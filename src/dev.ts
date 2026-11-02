// Servidor de desarrollo: el mismo Hono que el Worker, servido por Bun.
// Vite (src/dev:client) reenvía /api aquí, así que el navegador ve un origen.
import app from './server/index'

declare const Bun: {
  serve(options: { port: number; fetch: (request: Request) => Response | Promise<Response> }): unknown
  env: Record<string, string | undefined>
}

const port = Number(Bun.env.PORT) || 8787

Bun.serve({
  port,
  fetch: (request: Request) => app.fetch(request, Bun.env as never),
})

console.log(`[nexo] API en http://localhost:${port} (claves de entorno: ${Object.keys(Bun.env).filter((key) => key.endsWith('_API_KEY')).length})`)
