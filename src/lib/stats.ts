import type { Conversation } from '../shared/types'

export interface ModelUsage {
  provider: string
  model: string
  count: number
}

export interface UsageStats {
  conversations: number
  userTurns: number
  replies: number
  characters: number
  words: number
  averageMs: number
  attachments: number
  models: ModelUsage[]
  providers: Array<{ provider: string; count: number }>
}

function countWords(text: string): number {
  const clean = text.trim()
  if (!clean) return 0
  return clean.split(/\s+/).length
}

/** Todo se calcula en una sola pasada: O(n) sobre los turnos guardados. */
export function computeStats(conversations: Conversation[]): UsageStats {
  const models = new Map<string, ModelUsage>()
  const providers = new Map<string, number>()
  let userTurns = 0
  let replies = 0
  let characters = 0
  let words = 0
  let attachments = 0
  let totalMs = 0
  let timedReplies = 0

  for (const conversation of conversations) {
    for (const turn of conversation.turns) {
      if (turn.role === 'user') {
        userTurns += 1
        characters += turn.content.length
        words += countWords(turn.content)
        if (turn.attachments?.length) {
          attachments += turn.attachments.length
          for (const attachment of turn.attachments) {
            characters += attachment.content.length
            words += countWords(attachment.content)
          }
        }
        continue
      }

      for (const part of turn.parts) {
        replies += 1
        characters += part.content.length
        words += countWords(part.content)
        const key = `${part.provider}::${part.model}`
        const usage = models.get(key)
        if (usage) usage.count += 1
        else models.set(key, { provider: part.provider, model: part.model, count: 1 })
        providers.set(part.provider, (providers.get(part.provider) ?? 0) + 1)
        if (typeof part.ms === 'number' && part.ms > 0) {
          totalMs += part.ms
          timedReplies += 1
        }
      }
    }
  }

  return {
    conversations: conversations.length,
    userTurns,
    replies,
    characters,
    words,
    averageMs: timedReplies ? Math.round(totalMs / timedReplies) : 0,
    attachments,
    models: [...models.values()].sort((a, b) => b.count - a.count),
    providers: [...providers.entries()]
      .map(([provider, count]) => ({ provider, count }))
      .sort((a, b) => b.count - a.count),
  }
}
