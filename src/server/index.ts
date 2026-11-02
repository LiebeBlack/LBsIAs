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
import type { ChatImage, ChatMessage } from '../shared/types'
import { localeFromRequest, translate } from '../shared/i18n'
import type { Locale, TranslationKey, TranslationParams } from '../shared/i18n'
import { UpstreamError, listModels, streamChat } from './adapters'
import type { Env } from './env'

const app = new Hono<{ Bindings: Env }>()

const MAX_MODEL_CHARS = 160
const MAX_MODELS = 400
const MAX_IMAGES_PER_MESSAGE = 4
const MAX_IMAGE_CHARS = 8_000_000
const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })

const tr = (locale: Locale, key: TranslationKey, params?: TranslationParams): string =>
  translate(locale, key, params)

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

  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue
    const entry = raw as { role?: unknown; content?: unknown; images?: unknown }
    const role = entry.role === 'assistant' ? 'assistant' : entry.role === 'user' ? 'user' : undefined
    const content = typeof entry.content === 'string' ? entry.content : ''
    const images: ChatImage[] = []

    if (Array.isArray(entry.images)) {
      for (const rawImage of entry.images) {
        if (!rawImage || typeof rawImage !== 'object') continue
        const image = rawImage as { mime?: unknown; data?: unknown }
        const mime = typeof image.mime === 'string' ? image.mime.toLowerCase() : ''
        const data = typeof image.data === 'string' ? image.data : ''
        if (!IMAGE_MIMES.has(mime) || !data || data.length > MAX_IMAGE_CHARS) continue
        images.push({ mime, data })
        if (images.length >= MAX_IMAGES_PER_MESSAGE) break
      }
    }

    if (role && (content.trim() || images.length)) {
      output.push({ role, content, ...(images.length ? { images } : {}) })
    }
  }

  return output
}

function describe(error: unknown, locale: Locale): { status: number; message: string } {
  if (error instanceof UpstreamError) {
    const hint =
      error.status === 401 || error.status === 403
        ? tr(locale, 'server.hint.401')
        : error.status === 402
          ? tr(locale, 'server.hint.402')
          : error.status === 404
            ? tr(locale, 'server.hint.404')
            : error.status === 429
              ? tr(locale, 'server.hint.429')
              : error.status === 502
                ? tr(locale, 'server.hint.502')
                : ''
    return { status: 400, message: [error.message, hint].filter(Boolean).join(' ') }
  }
  const message = error instanceof Error ? error.message : String(error)
  if (/abort|cancel/i.test(message)) return { status: 499, message: tr(locale, 'server.cancelled') }
  return { status: 500, message: message || tr(locale, 'server.unexpected') }
}

app.get('/api/health', () => json({ ok: true, providers: PROVIDERS.length, uptime: 'edge' }))

app.get('/api/providers', (c) => {
  const serverKeys = Object.fromEntries(
    PROVIDERS.map((provider) => [provider.id, Boolean(resolveKey(c.env, provider))]),
  )
  return json({ serverKeys })
})

app.get('/api/models', async (c) => {
  const locale = localeFromRequest(c.req.raw)
  if (!originAllowed(c.req.raw)) {
    return json({ error: { message: tr(locale, 'server.originDenied') } }, 403)
  }

  const provider = providerById(c.req.query('provider') ?? '')
  if (!provider) return json({ error: { message: tr(locale, 'server.unknownProvider') } }, 400)

  const apiKey = resolveKey(c.env, provider, c.req.header('x-provider-key'))
  if (!apiKey) {
    return json(
      { error: { code: 'missing_key', message: tr(locale, 'server.missingKey', { provider: provider.name }) } },
      400,
    )
  }

  try {
    const models = await listModels(provider, apiKey)
    return json({ models: models.slice(0, MAX_MODELS) })
  } catch (error) {
    const info = describe(error, locale)
    return json({ error: { message: info.message } }, info.status)
  }
})

app.post('/api/chat', async (c) => {
  const locale = localeFromRequest(c.req.raw)
  if (!originAllowed(c.req.raw)) {
    return json({ error: { message: tr(locale, 'server.originDenied') } }, 403)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return json({ error: { message: tr(locale, 'server.invalidJson') } }, 400)
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
  if (!provider) return json({ error: { message: tr(locale, 'server.unknownProvider') } }, 400)

  const model = typeof input.model === 'string' ? input.model.trim().slice(0, MAX_MODEL_CHARS) : ''
  if (!model) return json({ error: { message: tr(locale, 'server.missingModel') } }, 400)

  const messages = cleanMessages(input.messages)
  if (!messages.length) return json({ error: { message: tr(locale, 'server.noMessages') } }, 400)

  const apiKey = resolveKey(c.env, provider, c.req.header('x-provider-key'))
  if (!apiKey) {
    return json(
      { error: { code: 'missing_key', message: tr(locale, 'server.missingKey', { provider: provider.name }) } },
      400,
    )
  }

  const temperature =
    typeof input.temperature === 'number' && Number.isFinite(input.temperature)
      ? Math.min(2, Math.max(0, input.temperature))
      : undefined
  const maxTokens =
    typeof input.maxTokens === 'number' && Number.isFinite(input.maxTokens) && input.maxTokens > 0
      ? Math.max(1, Math.round(input.maxTokens))
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
          system: typeof input.system === 'string' ? input.system : undefined,
          temperature,
          maxTokens,
          signal: c.req.raw.signal,
        })

        for await (const token of result.stream) {
          if (token) send({ type: 'delta', text: token })
        }
        send({ type: 'done', model: result.model })
      } catch (error) {
        const info = describe(error, locale)
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
      'x-locale': locale,
    },
  })
})

app.all('/api/*', (c) => json({ error: { message: tr(localeFromRequest(c.req.raw), 'server.routeNotFound') } }, 404))

export default app
