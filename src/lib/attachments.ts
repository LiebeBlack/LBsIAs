import type { Attachment } from '../shared/types'

export const MAX_ATTACHMENTS = 3
export const MAX_ATTACHMENT_BYTES = 200_000
export const MAX_ATTACHMENT_CHARS = 24_000
export const MAX_TOTAL_ATTACHMENT_CHARS = 48_000

export const ATTACHMENT_ACCEPT =
  '.txt,.md,.markdown,.mdx,.json,.jsonc,.csv,.tsv,.ts,.tsx,.js,.jsx,.mjs,.cjs,.css,.scss,.html,.xml,.svg,.yml,.yaml,.toml,.ini,.env,.sh,.bash,.sql,.py,.go,.rs,.java,.kt,.php,.rb,.cs,.c,.cpp,.swift,.log,.diff,.patch'

const EXTENSIONS = new Set(
  ATTACHMENT_ACCEPT.split(',').map((extension) => extension.replace('.', '').toLowerCase()),
)

export type AttachmentError = 'tooLarge' | 'unsupported' | 'unreadable'

export type AttachmentResult =
  | { ok: true; attachment: Attachment }
  | { ok: false; reason: AttachmentError }

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

export function isTextFile(file: File): boolean {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (EXTENSIONS.has(extension)) return true
  const mime = (file.type || '').toLowerCase()
  return mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml'
}

export function isTotalTooLong(attachments: Attachment[], extra: Attachment): boolean {
  const current = attachments.reduce((total, item) => total + item.content.length, 0)
  return current + extra.content.length > MAX_TOTAL_ATTACHMENT_CHARS
}

export async function readAttachment(file: File): Promise<AttachmentResult> {
  if (!isTextFile(file)) return { ok: false, reason: 'unsupported' }
  if (file.size > MAX_ATTACHMENT_BYTES) return { ok: false, reason: 'tooLarge' }

  let raw: string
  try {
    raw = await file.text()
  } catch {
    return { ok: false, reason: 'unreadable' }
  }

  const truncated = raw.length > MAX_ATTACHMENT_CHARS
  const content = truncated
    ? `${raw.slice(0, MAX_ATTACHMENT_CHARS)}\n\n[Contenido truncado: el archivo supera el límite de ${MAX_ATTACHMENT_CHARS} caracteres]`
    : raw

  if (!content.trim()) return { ok: false, reason: 'unreadable' }

  return {
    ok: true,
    attachment: {
      id: makeId(),
      name: file.name.slice(0, 120) || 'archivo.txt',
      mime: file.type || 'text/plain',
      size: file.size,
      content,
    },
  }
}

/** Bloque que se envía al modelo como contexto, antes del mensaje. */
export function formatAttachmentContext(attachments: Attachment[]): string {
  if (!attachments.length) return ''
  return attachments
    .map(
      (attachment) =>
        `<attachment name="${attachment.name}" type="${attachment.mime}">\n${attachment.content}\n</attachment>`,
    )
    .join('\n\n')
}

export function messageWithAttachments(text: string, attachments: Attachment[]): string {
  const context = formatAttachmentContext(attachments)
  return context ? `${context}\n\n${text}` : text
}
