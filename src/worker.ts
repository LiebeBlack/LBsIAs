// Entrada del Worker de Cloudflare: primero la API y después los assets del SPA.
import app from './server/index'
import type { Env } from './server/env'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env)
    }

    if (env.ASSETS) return env.ASSETS.fetch(request)

    return new Response('Faltan los assets compilados. Ejecuta `bun run build`.', {
      status: 500,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    })
  },
}
