import { apiClient } from './client'

export interface AyahExample {
  arabic_text: string
  russian_translation: string | null
  surah_number: number
  ayah_number: number
  word_position: number
}

export interface CardDue {
  word_id: number
  arabic: string
  arabic_clean: string
  translations: string[]
  frequency: number
  easiness_factor: number
  interval: number
  repetitions: number
  next_review_date: string
  is_new: boolean
  examples: AyahExample[]
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
