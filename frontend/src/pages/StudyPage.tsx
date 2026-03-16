import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { cardsApi } from '../api/cards'
import type { CardDue } from '../api/cards'
import { sessionsApi } from '../api/sessions'
import type { SessionComplete } from '../api/sessions'
import FlashCard from '../components/FlashCard'
import QualityButtons from '../components/QualityButtons'
import ProgressBar from '../components/ProgressBar'

type StudyState = 'loading' | 'studying' | 'completed' | 'empty' | 'error'

export default function StudyPage() {
  const navigate = useNavigate()
  const [state, setState] = useState<StudyState>('loading')
  const [cards, setCards] = useState<CardDue[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [isReviewing, setIsReviewing] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [sessionResult, setSessionResult] = useState<SessionComplete | null>(null)

  const startSession = useCallback(async () => {
    setState('loading')
    setCurrentIndex(0)
    setIsFlipped(false)
    setCorrectCount(0)
    setSessionResult(null)

    try {
      const [cardsRes, sessionRes] = await Promise.all([
        cardsApi.getDueCards(20),
        sessionsApi.startSession(),
      ])

      if (cardsRes.data.length === 0) {
        setState('empty')
        return
      }

      setCards(cardsRes.data)
      setSessionId(sessionRes.data.id)
      setState('studying')
    } catch {
      setState('error')
    }
  }, [])

  useEffect(() => {
    startSession()
  }, [startSession])

  const handleQuality = async (quality: 1 | 2 | 3 | 4) => {
    if (!sessionId || isReviewing) return
    setIsReviewing(true)

    const card = cards[currentIndex]
    try {
      await cardsApi.reviewCard(card.word_id, quality, sessionId)
      if (quality >= 2) setCorrectCount(prev => prev + 1)
    } catch {
      // продолжаем даже при ошибке review
    }

    // Небольшая задержка перед переходом
    setTimeout(async () => {
      const nextIndex = currentIndex + 1

      if (nextIndex >= cards.length) {
        // Завершить сессию
        try {
          const res = await sessionsApi.completeSession(sessionId)
          setSessionResult(res.data)
        } catch {
          // Показать локальные результаты если API упал
          setSessionResult({
            id: sessionId,
            cards_reviewed: cards.length,
            cards_correct: correctCount + (quality >= 2 ? 1 : 0),
            accuracy: ((correctCount + (quality >= 2 ? 1 : 0)) / cards.length) * 100,
            duration_seconds: 0,
            completed_at: new Date().toISOString(),
          })
        }
        setState('completed')
      } else {
        setCurrentIndex(nextIndex)
        setIsFlipped(false)
      }

      setIsReviewing(false)
    }, 300)
  }

  // Экран загрузки
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка карточек...</p>
        </div>
      </div>
    )
  }

  // Нет карточек на сегодня
  if (state === 'empty') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">На сегодня всё!</h2>
          <p className="text-gray-500 mb-6">
            Вы повторили все карточки на сегодня. Возвращайтесь завтра!
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            На главную
          </button>
        </div>
      </div>
    )
  }

  // Ошибка
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка загрузки</h2>
          <p className="text-gray-500 mb-6">Не удалось загрузить карточки. Проверьте соединение.</p>
          <div className="flex gap-3">
            <button
              onClick={startSession}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Повторить
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Экран завершения сессии
  if (state === 'completed' && sessionResult) {
    const accuracy = Math.round(sessionResult.accuracy)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">
            {accuracy >= 80 ? '🌟' : accuracy >= 60 ? '👍' : '📚'}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Сессия завершена!</h2>
          <p className="text-gray-500 mb-6">Отличная работа над словами Корана</p>

          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">{sessionResult.cards_reviewed}</div>
              <div className="text-xs text-gray-500 mt-1">Карточек</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className={`text-2xl font-bold ${accuracy >= 70 ? 'text-emerald-600' : 'text-orange-600'}`}>
                {accuracy}%
              </div>
              <div className="text-xs text-gray-500 mt-1">Точность</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-gray-900">{sessionResult.cards_correct}</div>
              <div className="text-xs text-gray-500 mt-1">Правильно</div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={startSession}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Ещё раз
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg transition-colors"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Основной экран обучения
  const currentCard = cards[currentIndex]
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Навбар */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            ← Выйти
          </button>
          <span className="text-emerald-600 font-semibold">Повторение</span>
          <span className="text-sm text-gray-400">{currentIndex + 1}/{cards.length}</span>
        </div>
      </nav>

      <main className="max-w-lg mx-auto p-4 pt-6 flex flex-col gap-6">
        {/* Прогресс */}
        <ProgressBar
          current={currentIndex + 1}
          total={cards.length}
          correct={correctCount}
        />

        {/* Карточка */}
        <FlashCard
          card={currentCard}
          onFlip={setIsFlipped}
        />

        {/* Кнопки оценки */}
        <QualityButtons
          visible={isFlipped}
          onSelect={handleQuality}
          isLoading={isReviewing}
        />

        {/* Подсказка пока карточка не перевёрнута */}
        {!isFlipped && (
          <p className="text-center text-gray-400 text-sm">
            Нажмите на карточку, чтобы увидеть перевод
          </p>
        )}
      </main>
    </div>
  )
}
