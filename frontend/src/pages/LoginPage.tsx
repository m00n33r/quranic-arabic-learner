import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      const res = await authApi.login(email, password)
      await login(res.data.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Неверный email или пароль')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Логотип */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/40 mb-4">
            <span className="text-white text-3xl font-bold" style={{ fontFamily: 'Amiri, serif' }}>ق</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quran Arabic</h1>
          <p className="text-gray-500 dark:text-emerald-400/80 text-sm mt-1">Изучайте слова Корана</p>
          <p className="text-emerald-700 dark:text-white/40 text-lg mt-2" dir="rtl" style={{ fontFamily: 'Amiri, serif' }}>
            بِسْمِ اللَّهِ
          </p>
        </div>

        {/* Карточка формы */}
        <div className="bg-white dark:bg-white/5 dark:backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-xl shadow-gray-200/50 dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 mt-2"
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-white/40 mt-6">
            Нет аккаунта?{' '}
            <Link to="/register" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium transition-colors">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
