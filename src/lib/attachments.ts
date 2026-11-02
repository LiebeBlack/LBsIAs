import type { Attachment, ChatImage } from '../shared/types'

export const MAX_ATTACHMENTS = 4
export const MAX_TEXT_BYTES = 2_000_000
export const MAX_TOTAL_ATTACHMENT_CHARS = 6_000_000
export const MAX_IMAGE_SOURCE_BYTES = 15_000_000
export const MAX_IMAGE_DATA_CHARS = 8_000_000
export const MAX_IMAGE_EDGE = 1_600
export const ATTACHMENT_ACCEPT = '*/*'

export const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const
const IMAGE_MIME_SET = new Set<string>(IMAGE_MIMES)
const IMAGE_SOURCE_MIME_SET = new Set<string>([...IMAGE_MIMES, 'image/bmp', 'image/avif'])

const IMAGE_EXTENSIONS: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  avif: 'image/avif',
}

const TEXT_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'mdx',
  'json',
  'jsonc',
  'csv',
  'tsv',
  'ts',
  'tsx',
  'js',
  'jsx',
  'mjs',
  'cjs',
  'css',
  'scss',
  'html',
  'htm',
  'xml',
  'svg',
  'yml',
  'yaml',
  'toml',
  'ini',
  'env',
  'sh',
  'bash',
  'sql',
  'py',
  'go',
  'rs',
  'java',
  'kt',
  'php',
  'rb',
  'cs',
  'c',
  'cpp',
  'h',
  'hpp',
  'swift',
  'log',
  'diff',
  'patch',
  'tex',
  'r',
  'lua',
  'pl',
  'dart',
  'vue',
  'svelte',
])

export type AttachmentError = 'tooLarge' | 'unsupported' | 'unreadable'

export type AttachmentResult =
  | { ok: true; attachment: Attachment }
  | { ok: false; reason: AttachmentError }

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  return `a-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function extensionOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

function detectMime(file: File): string {
  const raw = (file.type || '').toLowerCase()
  const declared = raw === 'image/jpg' || raw === 'image/pjpeg' ? 'image/jpeg' : raw === 'image/x-png' ? 'image/png' : raw
  const inferred = IMAGE_EXTENSIONS[extensionOf(file.name)] ?? ''
  if (!declared || declared === 'application/octet-stream') return inferred || declared
  return declared
}

export function isSupportedImageMime(mime: string): boolean {
  return IMAGE_MIME_SET.has(mime.toLowerCase())
}

function isImageSourceMime(mime: string): boolean {
  return IMAGE_SOURCE_MIME_SET.has(mime.toLowerCase())
}

export function isTextFile(file: File): boolean {
  if (TEXT_EXTENSIONS.has(extensionOf(file.name))) return true
  const mime = (file.type || '').toLowerCase()
  return (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    mime === 'application/xml' ||
    mime === 'application/javascript' ||
    mime === 'application/x-yaml'
  )
}

export function isTotalTooLong(attachments: Attachment[], extra: Attachment): boolean {
  const current = attachments.reduce((total, item) => total + item.content.length, 0)
  return current + extra.content.length > MAX_TOTAL_ATTACHMENT_CHARS
}

export function attachmentDataUrl(attachment: Attachment): string {
  return `data:${attachment.mime};base64,${attachment.content}`
}

export function imagesFromAttachments(attachments: Attachment[]): ChatImage[] | undefined {
  const images = attachments
    .filter((attachment) => attachment.kind === 'image' && attachment.content)
    .map((attachment) => ({ mime: attachment.mime, data: attachment.content }))
  return images.length ? images : undefined
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(blob)
  })
}

async function blobToBase64(blob: Blob): Promise<string> {
  const dataUrl = await blobToDataUrl(blob)
  const comma = dataUrl.indexOf(',')
  if (comma === -1) throw new Error('empty data url')
  return dataUrl.slice(comma + 1)
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('canvas encode failed'))),
      type,
      quality,
    )
  })
}

async function decodeImage(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file)
    } catch {
      // Safari y algunos formatos requieren el camino con <img>.
    }
  }

  const dataUrl = await blobToDataUrl(file)
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  return image
}

function imageAttachment(file: File, mime: string, data: string): Attachment {
  return {
    id: makeId(),
    name: file.name.slice(0, 120) || 'imagen',
    mime,
    size: Math.max(1, Math.round((data.length * 3) / 4)),
    content: data,
    kind: 'image',
  }
}

async function readImage(file: File, mime: string): Promise<AttachmentResult> {
  if (file.size > MAX_IMAGE_SOURCE_BYTES) return { ok: false, reason: 'tooLarge' }

  // Un GIF animado se conserva si es razonablemente pequeño; si no, se usa el
  // primer fotograma. Así el proveedor recibe algo válido sin inflar el chat.
  if (mime === 'image/gif' && file.size <= 3_000_000) {
    try {
      const data = await blobToBase64(file)
      if (!data || data.length > MAX_IMAGE_DATA_CHARS) return { ok: false, reason: 'tooLarge' }
      return { ok: true, attachment: imageAttachment(file, mime, data) }
    } catch {
      return { ok: false, reason: 'unreadable' }
    }
  }

  try {
    const source = await decodeImage(file)
    const sourceWidth = source instanceof HTMLImageElement ? source.naturalWidth : source.width
    const sourceHeight = source instanceof HTMLImageElement ? source.naturalHeight : source.height
    if (!sourceWidth || !sourceHeight) throw new Error('empty image')

    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(sourceWidth, sourceHeight))
    const width = Math.max(1, Math.round(sourceWidth * scale))
    const height = Math.max(1, Math.round(sourceHeight * scale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas unavailable')
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(source, 0, 0, width, height)
    if ('close' in source && typeof source.close === 'function') source.close()

    // WebP conserva transparencia y suele pesar menos que PNG/JPEG.
    const blob = await canvasToBlob(canvas, 'image/webp', 0.82)
    const data = await blobToBase64(blob)
    if (!data || data.length > MAX_IMAGE_DATA_CHARS) return { ok: false, reason: 'tooLarge' }
    return { ok: true, attachment: imageAttachment(file, 'image/webp', data) }
  } catch {
    return { ok: false, reason: 'unreadable' }
  }
}

async function readText(file: File): Promise<AttachmentResult> {
  if (file.size > MAX_TEXT_BYTES) return { ok: false, reason: 'tooLarge' }

  let content: string
  try {
    content = await file.text()
  } catch {
    return { ok: false, reason: 'unreadable' }
  }

  if (!content.trim()) return { ok: false, reason: 'unreadable' }

  return {
    ok: true,
    attachment: {
      id: makeId(),
      name: file.name.slice(0, 120) || 'archivo.txt',
      mime: file.type || 'text/plain',
      size: file.size,
      content,
      kind: 'text',
    },
  }
}

function readBinary(file: File): AttachmentResult {
  return {
    ok: true,
    attachment: {
      id: makeId(),
      name: file.name.slice(0, 120) || 'archivo',
      mime: file.type || 'application/octet-stream',
      size: file.size,
      content: '',
      kind: 'file',
    },
  }
}

export async function readAttachment(file: File): Promise<AttachmentResult> {
  const mime = detectMime(file)
  if (isImageSourceMime(mime)) return readImage(file, mime)
  if (isTextFile(file)) return readText(file)
  return readBinary(file)
}

/** Bloque que se envía al modelo como contexto, antes del mensaje. */
export function formatAttachmentContext(attachments: Attachment[]): string {
  const textFiles = attachments.filter((attachment) => attachment.kind === 'text' && attachment.content.trim())
  if (!textFiles.length) return ''
  return textFiles
    .map(
      (attachment) =>
        `<attachment name="${attachment.name}" type="${attachment.mime}">\n${attachment.content}\n</attachment>`,
    )
    .join('\n\n')
}

export function messageWithAttachments(text: string, attachments: Attachment[]): string {
  const context = formatAttachmentContext(attachments)
  const images = attachments.filter((attachment) => attachment.kind === 'image')
  const files = attachments.filter((attachment) => attachment.kind === 'file')
  const chunks: string[] = []

  if (context) chunks.push(context)
  if (images.length) {
    chunks.push(images.map((attachment) => `[Imagen adjunta: ${attachment.name}]`).join('\n'))
  }
  if (files.length) {
    chunks.push(
      files
        .map(
          (attachment) =>
            `[Archivo adjunto: ${attachment.name} (${attachment.mime}). El modelo no puede leer este formato binario.]`,
        )
        .join('\n'),
    )
  }
  if (text.trim()) chunks.push(text)

  return chunks.join('\n\n')
}
