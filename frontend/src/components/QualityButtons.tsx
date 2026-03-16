interface QualityButtonsProps {
  onSelect: (quality: 1 | 2 | 3 | 4) => void
  isLoading?: boolean
  visible: boolean   // показывать только после переворота карточки
}

const QUALITY_OPTIONS = [
  {
    quality: 1 as const,
    label: 'Снова',
    sublabel: 'Забыл',
    bgClass: 'bg-red-50 hover:bg-red-100 border-red-200 text-red-700',
    emoji: '😰',
  },
  {
    quality: 2 as const,
    label: 'Трудно',
    sublabel: 'С трудом вспомнил',
    bgClass: 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700',
    emoji: '😓',
  },
  {
    quality: 3 as const,
    label: 'Хорошо',
    sublabel: 'Вспомнил с усилием',
    bgClass: 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700',
    emoji: '🙂',
  },
  {
    quality: 4 as const,
    label: 'Легко',
    sublabel: 'Вспомнил сразу',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700',
    emoji: '😊',
  },
]

export default function QualityButtons({ onSelect, isLoading = false, visible }: QualityButtonsProps) {
  if (!visible) return null

  return (
    <div className="grid grid-cols-4 gap-2">
      {QUALITY_OPTIONS.map(({ quality, label, sublabel, bgClass, emoji }) => (
        <button
          key={quality}
          onClick={() => onSelect(quality)}
          disabled={isLoading}
          className={`
            flex flex-col items-center p-3 rounded-xl border-2 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${bgClass}
          `}
        >
          <span className="text-2xl mb-1">{emoji}</span>
          <span className="font-semibold text-sm">{label}</span>
          <span className="text-xs opacity-70 text-center leading-tight mt-0.5">{sublabel}</span>
        </button>
      ))}
    </div>
  )
}
