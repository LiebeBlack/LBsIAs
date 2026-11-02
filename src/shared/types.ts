import type { Locale } from './i18n'

export type Role = 'user' | 'assistant'

/** Imagen ya codificada en base64, lista para un proveedor multimodal. */
export interface ChatImage {
  mime: string
  data: string
}

export interface ChatMessage {
  role: Role
  content: string
  images?: ChatImage[]
}

export type PartStatus = 'streaming' | 'done' | 'error' | 'stopped'

/** Archivo adjunto a un mensaje del usuario. */
export interface Attachment {
  id: string
  name: string
  mime: string
  size: number
  /** Texto plano, base64 de una imagen o vacío en archivos binarios no legibles. */
  content: string
  kind: 'text' | 'image' | 'file'
}

/** Una respuesta concreta, de un modelo concreto. */
export interface ReplyPart {
  id: string
  provider: string
  model: string
  content: string
  status: PartStatus
  error?: string
  /** Milisegundos hasta el último token. */
  ms?: number
}

export interface UserTurn {
  id: string
  role: 'user'
  content: string
  at: number
  attachments?: Attachment[]
}

export interface AssistantTurn {
  id: string
  role: 'assistant'
  parts: ReplyPart[]
  at: number
}

export type Turn = UserTurn | AssistantTurn

export interface Conversation {
  id: string
  title: string
  turns: Turn[]
  createdAt: number
  updatedAt: number
}

export interface ModelChoice {
  provider: string
  model: string
}

export type Theme = 'dark' | 'light' | 'system'

/** «auto» sigue el idioma del navegador. */
export type LocalePreference = Locale | 'auto'

export interface Settings {
  /** Modelo activo del modo simple. */
  provider: string
  model: string
  theme: Theme
  accent: string
  /** Vacío significa «usar las instrucciones predeterminadas del idioma». */
  system: string
  temperature: number
  maxTokens: number
  /** Modo comparación: una respuesta por cada modelo elegido. */
  compare: boolean
  compareModels: ModelChoice[]
  sendOnEnter: boolean
  locale: LocalePreference
}

export interface Workspace {
  conversations: Conversation[]
  activeId: string | null
  settings: Settings
}
