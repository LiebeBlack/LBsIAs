import type { Conversation } from '../shared/types'

export type SearchKind = 'title' | 'user' | 'assistant'

export interface SearchHit {
  key: string
  conversationId: string
  conversationTitle: string
  kind: SearchKind
  text: string
  at: number
}

const MAX_HITS = 60
const MAX_PER_CHAT = 4
const SNIPPET_BEFORE = 52
const SNIPPET_AFTER = 76

function snippet(text: string, index: number, length: number): string {
  const start = Math.max(0, index - SNIPPET_BEFORE)
  const end = Math.min(text.length, index + length + SNIPPET_AFTER)
  const body = text.slice(start, end).replace(/\s+/g, ' ').trim()
  return `${start > 0 ? '…' : ''}${body}${end < text.length ? '…' : ''}`
}

/**
 * Búsqueda lineal sobre títulos y mensajes. Devuelve como máximo 4 aciertos por
 * conversación para que una sola charla no tape el resto de resultados.
 */
export function searchConversations(conversations: Conversation[], rawQuery: string): SearchHit[] {
  const query = rawQuery.trim()
  if (query.length < 2) return []
  const needle = query.toLowerCase()
  const hits: SearchHit[] = []
  const ordered = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)

  for (const conversation of ordered) {
    let perChat = 0
    const title = conversation.title
    const titleIndex = title.toLowerCase().indexOf(needle)
    if (titleIndex !== -1) {
      hits.push({
        key: `${conversation.id}:title`,
        conversationId: conversation.id,
        conversationTitle: title,
        kind: 'title',
        text: title,
        at: conversation.updatedAt,
      })
      perChat += 1
    }

    for (const turn of conversation.turns) {
      if (perChat >= MAX_PER_CHAT) break
      if (turn.role === 'user') {
        const index = turn.content.toLowerCase().indexOf(needle)
        if (index !== -1) {
          hits.push({
            key: `${conversation.id}:${turn.id}`,
            conversationId: conversation.id,
            conversationTitle: title,
            kind: 'user',
            text: snippet(turn.content, index, query.length),
            at: turn.at,
          })
          perChat += 1
        }
        continue
      }

      for (const part of turn.parts) {
        if (perChat >= MAX_PER_CHAT) break
        if (part.status === 'error') continue
        const index = part.content.toLowerCase().indexOf(needle)
        if (index === -1) continue
        hits.push({
          key: `${conversation.id}:${part.id}`,
          conversationId: conversation.id,
          conversationTitle: title,
          kind: 'assistant',
          text: snippet(part.content, index, query.length),
          at: turn.at,
        })
        perChat += 1
      }
    }

    if (hits.length >= MAX_HITS) break
  }

  return hits.slice(0, MAX_HITS)
}
