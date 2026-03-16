import pytest
from app.utils.arabic import normalize_arabic, extract_words


class TestNormalizeArabic:
    def test_removes_fatha(self):
        # عَمَّ → عم (убирает фатху и шадду)
        assert normalize_arabic("عَمَّ") == "عم"

    def test_removes_sukun(self):
        assert normalize_arabic("مِنْ") == "من"

    def test_normalizes_alef_with_hamza(self):
        # أ → ا
        assert normalize_arabic("أَنَا") == "انا"

    def test_normalizes_alef_with_madda(self):
        # آ → ا
        assert normalize_arabic("آمَنَ") == "امن"

    def test_removes_tatweel(self):
        assert normalize_arabic("اللـه") == "الله"

    def test_plain_word_unchanged(self):
        # Слово без огласовок не меняется
        assert normalize_arabic("الله") == "الله"

    def test_empty_string(self):
        assert normalize_arabic("") == ""

    def test_strips_whitespace(self):
        assert normalize_arabic("  عَمَّ  ") == "عم"


class TestExtractWords:
    def test_splits_ayah_into_words(self):
        ayah = "عَمَّ يَتَسَاءَلُونَ"
        words = extract_words(ayah)
        assert len(words) == 2
        assert words[0] == "عَمَّ"
        assert words[1] == "يَتَسَاءَلُونَ"

    def test_empty_text(self):
        assert extract_words("") == []

    def test_single_word(self):
        assert extract_words("الله") == ["الله"]
