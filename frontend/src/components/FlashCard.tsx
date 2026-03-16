import { useState, useRef } from 'react'
import type { CardDue } from '../api/cards'

interface FlashCardProps {
  card: CardDue
  onFlip?: (flipped: boolean) => void
  onSwipe?: (direction: 'left' | 'right') => void
}

const SWIPE_THRESHOLD = 90

export default function FlashCard({ card, onFlip, onSwipe }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isExiting, setIsExiting] = useState<'left' | 'right' | null>(null)

  const startX = useRef(0)
  const hasDragged = useRef(false)

  const flip = () => {
    const next = !isFlipped
    setIsFlipped(next)
    onFlip?.(next)
  }

  const triggerSwipe = (dir: 'left' | 'right') => {
    if (isExiting) return
    setIsExiting(dir)
    setDragX(dir === 'right' ? 600 : -600)
    setTimeout(() => {
      onSwipe?.(dir)
    }, 280)
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    startX.current = e.clientX
    hasDragged.current = false
    setIsDragging(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || isExiting) return
    const dx = e.clientX - startX.current
    if (Math.abs(dx) > 8) hasDragged.current = true
    setDragX(dx)
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return
    setIsDragging(false)

    const dx = e.clientX - startX.current

    if (!hasDragged.current || Math.abs(dx) < 8) {
      // tap — flip
      setDragX(0)
      flip()
      return
    }

    if (isFlipped && Math.abs(dx) >= SWIPE_THRESHOLD) {
      triggerSwipe(dx > 0 ? 'right' : 'left')
    } else {
      // snap back
      setDragX(0)
    }
  }

  const rotation = dragX * 0.06
  const overlayProgress = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1)
  const showKnow = dragX > 15
  const showDontKnow = dragX < -15

  const dragStyle: React.CSSProperties = {
    transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
    transition: isDragging || isExiting ? (isExiting ? 'transform 0.28s ease-in' : 'none') : 'transform 0.3s ease',
    width: '100%',
    height: '100%',
    position: 'relative',
  }

  return (
    <div
      className="card-container w-full select-none touch-none"
      style={{ height: '320px', cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div style={dragStyle}>
        {/* Зелёный оверлей — ЗНАЮ */}
        {showKnow && isFlipped && (
          <div
            className="absolute inset-0 rounded-2xl flex items-center justify-start pl-8 z-20 pointer-events-none"
            style={{ opacity: overlayProgress }}
          >
            <div className="border-4 border-emerald-500 rounded-xl px-4 py-2 rotate-[-15deg]">
              <span className="text-emerald-500 text-2xl font-black tracking-widest">ЗНАЮ</span>
            </div>
          </div>
        )}

        {/* Красный оверлей — НЕ ЗНАЮ */}
        {showDontKnow && isFlipped && (
          <div
            className="absolute inset-0 rounded-2xl flex items-center justify-end pr-8 z-20 pointer-events-none"
            style={{ opacity: overlayProgress }}
          >
            <div className="border-4 border-red-500 rounded-xl px-4 py-2 rotate-[15deg]">
              <span className="text-red-500 text-2xl font-black tracking-widest">НЕ ЗНАЮ</span>
            </div>
          </div>
        )}

        <div className={`card-inner w-full h-full ${isFlipped ? 'flipped' : ''}`}>

          {/* Лицевая сторона */}
          <div className="card-face bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-8">
            {card.is_new && (
              <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                Новое
              </span>
            )}
            <div
              className="arabic-text text-gray-900 mb-6 text-center"
              dir="rtl"
              lang="ar"
              style={{ fontSize: '4rem', lineHeight: '2' }}
            >
              {card.arabic}
            </div>
            <div className="text-gray-400 text-sm">
              Встречается {card.frequency}× в 30-м джузе
            </div>
            <div className="absolute bottom-4 text-gray-400 text-xs">
              Нажмите, чтобы увидеть перевод
            </div>
          </div>

          {/* Обратная сторона */}
          <div className="card-back-face card-face bg-emerald-50 rounded-2xl shadow-lg border border-emerald-100 flex flex-col items-center justify-center p-8">
            <div
              className="arabic-text text-emerald-700 mb-4 text-center"
              dir="rtl"
              lang="ar"
              style={{ fontSize: '2.2rem', lineHeight: '2' }}
            >
              {card.arabic}
            </div>
            <div className="text-base text-gray-700 mb-5 text-center leading-relaxed max-w-sm">
              {card.translation_ru || '—'}
            </div>
            <div className="flex gap-4 text-xs text-gray-400 mb-2">
              <span>Интервал: {card.interval} дн.</span>
              <span>Повторений: {card.repetitions}</span>
              <span>EF: {card.easiness_factor.toFixed(2)}</span>
            </div>
            <div className="absolute bottom-4 text-gray-400 text-xs">
              ← Не знаю &nbsp;|&nbsp; Знаю →
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
