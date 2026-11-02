import type { ChatMessage, Conversation, PartStatus, ReplyPart, Turn, Workspace } from '../shared/types'
import { DEFAULT_PROVIDER } from '../shared/providers'

export const STATE_KEY = 'nexo.state.v1'
export const KEYS_KEY = 'nexo.keys.v1'

export const DEFAULT_SETTINGS: Workspace['settings'] = {
  provider: DEFAULT_PROVIDER.id,
  model: DEFAULT_PROVIDER.models[0] ?? 'gpt-4o-mini',
  theme: 'dark',
  accent: '#8b6cff',
  system:
    'Eres Nexo, un asistente claro y directo. Adapta la longitud a la pregunta: breve si es simple, estructurada si es compleja. Usa Markdown solo cuando aporte (listas, tablas, bloques de código con lenguaje). Si no estás seguro de algo, dilo.',
  temperature: 0.7,
  maxTokens: 2048,
  compare: false,
  compareModels: [
    { provider: 'openai', model: 'gpt-4o-mini' },
    { provider: 'anthropic', model: 'claude-haiku-4-5' },
  ],
  sendOnEnter: true,
}

export function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const STATUSES: PartStatus[] = ['streaming', 'done', 'error', 'stopped']

/**
 * Normaliza los turnos guardados. Una respuesta que estaba transmitiéndose
 * cuando se cerró la pestaña queda como «detenida»: si no, el composer
 * seguiría creyendo que hay una petición en curso y no dejaría escribir.
 */
function repairTurns(value: unknown): Turn[] {
  if (!Array.isArray(value)) return []
  const turns: Turn[] = []

  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue
    const turn = raw as Record<string, unknown>
    const id = typeof turn.id === 'string' ? turn.id : uid()
    const at = typeof turn.at === 'number' ? turn.at : Date.now()

    if (turn.role === 'user') {
      if (typeof turn.content !== 'string') continue
      turns.push({ id, role: 'user', content: turn.content, at })
      continue
    }

    if (turn.role !== 'assistant' || !Array.isArray(turn.parts)) continue
    const parts: ReplyPart[] = []

    for (const entry of turn.parts) {
      if (!entry || typeof entry !== 'object') continue
      const part = entry as Record<string, unknown>
      if (typeof part.provider !== 'string' || typeof part.model !== 'string') continue
      const rawStatus = STATUSES.find((status) => status === part.status) ?? 'done'
      parts.push({
        id: typeof part.id === 'string' ? part.id : uid(),
        provider: part.provider,
        model: part.model,
        content: typeof part.content === 'string' ? part.content : '',
        status: rawStatus === 'streaming' ? 'stopped' : rawStatus,
        ...(typeof part.error === 'string' ? { error: part.error } : {}),
        ...(typeof part.ms === 'number' ? { ms: part.ms } : {}),
      })
    }

    if (parts.length) turns.push({ id, role: 'assistant', parts, at })
  }

  return turns
}

export function loadWorkspace(): Workspace {
  const empty: Workspace = { conversations: [], activeId: null, settings: { ...DEFAULT_SETTINGS } }
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return empty
    const parsed = JSON.parse(raw) as Partial<Workspace> | null
    if (!parsed || typeof parsed !== 'object') return empty

    const conversations: Conversation[] = Array.isArray(parsed.conversations)
      ? parsed.conversations.flatMap((entry) => {
          if (!entry || typeof entry !== 'object') return []
          const candidate = entry as Partial<Conversation>
          if (typeof candidate.id !== 'string') return []
          const turns = repairTurns(candidate.turns)
          const now = Date.now()
          return [
            {
              id: candidate.id,
              title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title : 'Conversación',
              turns,
              createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : now,
              updatedAt: typeof candidate.updatedAt === 'number' ? candidate.updatedAt : now,
            },
          ]
        })
      : []

    const settings = { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) }
    const activeId =
      typeof parsed.activeId === 'string' && conversations.some((conversation) => conversation.id === parsed.activeId)
        ? parsed.activeId
        : (conversations[0]?.id ?? null)

    return { conversations, activeId, settings }
  } catch {
    return empty
  }
}

export function saveWorkspace(workspace: Workspace): void {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(workspace))
  } catch {
    // Cuota llena o almacenamiento bloqueado: la app sigue funcionando en memoria.
  }
}

export function loadKeys(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEYS_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, unknown> | null
    if (!parsed || typeof parsed !== 'object') return {}
    const keys: Record<string, string> = {}
    for (const [provider, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && value.trim()) keys[provider] = value.trim()
    }
    return keys
  } catch {
    return {}
  }
}

export function saveKeys(keys: Record<string, string>): void {
  try {
    localStorage.setItem(KEYS_KEY, JSON.stringify(keys))
  } catch {
    // Igual que arriba: si no hay sitio, la sesión actual sigue viva.
  }
}

/** Historial en texto plano para el contexto del modelo. */
export function toChatMessages(turns: Turn[]): ChatMessage[] {
  const messages: ChatMessage[] = []
  for (const turn of turns) {
    if (turn.role === 'user') {
      if (turn.content.trim()) messages.push({ role: 'user', content: turn.content })
      continue
    }
    const winner = turn.parts.find((part) => part.status === 'done' && part.content.trim())
    if (winner) messages.push({ role: 'assistant', content: winner.content })
  }
  return messages
}

/** Exporta una conversación como Markdown legible. */
export function toMarkdown(conversation: Conversation): string {
  const lines: string[] = [`# ${conversation.title}`, '']
  lines.push(`_Exportado de Nexo el ${new Date().toLocaleString('es')}_`, '')

  for (const turn of conversation.turns) {
    if (turn.role === 'user') {
      lines.push('## Tú', '', turn.content, '')
      continue
    }
    for (const part of turn.parts) {
      const seconds = part.ms ? ` · ${(part.ms / 1000).toFixed(1)} s` : ''
      lines.push(`## ${part.provider} · ${part.model}${seconds}`, '')
      lines.push(part.content.trim() || '_(sin respuesta)_', '')
      if (part.error) lines.push(`> Error: ${part.error}`, '')
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n')
}

export function isStreaming(turns: Turn[]): boolean {
  return turns.some((turn) => turn.role === 'assistant' && turn.parts.some((part) => part.status === 'streaming'))
}

export function titleFrom(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (!clean) return 'Nueva conversación'
  return clean.length > 48 ? `${clean.slice(0, 48).trimEnd()}…` : clean
}

export function slugFrom(text: string): string {
  const slug = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
  return slug || 'nexo'
}

export function formatAgo(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.round(diff / 60_000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.round(hours / 24)
  if (days < 7) return `${days} d`
  return new Date(timestamp).toLocaleDateString('es', { day: 'numeric', month: 'short' })
}
