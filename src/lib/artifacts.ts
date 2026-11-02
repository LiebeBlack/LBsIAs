/**
 * Detecta archivos dentro de una respuesta. Si el modelo devuelve un bloque de
 * código con un nombre (`documento.md`, `config.json`…), se convierte en una
 * tarjeta descargable con su nombre y su tipo real.
 *
 * No inventa archivos: solo lo que venga entre ``` … ``` y tenga contenido.
 */

export interface Artifact {
  id: string
  filename: string
  language: string
  content: string
  bytes: number
  mime: string
}

const EXTENSIONS: Record<string, string> = {
  md: 'md',
  markdown: 'md',
  mdx: 'md',
  json: 'json',
  jsonc: 'json',
  ts: 'ts',
  typescript: 'ts',
  tsx: 'tsx',
  js: 'js',
  javascript: 'js',
  jsx: 'jsx',
  mjs: 'mjs',
  css: 'css',
  scss: 'scss',
  html: 'html',
  xml: 'xml',
  svg: 'svg',
  csv: 'csv',
  tsv: 'tsv',
  sql: 'sql',
  py: 'py',
  python: 'py',
  yml: 'yml',
  yaml: 'yaml',
  sh: 'sh',
  bash: 'sh',
  zsh: 'sh',
  txt: 'txt',
  toml: 'toml',
  ini: 'ini',
  env: 'env',
  go: 'go',
  rs: 'rs',
  rust: 'rs',
  java: 'java',
  kt: 'kt',
  php: 'php',
  rb: 'rb',
  c: 'c',
  cpp: 'cpp',
  cs: 'cs',
  swift: 'swift',
  diff: 'diff',
  patch: 'patch',
  graphql: 'graphql',
  prisma: 'prisma',
  dockerfile: 'dockerfile',
  makefile: 'mk',
}

const MIME: Record<string, string> = {
  md: 'text/markdown;charset=utf-8',
  markdown: 'text/markdown;charset=utf-8',
  json: 'application/json;charset=utf-8',
  jsonc: 'application/json;charset=utf-8',
  csv: 'text/csv;charset=utf-8',
  html: 'text/html;charset=utf-8',
  xml: 'application/xml;charset=utf-8',
  svg: 'image/svg+xml',
}

const NAME_HINT =
  /([\w .-]{1,64}\.(?:md|markdown|mdx|json|jsonc|ts|tsx|js|jsx|mjs|css|scss|html|xml|svg|csv|tsv|sql|py|yml|yaml|sh|txt|toml|ini|env|go|rs|java|kt|php|rb|c|cpp|cs|swift|diff|patch|graphql|prisma|dockerfile|mk))\b/i

/** Familias de extensiones equivalentes para una misma sintaxis. */
function matchesLanguage(filename: string, language: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  if (!ext) return false
  if (ext === extensionFor(language)) return true
  if (language === 'md' && (ext === 'markdown' || ext === 'mdx')) return true
  if (language === 'ts' && ext === 'typescript') return true
  if (language === 'js' && ext === 'javascript') return true
  if (language === 'yml' && ext === 'yaml') return true
  return false
}

function slug(text: string): string {
  const value = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)
  return value || 'nexo'
}

function sanitize(name: string): string {
  return name
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

function extensionFor(language: string): string {
  return EXTENSIONS[language] ?? 'txt'
}

function uniqueName(candidate: string, used: Set<string>): string {
  let name = candidate
  let counter = 2
  while (used.has(name)) {
    const dot = candidate.lastIndexOf('.')
    name = dot > 0 ? `${candidate.slice(0, dot)}-${counter}${candidate.slice(dot)}` : `${candidate}-${counter}`
    counter += 1
  }
  used.add(name)
  return name
}

/**
 * Busca un nombre justo antes del bloque. Solo se acepta si su extensión
 * concuerda con el lenguaje del bloque: así un `guia.md` mencionado antes no
 * bautiza por error al siguiente bloque de JSON.
 */
function nameFromContext(
  before: string,
  language: string,
  index: number,
  fallback: string,
  used: Set<string>,
): string {
  const hint = before.match(NAME_HINT)
  if (hint?.[1]) {
    const candidate = sanitize(hint[1].trim())
    if (matchesLanguage(candidate, language)) return uniqueName(candidate, used)
  }
  return uniqueName(sanitize(`${slug(fallback)}-${index + 1}.${extensionFor(language)}`), used)
}

export function extractArtifacts(content: string, fallbackTitle: string): Artifact[] {
  const items: Artifact[] = []
  if (!content.includes('```')) return items

  const used = new Set<string>()
  const fence = /```([^\n`]*)\n([\s\S]*?)```/g
  let match: RegExpExecArray | null

  while ((match = fence.exec(content)) !== null) {
    const info = (match[1] ?? '').trim().toLowerCase()
    const language = info.split(/\s+/)[0] ?? ''
    const body = (match[2] ?? '').replace(/\s+$/, '')
    if (!body.trim() || body.length < 24) continue

    const filename = nameFromContext(
      content.slice(Math.max(0, match.index - 200), match.index),
      language,
      items.length,
      fallbackTitle,
      used,
    )

    items.push({
      id: `${match.index}-${items.length}`,
      filename,
      language: language || 'texto',
      content: `${body}\n`,
      bytes: new TextEncoder().encode(body).length,
      mime: MIME[language] ?? 'text/plain;charset=utf-8',
    })
  }

  return items
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
