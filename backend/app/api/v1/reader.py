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


@router.get("/surahs", response_model=list[SurahInfo])
def get_surahs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Список сур 30-го джуза."""
    return db.query(Surah).order_by(Surah.number.asc()).all()


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
                words_in_ayah.append(WordInAyah(
                    word_id=word_id,
                    position=pos,
                    arabic=arabic,
                    is_in_study=word_id in studying_word_ids,
                ))
            else:
                words_in_ayah.append(WordInAyah(
                    word_id=None,
                    position=pos,
                    arabic=token,
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
