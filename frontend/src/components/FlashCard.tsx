import { useState, useRef } from 'react'
import type { CardDue, AyahExample } from '../api/cards'

interface FlashCardProps {
  card: CardDue
  onFlip?: (flipped: boolean) => void
  onSwipe?: (direction: 'left' | 'right') => void
}

const SWIPE_THRESHOLD = 90

// Подсветить слово в тексте аята по позиции
function AyahWithHighlight({ ayah }: { ayah: AyahExample }) {
  const words = ayah.arabic_text.split(/\s+/).filter(Boolean)

  return (
    <div className="text-sm">
      {/* Арабский текст с подсветкой целевого слова */}
      <div
        className="mb-1.5 leading-loose text-right"
        dir="rtl"
        lang="ar"
        style={{ fontFamily: 'Amiri, serif', fontSize: '1.1rem' }}
      >
        {words.map((w, i) => (
          <span key={i}>
            {i === ayah.word_position ? (
              <mark className="bg-yellow-200 text-yellow-900 rounded px-0.5 mx-0.5 not-italic">
                {w}
              </mark>
            ) : (
              <span className="text-gray-600 mx-0.5">{w}</span>
            )}
          </span>
        ))}
      </div>
      {/* Перевод аята */}
      {ayah.russian_translation && (
        <p className="text-gray-500 text-xs leading-relaxed italic">
          {ayah.russian_translation}
        </p>
      )}
      {/* Ссылка на суру:аят */}
      <span className="text-gray-300 text-xs">
        {ayah.surah_number}:{ayah.ayah_number}
      </span>
    </div>
  )
}

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
    setTimeout(() => onSwipe?.(dir), 280)
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
      setDragX(0)
      flip()
      return
    }
    if (isFlipped && Math.abs(dx) >= SWIPE_THRESHOLD) {
      triggerSwipe(dx > 0 ? 'right' : 'left')
    } else {
      setDragX(0)
    }
  }

  const rotation = dragX * 0.06
  const overlayProgress = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1)
  const showKnow = dragX > 15
  const showDontKnow = dragX < -15

  const dragStyle: React.CSSProperties = {
    transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
    transition: isDragging || isExiting
      ? (isExiting ? 'transform 0.28s ease-in' : 'none')
      : 'transform 0.3s ease',
    width: '100%',
    height: '100%',
    position: 'relative',
  }

  return (
    <div
      className="card-container w-full select-none touch-none"
      style={{ height: '420px', cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div style={dragStyle}>
        {/* Оверлей ЗНАЮ */}
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
        {/* Оверлей НЕ ЗНАЮ */}
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

          {/* ── ЛИЦЕВАЯ СТОРОНА ── */}
          <div className="card-face bg-white rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center justify-center p-8">
            {card.is_new && (
              <span className="absolute top-4 right-4 bg-emerald-100 text-emerald-700 text-xs font-medium px-2 py-1 rounded-full">
                Новое
              </span>
            )}
            <div
              className="arabic-text text-gray-900 mb-4 text-center"
              dir="rtl"
              lang="ar"
              style={{ fontSize: '4.5rem', lineHeight: '1.8' }}
            >
              {card.arabic}
            </div>
            <div className="text-gray-400 text-sm">
              Встречается {card.frequency}× в 30-м джузе
            </div>
            <div className="absolute bottom-4 text-gray-400 text-xs">
              Нажмите, чтобы увидеть значение
            </div>
          </div>

          {/* ── ОБОРОТНАЯ СТОРОНА ── */}
          <div className="card-back-face card-face bg-white rounded-2xl shadow-lg border border-emerald-100 flex flex-col p-6 overflow-hidden">

            {/* Слово меньшим шрифтом */}
            <div
              className="arabic-text text-emerald-700 text-center mb-3 flex-shrink-0"
              dir="rtl"
              lang="ar"
              style={{ fontSize: '2.2rem', lineHeight: '1.8' }}
            >
              {card.arabic}
            </div>

            {/* Значения слова */}
            <div className="flex-shrink-0 mb-4">
              {card.translations.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {card.translations.map((t, i) => (
                    <span
                      key={i}
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        i === 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 text-sm">нет перевода</p>
              )}
            </div>

            {/* Примеры из аятов */}
            {card.examples.length > 0 && (
              <div className="flex-1 overflow-hidden">
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                    Примеры из Корана
                  </p>
                  <div className="space-y-3">
                    {card.examples.map((ex, i) => (
                      <AyahWithHighlight key={i} ayah={ex} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Подсказка свайп */}
            <div className="flex-shrink-0 pt-2 border-t border-gray-50 mt-2 text-center">
              <span className="text-gray-300 text-xs">← Не знаю &nbsp;|&nbsp; Знаю →</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
