"""
Заполнение БД данными 30-го джуза Корана.

Логика:
1. Загрузить аяты из alquran.cloud (или из кэша)
2. Создать записи Surah (дедупликация по number)
3. Создать записи Ayah
4. Извлечь уникальные слова из всех аятов
5. Создать записи Word + WordOccurrence
"""
from collections import defaultdict
from sqlalchemy.orm import Session

from app.models.surah import Surah
from app.models.ayah import Ayah
from app.models.word import Word, WordOccurrence
from app.data.fetcher import QuranFetcher, AyahData
from app.utils.arabic import normalize_arabic, extract_words, extract_root_approx


class DatabaseSeeder:
    def __init__(self, db: Session, fetcher: QuranFetcher | None = None):
        self.db = db
        self.fetcher = fetcher or QuranFetcher()

    def seed(self, juz_number: int = 30, force: bool = False) -> dict:
        """
        Заполнить БД данными джуза.

        Args:
            juz_number: номер джуза (по умолчанию 30)
            force: если True — очистить существующие данные перед загрузкой

        Returns: статистика {surahs, ayahs, words, occurrences}
        """
        if force:
            self._clear_data()

        # Проверить — данные уже загружены?
        existing = self.db.query(Ayah).count()
        if existing > 0 and not force:
            print(f"БД уже содержит {existing} аятов. Используйте force=True для перезагрузки.")
            return {"skipped": True, "existing_ayahs": existing}

        print(f"Загружаем данные джуза {juz_number}...")
        ayah_data_list = self.fetcher.fetch_juz(juz_number)

        # 1. Создать суры
        surahs_created = self._seed_surahs(ayah_data_list)

        # 2. Создать аяты
        ayahs_map = self._seed_ayahs(ayah_data_list)

        # 3. Извлечь слова и связи
        words_created, occurrences_created = self._seed_words(ayah_data_list, ayahs_map)

        self.db.commit()

        stats = {
            "surahs": surahs_created,
            "ayahs": len(ayahs_map),
            "words": words_created,
            "occurrences": occurrences_created,
        }
        print(f"Загружено: {stats}")
        return stats

    def _clear_data(self):
        """Очистить все данные (для повторного seed)."""
        self.db.query(WordOccurrence).delete()
        self.db.query(Word).delete()
        self.db.query(Ayah).delete()
        self.db.query(Surah).delete()
        self.db.commit()
        print("Данные очищены.")

    def _seed_surahs(self, ayah_data_list: list[AyahData]) -> int:
        """Создать суры (дедупликация по number)."""
        seen_surahs = {}
        for ayah in ayah_data_list:
            if ayah.surah_number not in seen_surahs:
                seen_surahs[ayah.surah_number] = ayah

        count = 0
        for surah_num, ayah in seen_surahs.items():
            existing = self.db.query(Surah).filter_by(number=surah_num).first()
            if not existing:
                surah = Surah(
                    number=ayah.surah_number,
                    name_arabic=ayah.surah_name_arabic,
                    name_english=ayah.surah_name_english,
                    name_transliteration=ayah.surah_name_transliteration,
                    revelation_type=ayah.surah_revelation_type,
                    total_ayahs=ayah.surah_total_ayahs,
                )
                self.db.add(surah)
                count += 1

        self.db.flush()
        return count

    def _seed_ayahs(self, ayah_data_list: list[AyahData]) -> dict[int, Ayah]:
        """Создать аяты. Возвращает {global_number: Ayah}."""
        ayahs_map = {}
        for data in ayah_data_list:
            ayah = Ayah(
                surah_number=data.surah_number,
                ayah_number=data.ayah_number,
                global_number=data.global_number,
                juz_number=30,
                arabic_text=data.arabic_text,
                russian_translation=data.russian_translation,
            )
            self.db.add(ayah)
            ayahs_map[data.global_number] = ayah

        self.db.flush()  # flush чтобы получить id
        return ayahs_map

    def _seed_words(
        self,
        ayah_data_list: list[AyahData],
        ayahs_map: dict[int, Ayah],
    ) -> tuple[int, int]:
        """
        Извлечь уникальные слова и создать WordOccurrence.
        Возвращает (words_created, occurrences_created).
        """
        # Собрать все вхождения: arabic_clean → [(arabic_with_harakat, ayah, position)]
        word_occurrences_data: dict[str, list[tuple[str, Ayah, int]]] = defaultdict(list)

        for ayah_data in ayah_data_list:
            ayah = ayahs_map[ayah_data.global_number]
            words = extract_words(ayah_data.arabic_text)
            for position, word_text in enumerate(words):
                clean = normalize_arabic(word_text)
                if clean:  # пропустить пустые после нормализации
                    word_occurrences_data[clean].append((word_text, ayah, position))

        words_created = 0
        occurrences_created = 0
        word_objects: dict[str, Word] = {}

        # Создать Word объекты
        for arabic_clean, occurrences in word_occurrences_data.items():
            # Берём наиболее частую форму с огласовками для отображения
            arabic_display = max(
                set(o[0] for o in occurrences),
                key=lambda w: sum(1 for o in occurrences if o[0] == w)
            )
            word = Word(
                arabic=arabic_display,
                arabic_clean=arabic_clean,
                frequency=len(occurrences),
                root_approx=extract_root_approx(arabic_clean) or None,
                # translation_ru — будет добавлен позже (в Phase 4 или вручную)
            )
            self.db.add(word)
            word_objects[arabic_clean] = word
            words_created += 1

        self.db.flush()

        # Создать WordOccurrence (дедупликация по word+ayah+position)
        seen_occurrences = set()
        for arabic_clean, occurrences in word_occurrences_data.items():
            word = word_objects[arabic_clean]
            for _, ayah, position in occurrences:
                key = (word.id, ayah.id, position)
                if key not in seen_occurrences:
                    self.db.add(WordOccurrence(
                        word_id=word.id,
                        ayah_id=ayah.id,
                        position=position,
                    ))
                    seen_occurrences.add(key)
                    occurrences_created += 1

        return words_created, occurrences_created
