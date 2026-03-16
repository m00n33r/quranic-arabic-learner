export type TajweedRule = 'qalqalah' | 'ghunnah' | 'shadda' | 'tanwin' | 'none'

const QALQALAH_LETTERS = new Set(['ق', 'ط', 'ب', 'ج', 'د'])
const SUKUN = '\u0652'
const SHADDA = '\u0651'
const TANWIN = /[\u064B\u064C\u064D]/

function stripDiacritics(text: string): string {
  return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '')
}

export function getTajweedRule(word: string): TajweedRule {
  const hasShadda = word.includes(SHADDA)
  const hasTanwin = TANWIN.test(word)
  const letters = stripDiacritics(word)

  // Ghunnah: ن or م with shadda
  if (hasShadda && /[نم]/.test(letters)) return 'ghunnah'

  // Qalqalah: qalqalah letter + sukun, or qalqalah letter at end of word
  for (let i = 0; i < word.length; i++) {
    if (!QALQALAH_LETTERS.has(word[i])) continue
    const next = word[i + 1]
    if (!next || next === SUKUN) return 'qalqalah'
  }
  if (letters.length > 0 && QALQALAH_LETTERS.has(letters[letters.length - 1])) {
    return 'qalqalah'
  }

  // Any shadda
  if (hasShadda) return 'shadda'

  // Tanwin
  if (hasTanwin) return 'tanwin'

  return 'none'
}

export const TAJWEED_COLORS: Record<TajweedRule, string> = {
  qalqalah: '#dc2626',  // red
  ghunnah:  '#16a34a',  // green
  shadda:   '#9333ea',  // purple
  tanwin:   '#ea580c',  // orange
  none:     '#111827',  // near black
}

export const TAJWEED_LEGEND = [
  { rule: 'qalqalah' as TajweedRule, label: 'Калькаля',  description: 'Буквы ق ط ب ج د — отскок при сукуне' },
  { rule: 'ghunnah'  as TajweedRule, label: 'Гунна',     description: 'نّ مّ — назализация, 2 доли' },
  { rule: 'shadda'   as TajweedRule, label: 'Шадда',     description: 'Удвоение буквы' },
  { rule: 'tanwin'   as TajweedRule, label: 'Танвин',    description: 'Удвоенные гласные в конце' },
]
