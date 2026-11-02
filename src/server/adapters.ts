// Adaptadores de proveedor. Todos normalizan su streaming a un único flujo de
// texto, para que el resto de la aplicación no sepa de quién viene la respuesta.
//
//   kind 'openai'    → POST /chat/completions con SSE (OpenAI, OpenRouter, Groq,
//                      Mistral, DeepSeek, xAI)
//   kind 'anthropic' → POST /messages con SSE
//   kind 'gemini'    → POST /models/:model:streamGenerateContent?alt=sse

import type { Provider } from '../shared/providers'
import type { ChatMessage } from '../shared/types'

export class UpstreamError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'UpstreamError'
    this.status = status
  }
}

export interface StreamRequest {
  provider: Provider
  model: string
  apiKey: string
  messages: ChatMessage[]
  system?: string
  temperature?: number
  maxTokens?: number
  signal?: AbortSignal
}

export interface StreamResult {
  model: string
  stream: AsyncGenerator<string>
}

interface OpenAIChunk {
  choices?: Array<{ delta?: { content?: string }; text?: string }>
}

interface AnthropicChunk {
  type?: string
  delta?: { text?: string }
  content_block?: { text?: string }
}

interface GeminiChunk {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

function errorDetail(text: string): string {
  if (!text) return ''
  try {
    const parsed = JSON.parse(text) as {
      error?: string | { message?: string; error?: { message?: string } }
      message?: string
    }
    const candidates = [
      typeof parsed.error === 'object' ? parsed.error?.message : undefined,
      typeof parsed.error === 'object' ? parsed.error?.error?.message : undefined,
      typeof parsed.error === 'string' ? parsed.error : undefined,
      parsed.message,
    ]
    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim().slice(0, 600)
    }
  } catch {
    // Cuerpo no JSON: se devuelve el texto tal cual.
  }
  return text.replace(/\s+/g, ' ').trim().slice(0, 600)
}

async function failWith(response: Response, provider: Provider): Promise<never> {
  const text = await response.text().catch(() => '')
  const detail = errorDetail(text) || response.statusText
  throw new UpstreamError(response.status, `${provider.name} (${response.status}): ${detail}`)
}

/** Lee un cuerpo SSE y entrega el contenido de cada línea `data: …`. */
async function* sseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      let index = buffer.indexOf('\n')
      while (index !== -1) {
        const line = buffer.slice(0, index).replace(/\r$/, '')
        buffer = buffer.slice(index + 1)
        if (line.startsWith('data:')) {
          const data = line.slice(5).trim()
          if (data) yield data
        }
        index = buffer.indexOf('\n')
      }
    }

    const tail = buffer.replace(/\r$/, '').trim()
    if (tail.startsWith('data:')) {
      const data = tail.slice(5).trim()
      if (data) yield data
    }
  } finally {
    reader.releaseLock()
  }
}

async function* openAICompatible(input: StreamRequest): AsyncGenerator<string> {
  const { provider, model, apiKey, system, temperature, maxTokens, signal } = input
  const url = `${provider.baseUrl}/chat/completions`

  const payload: Record<string, unknown> = {
    model,
    messages: system ? [{ role: 'system', content: system }, ...input.messages] : input.messages,
    stream: true,
  }
  if (typeof temperature === 'number') payload.temperature = temperature
  if (maxTokens) payload[provider.id === 'openai' ? 'max_completion_tokens' : 'max_tokens'] = maxTokens

  const headers: Record<string, string> = {
    'content-type': 'application/json',
    authorization: `Bearer ${apiKey}`,
  }
  if (provider.id === 'openrouter') {
    headers['HTTP-Referer'] = 'https://nexo.chat'
    headers['X-Title'] = 'Nexo'
  }

  let response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal })

  // Algunos modelos (razonadores, versiones nuevas) rechazan `temperature` o el
  // nombre del límite de tokens. Si el 400 lo menciona, se reintenta sin ellos.
  if (!response.ok && response.status === 400) {
    const text = await response.text().catch(() => '')
    if (/temperature|max_tokens|max_completion_tokens|unsupported/i.test(text)) {
      delete payload.temperature
      delete payload.max_tokens
      delete payload.max_completion_tokens
      response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal })
    } else {
      throw new UpstreamError(400, `${provider.name} (400): ${errorDetail(text) || 'petición rechazada'}`)
    }
  }

  if (!response.ok) await failWith(response, provider)
  if (!response.body) throw new UpstreamError(502, `${provider.name}: respuesta vacía`)

  for await (const data of sseData(response.body)) {
    if (data === '[DONE]') return
    let text: string | undefined
    try {
      const chunk = JSON.parse(data) as OpenAIChunk
      text = chunk.choices?.[0]?.delta?.content ?? chunk.choices?.[0]?.text
    } catch {
      continue
    }
    if (typeof text === 'string' && text) yield text
  }
}

function anthropicOutputLimit(model: string): number {
  if (/claude-.*opus-4/i.test(model)) return 32_000
  if (/claude-.*(sonnet|haiku)-4/i.test(model)) return 64_000
  return 8_192
}

async function* anthropic(input: StreamRequest): AsyncGenerator<string> {
  const { provider, model, apiKey, system, temperature, maxTokens, signal } = input

  const response = await fetch(`${provider.baseUrl}/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens && maxTokens > 0 ? maxTokens : anthropicOutputLimit(model),
      stream: true,
      messages: input.messages.map((message) => ({ role: message.role, content: message.content })),
      ...(system ? { system } : {}),
      ...(typeof temperature === 'number' ? { temperature } : {}),
    }),
    signal,
  })

  if (!response.ok) await failWith(response, provider)
  if (!response.body) throw new UpstreamError(502, `${provider.name}: respuesta vacía`)

  for await (const data of sseData(response.body)) {
    try {
      const chunk = JSON.parse(data) as AnthropicChunk
      if (chunk.type === 'content_block_delta' && typeof chunk.delta?.text === 'string') {
        if (chunk.delta.text) yield chunk.delta.text
      } else if (chunk.type === 'content_block_start' && typeof chunk.content_block?.text === 'string') {
        if (chunk.content_block.text) yield chunk.content_block.text
      }
    } catch {
      continue
    }
  }
}

async function* gemini(input: StreamRequest): AsyncGenerator<string> {
  const { provider, model, apiKey, system, temperature, maxTokens, signal } = input

  const url =
    `${provider.baseUrl}/models/${encodeURIComponent(model)}:streamGenerateContent` +
    `?alt=sse&key=${encodeURIComponent(apiKey)}`

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: input.messages.map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      })),
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: {
        ...(typeof temperature === 'number' ? { temperature } : {}),
        ...(maxTokens ? { maxOutputTokens: maxTokens } : {}),
      },
    }),
    signal,
  })

  if (!response.ok) await failWith(response, provider)
  if (!response.body) throw new UpstreamError(502, `${provider.name}: respuesta vacía`)

  for await (const data of sseData(response.body)) {
    try {
      const chunk = JSON.parse(data) as GeminiChunk
      const parts = chunk.candidates?.[0]?.content?.parts
      if (!Array.isArray(parts)) continue
      for (const part of parts) {
        if (typeof part?.text === 'string' && part.text) yield part.text
      }
    } catch {
      continue
    }
  }
}

export async function streamChat(input: StreamRequest): Promise<StreamResult> {
  switch (input.provider.kind) {
    case 'anthropic':
      return { model: input.model, stream: anthropic(input) }
    case 'gemini':
      return { model: input.model, stream: gemini(input) }
    default:
      return { model: input.model, stream: openAICompatible(input) }
  }
}

interface ModelRow {
  id?: string
  name?: string
  supportedGenerationMethods?: string[]
}

/** Lista de modelos que acepta la clave, en el orden que devuelve el proveedor. */
export async function listModels(provider: Provider, apiKey: string): Promise<string[]> {
  if (provider.kind === 'anthropic') {
    const response = await fetch(`${provider.baseUrl}/models?limit=100`, {
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    })
    if (!response.ok) await failWith(response, provider)
    const payload = (await response.json()) as { data?: ModelRow[] }
    return (payload.data ?? []).map((row) => String(row.id ?? '')).filter(Boolean)
  }

  if (provider.kind === 'gemini') {
    const response = await fetch(`${provider.baseUrl}/models?pageSize=200&key=${encodeURIComponent(apiKey)}`)
    if (!response.ok) await failWith(response, provider)
    const payload = (await response.json()) as { models?: ModelRow[] }
    return (payload.models ?? [])
      .filter((row) => !row.supportedGenerationMethods || row.supportedGenerationMethods.includes('generateContent'))
      .map((row) => String(row.name ?? '').replace(/^models\//, ''))
      .filter(Boolean)
  }

  const response = await fetch(`${provider.baseUrl}/models`, {
    headers: { authorization: `Bearer ${apiKey}` },
  })
  if (!response.ok) await failWith(response, provider)
  const payload = (await response.json()) as { data?: ModelRow[]; models?: ModelRow[] }
  const rows = payload.data ?? payload.models ?? []
  return rows
    .map((row) => String(row.id ?? row.name ?? ''))
    .filter(Boolean)
    .sort()
}
