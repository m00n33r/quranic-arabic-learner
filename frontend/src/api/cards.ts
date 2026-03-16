import { apiClient } from './client'

export interface CardDue {
  word_id: number
  arabic: string
  arabic_clean: string
  translation_ru: string | null
  frequency: number
  easiness_factor: number
  interval: number
  repetitions: number
  next_review_date: string
  is_new: boolean
}

export interface ReviewResponse {
  word_id: number
  quality: number
  new_ef: number
  new_interval: number
  new_repetitions: number
  next_review_date: string
  is_correct: boolean
}

export const cardsApi = {
  getDueCards: (limit = 20) =>
    apiClient.get<CardDue[]>(`/cards/due?limit=${limit}`),

  reviewCard: (wordId: number, quality: number, sessionId?: number) =>
    apiClient.post<ReviewResponse>(`/cards/${wordId}/review`, {
      quality,
      session_id: sessionId,
    }),
}
