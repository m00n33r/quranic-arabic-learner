"""
Переводит слова Корана с английского на русский через Google Translate.

Берёт существующие переводы из Word.translation_ru (сейчас там English),
переводит каждое значение на русский, сохраняет обратно.

Запуск:
    cd backend && python scripts/translate_words_to_russian.py

Зависимости:
    pip install deep-translator
"""
import sys
import os
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from deep_translator import GoogleTranslator
from app.core.database import SessionLocal
from app.models.word import Word

# Корнеевые слова/частицы которые переводить не нужно — оставляем транслит
SKIP_WORDS = {
    'allah', 'allāh', 'subhanahu', 'bismillah',
}

# Кэш, чтобы не переводить одно и то же дважды
_cache: dict[str, str] = {}

# Готовые русские переводы для распространённых арабских частей речи
MANUAL_OVERRIDES: dict[str, str] = {
    'allah': 'Аллах',
    'Allah': 'Аллах',
    'of allah': 'Аллаха',
    'of Allah': 'Аллаха',
    '(of) allah': 'Аллаха',
    '(of) Allah': 'Аллаха',
    'is allah': 'является Аллах',
    '(is) allah': 'это Аллах',
    '(is) Allah': 'это Аллах',
    'the most gracious': 'Милостивый',
    'the most merciful': 'Милосердный',
    'lord': 'Господь',
    'the lord': 'Господь',
    'your lord': 'твой Господь',
    'my lord': 'мой Господь',
    'our lord': 'наш Господь',
    'his lord': 'его Господь',
    'messenger': 'посланник',
    'the messenger': 'посланник',
    'prophet': 'пророк',
    'the prophet': 'пророк',
    'indeed': 'воистину',
    'verily': 'воистину',
    'truly': 'поистине',
    'and': 'и',
    'or': 'или',
    'not': 'не',
    'no': 'нет',
    'so': 'итак',
    'then': 'затем',
    'but': 'но',
    'with': 'с',
    'in': 'в',
    'of': 'из',
    'for': 'для',
    'on': 'на',
    'to': 'к',
    'from': 'от',
    'by': 'через',
    'about': 'о',
    'upon': 'на',
    'over': 'над',
    'between': 'между',
    'among': 'среди',
    'he': 'он',
    'she': 'она',
    'they': 'они',
    'we': 'мы',
    'you': 'ты',
    'i': 'я',
    'it': 'это',
    'his': 'его',
    'her': 'её',
    'their': 'их',
    'our': 'наш',
    'your': 'твой',
    'my': 'мой',
    'who': 'кто',
    'what': 'что',
    'which': 'который',
    'when': 'когда',
    'where': 'где',
    'how': 'как',
    'why': 'почему',
    'day': 'день',
    'the day': 'день',
    'night': 'ночь',
    'the night': 'ночь',
    'earth': 'земля',
    'the earth': 'земля',
    'heaven': 'небеса',
    'the heaven': 'небо',
    'sky': 'небо',
    'the sky': 'небо',
    'fire': 'огонь',
    'the fire': 'огонь',
    'water': 'вода',
    'the water': 'вода',
    'light': 'свет',
    'the light': 'свет',
    'truth': 'истина',
    'the truth': 'истина',
    'good': 'благо',
    'evil': 'зло',
    'people': 'люди',
    'the people': 'люди',
    'mankind': 'человечество',
    'human': 'человек',
    'man': 'человек',
    'woman': 'женщина',
    'believers': 'верующие',
    'the believers': 'верующие',
    'disbelievers': 'неверующие',
    'the disbelievers': 'неверующие',
    'religion': 'вера',
    'the religion': 'религия',
    'book': 'книга',
    'the book': 'книга',
    'quran': 'Коран',
    'the quran': 'Коран',
    'prayer': 'молитва',
    'the prayer': 'молитва',
    'victory': 'победа',
    'the victory': 'победа',
    'help': 'помощь',
    'the help': 'помощь',
    'forgiveness': 'прощение',
    'his forgiveness': 'Его прощение',
}


def translate_single(text: str) -> str:
    """Перевести одну фразу на русский."""
    text_lower = text.lower().strip()

    # Ручные переводы
    if text in MANUAL_OVERRIDES:
        return MANUAL_OVERRIDES[text]
    if text_lower in MANUAL_OVERRIDES:
        return MANUAL_OVERRIDES[text_lower]

    # Кэш
    if text in _cache:
        return _cache[text]

    try:
        ru = GoogleTranslator(source='en', target='ru').translate(text)
        _cache[text] = ru
        time.sleep(0.05)  # небольшая пауза чтобы не попасть под rate limit
        return ru
    except Exception as e:
        print(f"    Ошибка перевода '{text}': {e}")
        return text  # вернуть оригинал при ошибке


def translate_meanings(translation_str: str) -> str:
    """
    Перевести строку значений вида 'when; comes; the help'.
    Возвращает 'когда; приходит; помощь'.
    """
    parts = [p.strip() for p in translation_str.split(';') if p.strip()]
    translated = []
    for part in parts:
        ru = translate_single(part)
        translated.append(ru)
    return '; '.join(translated)


def main():
    db = SessionLocal()
    try:
        words = db.query(Word).filter(Word.translation_ru.isnot(None)).all()
        total = len(words)
        print(f"Всего слов с переводом: {total}")
        print("Переводим на русский...\n")

        updated = 0
        errors = 0

        for i, word in enumerate(words, 1):
            old = word.translation_ru
            if not old:
                continue

            try:
                new_ru = translate_meanings(old)
                word.translation_ru = new_ru
                updated += 1

                if i <= 5 or i % 100 == 0:
                    print(f"  [{i}/{total}] {word.arabic}")
                    print(f"    EN: {old[:60]}")
                    print(f"    RU: {new_ru[:60]}")

            except Exception as e:
                errors += 1
                print(f"  [{i}] Ошибка для {word.arabic}: {e}")

            # Коммитить порциями по 50
            if i % 50 == 0:
                db.commit()
                print(f"  Сохранено {i}/{total}...")

        db.commit()
        print(f"\nГотово! Обновлено: {updated}, ошибок: {errors}")

        # Показать примеры
        print("\nПримеры результата:")
        examples = db.query(Word).filter(Word.translation_ru.isnot(None)).limit(8).all()
        for w in examples:
            print(f"  {w.arabic:20} → {w.translation_ru}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
