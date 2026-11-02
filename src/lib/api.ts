import type { ChatMessage, ModelChoice } from '../shared/types'

export interface ReplyStreamRequest {
  target: ModelChoice
  messages: ChatMessage[]
  system?: string
  temperature?: number
  maxTokens?: number
  apiKey?: string
  signal?: AbortSignal
}

export interface ReplyStreamEvent {
  delta?: string
  error?: string
}

/** El idioma de la interfaz viaja en `x-locale` para localizar los errores. */
function currentLocale(): 'es' | 'en' {
  if (typeof document === 'undefined') return 'es'
  return document.documentElement.lang.toLowerCase().startsWith('en') ? 'en' : 'es'
}

/**
 * Envía un turno y va entregando los tokens según llegan (SSE).
 * Nunca lanza por errores de negocio: los reporta como `{ error }`.
 */
export async function* streamReply(input: ReplyStreamRequest): AsyncGenerator<ReplyStreamEvent> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-locale': currentLocale(),
      ...(input.apiKey ? { 'x-provider-key': input.apiKey } : {}),
    },
    body: JSON.stringify({
      provider: input.target.provider,
      model: input.target.model,
      messages: input.messages,
      system: input.system,
      temperature: input.temperature,
      maxTokens: input.maxTokens,
    }),
    signal: input.signal,
  })

  if (!response.ok) {
    let message = `Error ${response.status}`
    try {
      const payload = (await response.json()) as { error?: { message?: string } }
      if (payload?.error?.message) message = payload.error.message
    } catch {
      // Respuesta sin JSON: nos quedamos con el código.
    }
    yield { error: message }
    return
  }

  if (!response.body) {
    yield { error: 'El proveedor no devolvió contenido.' }
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n/g, '\n')

      let boundary = buffer.indexOf('\n\n')
      while (boundary !== -1) {
        const block = buffer.slice(0, boundary)
        buffer = buffer.slice(boundary + 2)
        boundary = buffer.indexOf('\n\n')

        const data = block
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5).trim())
          .join('\n')
        if (!data) continue

        let event: { type?: string; text?: string; message?: string }
        try {
          event = JSON.parse(data) as typeof event
        } catch {
          continue
        }

        if (event.type === 'delta' && typeof event.text === 'string' && event.text) {
          yield { delta: event.text }
        } else if (event.type === 'error') {
          yield { error: event.message ?? 'Error del proveedor.' }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }
}

export async function fetchModels(providerId: string, apiKey?: string): Promise<string[]> {
  const response = await fetch(`/api/models?provider=${encodeURIComponent(providerId)}`, {
    headers: {
      'x-locale': currentLocale(),
      ...(apiKey ? { 'x-provider-key': apiKey } : {}),
    },
  })
  const payload = (await response.json().catch(() => ({}))) as {
    models?: string[]
    error?: { message?: string }
  }
  if (!response.ok) throw new Error(payload?.error?.message ?? `Error ${response.status}`)
  return Array.isArray(payload.models) ? payload.models : []
}

export async function fetchServerKeys(): Promise<Record<string, boolean>> {
  try {
    const response = await fetch('/api/providers')
    if (!response.ok) return {}
    const payload = (await response.json()) as { serverKeys?: Record<string, boolean> }
    return payload.serverKeys ?? {}
  } catch {
    return {}
  }
}
