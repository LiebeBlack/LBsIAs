import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// El cliente se sirve con Vite; /api se reenvía al mismo backend Hono que en
// producción corre como Worker de Cloudflare (src/dev.ts lo levanta con Bun).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8787', changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
    reportCompressedSize: false,
  },
})
