import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { statsApi } from '../api/stats'
import type { StatsSummary } from '../api/stats'

interface StatCardProps {
  label: string
  value: string | number
  sublabel?: string
  colorClass: string
  icon: string
}

function StatCard({ label, value, sublabel, colorClass, icon }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border border-gray-100`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-sm font-medium">{label}</span>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className={`text-3xl font-bold ${colorClass}`}>{value}</div>
      {sublabel && <div className="text-xs text-gray-400 mt-1">{sublabel}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<StatsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)

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
    <div className="min-h-screen bg-gray-50">
      {/* Навбар */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold text-lg">Quran Arabic</span>
            <span className="arabic-text text-emerald-700" dir="rtl">القرآن</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">{user?.username}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Добро пожаловать, {user?.username}!
        </h2>

        {/* Кнопка "Учиться" */}
        <div className="bg-emerald-600 rounded-2xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-1">Начать занятие</h3>
              <p className="text-emerald-100 text-sm">
                {isLoading ? 'Загрузка...' : (
                  stats?.cards_due_today
                    ? `${stats.cards_due_today} карточек ждут повторения`
                    : 'На сегодня всё готово!'
                )}
              </p>
            </div>
            <button
              onClick={() => navigate('/study')}
              className="bg-white text-emerald-700 font-bold px-6 py-3 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              Учиться →
            </button>
          </div>

          {/* Прогресс-бар выученных слов */}
          {stats && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-emerald-100 mb-1">
                <span>Прогресс словаря</span>
                <span>{stats.words_learned} / {stats.words_total} слов ({progressPercent}%)</span>
              </div>
              <div className="h-2 bg-emerald-500 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Статистика */}
        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-3 w-2/3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
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
            <StatCard
              label="Выучено слов"
              value={stats.words_learned}
              sublabel={`из ${stats.words_total}`}
              colorClass="text-emerald-600"
              icon="📚"
            />
            <StatCard
              label="Серия дней"
              value={stats.current_streak}
              sublabel={stats.current_streak === 1 ? 'день подряд' : 'дней подряд'}
              colorClass="text-amber-600"
              icon="🔥"
            />
            <StatCard
              label="Точность"
              value={`${Math.round(stats.accuracy_overall)}%`}
              sublabel="средняя"
              colorClass={stats.accuracy_overall >= 70 ? 'text-blue-600' : 'text-orange-600'}
              icon="🎯"
            />
            <StatCard
              label="Сессий"
              value={stats.sessions_total}
              sublabel="завершено"
              colorClass="text-purple-600"
              icon="✅"
            />
          </div>
        )}

        {/* Сегодня */}
        {stats && stats.cards_today > 0 && (
          <div className="mt-4 bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-sm text-gray-600">
            Сегодня вы повторили <strong>{stats.cards_today}</strong> карточек. Отличная работа!
          </div>
        )}
      </main>
    </div>
  )
}
