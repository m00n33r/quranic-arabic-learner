import { useState } from 'react'
import type { CardDue } from '../api/cards'

interface FlashCardProps {
  card: CardDue
  onFlip?: (flipped: boolean) => void
}

export default function FlashCard({ card, onFlip }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    const newFlipped = !isFlipped
    setIsFlipped(newFlipped)
    onFlip?.(newFlipped)
  }

  return (
    <div
      className="card-container w-full cursor-pointer select-none"
      style={{ height: '320px' }}
      onClick={handleFlip}
      role="button"
      aria-label={isFlipped ? 'Показать слово' : 'Показать перевод'}
    >
      <div className={`card-inner w-full h-full ${isFlipped ? 'flipped' : ''}`}>

        {/* Лицевая сторона — арабское слово */}
        <div className="card-face bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-8">
          {/* Новая карточка */}
          {card.is_new && (
            <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
              Новое
            </span>
          )}

          {/* Арабское слово — большой шрифт, RTL */}
          <div
            className="arabic-text text-gray-900 mb-6 text-center"
            dir="rtl"
            lang="ar"
            style={{ fontSize: '4rem', lineHeight: '2' }}
          >
            {card.arabic}
          </div>

          {/* Частота в 30-м джузе */}
          <div className="text-gray-400 text-sm">
            Встречается {card.frequency}× в 30-м джузе
          </div>

          {/* Подсказка */}
          <div className="absolute bottom-4 text-gray-400 text-xs">
            Нажмите, чтобы увидеть перевод
          </div>
        </div>

        {/* Обратная сторона — перевод */}
        <div className="card-back-face card-face bg-emerald-50 rounded-2xl shadow-lg border border-emerald-100 flex flex-col items-center justify-center p-8">

          {/* Арабское слово (меньше) */}
          <div
            className="arabic-text text-emerald-700 mb-3 text-center"
            dir="rtl"
            lang="ar"
            style={{ fontSize: '2rem', lineHeight: '2' }}
          >
            {card.arabic}
          </div>

          {/* Перевод */}
          <div className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            {card.translation_ru || '—'}
          </div>

          {/* SM-2 прогресс */}
          <div className="flex gap-4 text-xs text-gray-400">
            <span>Интервал: {card.interval} дн.</span>
            <span>Повторений: {card.repetitions}</span>
            <span>EF: {card.easiness_factor.toFixed(2)}</span>
          </div>

          <div className="absolute bottom-4 text-gray-400 text-xs">
            Оцените своё знание ↓
          </div>
        </div>

      </div>
    </div>
  )
}
