import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { cardsApi } from '../api/cards'
import type { CardDue } from '../api/cards'
import { sessionsApi } from '../api/sessions'
import type { SessionComplete } from '../api/sessions'
import FlashCard from '../components/FlashCard'
import type { FlashCardHandle } from '../components/FlashCard'
import ProgressBar from '../components/ProgressBar'
import ThemeToggle from '../components/ThemeToggle'

type StudyState = 'loading' | 'studying' | 'completed' | 'empty' | 'error'

export default function StudyPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const surahNumber = searchParams.get('surah') ? Number(searchParams.get('surah')) : undefined
  const surahName = searchParams.get('surah_name') ?? undefined

  const [state, setState] = useState<StudyState>('loading')
  const [cards, setCards] = useState<CardDue[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionResult, setSessionResult] = useState<SessionComplete | null>(null)
  const cardRef = useRef<FlashCardHandle>(null)

  const startSession = useCallback(async () => {
    setState('loading'); setCurrentIndex(0); setIsFlipped(false); setCorrectCount(0); setSessionResult(null)
    try {
      const [cardsRes, sessionRes] = await Promise.all([cardsApi.getDueCards(20, surahNumber), sessionsApi.startSession()])
      if (cardsRes.data.length === 0) { setState('empty'); return }
      setCards(cardsRes.data); setSessionId(sessionRes.data.id); setState('studying')
    } catch { setState('error') }
  }, [surahNumber])

  useEffect(() => { startSession() }, [startSession])

  const handleQuality = useCallback(async (quality: 1 | 2 | 3 | 4) => {
    if (!sessionId || isReviewing) return
    setIsReviewing(true)
    const card = cards[currentIndex]
    try { await cardsApi.reviewCard(card.word_id, quality, sessionId); if (quality >= 2) setCorrectCount(p => p + 1) } catch { }
    const nextIndex = currentIndex + 1
    if (nextIndex >= cards.length) {
      try { const res = await sessionsApi.completeSession(sessionId); setSessionResult(res.data) } catch {
        setSessionResult({ id: sessionId, cards_reviewed: cards.length, cards_correct: correctCount + (quality >= 2 ? 1 : 0), accuracy: ((correctCount + (quality >= 2 ? 1 : 0)) / cards.length) * 100, duration_seconds: 0, completed_at: new Date().toISOString() })
      }
      setState('completed')
    } else { setCurrentIndex(nextIndex); setIsFlipped(false) }
    setIsReviewing(false)
  }, [sessionId, isReviewing, cards, currentIndex, correctCount])

  const handleSwipe = useCallback((dir: 'left' | 'right') => handleQuality(dir === 'right' ? 4 : 1), [handleQuality])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state !== 'studying' || isReviewing || !isFlipped) return
      if (e.key === 'ArrowRight') cardRef.current?.triggerSwipe('right')
      if (e.key === 'ArrowLeft') cardRef.current?.triggerSwipe('left')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state, isReviewing, isFlipped])

  const goBack = () => surahNumber ? navigate(`/reader?surah=${surahNumber}`) : navigate('/dashboard')

  const bg = 'min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors'
  const card = 'bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-xl shadow-gray-200/50 dark:shadow-none backdrop-blur-sm'

  if (state === 'loading') return (
    <div className={`${bg} flex items-center justify-center`}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 dark:text-white/60">Загрузка карточек...</p>
      </div>
    </div>
  )

  if (state === 'empty') return (
    <div className={`${bg} flex items-center justify-center p-4`}>
      <div className={card}>
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {surahNumber ? 'Все слова суры изучены!' : 'На сегодня всё!'}
        </h2>
        <p className="text-gray-500 dark:text-white/50 mb-6">
          {surahNumber ? 'Добавьте новые слова в ридере.' : 'Возвращайтесь завтра!'}
        </p>
        <div className="flex flex-col gap-3">
          {surahNumber && (
            <button onClick={() => navigate(`/reader?surah=${surahNumber}`)}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all hover:-translate-y-0.5">
              Вернуться к чтению суры
            </button>
          )}
          <button onClick={() => navigate('/dashboard')}
            className="w-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-white/70 font-semibold py-3 rounded-xl transition-colors">
            На главную
          </button>
        </div>
      </div>
    </div>
  )

  if (state === 'error') return (
    <div className={`${bg} flex items-center justify-center p-4`}>
      <div className={card}>
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ошибка загрузки</h2>
        <p className="text-gray-500 dark:text-white/50 mb-6">Не удалось загрузить карточки.</p>
        <div className="flex gap-3">
          <button onClick={startSession} className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl">Повторить</button>
          <button onClick={goBack} className="flex-1 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 font-semibold py-3 rounded-xl">Назад</button>
        </div>
      </div>
    </div>
  )

  if (state === 'completed' && sessionResult) {
    const accuracy = Math.round(sessionResult.accuracy)
    return (
      <div className={`${bg} flex items-center justify-center p-4`}>
        <div className={card}>
          <div className="text-6xl mb-4">{accuracy >= 80 ? '🌟' : accuracy >= 60 ? '👍' : '📚'}</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Сессия завершена!</h2>
          {surahName && (
            <p className="text-violet-600 dark:text-violet-400 font-medium mb-1" dir="rtl" lang="ar" style={{ fontFamily: 'Amiri, serif', fontSize: '1.2rem' }}>{surahName}</p>
          )}
          <p className="text-gray-400 dark:text-white/40 mb-8">Отличная работа над словами Корана</p>
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Карточек', value: sessionResult.cards_reviewed, color: 'text-gray-900 dark:text-white' },
              { label: 'Точность', value: `${accuracy}%`, color: accuracy >= 70 ? 'text-emerald-600 dark:text-emerald-400' : 'text-orange-500' },
              { label: 'Правильно', value: sessionResult.cards_correct, color: 'text-gray-900 dark:text-white' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-gray-400 dark:text-white/40 mt-1">{label}</div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3">
            {surahNumber && (
              <button onClick={() => navigate(`/reader?surah=${surahNumber}`)}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-700 text-white font-semibold py-3 rounded-xl transition-all hover:-translate-y-0.5">
                Читать суру снова
              </button>
            )}
            <button onClick={startSession}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold py-3 rounded-xl transition-all hover:-translate-y-0.5">
              Ещё раз
            </button>
            <button onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/70 font-semibold py-3 rounded-xl transition-colors">
              На главную
            </button>
          </div>
        </div>
      </div>
    )
  }

  const currentCard = cards[currentIndex]
  return (
    <div className={bg}>
      <nav className="bg-white dark:bg-slate-800/80 border-b border-gray-200 dark:border-white/10 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <button onClick={goBack} className="text-sm text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80 transition-colors">
            ← {surahNumber ? 'К суре' : 'Выйти'}
          </button>
          <div className="text-center">
            <div className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm">Повторение</div>
            {surahName && (
              <div className="text-xs text-gray-400 dark:text-white/30" dir="rtl" lang="ar" style={{ fontFamily: 'Amiri, serif' }}>{surahName}</div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400 dark:text-white/40 font-mono">{currentIndex + 1}/{cards.length}</span>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-4 pt-6 flex flex-col gap-6">
        <ProgressBar current={currentIndex + 1} total={cards.length} correct={correctCount} />
        <FlashCard key={currentCard.word_id} ref={cardRef} card={currentCard} onFlip={setIsFlipped} onSwipe={handleSwipe} />
        {isFlipped ? (
          <div className="flex justify-between text-sm text-gray-400 dark:text-white/30 px-4">
            <span>← Не знаю</span>
            <span className="hidden md:block text-xs">стрелки ← →</span>
            <span>Знаю →</span>
          </div>
        ) : (
          <p className="text-center text-gray-400 dark:text-white/30 text-sm">
            Нажмите на карточку, чтобы увидеть значение
            <span className="hidden md:inline"> · <kbd className="font-mono bg-gray-100 dark:bg-white/10 px-1 rounded text-xs">Shift</kbd></span>
          </p>
        )}
      </main>
    </div>
  )
}
