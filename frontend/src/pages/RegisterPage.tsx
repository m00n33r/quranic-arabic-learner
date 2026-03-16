import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

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
      // Авто-логин после регистрации
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Регистрация</h1>
          <p className="text-gray-500 text-sm">Начните изучать арабский через Коран</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {(['email', 'username', 'password'] as const).map(field => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {field === 'username' ? 'Имя пользователя' : field === 'password' ? 'Пароль' : 'Email'}
              </label>
              <input
                type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'}
                name={field}
                value={form[field]}
                onChange={handleChange}
                required
                minLength={field === 'password' ? 8 : undefined}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                placeholder={field === 'email' ? 'your@email.com' : field === 'username' ? 'username123' : '••••••••'}
              />
            </div>
          ))}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {isLoading ? 'Регистрация...' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
