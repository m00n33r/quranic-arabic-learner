import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function DashboardPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

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

      {/* Контент */}
      <main className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Добро пожаловать, {user?.username}!</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">Начать занятие</h3>
            <p className="text-gray-500 text-sm mb-4">Повторите слова 30-го джуза</p>
            <button
              onClick={() => navigate('/study')}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors"
            >
              Учиться
            </button>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-2">Статистика</h3>
            <p className="text-gray-500 text-sm">Будет доступна в следующей фазе</p>
          </div>
        </div>
      </main>
    </div>
  )
}
