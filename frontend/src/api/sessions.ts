import { apiClient } from './client'

export interface SessionStart {
  id: number
  user_id: number
  started_at: string
  is_completed: boolean
}

export interface SessionComplete {
  id: number
  cards_reviewed: number
  cards_correct: number
  accuracy: number
  duration_seconds: number
  completed_at: string
}

export const sessionsApi = {
  startSession: () => apiClient.post<SessionStart>('/sessions/start'),
  completeSession: (id: number) => apiClient.post<SessionComplete>(`/sessions/${id}/complete`),
  getSession: (id: number) => apiClient.get(`/sessions/${id}`),
}
