// Motor bilingüe compartido por cliente y servidor. Sin dependencias ni React:
// el Worker puede importarlo sin arrastrar código de navegador.
//
// El diccionario inglés es la fuente de verdad del tipo: si se añade una clave
// allí y falta en español, TypeScript falla en compilación. No hay traducciones
// silenciosas ni cadenas huérfanas.

export type Locale = 'es' | 'en'

export interface TranslationParams {
  [name: string]: string | number
}

const en = {
  'app.tagline': 'every model',
  'app.title': 'Nexo — every AI model in one chat',
  'app.description':
    'Nexo is a chat that talks to OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, Mistral, DeepSeek and xAI. Compare answers, switch models and use your own keys.',

  'common.close': 'Close',
  'common.cancel': 'Cancel',

  'sidebar.newChat': 'New chat',
  'sidebar.searchPlaceholder': 'Search chats',
  'sidebar.searchAria': 'Search conversations',
  'sidebar.conversationsAria': 'Conversations',
  'sidebar.closeMenu': 'Close menu',
  'sidebar.turns.one': '{count} turn',
  'sidebar.turns.other': '{count} turns',
  'sidebar.empty': 'empty',
  'sidebar.writing': 'writing…',
  'sidebar.responding': 'Responding',
  'sidebar.noChats': 'No chats yet.',
  'sidebar.settings': 'Settings',
  'sidebar.keys.one': '{count} key',
  'sidebar.keys.other': '{count} keys',
  'sidebar.noKeys': 'no keys',
  'sidebar.footNote': 'Your keys live in this browser. They are never stored on the server.',
  'sidebar.renameAria': 'Rename {title}',
  'sidebar.deleteAria': 'Delete {title}',

  'chat.newChat': 'New chat',
  'chat.compareModels.one': '{count} model in parallel',
  'chat.compareModels.other': '{count} models in parallel',
  'chat.compare': 'Compare',
  'chat.compareTitle': 'Send every question to several models at once',
  'chat.exportAria': 'Export conversation',
  'chat.exportTitle': 'Export as Markdown',
  'chat.settingsAria': 'Settings',
  'chat.openSidebar': 'Open chats',
  'chat.missingCompareKey': 'One of the compared models has no key assigned.',
  'chat.missingKey': 'The {provider} key is missing for this model.',
  'chat.addKey': 'Add key',
  'chat.emptyTitle': 'One chat, every model.',
  'chat.emptyBody':
    'Switch providers without changing the conversation. Or compare answers side by side and keep the best one.',
  'chat.suggestion.1': 'Explain how compound interest works with a quick example.',
  'chat.suggestion.2': 'Write a friendly email claiming an unpaid invoice.',
  'chat.suggestion.3': 'Give me a 20-minute home workout with no equipment.',
  'chat.suggestion.4': 'Compare PostgreSQL and SQLite for a small app.',
  'chat.thinking': 'Thinking…',
  'chat.copyAria': 'Copy reply',
  'chat.copyTitle': 'Copy',
  'chat.regenerateAria': 'Regenerate reply',
  'chat.regenerateTitle': 'Regenerate',
  'chat.placeholderIdle': 'Type what you need…',
  'chat.placeholderBusy': 'Waiting for the answer…',
  'chat.characters.one': '{count} character',
  'chat.characters.other': '{count} characters',
  'chat.enterSends': 'Enter sends · Shift+Enter newline',
  'chat.ctrlEnterSends': 'Ctrl/⌘+Enter sends',
  'chat.stopAria': 'Stop reply',
  'chat.sendAria': 'Send',
  'chat.legal': 'Nexo never stores your keys or your conversations on a server. Everything lives in this browser.',

  'status.streaming': 'typing…',
  'status.done': 'ready',
  'status.stopped': 'stopped',
  'status.error': 'error',

  'models.search': 'Search model or provider…',
  'models.noResults': 'No results for “{query}”.',
  'models.loading': 'Checking keys…',
  'models.loadReal': 'Load real models with my keys',

  'artifacts.generatedAria': 'Generated files',
  'artifacts.download': 'Download',
  'artifacts.downloadTitle': 'Download {filename}',
  'artifacts.copyAria': 'Copy {filename}',
  'artifacts.copyTitle': 'Copy content',

  'settings.title': 'Settings',
  'settings.subtitle': 'Everything is stored in this browser.',
  'settings.tab.keys': 'Keys',
  'settings.tab.model': 'Model',
  'settings.tab.appearance': 'Appearance',
  'settings.tab.data': 'Data',
  'settings.keys.hint':
    'Paste your keys: they stay in this browser, are restored the next time you open Nexo, and only travel to the server that forwards your question to the provider. They are never written to disk or logged.',
  'settings.keys.serverKey': 'server key',
  'settings.keys.create': 'create key ↗',
  'settings.keys.show': 'Show key',
  'settings.keys.hide': 'Hide key',
  'settings.keys.testing': 'Testing…',
  'settings.keys.test': 'Test',
  'settings.keys.available.one': '{count} model available',
  'settings.keys.available.other': '{count} models available',
  'settings.keys.example': ' · e.g. {model}',
  'settings.keys.failed': 'Could not validate.',
  'settings.keys.storageBlocked':
    'This browser blocks local storage. Your keys will be lost when you close the tab. Allow site data for Nexo to keep them.',
  'settings.system.label': 'Assistant instructions',
  'settings.system.reset': 'Reset to default instructions',
  'settings.system.hint': 'The default instructions follow the interface language. Your custom text is kept when you switch.',
  'settings.temperature.label': 'Temperature',
  'settings.temperature.hint': 'Low for precise answers, high for creative ones.',
  'settings.maxTokens': 'Max tokens per reply',
  'settings.sendOnEnter': 'Enter sends the message (Shift+Enter inserts a line break)',
  'settings.compare': 'Compare mode: send every question to several models',
  'settings.addModel': 'Add model',
  'settings.removeModelAria': 'Remove model',
  'settings.theme': 'Theme',
  'settings.theme.dark': 'Dark',
  'settings.theme.light': 'Light',
  'settings.theme.system': 'System',
  'settings.accent': 'Accent color',
  'settings.accentAria': 'Accent {color}',
  'settings.customColor': 'Custom color',
  'settings.language': 'Language',
  'settings.language.es': 'Español',
  'settings.language.en': 'English',
  'settings.data.summary.one': '{count} conversation stored in this browser. Export a backup before clearing.',
  'settings.data.summary.other': '{count} conversations stored in this browser. Export a backup before clearing.',
  'settings.data.export': 'Export JSON',
  'settings.data.import': 'Import JSON',
  'settings.data.imported.one': '{count} conversation imported.',
  'settings.data.imported.other': '{count} conversations imported.',
  'settings.data.invalidFile': 'The file does not contain valid conversations.',
  'settings.data.unreadable': 'Could not read the file.',
  'settings.data.clear': 'Delete chats and keys',
  'settings.data.confirm': 'Yes, delete everything',
  'settings.data.cancel': 'Cancel',

  'system.default':
    'You are Nexo, a clear and direct assistant. Match the length to the question: brief if it is simple, structured if it is complex. Use Markdown only when it helps (lists, tables, code blocks with a language). If you are not sure about something, say so.',

  'error.http': 'Error {status}',
  'error.serverUnreachable': 'Could not reach the server. Check that it is running.',
  'error.noContent': 'The provider returned no content.',
  'error.provider': 'Provider error.',
  'error.unexpected': 'Unexpected error',

  'export.byline': '_Exported from Nexo on {date}_',
  'export.you': 'You',
  'export.empty': '_(no response)_',

  'store.conversation': 'Conversation',
  'store.newConversation': 'New conversation',

  'time.now': 'now',
  'time.minutes': '{count} min',
  'time.hours': '{count} h',
  'time.days': '{count} d',

  'server.originDenied': 'Origin not allowed.',
  'server.unknownProvider': 'Unknown provider.',
  'server.invalidJson': 'The body must be valid JSON.',
  'server.missingModel': 'The model is missing.',
  'server.noMessages': 'There are no messages to send.',
  'server.missingKey': 'Add your {provider} key in Settings → Keys.',
  'server.routeNotFound': 'Route not found.',
  'server.hint.401': 'Check the key and its permissions.',
  'server.hint.402': 'The provider has no available balance.',
  'server.hint.404': 'That model does not exist for your key.',
  'server.hint.429': 'Too many requests or spending limit reached.',
  'server.hint.502': 'The provider returned an empty response.',
  'server.cancelled': 'Request cancelled.',
  'server.unexpected': 'Unexpected error',
} as const

export type TranslationKey = keyof typeof en

const es: Record<TranslationKey, string> = {
  'app.tagline': 'todos los modelos',
  'app.title': 'Nexo — todos los modelos de IA en un chat',
  'app.description':
    'Nexo es un chat que habla con OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, Mistral, DeepSeek y xAI. Compara respuestas, cambia de modelo y usa tus propias claves.',

  'common.close': 'Cerrar',
  'common.cancel': 'Cancelar',

  'sidebar.newChat': 'Nueva conversación',
  'sidebar.searchPlaceholder': 'Buscar chats',
  'sidebar.searchAria': 'Buscar conversaciones',
  'sidebar.conversationsAria': 'Conversaciones',
  'sidebar.closeMenu': 'Cerrar menú',
  'sidebar.turns.one': '{count} turno',
  'sidebar.turns.other': '{count} turnos',
  'sidebar.empty': 'vacío',
  'sidebar.writing': 'escribiendo…',
  'sidebar.responding': 'Respondiendo',
  'sidebar.noChats': 'Aún no hay chats.',
  'sidebar.settings': 'Ajustes',
  'sidebar.keys.one': '{count} clave',
  'sidebar.keys.other': '{count} claves',
  'sidebar.noKeys': 'sin claves',
  'sidebar.footNote': 'Tus claves viven en este navegador. Nunca se guardan en el servidor.',
  'sidebar.renameAria': 'Renombrar {title}',
  'sidebar.deleteAria': 'Eliminar {title}',

  'chat.newChat': 'Nuevo chat',
  'chat.compareModels.one': '{count} modelo en paralelo',
  'chat.compareModels.other': '{count} modelos en paralelo',
  'chat.compare': 'Comparar',
  'chat.compareTitle': 'Enviar cada pregunta a varios modelos a la vez',
  'chat.exportAria': 'Exportar conversación',
  'chat.exportTitle': 'Exportar como Markdown',
  'chat.settingsAria': 'Ajustes',
  'chat.openSidebar': 'Abrir chats',
  'chat.missingCompareKey': 'Alguno de los modelos comparados no tiene clave asignada.',
  'chat.missingKey': 'Falta la clave de {provider} para hablar con este modelo.',
  'chat.addKey': 'Añadir clave',
  'chat.emptyTitle': 'Un chat, todos los modelos.',
  'chat.emptyBody':
    'Cambia de proveedor sin cambiar de conversación. O compara respuestas en paralelo y quédate con la mejor.',
  'chat.suggestion.1': 'Explícame cómo funciona el interés compuesto con un ejemplo rápido.',
  'chat.suggestion.2': 'Redacta un correo amable reclamando una factura pendiente.',
  'chat.suggestion.3': 'Dame una rutina de 20 minutos sin material para casa.',
  'chat.suggestion.4': 'Compara las ventajas de PostgreSQL y SQLite para una app pequeña.',
  'chat.thinking': 'Pensando…',
  'chat.copyAria': 'Copiar respuesta',
  'chat.copyTitle': 'Copiar',
  'chat.regenerateAria': 'Regenerar respuesta',
  'chat.regenerateTitle': 'Regenerar',
  'chat.placeholderIdle': 'Escribe lo que necesites…',
  'chat.placeholderBusy': 'Esperando respuesta…',
  'chat.characters.one': '{count} carácter',
  'chat.characters.other': '{count} caracteres',
  'chat.enterSends': 'Enter envía · Shift+Enter salto',
  'chat.ctrlEnterSends': 'Ctrl/⌘+Enter envía',
  'chat.stopAria': 'Detener respuesta',
  'chat.sendAria': 'Enviar',
  'chat.legal': 'Nexo no guarda tus claves ni tus conversaciones en ningún servidor. Todo vive en este navegador.',

  'status.streaming': 'escribiendo…',
  'status.done': 'listo',
  'status.stopped': 'detenido',
  'status.error': 'error',

  'models.search': 'Buscar modelo o proveedor…',
  'models.noResults': 'Sin resultados para «{query}».',
  'models.loading': 'Consultando claves…',
  'models.loadReal': 'Cargar modelos reales con mis claves',

  'artifacts.generatedAria': 'Archivos generados',
  'artifacts.download': 'Descargar',
  'artifacts.downloadTitle': 'Descargar {filename}',
  'artifacts.copyAria': 'Copiar {filename}',
  'artifacts.copyTitle': 'Copiar contenido',

  'settings.title': 'Ajustes',
  'settings.subtitle': 'Todo se guarda en este navegador.',
  'settings.tab.keys': 'Claves',
  'settings.tab.model': 'Modelo',
  'settings.tab.appearance': 'Aspecto',
  'settings.tab.data': 'Datos',
  'settings.keys.hint':
    'Pega tus claves: se quedan en este navegador, se recuperan la próxima vez que abras Nexo y solo viajan al servidor que reenvía tu pregunta al proveedor. Nunca se escriben en disco ni se registran.',
  'settings.keys.serverKey': 'clave del servidor',
  'settings.keys.create': 'crear clave ↗',
  'settings.keys.show': 'Mostrar clave',
  'settings.keys.hide': 'Ocultar clave',
  'settings.keys.testing': 'Probando…',
  'settings.keys.test': 'Probar',
  'settings.keys.available.one': '{count} modelo disponible',
  'settings.keys.available.other': '{count} modelos disponibles',
  'settings.keys.example': ' · p. ej. {model}',
  'settings.keys.failed': 'No se pudo validar.',
  'settings.keys.storageBlocked':
    'Este navegador bloquea el almacenamiento local. Las claves se perderán al cerrar la pestaña. Permite los datos del sitio para Nexo.',
  'settings.system.label': 'Instrucciones del asistente',
  'settings.system.reset': 'Restaurar instrucciones predeterminadas',
  'settings.system.hint':
    'Las instrucciones predeterminadas siguen el idioma de la interfaz. Tu texto personalizado se conserva al cambiar.',
  'settings.temperature.label': 'Temperatura',
  'settings.temperature.hint': 'Baja para respuestas precisas, alta para respuestas creativas.',
  'settings.maxTokens': 'Máximo de tokens por respuesta',
  'settings.sendOnEnter': 'Enter envía el mensaje (Shift+Enter hace un salto de línea)',
  'settings.compare': 'Modo comparación: enviar cada pregunta a varios modelos',
  'settings.addModel': 'Añadir modelo',
  'settings.removeModelAria': 'Quitar modelo',
  'settings.theme': 'Tema',
  'settings.theme.dark': 'Oscuro',
  'settings.theme.light': 'Claro',
  'settings.theme.system': 'Sistema',
  'settings.accent': 'Color de acento',
  'settings.accentAria': 'Acento {color}',
  'settings.customColor': 'Color personalizado',
  'settings.language': 'Idioma',
  'settings.language.es': 'Español',
  'settings.language.en': 'English',
  'settings.data.summary.one': '{count} conversación guardada en este navegador. Exporta un respaldo antes de limpiar.',
  'settings.data.summary.other':
    '{count} conversaciones guardadas en este navegador. Exporta un respaldo antes de limpiar.',
  'settings.data.export': 'Exportar JSON',
  'settings.data.import': 'Importar JSON',
  'settings.data.imported.one': '{count} conversación importada.',
  'settings.data.imported.other': '{count} conversaciones importadas.',
  'settings.data.invalidFile': 'El archivo no contiene conversaciones válidas.',
  'settings.data.unreadable': 'No se pudo leer el archivo.',
  'settings.data.clear': 'Borrar chats y claves',
  'settings.data.confirm': 'Sí, borrar todo',
  'settings.data.cancel': 'Cancelar',

  'system.default':
    'Eres Nexo, un asistente claro y directo. Adapta la longitud a la pregunta: breve si es simple, estructurada si es compleja. Usa Markdown solo cuando aporte (listas, tablas, bloques de código con lenguaje). Si no estás seguro de algo, dilo.',

  'error.http': 'Error {status}',
  'error.serverUnreachable': 'No se pudo contactar con el servidor. Comprueba que está en marcha.',
  'error.noContent': 'El proveedor no devolvió contenido.',
  'error.provider': 'Error del proveedor.',
  'error.unexpected': 'Error inesperado',

  'export.byline': '_Exportado de Nexo el {date}_',
  'export.you': 'Tú',
  'export.empty': '_(sin respuesta)_',

  'store.conversation': 'Conversación',
  'store.newConversation': 'Nueva conversación',

  'time.now': 'ahora',
  'time.minutes': '{count} min',
  'time.hours': '{count} h',
  'time.days': '{count} d',

  'server.originDenied': 'Origen no permitido.',
  'server.unknownProvider': 'Proveedor desconocido.',
  'server.invalidJson': 'El cuerpo debe ser JSON válido.',
  'server.missingModel': 'Falta el modelo.',
  'server.noMessages': 'No hay mensajes que enviar.',
  'server.missingKey': 'Añade tu clave de {provider} en Ajustes → Claves.',
  'server.routeNotFound': 'Ruta no encontrada.',
  'server.hint.401': 'Revisa la clave y sus permisos.',
  'server.hint.402': 'El proveedor no tiene saldo disponible.',
  'server.hint.404': 'Ese modelo no existe para tu clave.',
  'server.hint.429': 'Demasiadas peticiones o límite de gasto alcanzado.',
  'server.hint.502': 'El proveedor devolvió una respuesta vacía.',
  'server.cancelled': 'Petición cancelada.',
  'server.unexpected': 'Error inesperado',
}

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { es, en }

export function isLocale(value: unknown): value is Locale {
  return value === 'es' || value === 'en'
}

/**
 * Idioma inicial: preferencia guardada (la resuelve el llamador) o, si no hay,
 * el primer idioma soportado en la lista del navegador. Español por defecto.
 */
export function detectLocale(): Locale {
  if (typeof navigator === 'undefined') return 'es'
  const candidates =
    Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : [navigator.language]
  for (const tag of candidates) {
    const primary = tag.toLowerCase().split('-')[0]
    if (primary === 'en') return 'en'
    if (primary === 'es') return 'es'
  }
  return 'es'
}

export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  const template = dictionaries[locale][key]
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(params, name) ? String(params[name]) : match,
  )
}

/** Plurales con dos formas (es/en): `<key>.one` y `<key>.other`. */
export function plural(locale: Locale, key: string, count: number): string {
  const suffix = count === 1 ? 'one' : 'other'
  return translate(locale, `${key}.${suffix}` as TranslationKey, { count })
}

export function defaultSystemPrompt(locale: Locale): string {
  return translate(locale, 'system.default')
}

/** El cliente manda `x-locale`; si falta, se negocia con `Accept-Language`. */
export function localeFromRequest(request: Request): Locale {
  const explicit = request.headers.get('x-locale')
  if (isLocale(explicit)) return explicit
  const header = request.headers.get('accept-language') ?? ''
  for (const entry of header.split(',')) {
    const tag = entry.split(';')[0]?.trim().toLowerCase() ?? ''
    if (tag.startsWith('en')) return 'en'
    if (tag.startsWith('es')) return 'es'
  }
  return 'es'
}

export function formatAgo(locale: Locale, timestamp: number): string {
  const minutes = Math.round((Date.now() - timestamp) / 60_000)
  if (minutes < 1) return translate(locale, 'time.now')
  if (minutes < 60) return translate(locale, 'time.minutes', { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 24) return translate(locale, 'time.hours', { count: hours })
  const days = Math.round(hours / 24)
  if (days < 7) return translate(locale, 'time.days', { count: days })
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(timestamp))
}

export function formatDateTime(locale: Locale, timestamp: number): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(timestamp),
  )
}

export function formatNumber(locale: Locale, value: number, digits = 1): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(value)
}
