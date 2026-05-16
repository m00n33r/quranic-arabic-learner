import re

# Диапазоны Unicode для огласовок Корана (харакат/ташкиль)
ARABIC_DIACRITICS = re.compile(
    r'[\u064B-\u065F'     # Харакат: фатхатан, думматан, касратан, фатха, думма, касра, шадда, сукун и т.д.
    r'\u0670'             # Superscript Alef (алеф хинджер)
    r'\u06D6-\u06DC'      # Знаки тилавы Корана
    r'\u06DF-\u06E4'      # Знаки тилавы Корана
    r'\u06E7\u06E8'       # Знаки тилавы Корана
    r'\u06EA-\u06ED]'     # Знаки тилавы Корана
)

# Формы алефа → базовый алеф
ALEF_VARIANTS = str.maketrans({
    '\u0622': '\u0627',  # آ → ا (Alef with Madda)
    '\u0623': '\u0627',  # أ → ا (Alef with Hamza Above)
    '\u0625': '\u0627',  # إ → ا (Alef with Hamza Below)
    '\u0671': '\u0627',  # ٱ → ا (Alef Wasla)
})

TATWEEL = '\u0640'  # Татвиль (кашида) ـ


def normalize_arabic(text: str) -> str:
    """
    Нормализовать арабское слово для дедупликации:
    1. Удалить огласовки (харакат)
    2. Нормализовать формы алефа
    3. Удалить татвиль (кашида)
    4. Убрать лишние пробелы
    """
    text = ARABIC_DIACRITICS.sub('', text)
    text = text.translate(ALEF_VARIANTS)
    text = text.replace(TATWEEL, '')
    return text.strip()


def extract_words(arabic_text: str) -> list[str]:
    """
    Извлечь список слов из арабского текста аята.
    Возвращает слова С огласовками (для отображения).
    """
    # Разбить по пробелам, убрать пустые строки
    words = [w.strip() for w in arabic_text.split() if w.strip()]
    # Убрать слова-знаки препинания (если есть)
    words = [w for w in words if any('\u0600' <= c <= '\u06FF' for c in w)]
    return words


# Слабые буквы и незначащие символы арабского — не входят в корень
_WEAK_LETTERS = set('اويءةأإآؤئ')


def extract_root_approx(arabic_clean: str) -> str:
    """
    Приближённо извлечь трёхбуквенный корень из нормализованного арабского слова.

    Метод: берём первые 3 согласные буквы, исключая слабые (ا و ي ء ة и варианты хамзы).
    Точность ~70% для слов 30-го джуза — достаточно для группировки кластеров.

    Returns:
        Строка из 1–3 символов (может быть короче у очень коротких слов).
    """
    consonants = [c for c in arabic_clean if c not in _WEAK_LETTERS]
    return ''.join(consonants[:3])
