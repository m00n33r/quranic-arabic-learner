import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SurahInfo, AyahWithWords } from '../api/reader'
import { readerApi } from '../api/reader'
import { getTajweedRule, TAJWEED_COLORS, TAJWEED_LEGEND } from '../utils/tajweed'

export default function QuranReaderPage() {
  const [surahs, setSurahs] = useState<SurahInfo[]>([])
  const [selectedSurah, setSelectedSurah] = useState<number>(78)
  const [ayahs, setAyahs] = useState<AyahWithWords[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [pendingWordIds, setPendingWordIds] = useState<Set<number>>(new Set())
  const [studyingWordIds, setStudyingWordIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const navigate = useNavigate()

  const loadAyahs = async (surahNumber: number) => {
    setIsLoading(true)
    setCurrentIndex(0)
    setPendingWordIds(new Set())
    try {
      const res = await readerApi.getAyahs(surahNumber)
      setAyahs(res.data)
      const ids = new Set<number>()
      res.data.forEach(a => a.words.forEach(w => { if (w.word_id && w.is_in_study) ids.add(w.word_id) }))
      setStudyingWordIds(ids)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      const surahsRes = await readerApi.getSurahs()
      setSurahs(surahsRes.data)
      await loadAyahs(78)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSurahChange = async (surahNumber: number) => {
    setSelectedSurah(surahNumber)
    await loadAyahs(surahNumber)
  }

  const handleWordClick = async (wordId: number | null, baseIsInStudy: boolean) => {
    if (!wordId) return
    const isInStudy = baseIsInStudy || studyingWordIds.has(wordId)
    if (isInStudy) {
      try {
        await readerApi.dequeue(wordId)
        setStudyingWordIds(prev => { const s = new Set(prev); s.delete(wordId); return s })
        setPendingWordIds(prev => { const s = new Set(prev); s.delete(wordId); return s })
      } catch (e) { console.error(e) }
      return
    }
    setPendingWordIds(prev => {
      const s = new Set(prev)
      if (s.has(wordId)) s.delete(wordId)
      else s.add(wordId)
      return s
    })
  }

  const goToNext = async () => {
    if (pendingWordIds.size > 0) {
      const ids = Array.from(pendingWordIds)
      try {
        await readerApi.enqueue(ids)
        setStudyingWordIds(prev => { const s = new Set(prev); ids.forEach(id => s.add(id)); return s })
      } catch (e) { console.error(e) }
      setPendingWordIds(new Set())
    }
    if (currentIndex < ayahs.length - 1) {
      setCurrentIndex(i => i + 1)
    }
  }

  const goToPrev = () => {
    setPendingWordIds(new Set())
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as Element)?.tagName ?? '')) return
      if (e.key === 'ArrowRight' || e.key === 'l' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        goToNext()
      }
      if (e.key === 'ArrowLeft' || e.key === 'h' || e.key === 'PageUp') {
        e.preventDefault()
        goToPrev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, pendingWordIds, ayahs.length])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка аятов...</p>
        </div>
      </div>
    )
  }

  const currentAyah = ayahs[currentIndex]

  if (!currentAyah) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Аяты не найдены.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 hover:text-gray-700 text-sm flex-shrink-0">
            ← Назад
          </button>
          <select
            value={selectedSurah}
            onChange={e => handleSurahChange(Number(e.target.value))}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {surahs.map(s => (
              <option key={s.number} value={s.number}>
                {s.name_arabic} — {s.name_english}
              </option>
            ))}
          </select>
        </div>
      </nav>

      {/* Progress bar */}
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Аят {currentIndex + 1} из {ayahs.length}</span>
          {pendingWordIds.size > 0 && (
            <span className="text-yellow-600 font-medium">+ {pendingWordIds.size} слов выбрано</span>
          )}
        </div>
        <div className="h-1 bg-gray-200 rounded-full">
          <div
            className="h-1 bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / Math.max(ayahs.length, 1)) * 100}%` }}
          />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-2">
        {/* Ayah card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          {/* Arabic text - RTL word-by-word */}
          <div className="mb-4" dir="rtl">
            <div className="flex flex-wrap gap-x-2 gap-y-3 justify-start">
              {currentAyah.words.map((word, i) => {
                const rule = getTajweedRule(word.arabic)
                const color = TAJWEED_COLORS[rule]
                const isPending = word.word_id !== null && pendingWordIds.has(word.word_id)
                const isStudying = word.word_id !== null && (word.is_in_study || studyingWordIds.has(word.word_id))
                const isClickable = word.word_id !== null

                return (
                  <button
                    key={i}
                    onClick={() => handleWordClick(word.word_id, word.is_in_study)}
                    disabled={!isClickable}
                    className={[
                      'relative px-1 py-0.5 rounded transition-all duration-150',
                      isClickable ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default',
                      isPending ? 'ring-2 ring-yellow-400 bg-yellow-50' : '',
                      isStudying ? 'ring-2 ring-emerald-400 bg-emerald-50' : '',
                    ].join(' ')}
                    style={{
                      fontFamily: 'Amiri, serif',
                      fontSize: '2rem',
                      lineHeight: '2.5',
                      color: (!isPending && !isStudying) ? color : undefined,
                    }}
                    lang="ar"
                    title={
                      !isClickable ? 'Служебное слово' :
                      isStudying ? 'Нажмите чтобы убрать из изучения' :
                      isPending ? 'Нажмите чтобы отменить выбор' :
                      'Нажмите чтобы добавить в изучение'
                    }
                  >
                    {word.arabic}
                    {isStudying && (
                      <span className="absolute -top-1 -right-1 text-xs text-emerald-500 font-bold leading-none">✓</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Ayah number */}
          <div className="text-right text-gray-400 text-sm mb-3" dir="rtl">
            ﴿{currentAyah.ayah_number}﴾
          </div>

          {/* Translation */}
          <div className="border-t border-gray-100 pt-3">
            <div className="text-xs text-gray-400 mb-1">Перевод (Кулиев)</div>
            <div className="text-gray-700 text-base leading-relaxed">
              {currentAyah.russian_translation ?? 'Перевод недоступен'}
            </div>
          </div>
        </div>

        {/* Tajweed legend */}
        <div className="mb-24">
          <button
            onClick={() => setShowLegend(v => !v)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-2"
          >
            <span>{showLegend ? '▲' : '▼'}</span>
            <span>Цвета таджвида</span>
          </button>
          {showLegend && (
            <div className="bg-white rounded-xl border border-gray-100 p-4 grid grid-cols-2 gap-3">
              {TAJWEED_LEGEND.map(({ rule, label, description }) => (
                <div key={rule} className="flex items-start gap-2">
                  <span style={{ color: TAJWEED_COLORS[rule], fontFamily: 'Amiri, serif', fontSize: '1.5rem' }}>أ</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-700">{label}</div>
                    <div className="text-xs text-gray-500 leading-tight">{description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
        <div className="max-w-2xl mx-auto flex items-stretch">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className="flex-1 flex flex-col items-center justify-center py-4 gap-0.5 text-gray-600 disabled:text-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors border-r border-gray-100"
          >
            <span className="text-xl">←</span>
            <span className="text-xs font-medium">Предыдущий</span>
          </button>

          <div className="flex flex-col items-center justify-center px-4 min-w-[80px]">
            <span className="text-xs text-gray-500 font-medium">{currentIndex + 1} / {ayahs.length}</span>
            {pendingWordIds.size > 0 && (
              <span className="text-xs text-yellow-600 font-semibold">+{pendingWordIds.size}</span>
            )}
          </div>

          <button
            onClick={goToNext}
            disabled={currentIndex === ayahs.length - 1 && pendingWordIds.size === 0}
            className="flex-1 flex flex-col items-center justify-center py-4 gap-0.5 text-emerald-600 disabled:text-gray-300 hover:bg-emerald-50 active:bg-emerald-100 transition-colors border-l border-gray-100"
          >
            <span className="text-xl">{currentIndex < ayahs.length - 1 ? '→' : '✓'}</span>
            <span className="text-xs font-medium">{currentIndex < ayahs.length - 1 ? 'Следующий' : 'Завершить'}</span>
          </button>
        </div>
        <div className="hidden md:block text-center text-xs text-gray-300 pb-1.5">
          ← → или H / L · Space для следующего
        </div>
      </div>
    </div>
  )
}
