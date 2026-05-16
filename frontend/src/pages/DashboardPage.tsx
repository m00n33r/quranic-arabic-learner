import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { statsApi } from '../api/stats'
import type { StatsSummary } from '../api/stats'
import OnboardingModal, { hasSeenOnboarding } from '../components/OnboardingModal'
import ThemeToggle from '../components/ThemeToggle'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  gradient: string
  icon: string
}

function StatCard({ label, value, sublabel, gradient, icon }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} text-white shadow-lg`}>
      <div className="absolute -right-3 -top-3 text-5xl opacity-20 select-none">{icon}</div>
      <div className="text-xs font-medium uppercase tracking-wider opacity-75 mb-2">{label}</div>
      <div className="text-3xl font-bold mb-0.5">{value}</div>
      {sublabel && <div className="text-xs opacity-70">{sublabel}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<StatsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(!hasSeenOnboarding())

  useEffect(() => {
    statsApi.getSummary()
      .then(res => setStats(res.data))
      .catch(() => setError(true))
      .finally(() => setIsLoading(false))
  }, [])

  const progressPercent = stats && stats.words_total > 0
    ? Math.round((stats.words_learned / stats.words_total) * 100)
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* Навбар */}
      <nav className="bg-white dark:bg-slate-800/80 border-b border-gray-200 dark:border-white/10 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-emerald-900/40">
              <span className="text-white text-sm font-bold" style={{ fontFamily: 'Amiri, serif' }}>ق</span>
            </div>
            <div>
              <span className="text-gray-900 dark:text-white font-bold text-base leading-none">Quran Arabic</span>
              <div className="text-emerald-600 dark:text-emerald-400 text-xs">обучение на основе Корана</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-white/60">{user?.username}</span>
            <ThemeToggle />
            <button
              onClick={logout}
              className="text-xs text-gray-400 dark:text-white/30 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Приветствие */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Ассаляму алейкум, <span className="text-emerald-600 dark:text-emerald-400">{user?.username}</span>
          </h2>
          <p className="text-gray-400 dark:text-white/40 text-sm mt-0.5">Продолжайте изучать слова Корана</p>
        </div>

        {/* Главные кнопки действий */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Начать занятие */}
          <button
            onClick={() => navigate('/study')}
            className="group relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-left shadow-xl shadow-emerald-200 dark:shadow-emerald-900/40 hover:shadow-emerald-300 dark:hover:shadow-emerald-700/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-15 select-none">📚</div>
            <div className="relative">
              <div className="text-emerald-100/70 text-xs font-medium uppercase tracking-wider mb-3">Карточки</div>
              <div className="text-white text-xl font-bold mb-1">Начать занятие</div>
              <div className="text-emerald-100/70 text-sm">
                {isLoading ? '...' : (
                  stats?.cards_due_today
                    ? `${stats.cards_due_today} карточек ждут`
                    : 'На сегодня всё готово!'
                )}
              </div>
              {stats && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-emerald-100/60 mb-1.5">
                    <span>Словарный запас</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-emerald-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-white/80 rounded-full transition-all duration-700"
                      style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="text-xs text-emerald-100/50 mt-1">{stats.words_learned} из {stats.words_total} слов</div>
                </div>
              )}
            </div>
          </button>

          {/* Читать Коран */}
          <button
            onClick={() => navigate('/reader')}
            className="group relative overflow-hidden bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-6 text-left shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 hover:shadow-indigo-300 dark:hover:shadow-indigo-700/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-colors" />
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-15 select-none">📖</div>
            <div className="relative">
              <div className="text-indigo-100/70 text-xs font-medium uppercase tracking-wider mb-3">Чтение</div>
              <div className="text-white text-xl font-bold mb-1">Читать Коран</div>
              <div className="text-indigo-100/70 text-sm">Таджвид · перевод · добавление слов</div>
              <div className="mt-4 flex gap-2">
                {['30-й джуз', '37 сур', 'таджвид'].map(tag => (
                  <span key={tag} className="text-xs bg-white/10 text-white/70 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </div>
          </button>
        </div>

        {/* Статистика */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-gray-200 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            Не удалось загрузить статистику.{' '}
            <button
              onClick={() => { setError(false); setIsLoading(true); statsApi.getSummary().then(r => setStats(r.data)).catch(() => setError(true)).finally(() => setIsLoading(false)) }}
              className="underline hover:no-underline"
            >
              Повторить
            </button>
          </div>
        )}

        {stats && !isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Выучено слов" value={stats.words_learned} sublabel={`из ${stats.words_total}`}
              gradient="bg-gradient-to-br from-emerald-500 to-emerald-700" icon="📚" />
            <StatCard label="Серия" value={`${stats.current_streak}д`}
              sublabel={stats.current_streak === 1 ? 'день подряд' : 'дней подряд'}
              gradient="bg-gradient-to-br from-amber-500 to-orange-600" icon="🔥" />
            <StatCard label="Точность" value={`${Math.round(stats.accuracy_overall)}%`} sublabel="средняя"
              gradient={stats.accuracy_overall >= 70
                ? "bg-gradient-to-br from-blue-500 to-blue-700"
                : "bg-gradient-to-br from-orange-500 to-red-600"} icon="🎯" />
            <StatCard label="Сессий" value={stats.sessions_total} sublabel="завершено"
              gradient="bg-gradient-to-br from-purple-500 to-violet-700" icon="✅" />
          </div>
        )}

        {stats && stats.cards_today > 0 && (
          <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl px-5 py-4 flex items-center gap-3">
            <span className="text-2xl">⭐</span>
            <div>
              <div className="text-gray-800 dark:text-white text-sm font-medium">
                Сегодня повторено <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.cards_today}</span> карточек
              </div>
              <div className="text-gray-400 dark:text-white/40 text-xs">Отличная работа, продолжайте!</div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
