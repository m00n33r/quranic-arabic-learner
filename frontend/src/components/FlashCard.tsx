import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import type { CardDue, AyahExample, KnownRootWord } from '../api/cards'

interface FlashCardProps {
  card: CardDue
  onFlip?: (flipped: boolean) => void
  onSwipe?: (direction: 'left' | 'right') => void
}

export interface FlashCardHandle {
  triggerSwipe: (dir: 'left' | 'right') => void
}

const SWIPE_THRESHOLD = 90

function RootFamilyBlock({ words, root }: { words: KnownRootWord[]; root: string | null }) {
  if (!words.length || !root) return null
  return (
    <div className="border-t border-gray-100 dark:border-white/10 pt-3 mt-2">
      <p className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-wide mb-2 flex items-center gap-1">
        <span>🌿</span> Семья слов · корень
        <span dir="rtl" lang="ar" className="text-emerald-600 dark:text-emerald-400 font-medium"
          style={{ fontFamily: 'Amiri, serif', fontSize: '1rem' }}>{root}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {words.map((w, i) => (
          <div key={i} className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-lg px-3 py-1.5 flex items-center gap-2 text-sm">
            <span dir="rtl" lang="ar" className="text-emerald-700 dark:text-emerald-400 font-medium"
              style={{ fontFamily: 'Amiri, serif', fontSize: '1.05rem' }}>{w.arabic}</span>
            <span className="text-gray-500 dark:text-white/50 text-xs">{w.translation_ru}</span>
            {w.repetitions >= 3 && <span className="text-yellow-500 text-xs" title="Хорошо изучено">★</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function AyahWithHighlight({ ayah }: { ayah: AyahExample }) {
  const words = ayah.arabic_text.split(/\s+/).filter(Boolean)
  return (
    <div className="text-sm">
      <div className="mb-1.5 leading-loose text-right" dir="rtl" lang="ar"
        style={{ fontFamily: 'Amiri, serif', fontSize: '1.1rem' }}>
        {words.map((w, i) => (
          <span key={i}>
            {i === ayah.word_position ? (
              <mark className="bg-yellow-200 dark:bg-yellow-500/30 text-yellow-900 dark:text-yellow-300 rounded px-0.5 mx-0.5 not-italic">{w}</mark>
            ) : (
              <span className="text-gray-600 dark:text-white/60 mx-0.5">{w}</span>
            )}
          </span>
        ))}
      </div>
      {ayah.russian_translation && (
        <p className="text-gray-500 dark:text-white/40 text-xs leading-relaxed italic">{ayah.russian_translation}</p>
      )}
      <span className="text-gray-300 dark:text-white/20 text-xs">{ayah.surah_number}:{ayah.ayah_number}</span>
    </div>
  )
}

const FlashCard = forwardRef<FlashCardHandle, FlashCardProps>(function FlashCard({ card, onFlip, onSwipe }, ref) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isExiting, setIsExiting] = useState<'left' | 'right' | null>(null)
  const startX = useRef(0)
  const hasDragged = useRef(false)

  const flip = () => { const next = !isFlipped; setIsFlipped(next); onFlip?.(next) }

  const triggerSwipe = (dir: 'left' | 'right') => {
    if (isExiting) return
    setIsExiting(dir); setDragX(dir === 'right' ? 600 : -600)
    setTimeout(() => onSwipe?.(dir), 280)
  }

  useImperativeHandle(ref, () => ({ triggerSwipe }))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'ShiftRight') flip() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    startX.current = e.clientX; hasDragged.current = false; setIsDragging(true)
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
    if (!hasDragged.current || Math.abs(dx) < 8) { setDragX(0); flip(); return }
    if (isFlipped && Math.abs(dx) >= SWIPE_THRESHOLD) triggerSwipe(dx > 0 ? 'right' : 'left')
    else setDragX(0)
  }

  const rotation = dragX * 0.06
  const overlayProgress = Math.min(Math.abs(dragX) / SWIPE_THRESHOLD, 1)
  const showKnow = dragX > 15
  const showDontKnow = dragX < -15
  const tintColor = dragX > 0 ? `rgba(16,185,129,${0.28 * overlayProgress})` : dragX < 0 ? `rgba(239,68,68,${0.28 * overlayProgress})` : 'transparent'

  const dragStyle: React.CSSProperties = {
    transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
    transition: isDragging || isExiting ? (isExiting ? 'transform 0.28s ease-in' : 'none') : 'transform 0.3s ease',
    width: '100%', height: '100%', position: 'relative',
  }

  return (
    <div className="card-container w-full select-none touch-none"
      style={{ height: '560px', cursor: isDragging ? 'grabbing' : 'grab' }}
      onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
      <div style={dragStyle}>
        <div className="absolute inset-0 rounded-2xl z-10 pointer-events-none"
          style={{ backgroundColor: tintColor, transition: isDragging || isExiting ? 'none' : 'background-color 0.3s ease' }} />

        {showKnow && isFlipped && (
          <div className="absolute inset-0 rounded-2xl flex items-center justify-start pl-8 z-20 pointer-events-none" style={{ opacity: overlayProgress }}>
            <div className="border-4 border-emerald-500 rounded-xl px-4 py-2 rotate-[-15deg]">
              <span className="text-emerald-500 text-2xl font-black tracking-widest">ЗНАЮ</span>
            </div>
          </div>
        )}
        {showDontKnow && isFlipped && (
          <div className="absolute inset-0 rounded-2xl flex items-center justify-end pr-8 z-20 pointer-events-none" style={{ opacity: overlayProgress }}>
            <div className="border-4 border-red-500 rounded-xl px-4 py-2 rotate-[15deg]">
              <span className="text-red-500 text-2xl font-black tracking-widest">НЕ ЗНАЮ</span>
            </div>
          </div>
        )}

        <div className={`card-inner w-full h-full ${isFlipped ? 'flipped' : ''}`}>

          {/* Лицевая сторона */}
          <div className="card-face bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-100 dark:border-white/10 flex flex-col items-center justify-center p-8">
            {card.is_new && (
              <span className="absolute top-4 right-4 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium px-2 py-1 rounded-full">
                Новое
              </span>
            )}
            <div className="arabic-text text-gray-900 dark:text-white mb-4 text-center" dir="rtl" lang="ar"
              style={{ fontSize: '4.5rem', lineHeight: '1.8' }}>
              {card.arabic}
            </div>
            <div className="text-gray-400 dark:text-white/30 text-sm">
              Встречается {card.frequency}× в 30-м джузе
            </div>
            <div className="absolute bottom-4 text-gray-300 dark:text-white/20 text-xs">
              Нажмите, чтобы увидеть значение
            </div>
          </div>

          {/* Оборотная сторона */}
          <div className="card-back-face card-face bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-emerald-100 dark:border-emerald-500/20 flex flex-col p-6 overflow-hidden">
            <div className="arabic-text text-emerald-700 dark:text-emerald-400 text-center mb-3 flex-shrink-0" dir="rtl" lang="ar"
              style={{ fontSize: '2.2rem', lineHeight: '1.8' }}>
              {card.arabic}
            </div>

            <div className="flex-shrink-0 mb-4">
              {card.translations.length > 0 ? (
                <div className="flex flex-wrap gap-2 justify-center">
                  {card.translations.map((t, i) => (
                    <span key={i} className={`px-3 py-1 rounded-full text-sm font-medium ${
                      i === 0 ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60'}`}>
                      {t}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-400 dark:text-white/30 text-sm italic">служебный символ · перевод отсутствует</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {card.examples.length > 0 && (
                <div className="border-t border-gray-100 dark:border-white/10 pt-3">
                  <p className="text-xs text-gray-400 dark:text-white/30 uppercase tracking-wide mb-2">Примеры из Корана</p>
                  <div className="space-y-3">
                    {card.examples.slice(0, 2).map((ex, i) => <AyahWithHighlight key={i} ayah={ex} />)}
                  </div>
                </div>
              )}
              <RootFamilyBlock words={card.known_root_words ?? []} root={card.root_approx ?? null} />
            </div>

            <div className="flex-shrink-0 pt-2 border-t border-gray-50 dark:border-white/5 mt-2 text-center">
              <span className="text-gray-300 dark:text-white/20 text-xs">← Не знаю &nbsp;|&nbsp; Знаю →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

export default FlashCard
