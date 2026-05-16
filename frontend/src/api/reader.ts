import { apiClient } from './client'

export interface SurahInfo {
  number: number
  name_arabic: string
  name_english: string
  name_transliteration: string | null
  name_russian: string | null
  name_transliteration_ru: string | null
  revelation_type: string | null
  total_ayahs: number
}

export interface WordInAyah {
  word_id: number | null
  position: number
  arabic: string
  translation_ru: string | null
  is_in_study: boolean
}

export interface AyahWithWords {
  id: number
  surah_number: number
  ayah_number: number
  arabic_text: string
  russian_translation: string | null
  words: WordInAyah[]
}

export interface EnqueueResponse {
  added: number
  already_studying: number
}

export const readerApi = {
  getSurahs: () =>
    apiClient.get<SurahInfo[]>('/reader/surahs'),

  getAyahs: (surahNumber: number) =>
    apiClient.get<AyahWithWords[]>(`/reader/ayahs/${surahNumber}`),

  enqueue: (wordIds: number[]) =>
    apiClient.post<EnqueueResponse>('/reader/enqueue', { word_ids: wordIds }),

  dequeue: (wordId: number) =>
    apiClient.delete(`/reader/words/${wordId}`),
}
