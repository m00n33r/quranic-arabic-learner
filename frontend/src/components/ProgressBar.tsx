interface ProgressBarProps {
  current: number   // текущий номер карточки (1-based)
  total: number     // всего карточек
  correct: number   // правильных ответов
}

export default function ProgressBar({ current, total, correct }: ProgressBarProps) {
  const percentage = total > 0 ? ((current - 1) / total) * 100 : 0
  const accuracy = (current > 1) ? Math.round((correct / (current - 1)) * 100) : null

  return (
    <div className="w-full">
      {/* Счётчик */}
      <div className="flex items-center justify-between mb-2 text-sm">
        <span className="text-gray-600">
          Карточка <span className="font-semibold text-gray-900">{current}</span> из {total}
        </span>
        {accuracy !== null && (
          <span className="text-gray-600">
            Точность: <span className={`font-semibold ${accuracy >= 70 ? 'text-emerald-600' : 'text-orange-600'}`}>
              {accuracy}%
            </span>
          </span>
        )}
      </div>

      {/* Прогресс бар */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
