import { apiClient } from './client'

export interface StatsSummary {
  words_learned: number
  words_total: number
  cards_due_today: number
  cards_today: number
  sessions_total: number
  current_streak: number
  accuracy_overall: number
}

export const statsApi = {
  getSummary: () => apiClient.get<StatsSummary>('/stats/summary'),
}
