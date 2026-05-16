import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '' })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)
    try {
      await authApi.register(form)
      const loginRes = await authApi.login(form.email, form.password)
      await login(loginRes.data.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'Ошибка регистрации')
    } finally {
      setIsLoading(false)
    }
  }

  const fields = [
    { key: 'email' as const, label: 'Email', type: 'email', placeholder: 'your@email.com' },
    { key: 'username' as const, label: 'Имя пользователя', type: 'text', placeholder: 'username123' },
    { key: 'password' as const, label: 'Пароль', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500 shadow-xl shadow-emerald-200 dark:shadow-emerald-900/40 mb-4">
            <span className="text-white text-3xl font-bold" style={{ fontFamily: 'Amiri, serif' }}>ق</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Регистрация</h1>
          <p className="text-gray-500 dark:text-emerald-400/80 text-sm mt-1">Начните изучать арабский через Коран</p>
        </div>

        <div className="bg-white dark:bg-white/5 dark:backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-xl shadow-gray-200/50 dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70 mb-1.5">{label}</label>
                <input
                  type={type}
                  name={key}
                  value={form[key]}
                  onChange={handleChange}
                  required
                  minLength={key === 'password' ? 8 : undefined}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder={placeholder}
                />
              </div>
            ))}

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
              {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 dark:text-white/40 mt-6">
            Уже есть аккаунт?{' '}
            <Link to="/login" className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 font-medium transition-colors">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
