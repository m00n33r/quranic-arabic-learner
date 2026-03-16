"""
Обновить переводы слов, используя word-by-word данные с quran.com API.

Логика:
- Для каждого слова (Word) собираем ВСЕ английские переводы из всех аятов где оно встречается
- Дедуплицируем → несколько значений (например: من = "from; of; among; than")
- Сохраняем в Word.translation_ru через точку с запятой

Запуск: python scripts/update_word_translations.py
"""
import sys
import os
import time
import httpx

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from collections import defaultdict
from app.core.database import SessionLocal
from app.models.word import Word, WordOccurrence
from app.models.ayah import Ayah
from app.utils.arabic import normalize_arabic, extract_words


def fetch_juz30_word_translations() -> dict[str, list[str]]:
    """
    Вернуть {arabic_clean: [translation1, translation2, ...]}
    Порядок: по частоте встречаемости (чаще = первее).
    """
    # word_clean → {translation → count}
    translations_counter: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    base_url = "https://api.quran.com/api/v4"
    client = httpx.Client(timeout=30)

    # Получить список сур в джузе 30
    print("Получаем список сур 30-го джуза...")
    r = client.get(f"{base_url}/juzs/30")
    r.raise_for_status()
    juz_data = r.json()

    # Суры 30-го джуза: 78-114
    surah_start = 78
    surah_end = 114

    for surah_num in range(surah_start, surah_end + 1):
        print(f"  Суpa {surah_num}...", end=" ", flush=True)
        page = 1
        while True:
            try:
                r = client.get(
                    f"{base_url}/verses/by_chapter/{surah_num}",
                    params={
                        "words": "true",
                        "word_fields": "text_uthmani,text_uthmani_simple",
                        "per_page": 50,
                        "page": page,
                    },
                )
                r.raise_for_status()
                data = r.json()
            except Exception as e:
                print(f"ОШИБКА: {e}")
                break

            verses = data.get("verses", [])
            if not verses:
                break

            for verse in verses:
                for word in verse.get("words", []):
                    if word.get("char_type_name") != "word":
                        continue

                    arabic_raw = word.get("text_uthmani", "")
                    translation = word.get("translation", {}).get("text", "").strip()

                    if not arabic_raw or not translation:
                        continue

                    # Нормализовать для дедупликации
                    arabic_clean = normalize_arabic(arabic_raw)
                    if not arabic_clean:
                        continue

                    # Убрать скобки с числами типа "(1)" из конца
                    import re
                    translation = re.sub(r'\s*\(\d+\)\s*$', '', translation).strip()
                    if not translation:
                        continue

                    translations_counter[arabic_clean][translation] += 1

            meta = data.get("meta", {})
            if not meta.get("next_page"):
                break
            page += 1
            time.sleep(0.05)

        print("OK")
        time.sleep(0.1)

    client.close()

    # Для каждого слова: взять топ-5 значений по частоте
    result: dict[str, list[str]] = {}
    for arabic_clean, counter in translations_counter.items():
        # Сортировать по убыванию частоты, брать топ-5 уникальных
        sorted_trans = sorted(counter.items(), key=lambda x: -x[1])
        top = [t for t, _ in sorted_trans[:5]]
        result[arabic_clean] = top

    return result


def main():
    print("=" * 60)
    print("Обновление переводов слов из quran.com")
    print("=" * 60)

    print("\nЗагружаем word-by-word переводы...")
    translations_map = fetch_juz30_word_translations()
    print(f"\nПолучено переводов для {len(translations_map)} уникальных слов")

    # Обновить в БД
    db = SessionLocal()
    try:
        words = db.query(Word).all()
        updated = 0
        not_found = 0

        for word in words:
            clean = word.arabic_clean
            if clean in translations_map:
                meanings = translations_map[clean]
                # Хранить как строку через "; "
                word.translation_ru = "; ".join(meanings)
                updated += 1
            else:
                not_found += 1

        db.commit()
        print(f"\nОбновлено: {updated} слов")
        print(f"Не найдено в quran.com: {not_found} слов")

        # Показать примеры
        print("\nПримеры (первые 10 слов с переводами):")
        examples = db.query(Word).filter(Word.translation_ru.isnot(None)).limit(10).all()
        for w in examples:
            print(f"  {w.arabic} → {w.translation_ru}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
