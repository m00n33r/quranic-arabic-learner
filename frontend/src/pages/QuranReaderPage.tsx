import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { SurahInfo, AyahWithWords, WordInAyah } from '../api/reader'
import { readerApi } from '../api/reader'
import { getTajweedRule, TAJWEED_COLORS, TAJWEED_LEGEND } from '../utils/tajweed'
import ThemeToggle from '../components/ThemeToggle'

const POSITION_KEY = 'quran_reader_position'

function saveReaderPosition(surah: number, ayahIndex: number) {
  localStorage.setItem(POSITION_KEY, JSON.stringify({ surah, ayahIndex }))
}

function loadReaderPosition(): { surah: number; ayahIndex: number } | null {
  try {
    const raw = localStorage.getItem(POSITION_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch { return null }
}

// Собрать все word_id из аята которые ещё не изучаются и не исключены
function getNewWordIds(
  ayah: AyahWithWords,
  studyingIds: Set<number>,
  excludedIds: Set<number>,
): Set<number> {
  const result = new Set<number>()
  for (const w of ayah.words) {
    if (w.word_id && !studyingIds.has(w.word_id) && !excludedIds.has(w.word_id)) {
      result.add(w.word_id)
    }
  }
  return result
}

export default function QuranReaderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [surahs, setSurahs] = useState<SurahInfo[]>([])
  const [selectedSurah, setSelectedSurah] = useState<number>(
    searchParams.get('surah') ? Number(searchParams.get('surah')) : 78
  )
  const [ayahs, setAyahs] = useState<AyahWithWords[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  // pendingWordIds: новые слова аята, будут добавлены при переходе
  const [pendingWordIds, setPendingWordIds] = useState<Set<number>>(new Set())
  // excludedWordIds: слова которые пользователь исключил ("знаю") — хранятся всю сессию
  const [excludedWordIds, setExcludedWordIds] = useState<Set<number>>(new Set())
  // studyingWordIds: слова уже в очереди изучения (из БД + добавленные в этой сессии)
  const [studyingWordIds, setStudyingWordIds] = useState<Set<number>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const [showSurahDropdown, setShowSurahDropdown] = useState(false)
  const [surahSearch, setSurahSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

  const loadAyahs = useCallback(async (surahNumber: number, excluded: Set<number> = excludedWordIds, startIndex = 0) => {
    setIsLoading(true)
    try {
      const res = await readerApi.getAyahs(surahNumber)
      const data = res.data
      setAyahs(data)

      // Собрать studying ids из API
      const studyIds = new Set<number>()
      data.forEach(a => a.words.forEach(w => { if (w.word_id && w.is_in_study) studyIds.add(w.word_id) }))
      setStudyingWordIds(studyIds)

      // Восстановить позицию (или начать с начала)
      const safeIndex = Math.min(startIndex, Math.max(0, data.length - 1))
      setCurrentIndex(safeIndex)
      if (data.length > 0) {
        setPendingWordIds(getNewWordIds(data[safeIndex], studyIds, excluded))
      }
    } finally {
      setIsLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const init = async () => {
      const surahsRes = await readerApi.getSurahs()
      setSurahs(surahsRes.data)

      // Приоритет: URL-параметр → сохранённая позиция → дефолт (сура 78)
      let initial = 78
      let startIndex = 0
      if (searchParams.get('surah')) {
        initial = Number(searchParams.get('surah'))
      } else {
        const saved = loadReaderPosition()
        if (saved) {
          initial = saved.surah
          startIndex = saved.ayahIndex
        }
      }

      setSelectedSurah(initial)
      await loadAyahs(initial, new Set(), startIndex)
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Закрывать дропдаун при клике вне него
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSurahDropdown(false)
        setSurahSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSurahChange = async (surahNumber: number) => {
    setSelectedSurah(surahNumber)
    setShowSurahDropdown(false)
    setSurahSearch('')
    // При смене суры сбрасываем excluded и позицию
    setExcludedWordIds(new Set())
    saveReaderPosition(surahNumber, 0)
    await loadAyahs(surahNumber, new Set(), 0)
  }

  // Клик по слову:
  // studying → убрать из изучения
  // pending → исключить ("знаю")
  // excluded → вернуть в pending
  // без word_id → ничего
  const handleWordClick = async (word: WordInAyah) => {
    const { word_id } = word
    if (!word_id) return

    const isStudying = word.is_in_study || studyingWordIds.has(word_id)
    const isPending = pendingWordIds.has(word_id)
    const isExcluded = excludedWordIds.has(word_id)

    if (isStudying) {
      try {
        await readerApi.dequeue(word_id)
        setStudyingWordIds(prev => { const s = new Set(prev); s.delete(word_id); return s })
        // После удаления из изучения → добавить в pending (если не excluded)
        if (!isExcluded) {
          setPendingWordIds(prev => { const s = new Set(prev); s.add(word_id); return s })
        }
      } catch (e) { console.error(e) }
      return
    }

    if (isPending) {
      // Исключить ("я знаю это слово")
      setPendingWordIds(prev => { const s = new Set(prev); s.delete(word_id); return s })
      setExcludedWordIds(prev => { const s = new Set(prev); s.add(word_id); return s })
      return
    }

    if (isExcluded) {
      // Вернуть обратно в pending
      setExcludedWordIds(prev => { const s = new Set(prev); s.delete(word_id); return s })
      setPendingWordIds(prev => { const s = new Set(prev); s.add(word_id); return s })
      return
    }
  }

  // Enqueue pending слов и перейти к следующему аяту (или завершить суру)
  const goToNext = useCallback(async () => {
    // Enqueue текущие pending
    const toEnqueue = Array.from(pendingWordIds)
    let newStudyingIds = studyingWordIds
    if (toEnqueue.length > 0) {
      try {
        await readerApi.enqueue(toEnqueue)
        newStudyingIds = new Set(studyingWordIds)
        toEnqueue.forEach(id => newStudyingIds.add(id))
        setStudyingWordIds(newStudyingIds)
      } catch (e) { console.error(e) }
    }
    setPendingWordIds(new Set())

    if (currentIndex < ayahs.length - 1) {
      const nextIdx = currentIndex + 1
      setCurrentIndex(nextIdx)
      saveReaderPosition(selectedSurah, nextIdx)
      // Автозаполнить pending для следующего аята
      setPendingWordIds(getNewWordIds(ayahs[nextIdx], newStudyingIds, excludedWordIds))
    } else {
      // Последний аят — завершить суру → перейти к карточкам
      const surahInfo = surahs.find(s => s.number === selectedSurah)
      const params = new URLSearchParams({ surah: String(selectedSurah) })
      if (surahInfo) params.set('surah_name', surahInfo.name_arabic)
      navigate(`/study?${params}`)
    }
  }, [currentIndex, ayahs, pendingWordIds, studyingWordIds, excludedWordIds, surahs, selectedSurah, navigate])

  const goToPrev = useCallback(() => {
    // Сбрасываем pending без enqueue
    setPendingWordIds(new Set())
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1
      setCurrentIndex(prevIdx)
      saveReaderPosition(selectedSurah, prevIdx)
      setPendingWordIds(getNewWordIds(ayahs[prevIdx], studyingWordIds, excludedWordIds))
    }
  }, [currentIndex, ayahs, studyingWordIds, excludedWordIds, selectedSurah])

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
  }, [goToNext, goToPrev])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 dark:text-white/60">Загрузка аятов...</p>
        </div>
      </div>
    )
  }

  const currentAyah = ayahs[currentIndex]
  if (!currentAyah) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center transition-colors">
        <p className="text-gray-500 dark:text-white/60">Аяты не найдены.</p>
      </div>
    )
  }

  const pendingCount = pendingWordIds.size

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors">

      {/* Навбар */}
      <nav className="bg-white dark:bg-slate-800/80 border-b border-gray-200 dark:border-white/10 sticky top-0 z-20 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="text-gray-500 dark:text-white/50 hover:text-gray-700 dark:hover:text-white/80 text-sm flex-shrink-0 transition-colors">
            ← Назад
          </button>

          <ThemeToggle />

          {/* Кастомный дропдаун сур */}
          <div className="flex-1 relative" ref={dropdownRef}>
            <button
              onClick={() => { setShowSurahDropdown(v => !v); setSurahSearch('') }}
              className="w-full flex items-center justify-between gap-2 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {(() => {
                const s = surahs.find(s => s.number === selectedSurah)
                return s ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-gray-400 dark:text-white/30 flex-shrink-0">{s.number}</span>
                    <span className="text-sm font-medium text-gray-800 dark:text-white/90 truncate">{s.name_transliteration_ru ?? s.name_english}</span>
                    <span className="text-xs text-gray-400 dark:text-white/40 truncate hidden sm:block">— {s.name_russian ?? s.name_english}</span>
                  </div>
                ) : <span className="text-gray-400 dark:text-white/40 text-sm">Выберите суру</span>
              })()}
              <svg className={`w-4 h-4 text-gray-400 dark:text-white/30 flex-shrink-0 transition-transform ${showSurahDropdown ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSurahDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-100 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-2 border-b border-gray-100 dark:border-white/10">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Поиск суры..."
                    value={surahSearch}
                    onChange={e => setSurahSearch(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="overflow-y-auto max-h-72">
                  {surahs.filter(s => {
                    if (!surahSearch) return true
                    const q = surahSearch.toLowerCase()
                    return (s.name_transliteration_ru ?? '').toLowerCase().includes(q) ||
                      (s.name_russian ?? '').toLowerCase().includes(q) ||
                      String(s.number).includes(q)
                  }).map(s => {
                    const isActive = s.number === selectedSurah
                    return (
                      <button key={s.number} onClick={() => handleSurahChange(s.number)}
                        className={['w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                          isActive ? 'bg-emerald-50 dark:bg-emerald-500/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'].join(' ')}>
                        <span className="text-xs font-mono text-gray-400 dark:text-white/30 w-6 flex-shrink-0 text-right">{s.number}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-sm font-medium truncate ${isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-800 dark:text-white/80'}`}>
                              {s.name_transliteration_ru ?? s.name_english}
                            </span>
                            <span className="text-xs text-gray-400 dark:text-white/30 truncate">— {s.name_russian}</span>
                          </div>
                          <div className="text-xs text-gray-400 dark:text-white/30">
                            {s.revelation_type === 'Meccan' ? '🕋 Мекканская' : '🕌 Мединская'} · {s.total_ayahs} аятов
                          </div>
                        </div>
                        <span dir="rtl" lang="ar" className="text-gray-500 dark:text-white/40 flex-shrink-0"
                          style={{ fontFamily: 'Amiri, serif', fontSize: '1.1rem' }}>{s.name_arabic}</span>
                        {isActive && <span className="text-emerald-600 dark:text-emerald-400 flex-shrink-0">✓</span>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Прогресс суры */}
      <div className="max-w-2xl mx-auto px-4 py-2">
        <div className="flex justify-between text-xs text-gray-400 dark:text-white/30 mb-1">
          <span>Аят {currentIndex + 1} из {ayahs.length}</span>
          {pendingCount > 0 && (
            <span className="text-blue-500 dark:text-blue-400 font-medium">
              {pendingCount} {pendingCount === 1 ? 'слово' : 'слов'} → в карточки
            </span>
          )}
        </div>
        <div className="h-1 bg-gray-200 dark:bg-white/10 rounded-full">
          <div className="h-1 bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / Math.max(ayahs.length, 1)) * 100}%` }} />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pt-4 pb-2">

        {/* Шапка суры — только для первого аята */}
        {currentIndex === 0 && (() => {
          const surah = surahs.find(s => s.number === selectedSurah)
          return (
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl mb-3 overflow-hidden shadow-sm">
              <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{surah?.name_russian ?? surah?.name_english}</h2>
                    <div className="flex items-center gap-2 mt-1 text-sm text-gray-400 dark:text-white/40">
                      {surah?.revelation_type && (
                        <span className="flex items-center gap-1">
                          <span>{surah.revelation_type === 'Meccan' ? '🕋' : '🕌'}</span>
                          <span>{surah.revelation_type === 'Meccan' ? 'Мекканская' : 'Мединская'}</span>
                        </span>
                      )}
                      <span>·</span>
                      <span>{surah?.total_ayahs} аятов</span>
                    </div>
                  </div>
                  <div className="text-3xl text-gray-700 dark:text-white/80 flex-shrink-0" dir="rtl" lang="ar"
                    style={{ fontFamily: 'Amiri, serif', lineHeight: 1.6 }}>{surah?.name_arabic}</div>
                </div>
              </div>
              {selectedSurah !== 9 && (
                <div className="px-6 py-5 flex flex-col items-center gap-1 bg-gradient-to-b from-emerald-50 dark:from-emerald-500/10 to-transparent">
                  <div className="text-gray-800 dark:text-white/90 text-center leading-loose" dir="rtl" lang="ar"
                    style={{ fontFamily: 'Amiri, serif', fontSize: '1.9rem' }}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                  </div>
                  <p className="text-xs text-gray-400 dark:text-white/30 tracking-wide">С именем Аллаха, Милостивого, Милосердного</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Карточка аята */}
        <div className="bg-white dark:bg-slate-800/80 border border-gray-100 dark:border-white/10 rounded-2xl mb-3 overflow-hidden shadow-sm">
          <div className="flex items-center px-5 pt-4 pb-2">
            <span className="text-gray-300 dark:text-white/20 text-sm font-mono">{currentAyah.ayah_number}</span>
          </div>

          {/* Интерлинейный текст — равномерная сетка */}
          <div className="px-4 pb-5 pt-1" dir="rtl">
            <div className="flex flex-wrap gap-1.5 justify-start items-stretch">
              {(currentAyah.ayah_number === 1 && selectedSurah !== 9
                ? currentAyah.words.filter(w => w.position >= 4)
                : currentAyah.words
              ).map((word, i) => {
                const rule = getTajweedRule(word.arabic)
                const color = TAJWEED_COLORS[rule]
                const isStudying = word.word_id !== null && (word.is_in_study || studyingWordIds.has(word.word_id))
                const isPending = word.word_id !== null && pendingWordIds.has(word.word_id)
                const isExcluded = word.word_id !== null && excludedWordIds.has(word.word_id)
                const isClickable = word.word_id !== null

                return (
                  <button
                    key={i}
                    onClick={() => handleWordClick(word)}
                    disabled={!isClickable}
                    dir="rtl"
                    title={
                      !isClickable ? undefined :
                      isStudying ? 'В изучении — нажмите чтобы убрать' :
                      isPending ? 'Будет добавлено в карточки — нажмите если знаете' :
                      isExcluded ? 'Знаете это слово — нажмите чтобы добавить' :
                      'Нажмите чтобы добавить в карточки'
                    }
                    className={[
                      'relative flex flex-col rounded-xl transition-all duration-150 overflow-hidden',
                      isClickable ? 'cursor-pointer' : 'cursor-default',
                      isStudying ? 'ring-1 ring-emerald-500/50' : '',
                      isExcluded ? 'opacity-40' : '',
                    ].join(' ')}
                    style={{
                      minWidth: '72px',
                      outline: isPending ? '2px solid rgba(59,130,246,0.6)' :
                               isStudying ? '2px solid rgba(16,185,129,0.5)' : '2px solid transparent',
                      background: isStudying
                        ? 'rgba(16,185,129,0.1)'
                        : isPending
                        ? 'rgba(59,130,246,0.06)'
                        : 'rgba(0,0,0,0.02)',
                    }}
                  >
                    {/* Зона арабского — фиксированная высота */}
                    <div
                      className="flex items-center justify-center px-3 hover:bg-white/5 active:bg-white/10 transition-colors"
                      style={{ height: '68px' }}
                    >
                      <span
                        lang="ar"
                        style={{
                          fontFamily: 'Amiri, serif',
                          fontSize: '1.75rem',
                          lineHeight: 1,
                          whiteSpace: 'nowrap',
                          color: isExcluded ? 'rgba(0,0,0,0.25)'
                               : isStudying ? '#059669'
                               : color,
                        }}
                      >
                        {word.arabic}
                      </span>
                    </div>

                    {/* Разделитель */}
                    <div className="border-t border-white/10 mx-2" />

                    {/* Зона перевода — фиксированная высота */}
                    <div
                      className="flex items-center justify-center px-2"
                      style={{ height: '36px' }}
                    >
                      <span
                        dir="ltr"
                        className={[
                          'text-center leading-tight',
                          isStudying ? 'text-emerald-600 dark:text-emerald-400' :
                          isPending  ? 'text-blue-500 dark:text-blue-400'   : 'text-gray-400 dark:text-white/40',
                        ].join(' ')}
                        style={{
                          fontSize: '0.62rem',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {word.translation_ru || (word.word_id !== null ? '—' : '')}
                      </span>
                    </div>

                    {/* Статус-маркеры */}
                    {isStudying && (
                      <span className="absolute top-1 right-1 text-emerald-400 font-bold leading-none" style={{ fontSize: '0.55rem' }}>✓</span>
                    )}
                    {isExcluded && (
                      <span className="absolute top-1 right-1 text-white/30 font-bold leading-none" style={{ fontSize: '0.55rem' }}>✕</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Перевод аята */}
          <div className="border-t border-gray-100 dark:border-white/10 px-5 py-3">
            <div className="text-xs text-gray-400 dark:text-white/25 mb-1">Перевод (Кулиев)</div>
            <div className="text-gray-700 dark:text-white/70 text-sm leading-relaxed">
              {currentAyah.russian_translation ?? 'Перевод недоступен'}
            </div>
          </div>
        </div>

        {/* Подсказка по словам */}
        <div className="flex gap-4 text-xs text-gray-400 dark:text-white/25 px-1 mb-4">
          <span className="flex items-center gap-1">
            <span style={{ borderBottom: '2px solid #3b82f6', paddingBottom: '1px' }}>أ</span>
            = добавится в карточки
          </span>
          <span className="flex items-center gap-1">
            <span className="text-emerald-600 dark:text-emerald-400">✓</span> = уже изучается
          </span>
          <span className="flex items-center gap-1">
            <span className="opacity-40">أ</span> = знаете
          </span>
        </div>

        {/* Легенда таджвида */}
        <div className="mb-24">
          <button onClick={() => setShowLegend(v => !v)}
            className="flex items-center gap-1 text-sm text-gray-400 dark:text-white/30 hover:text-gray-600 dark:hover:text-white/60 mb-2 transition-colors">
            <span>{showLegend ? '▲' : '▼'}</span>
            <span>Цвета таджвида</span>
          </button>
          {showLegend && (
            <div className="bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl p-4 grid grid-cols-2 gap-3">
              {TAJWEED_LEGEND.map(({ rule, label, description }) => (
                <div key={rule} className="flex items-start gap-2">
                  <span style={{ color: TAJWEED_COLORS[rule], fontFamily: 'Amiri, serif', fontSize: '1.5rem' }}>أ</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-700 dark:text-white/70">{label}</div>
                    <div className="text-xs text-gray-500 dark:text-white/40 leading-tight">{description}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Fixed навигация снизу */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900/90 border-t border-gray-200 dark:border-white/10 backdrop-blur-sm shadow-lg z-10">
        <div className="max-w-2xl mx-auto flex items-stretch">
          <button onClick={goToPrev} disabled={currentIndex === 0}
            className="flex-1 flex flex-col items-center justify-center py-4 gap-0.5 text-gray-600 dark:text-white/60 disabled:text-gray-300 dark:disabled:text-white/20 hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 transition-colors border-r border-gray-100 dark:border-white/10">
            <span className="text-xl">←</span>
            <span className="text-xs font-medium">Предыдущий</span>
          </button>
          <div className="flex flex-col items-center justify-center px-4 min-w-[80px]">
            <span className="text-xs text-gray-500 dark:text-white/40 font-medium">{currentIndex + 1} / {ayahs.length}</span>
            {pendingCount > 0 && <span className="text-xs text-blue-500 dark:text-blue-400 font-semibold">+{pendingCount}</span>}
          </div>
          <button onClick={goToNext}
            className="flex-1 flex flex-col items-center justify-center py-4 gap-0.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 active:bg-emerald-100 dark:active:bg-emerald-500/15 transition-colors border-l border-gray-100 dark:border-white/10">
            <span className="text-xl">{currentIndex < ayahs.length - 1 ? '→' : '✓'}</span>
            <span className="text-xs font-medium">{currentIndex < ayahs.length - 1 ? 'Следующий' : 'К карточкам'}</span>
          </button>
        </div>
        <div className="hidden md:block text-center text-xs text-gray-300 dark:text-white/20 pb-1.5">
          ← → или H / L · Space для следующего
        </div>
      </div>

    </div>
  )
}
