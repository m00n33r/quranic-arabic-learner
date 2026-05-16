from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.surah import Surah
from app.models.ayah import Ayah
from app.models.word import Word, WordOccurrence
from app.models.flashcard import UserCardProgress
from app.schemas.reader import (
    SurahInfo, AyahWithWords, WordInAyah,
    EnqueueRequest, EnqueueResponse,
)
from app.utils.arabic import extract_words

router = APIRouter(prefix="/reader", tags=["reader"])

DEFAULT_EF = 2.5

# Русские транслитерации названий сур 30-го джуза (78–114)
SURAH_TRANSLITERATION_RU: dict[int, str] = {
    78:  "Ан-Наба",
    79:  "Ан-Назиат",
    80:  "Абаса",
    81:  "Ат-Таквир",
    82:  "Аль-Инфитар",
    83:  "Аль-Мутаффифин",
    84:  "Аль-Иншикак",
    85:  "Аль-Бурудж",
    86:  "Ат-Тарик",
    87:  "Аль-Аля",
    88:  "Аль-Гашия",
    89:  "Аль-Фаджр",
    90:  "Аль-Баляд",
    91:  "Аш-Шамс",
    92:  "Аль-Лейль",
    93:  "Ад-Духа",
    94:  "Аш-Шарх",
    95:  "Ат-Тин",
    96:  "Аль-Аляк",
    97:  "Аль-Кадр",
    98:  "Аль-Баййина",
    99:  "Аз-Зальзаля",
    100: "Аль-Адиат",
    101: "Аль-Кариа",
    102: "Ат-Такасур",
    103: "Аль-Аср",
    104: "Аль-Хумаза",
    105: "Аль-Филь",
    106: "Курайш",
    107: "Аль-Маун",
    108: "Аль-Каусар",
    109: "Аль-Кафирун",
    110: "Ан-Наср",
    111: "Аль-Масад",
    112: "Аль-Ихляс",
    113: "Аль-Фаляк",
    114: "Ан-Нас",
}

# Русские названия сур 30-го джуза (78–114)
SURAH_NAMES_RU: dict[int, str] = {
    78:  "Весть",
    79:  "Вырывающие",
    80:  "Нахмурился",
    81:  "Скручивание",
    82:  "Разрывание",
    83:  "Обвешивающие",
    84:  "Разверзание",
    85:  "Созвездия",
    86:  "Ночной путник",
    87:  "Всевышний",
    88:  "Покрывающее",
    89:  "Заря",
    90:  "Город",
    91:  "Солнце",
    92:  "Ночь",
    93:  "Утро",
    94:  "Раскрытие",
    95:  "Смоква",
    96:  "Сгусток",
    97:  "Предопределение",
    98:  "Ясное знамение",
    99:  "Землетрясение",
    100: "Мчащиеся",
    101: "Великое бедствие",
    102: "Страсть к умножению",
    103: "Послеполуденное время",
    104: "Хулитель",
    105: "Слон",
    106: "Курейшиты",
    107: "Мелкая помощь",
    108: "Обильный",
    109: "Неверующие",
    110: "Помощь",
    111: "Пальмовые волокна",
    112: "Искренность",
    113: "Рассвет",
    114: "Люди",
}


@router.get("/surahs", response_model=list[SurahInfo])
def get_surahs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Список сур 30-го джуза."""
    surahs = db.query(Surah).order_by(Surah.number.asc()).all()
    result = []
    for s in surahs:
        info = SurahInfo.model_validate(s)
        info.name_russian = SURAH_NAMES_RU.get(s.number)
        info.name_transliteration_ru = SURAH_TRANSLITERATION_RU.get(s.number)
        result.append(info)
    return result


@router.get("/ayahs/{surah_number}", response_model=list[AyahWithWords])
def get_ayahs(
    surah_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    surah = db.query(Surah).filter(Surah.number == surah_number).first()
    if not surah:
        raise HTTPException(status_code=404, detail="Surah not found")

    ayahs = (
        db.query(Ayah)
        .filter(Ayah.surah_number == surah_number)
        .order_by(Ayah.ayah_number)
        .all()
    )

    # Words user is already studying
    studying_word_ids = set(
        row[0]
        for row in db.query(UserCardProgress.word_id)
        .filter(UserCardProgress.user_id == current_user.id)
        .all()
    )

    # All occurrences for this surah's ayahs
    ayah_ids = [a.id for a in ayahs]
    occurrences = (
        db.query(WordOccurrence)
        .filter(WordOccurrence.ayah_id.in_(ayah_ids))
        .all()
    )

    # Load all words at once
    word_ids_needed = list({occ.word_id for occ in occurrences})
    words_map = {
        w.id: w
        for w in db.query(Word).filter(Word.id.in_(word_ids_needed)).all()
    }

    # Build index: ayah_id → {position → (word_id, arabic)}
    occ_index: dict[int, dict[int, tuple[int, str]]] = {}
    for occ in occurrences:
        if occ.ayah_id not in occ_index:
            occ_index[occ.ayah_id] = {}
        word = words_map.get(occ.word_id)
        if word:
            occ_index[occ.ayah_id][occ.position] = (word.id, word.arabic)

    result = []
    for ayah in ayahs:
        tokens = extract_words(ayah.arabic_text)
        words_in_ayah = []
        for pos, token in enumerate(tokens):
            ayah_occs = occ_index.get(ayah.id, {})
            if pos in ayah_occs:
                word_id, arabic = ayah_occs[pos]
                word = words_map.get(word_id)
                # Берём первое значение перевода (до ";")
                translation_ru = None
                if word and word.translation_ru:
                    translation_ru = word.translation_ru.split(';')[0].strip() or None
                words_in_ayah.append(WordInAyah(
                    word_id=word_id,
                    position=pos,
                    arabic=arabic,
                    translation_ru=translation_ru,
                    is_in_study=word_id in studying_word_ids,
                ))
            else:
                words_in_ayah.append(WordInAyah(
                    word_id=None,
                    position=pos,
                    arabic=token,
                    translation_ru=None,
                    is_in_study=False,
                ))
        result.append(AyahWithWords(
            id=ayah.id,
            surah_number=ayah.surah_number,
            ayah_number=ayah.ayah_number,
            arabic_text=ayah.arabic_text,
            russian_translation=ayah.russian_translation,
            words=words_in_ayah,
        ))

    return result


@router.post("/enqueue", response_model=EnqueueResponse)
def enqueue_words(
    req: EnqueueRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    added = 0
    already_studying = 0
    today = date.today()

    for word_id in req.word_ids:
        word = db.query(Word).filter(Word.id == word_id).first()
        if not word:
            continue
        existing = (
            db.query(UserCardProgress)
            .filter(
                UserCardProgress.user_id == current_user.id,
                UserCardProgress.word_id == word_id,
            )
            .first()
        )
        if existing:
            already_studying += 1
            continue
        db.add(UserCardProgress(
            user_id=current_user.id,
            word_id=word_id,
            easiness_factor=DEFAULT_EF,
            interval=0,
            repetitions=0,
            next_review_date=today,
        ))
        added += 1

    db.commit()
    return EnqueueResponse(added=added, already_studying=already_studying)


@router.delete("/words/{word_id}", status_code=status.HTTP_204_NO_CONTENT)
def dequeue_word(
    word_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    progress = (
        db.query(UserCardProgress)
        .filter(
            UserCardProgress.user_id == current_user.id,
            UserCardProgress.word_id == word_id,
        )
        .first()
    )
    if progress:
        db.delete(progress)
        db.commit()
