// API Hono. El mismo código corre como Worker (src/worker.ts) y bajo Bun en
// desarrollo (src/dev.ts), así que no hay dos backends que mantener.
//
// Seguridad: no hay sesiones ni cookies. Las claves viven en el navegador del
// usuario (Ajustes → Claves) y llegan en la cabecera `x-provider-key` de cada
// petición; si no llega ninguna se usa la del entorno del servidor. Nada se
// escribe en disco ni se registra en logs.

import { Hono } from 'hono'
import { PROVIDERS, providerById } from '../shared/providers'
import type { Provider } from '../shared/providers'
import type { ChatMessage } from '../shared/types'
import { UpstreamError, listModels, streamChat } from './adapters'
import type { Env } from './env'

const app = new Hono<{ Bindings: Env }>()

const MAX_MESSAGES = 48
const MAX_CHARS = 16_000
const MAX_TOKENS_CAP = 8_192
const MAX_MODELS = 400

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })

function resolveKey(env: Env, provider: Provider, headerKey?: string): string | undefined {
  const fromHeader = headerKey?.trim()
  if (fromHeader) return fromHeader
  const fromEnv = env[provider.keyEnv]
  return typeof fromEnv === 'string' && fromEnv.trim() ? fromEnv.trim().slice(0, 4096) : undefined
}

function isLoopback(host: string): boolean {
  const name = host.replace(/^\[|\]$/g, '').split(':')[0]
  return name === 'localhost' || name === '127.0.0.1' || name === '::1'
}

/**
 * Bloquea peticiones de otras webs. En desarrollo el proxy de Vite hace que el
 * Origin sea `localhost:5173` y el Host `127.0.0.1:8787`, así que dos hosts de
 * loopback se consideran el mismo origen.
 */
function originAllowed(request: Request): boolean {
  const origin = request.headers.get('origin')
  if (!origin) return true
  try {
    const originUrl = new URL(origin)
    const requestUrl = new URL(request.url)
    if (originUrl.host === requestUrl.host) return true
    return isLoopback(originUrl.host) && isLoopback(requestUrl.host)
  } catch {
    return false
  }
}

function cleanMessages(input: unknown): ChatMessage[] {
  if (!Array.isArray(input)) return []
  const output: ChatMessage[] = []
  for (const raw of input.slice(-MAX_MESSAGES)) {
    if (!raw || typeof raw !== 'object') continue
    const entry = raw as { role?: unknown; content?: unknown }
    const role = entry.role === 'assistant' ? 'assistant' : entry.role === 'user' ? 'user' : undefined
    const content = typeof entry.content === 'string' ? entry.content.slice(0, MAX_CHARS) : ''
    if (role && content.trim()) output.push({ role, content })
  }
  return output
}

function describe(error: unknown): { status: number; message: string } {
  if (error instanceof UpstreamError) {
    const hint =
      error.status === 401 || error.status === 403
        ? 'Revisa la clave y sus permisos.'
        : error.status === 402
          ? 'El proveedor no tiene saldo disponible.'
          : error.status === 404
            ? 'Ese modelo no existe para tu clave.'
            : error.status === 429
              ? 'Demasiadas peticiones o límite de gasto alcanzado.'
              : ''
    return { status: 400, message: [error.message, hint].filter(Boolean).join(' ') }
  }
  const message = error instanceof Error ? error.message : String(error)
  if (/abort/i.test(message)) return { status: 499, message: 'Petición cancelada.' }
  return { status: 500, message: message || 'Error inesperado' }
}

app.get('/api/health', () => json({ ok: true, providers: PROVIDERS.length }))

app.get('/api/providers', (c) => {
  const serverKeys = Object.fromEntries(
    PROVIDERS.map((provider) => [provider.id, Boolean(resolveKey(c.env, provider))]),
  )
  return json({ serverKeys })
})

app.get('/api/models', async (c) => {
  if (!originAllowed(c.req.raw)) {
    return json({ error: { message: 'Origen no permitido.' } }, 403)
  }

  const provider = providerById(c.req.query('provider') ?? '')
  if (!provider) return json({ error: { message: 'Proveedor desconocido.' } }, 400)

  const apiKey = resolveKey(c.env, provider, c.req.header('x-provider-key'))
  if (!apiKey) return json({ error: { code: 'missing_key', message: `Necesitas una clave de ${provider.name}.` } }, 400)

  try {
    const models = await listModels(provider, apiKey)
    return json({ models: models.slice(0, MAX_MODELS) })
  } catch (error) {
    const info = describe(error)
    return json({ error: { message: info.message } }, info.status)
  }
})

app.post('/api/chat', async (c) => {
  if (!originAllowed(c.req.raw)) {
    return json({ error: { message: 'Origen no permitido.' } }, 403)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return json({ error: { message: 'El cuerpo debe ser JSON válido.' } }, 400)
  }

  const input = (body ?? {}) as {
    provider?: unknown
    model?: unknown
    messages?: unknown
    system?: unknown
    temperature?: unknown
    maxTokens?: unknown
  }

  const provider = providerById(typeof input.provider === 'string' ? input.provider : '')
  if (!provider) return json({ error: { message: 'Proveedor desconocido.' } }, 400)

  const model = typeof input.model === 'string' ? input.model.trim() : ''
  if (!model) return json({ error: { message: 'Falta el modelo.' } }, 400)

  const messages = cleanMessages(input.messages)
  if (!messages.length) return json({ error: { message: 'No hay mensajes que enviar.' } }, 400)

  const apiKey = resolveKey(c.env, provider, c.req.header('x-provider-key'))
  if (!apiKey) {
    return json(
      {
        error: {
          code: 'missing_key',
          message: `Añade tu clave de ${provider.name} en Ajustes → Claves.`,
        },
      },
      400,
    )
  }

  const temperature =
    typeof input.temperature === 'number' && Number.isFinite(input.temperature)
      ? Math.min(2, Math.max(0, input.temperature))
      : undefined
  const maxTokens =
    typeof input.maxTokens === 'number' && Number.isFinite(input.maxTokens)
      ? Math.min(MAX_TOKENS_CAP, Math.max(64, Math.round(input.maxTokens)))
      : undefined

  const encoder = new TextEncoder()
  const bodyStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let open = true
      const send = (payload: unknown): void => {
        if (!open) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        } catch {
          // El cliente cerró la conexión: dejamos de escribir.
          open = false
        }
      }

      try {
        const result = await streamChat({
          provider,
          model,
          apiKey,
          messages,
          system: typeof input.system === 'string' ? input.system.slice(0, MAX_CHARS) : undefined,
          temperature,
          maxTokens,
          signal: c.req.raw.signal,
        })

        for await (const token of result.stream) {
          if (token) send({ type: 'delta', text: token })
        }
        send({ type: 'done', model: result.model })
      } catch (error) {
        const info = describe(error)
        send({ type: 'error', message: info.message })
      } finally {
        if (open) {
          open = false
          try {
            controller.close()
          } catch {
            // Ya estaba cerrado por el cliente.
          }
        }
      }
    },
  })

  return new Response(bodyStream, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    },
  })
})

app.all('/api/*', () => json({ error: { message: 'Ruta no encontrada.' } }, 404))

export default app
