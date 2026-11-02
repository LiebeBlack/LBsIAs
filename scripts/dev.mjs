// Arranca API (Bun, puerto 8787) y cliente (Vite, puerto 5173) juntos.
// Vite reenvía /api al backend, así que las dos partes comparten origen.

const root = process.cwd()
const spawn = (args, label) => {
  const child = Bun.spawn([process.execPath, ...args], {
    cwd: root,
    stdout: 'inherit',
    stderr: 'inherit',
    env: { ...process.env, FORCE_COLOR: '1' },
  })
  child.exited.then((code) => {
    if (code !== 0) console.error(`[nexo] ${label} terminó con código ${code}`)
  })
  return child
}

console.log('[nexo] levantando API en http://localhost:8787 …')
const api = spawn(['src/dev.ts'], 'api')
const client = spawn(['node_modules/vite/bin/vite.js'], 'cliente')

let closing = false
const shutdown = async (signal) => {
  if (closing) return
  closing = true
  console.log(`\n[nexo] cerrando (${signal}) …`)
  api.kill()
  client.kill()
  await Promise.allSettled([api.exited, client.exited])
  process.exit(0)
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

await Promise.race([api.exited, client.exited])
await shutdown('fin')
