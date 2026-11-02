import type { TranslationKey } from '../shared/i18n'

/** Prompt propio, guardado en el navegador. */
export interface Prompt {
  id: string
  title: string
  body: string
}

export interface BuiltinPrompt {
  id: string
  titleKey: TranslationKey
  bodyKey: TranslationKey
}

/** Prompts incluidos: el texto se resuelve con el idioma activo. */
export const BUILTIN_PROMPTS: readonly BuiltinPrompt[] = [
  { id: 'code', titleKey: 'prompt.code.title', bodyKey: 'prompt.code.body' },
  { id: 'review', titleKey: 'prompt.review.title', bodyKey: 'prompt.review.body' },
  { id: 'summarize', titleKey: 'prompt.summarize.title', bodyKey: 'prompt.summarize.body' },
  { id: 'translate', titleKey: 'prompt.translate.title', bodyKey: 'prompt.translate.body' },
  { id: 'email', titleKey: 'prompt.email.title', bodyKey: 'prompt.email.body' },
  { id: 'plan', titleKey: 'prompt.plan.title', bodyKey: 'prompt.plan.body' },
]

const STORAGE_KEY = 'nexo.prompts.v1'
const MAX_PROMPTS = 60
const MAX_TITLE = 64
const MAX_BODY = 8_000

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function clean(value: unknown, limit: number): string {
  return typeof value === 'string' ? value.trim().slice(0, limit) : ''
}

export function loadPrompts(): Prompt[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .flatMap((entry) => {
        if (!entry || typeof entry !== 'object') return []
        const row = entry as Record<string, unknown>
        const title = clean(row.title, MAX_TITLE)
        const body = clean(row.body, MAX_BODY)
        if (!title || !body) return []
        return [{ id: typeof row.id === 'string' ? row.id : makeId(), title, body }]
      })
      .slice(0, MAX_PROMPTS)
  } catch {
    return []
  }
}

export function savePrompts(prompts: Prompt[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prompts.slice(0, MAX_PROMPTS)))
  } catch {
    // Sin almacenamiento: la biblioteca vive solo en esta sesión.
  }
}

export function createPrompt(title: string, body: string): Prompt | null {
  const cleanTitle = clean(title, MAX_TITLE)
  const cleanBody = clean(body, MAX_BODY)
  if (!cleanTitle || !cleanBody) return null
  return { id: makeId(), title: cleanTitle, body: cleanBody }
}

export function promptCount(prompts: Prompt[]): number {
  return BUILTIN_PROMPTS.length + prompts.length
}
