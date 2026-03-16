import { apiClient } from './client'

export interface UserResponse {
  id: number
  email: string
  username: string
  is_active: boolean
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export const authApi = {
  register: (data: { email: string; username: string; password: string }) =>
    apiClient.post<UserResponse>('/auth/register', data),

  login: (email: string, password: string) => {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    return apiClient.post<TokenResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  getMe: () => apiClient.get<UserResponse>('/auth/me'),
}
