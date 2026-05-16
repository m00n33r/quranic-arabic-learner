import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'quran_onboarding_done'

export function hasSeenOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function markOnboardingDone(): void {
  localStorage.setItem(STORAGE_KEY, '1')
}

interface Step {
  title: string
  icon: string
  content: React.ReactNode
}

const steps: Step[] = [
  {
    title: 'Добро пожаловать!',
    icon: '🌙',
    content: (
      <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
        <p>
          <strong>Quran Arabic Learner</strong> — сервис для изучения арабского языка
          через чтение Корана (30-й джуз).
        </p>
        <p>Всего три шага к пониманию Корана:</p>
        <ol className="list-decimal list-inside space-y-1 pl-2">
          <li>Читай суры с подсветкой таджвида</li>
          <li>Добавляй незнакомые слова в карточки</li>
          <li>Повторяй слова по системе SM-2</li>
        </ol>
        <div
          className="mt-4 text-center text-3xl leading-loose"
          dir="rtl"
          lang="ar"
          style={{ fontFamily: 'Amiri, serif' }}
        >
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
        <p className="text-center text-xs text-gray-400 italic">
          «Во имя Аллаха, Милостивого, Милосердного» — Басмала
        </p>
      </div>
    ),
  },
  {
    title: 'Чтение Корана с таджвидом',
    icon: '📖',
    content: (
      <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
        <p>
          В ридере слова Корана подсвечены согласно правилам таджвида:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
            <span>Калькала (قطبجد)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-green-600 flex-shrink-0" />
            <span>Гунна (نّ مّ)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-600 flex-shrink-0" />
            <span>Шадда</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
            <span>Танвин</span>
          </div>
        </div>
        <p>
          Все новые слова автоматически выделяются <span className="border-b-2 border-blue-500">синей линией снизу</span> —
          они будут добавлены в карточки для повторения.
        </p>
        <p>
          Если вы уже знаете слово — нажмите на него, чтобы исключить его из повторений.
          Нажмите ещё раз, чтобы вернуть.
        </p>
        <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
          Переходите между аятами кнопками <strong>←</strong> <strong>→</strong> или
          стрелками на клавиатуре
        </div>
      </div>
    ),
  },
  {
    title: 'Карточки для запоминания',
    icon: '🃏',
    content: (
      <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
        <p>
          Слова, которые вы добавили из ридера, появляются в режиме <strong>Учиться</strong>
          в виде флэш-карточек.
        </p>
        <div className="flex gap-3 justify-center my-2">
          <div className="flex flex-col items-center gap-1 text-xs text-red-600">
            <div className="text-2xl">←</div>
            <span>Не знаю</span>
          </div>
          <div className="bg-gray-100 rounded-xl px-6 py-3 text-center">
            <div
              className="text-2xl font-bold text-gray-900"
              dir="rtl"
              lang="ar"
              style={{ fontFamily: 'Amiri, serif' }}
            >
              الرَّحْمَٰنِ
            </div>
            <div className="text-xs text-gray-400 mt-1">нажмите, чтобы перевернуть</div>
          </div>
          <div className="flex flex-col items-center gap-1 text-xs text-emerald-600">
            <div className="text-2xl">→</div>
            <span>Знаю</span>
          </div>
        </div>
        <ul className="space-y-1 text-xs pl-2">
          <li>• Нажмите на карточку — увидите перевод и примеры из аятов</li>
          <li>• Свайпните вправо (или →) — слово знакомо</li>
          <li>• Свайпните влево (или ←) — нужно повторить</li>
          <li>• <strong>Right Shift</strong> — быстро перевернуть карточку</li>
        </ul>
        <div className="bg-emerald-50 rounded-lg p-3 text-xs text-emerald-700">
          Система SM-2 автоматически планирует повторения — слова появляются
          чаще, если вы их плохо знаете, и реже, если хорошо.
        </div>
      </div>
    ),
  },
  {
    title: 'Готово! Начнём читать?',
    icon: '✨',
    content: (
      <div className="space-y-3 text-gray-600 text-sm leading-relaxed">
        <p>
          Приложение содержит <strong>30-й джуз</strong> Корана — суры 78–114.
          Это идеальное место для начала: короткие суры, часто встречающиеся слова.
        </p>
        <div
          className="bg-gray-50 rounded-xl p-4 text-right text-xl leading-loose"
          dir="rtl"
          lang="ar"
          style={{ fontFamily: 'Amiri, serif' }}
        >
          <p>عَمَّ يَتَسَاءَلُونَ</p>
          <p>عَنِ النَّبَإِ الْعَظِيمِ</p>
        </div>
        <p className="text-center text-xs text-gray-400 italic">
          Ан-Наба 78:1-2 — «О чём они вопрошают друг друга? О великой вести»
        </p>
        <p>
          Нажмите кнопку ниже, чтобы выбрать суру и начать читать!
        </p>
      </div>
    ),
  },
]

interface OnboardingModalProps {
  onClose: () => void
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  const isLast = step === steps.length - 1
  const current = steps[step]

  const handleNext = () => {
    if (isLast) {
      markOnboardingDone()
      onClose()
      navigate('/reader')
    } else {
      setStep(s => s + 1)
    }
  }

  const handleSkip = () => {
    markOnboardingDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-indigo-600 p-6 text-white text-center">
          <div className="text-4xl mb-2">{current.icon}</div>
          <h2 className="text-xl font-bold">{current.title}</h2>
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-4 px-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-emerald-500' : 'w-1.5 bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6">{current.content}</div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {!isLast && (
            <button
              onClick={handleSkip}
              className="flex-1 py-2.5 rounded-lg text-gray-500 text-sm hover:bg-gray-100 transition-colors"
            >
              Пропустить
            </button>
          )}
          <button
            onClick={handleNext}
            className={`${isLast ? 'w-full' : 'flex-1'} py-2.5 rounded-lg font-semibold text-white text-sm transition-colors ${
              isLast
                ? 'bg-indigo-600 hover:bg-indigo-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLast ? 'Выбрать суру →' : 'Далее →'}
          </button>
        </div>
      </div>
    </div>
  )
}
