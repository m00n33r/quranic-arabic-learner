"""
Переводит только оставшиеся английские слова (без кириллицы в translation_ru).
Быстрее: батчевые запросы, пропускает уже переведённые.
"""
import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from deep_translator import GoogleTranslator
from app.core.database import SessionLocal
from app.models.word import Word

MANUAL_OVERRIDES = {
    'allah': 'Аллах', 'Allah': 'Аллах',
    'of allah': 'Аллаха', 'of Allah': 'Аллаха',
    '(of) allah': 'Аллаха', '(of) Allah': 'Аллаха',
    'the most gracious': 'Милостивый',
    'the most merciful': 'Милосердный',
    'lord': 'Господь', 'the lord': 'Господь',
    'your lord': 'твой Господь', 'my lord': 'мой Господь',
    'our lord': 'наш Господь', 'his lord': 'его Господь',
    'messenger': 'посланник', 'the messenger': 'посланник',
    'prophet': 'пророк', 'the prophet': 'пророк',
    'indeed': 'воистину', 'verily': 'воистину',
    'truly': 'поистине',
}

_cache: dict[str, str] = {}


def has_cyrillic(s: str) -> bool:
    return any('\u0400' <= c <= '\u04ff' for c in s)


def translate_single(text: str) -> str:
    text_l = text.lower().strip()
    if text in MANUAL_OVERRIDES:
        return MANUAL_OVERRIDES[text]
    if text_l in MANUAL_OVERRIDES:
        return MANUAL_OVERRIDES[text_l]
    if text in _cache:
        return _cache[text]
    try:
        ru = GoogleTranslator(source='en', target='ru').translate(text)
        _cache[text] = ru
        time.sleep(0.03)
        return ru
    except Exception as e:
        print(f"    Ошибка '{text[:40]}': {e}")
        return text


def translate_meanings(s: str) -> str:
    parts = [p.strip() for p in s.split(';') if p.strip()]
    return '; '.join(translate_single(p) for p in parts)


def main():
    db = SessionLocal()
    try:
        all_words = db.query(Word).filter(Word.translation_ru.isnot(None)).all()
        # Только слова без кириллицы (ещё не переведённые)
        pending = [w for w in all_words if w.translation_ru and not has_cyrillic(w.translation_ru)]
        print(f"Осталось перевести: {len(pending)} слов")

        for i, word in enumerate(pending, 1):
            old = word.translation_ru
            new_ru = translate_meanings(old)
            word.translation_ru = new_ru
            if i % 50 == 0:
                db.commit()
                print(f"  [{i}/{len(pending)}] сохранено...")
            elif i <= 3:
                print(f"  {word.arabic}: {old[:40]} → {new_ru[:40]}")

        db.commit()
        print(f"\nГотово! Переведено {len(pending)} слов.")
    finally:
        db.close()


if __name__ == '__main__':
    main()
