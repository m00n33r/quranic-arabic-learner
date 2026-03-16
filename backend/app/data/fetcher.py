"""
Загрузчик данных 30-го джуза из alquran.cloud API.

API документация: https://alquran.cloud/api
Используем endpoint: GET /v1/juz/{juz}/{edition}
Делаем два запроса: арабский текст + русский перевод.
"""
import httpx
from dataclasses import dataclass
from typing import Optional


BASE_URL = "https://api.alquran.cloud/v1"
JUZ_NUMBER = 30
# quran-uthmani = арабский текст с огласовками (для отображения)
# ru.kuliev = русский перевод Кулиева
ARABIC_EDITION = "quran-uthmani"
RUSSIAN_EDITION = "ru.kuliev"


@dataclass
class AyahData:
    global_number: int
    surah_number: int
    ayah_number: int
    arabic_text: str      # с огласовками
    russian_translation: Optional[str]
    surah_name_arabic: str
    surah_name_english: str
    surah_name_transliteration: str
    surah_revelation_type: str
    surah_total_ayahs: int


class QuranFetcher:
    """Загружает данные Корана из alquran.cloud API."""

    def __init__(self, timeout: float = 30.0):
        self.timeout = timeout

    def _fetch_edition(self, client: httpx.Client, juz_number: int, edition: str) -> dict:
        """Загрузить один джуз в одном издании."""
        url = f"{BASE_URL}/juz/{juz_number}/{edition}"
        response = client.get(url)
        response.raise_for_status()
        return response.json()["data"]

    def fetch_juz(self, juz_number: int = JUZ_NUMBER) -> list[AyahData]:
        """
        Загрузить все аяты джуза с арабским текстом и русским переводом.

        Returns: список AyahData, отсортированный по global_number.
        Raises: httpx.HTTPError при ошибке сети.
        """
        print(f"Загружаем джуз {juz_number} из {BASE_URL}...")

        with httpx.Client(timeout=self.timeout) as client:
            arabic_data = self._fetch_edition(client, juz_number, ARABIC_EDITION)
            russian_data = self._fetch_edition(client, juz_number, RUSSIAN_EDITION)

        # Создаём словарь русского перевода: global_number → text
        russian_by_number = {
            ayah["number"]: ayah["text"]
            for ayah in russian_data["ayahs"]
        }

        ayahs = []
        for ayah in arabic_data["ayahs"]:
            surah = ayah["surah"]
            ayahs.append(AyahData(
                global_number=ayah["number"],
                surah_number=surah["number"],
                ayah_number=ayah["numberInSurah"],
                arabic_text=ayah["text"],
                russian_translation=russian_by_number.get(ayah["number"]),
                surah_name_arabic=surah["name"],
                surah_name_english=surah["englishName"],
                surah_name_transliteration=surah.get("englishNameTranslation", ""),
                surah_revelation_type=surah.get("revelationType", ""),
                surah_total_ayahs=surah.get("numberOfAyahs", 0),
            ))

        print(f"Загружено {len(ayahs)} аятов из {len(set(a.surah_number for a in ayahs))} сур")
        return sorted(ayahs, key=lambda a: a.global_number)
