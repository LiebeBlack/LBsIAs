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
  'app.tagline': 'by LBs IAs',
  'app.title': 'Nexo by LBs IAs — every AI model in one chat',
  'app.description':
    'Nexo by LBs IAs is a private, bilingual workspace that talks to OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, Mistral, DeepSeek and xAI. Compare answers, switch models and use your own keys.',

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
  'chat.apiModel': 'API model',
  'chat.keyReady': 'Key ready',
  'chat.keysReady': 'Keys ready',
  'chat.keySaved': 'Saved key',
  'chat.keyServer': 'Server key',
  'chat.keyMissing': 'Missing key',
  'chat.keysChecking': 'Checking keys…',
  'chat.noKey': 'Add a key to send. It will be saved in this browser.',
  'chat.useProvider': 'Use {provider}',
  'chat.savedKeyAvailable': 'You already have a {provider} key; it will be used automatically when this model has none.',
  'chat.emptyTitle': 'One chat, every model.',
  'chat.emptyBody':
    'Switch providers without changing the conversation. Or compare answers side by side and keep the best one.',
  'chat.suggestion.1': 'Explain how compound interest works with a quick example.',
  'chat.suggestion.2': 'Write a friendly email claiming an unpaid invoice.',
  'chat.suggestion.3': 'Give me a 20-minute home workout with no equipment.',
  'chat.suggestion.4': 'Compare PostgreSQL and SQLite for a small app.',
  'chat.thinking': 'Thinking',
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
  'settings.tab.about': 'About',
  'settings.keys.hint':
    'Paste your keys: they are saved automatically in this browser and restored the next time you open Nexo. They only travel to the server that forwards your question to the provider. They are never written to disk or logged.',
  'settings.keys.serverKey': 'server key',
  'settings.keys.saved': 'Saved',
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
  'settings.maxTokens': 'Token limit per reply',
  'settings.maxTokens.hint': '0 = use the model maximum. Higher values allow longer replies.',
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
  'settings.language.auto': 'Automatic',
  'settings.language.hint': 'The default instructions follow the interface language.',
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
  'settings.data.stats': 'Usage',
  'settings.data.conversations': 'Chats',
  'settings.data.turns': 'Messages',
  'settings.data.replies': 'Replies',
  'settings.data.characters': 'Characters',
  'settings.data.avg': 'Avg. time',
  'settings.data.models': 'Models used',
  'settings.data.providers': 'Providers',
  'settings.data.prompts': 'Prompts',
  'settings.data.attachments': 'Attachments',
  'settings.data.topModel': 'Most used',
  'settings.data.none': 'No data yet',
  'settings.data.exportStats': 'Export stats',
  'settings.about.title': 'Nexo by LBs IAs',
  'settings.about.body':
    'A private, bilingual, multi-model workspace. Your keys, chats and prompts never leave this browser.',
  'settings.about.version': 'Version {version}',
  'settings.about.privacy': 'Privacy',
  'settings.about.privacyBody':
    'The server only forwards your request to the provider you choose. It never stores keys, conversations or usage logs.',
  'settings.about.shortcuts': 'Keyboard shortcuts',
  'settings.about.install': 'Install app',
  'settings.about.installed': 'Installed',
  'settings.about.installHint':
    'Install it from your browser menu to open Nexo like a native app and keep the interface offline.',
  'settings.about.status': 'Connection',
  'settings.about.by': 'Built by LBs IAs',
  'settings.about.shortcut.newChat': 'New conversation',
  'settings.about.shortcut.palette': 'Command palette',
  'settings.about.shortcut.search': 'Global search',
  'settings.about.shortcut.prompts': 'Prompt library',
  'settings.about.shortcut.settings': 'Settings',
  'settings.about.shortcut.send': 'Send message',

  'system.default':
    'You are Nexo, the AI assistant of LBs IAs: clear, direct and rigorous. Match the length to the question: brief if it is simple, structured if it is complex. Use Markdown only when it helps (lists, tables, code blocks with a language). If you are not sure about something, say so.',

  'error.http': 'Error {status}',
  'error.serverUnreachable': 'Could not reach the server. Check that it is running.',
  'error.noContent': 'The provider returned no content.',
  'error.provider': 'Provider error.',
  'error.unexpected': 'Unexpected error',

  'export.byline': '_Exported from Nexo on {date}_',
  'export.you': 'You',
  'export.empty': '_(no response)_',
  'export.attachments': 'Attachments',

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

  'sidebar.quickSearch': 'Search everywhere',
  'sidebar.quickPrompts': 'Prompts',
  'sidebar.quickPalette': 'Commands',
  'sidebar.online': 'Online',
  'sidebar.offline': 'Offline',

  'chat.attachAria': 'Attach file',
  'chat.attachTitle': 'Attach a text or code file',
  'chat.attachRemove': 'Remove {name}',
  'chat.attachError.tooMany': 'Up to 3 files per message.',
  'chat.attachError.tooLarge': 'That file is too large (200 KB max).',
  'chat.attachError.unsupported': 'Only text or code files.',
  'chat.attachError.unreadable': 'Could not read that file.',
  'chat.attachError.total': 'The attachments are too long together.',
  'chat.attachments.one': '{count} attachment',
  'chat.attachments.other': '{count} attachments',
  'chat.filesLabel': 'Attached files',
  'chat.promptsAria': 'Prompt library',
  'chat.promptsTitle': 'Insert a saved prompt',
  'chat.searchAria': 'Search in conversations',
  'chat.shortcutsHint': '⌘K commands · ⌘⇧F search · ⌘⇧P prompts',

  'empty.meta.private': 'Private by design',
  'empty.meta.multi': '8 providers',
  'empty.meta.bilingual': 'ES / EN',

  'palette.title': 'Command palette',
  'palette.placeholder': 'Type a command or search…',
  'palette.empty': 'No commands match “{query}”.',
  'palette.group.actions': 'Actions',
  'palette.group.chats': 'Conversations',
  'palette.group.prompts': 'Prompts',
  'palette.group.models': 'Models',
  'palette.hint': '↑↓ move · Enter run · Esc close',
  'palette.action.newChat': 'New conversation',
  'palette.action.search': 'Search in all messages',
  'palette.action.prompts': 'Open prompt library',
  'palette.action.settings': 'Open settings',
  'palette.action.theme': 'Toggle light / dark theme',
  'palette.action.compare': 'Toggle compare mode',
  'palette.action.export': 'Export this chat as Markdown',
  'palette.action.install': 'Install as an app',
  'palette.action.spanish': 'Interface language: Español',
  'palette.action.english': 'Interface language: English',

  'search.title': 'Search',
  'search.placeholder': 'Search titles and every message…',
  'search.empty': 'Type to search across all your conversations.',
  'search.noResults': 'No results for “{query}”.',
  'search.hint': 'Enter to open · Esc to close',
  'search.results.one': '{count} result',
  'search.results.other': '{count} results',
  'search.kind.title': 'Title',
  'search.kind.user': 'You',
  'search.kind.assistant': 'Reply',

  'prompts.title': 'Prompt library',
  'prompts.subtitle': 'Reusable instructions, one click away. Saved in this browser.',
  'prompts.builtin': 'Built-in',
  'prompts.custom': 'Yours',
  'prompts.empty': 'You have not saved any prompts yet.',
  'prompts.new': 'New prompt',
  'prompts.edit': 'Edit',
  'prompts.name': 'Name',
  'prompts.namePlaceholder': 'e.g. Weekly report',
  'prompts.body': 'Prompt',
  'prompts.bodyPlaceholder': 'Write the instruction you want to reuse…',
  'prompts.save': 'Save prompt',
  'prompts.delete': 'Delete prompt',
  'prompts.use': 'Use',
  'prompts.required': 'Add a name and the prompt text.',
  'prompts.count.one': '{count} custom prompt',
  'prompts.count.other': '{count} custom prompts',

  'prompt.code.title': 'Review code',
  'prompt.code.body':
    'Review the following code for bugs, edge cases, security and readability. Reply with concrete fixes, highest impact first:\n\n```\n\n```',
  'prompt.review.title': 'Improve writing',
  'prompt.review.body':
    'Rewrite the following text so it is clear, concise and professional. Keep the meaning and the language:\n\n',
  'prompt.summarize.title': 'Summarize',
  'prompt.summarize.body':
    'Summarize the following content in 5 key bullets, then give the single sentence that matters most:\n\n',
  'prompt.translate.title': 'Translate',
  'prompt.translate.body': 'Translate the following text into natural, professional English. Keep the formatting:\n\n',
  'prompt.email.title': 'Write an email',
  'prompt.email.body': 'Write a short, friendly email. Context:\n\n',
  'prompt.plan.title': 'Plan a project',
  'prompt.plan.body':
    'Turn this idea into a practical plan: milestones, risks and the first three concrete steps.\n\nIdea: ',

  'toast.copied': 'Copied.',
  'toast.exported': 'Export ready.',
  'toast.cleared': 'Everything was deleted from this browser.',
  'toast.offline': 'You are offline. History and the interface still work.',
  'toast.online': 'Back online.',
  'toast.installed': 'App installed.',
  'toast.promptSaved': 'Prompt saved.',
  'toast.promptDeleted': 'Prompt deleted.',
  'toast.exportFailed': 'Could not export.',
  'toast.autoModel': 'Using {provider} · {model}: you have a saved key.',
  'toast.skippedModels': 'Some compared models have no key and were skipped.',
} as const

export type TranslationKey = keyof typeof en

const es: Record<TranslationKey, string> = {
  'app.tagline': 'por LBs IAs',
  'app.title': 'Nexo by LBs IAs — todos los modelos de IA en un chat',
  'app.description':
    'Nexo by LBs IAs es un espacio privado y bilingüe que habla con OpenAI, Anthropic, Google Gemini, OpenRouter, Groq, Mistral, DeepSeek y xAI. Compara respuestas, cambia de modelo y usa tus propias claves.',

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
  'chat.apiModel': 'Modelo API',
  'chat.keyReady': 'Clave lista',
  'chat.keysReady': 'Claves listas',
  'chat.keySaved': 'Clave guardada',
  'chat.keyServer': 'Clave del servidor',
  'chat.keyMissing': 'Falta clave',
  'chat.keysChecking': 'Comprobando claves…',
  'chat.noKey': 'Añade una clave para enviar. Se guardará en este navegador.',
  'chat.useProvider': 'Usar {provider}',
  'chat.savedKeyAvailable': 'Ya tienes una clave de {provider}; se usará automáticamente cuando este modelo no tenga la suya.',
  'chat.emptyTitle': 'Un chat, todos los modelos.',
  'chat.emptyBody':
    'Cambia de proveedor sin cambiar de conversación. O compara respuestas en paralelo y quédate con la mejor.',
  'chat.suggestion.1': 'Explícame cómo funciona el interés compuesto con un ejemplo rápido.',
  'chat.suggestion.2': 'Redacta un correo amable reclamando una factura pendiente.',
  'chat.suggestion.3': 'Dame una rutina de 20 minutos sin material para casa.',
  'chat.suggestion.4': 'Compara las ventajas de PostgreSQL y SQLite para una app pequeña.',
  'chat.thinking': 'Pensando',
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
  'settings.tab.about': 'Acerca de',
  'settings.keys.hint':
    'Pega tus claves: se guardan automáticamente en este navegador y se recuperan la próxima vez que abras Nexo. Solo viajan al servidor que reenvía tu pregunta al proveedor. Nunca se escriben en disco ni se registran.',
  'settings.keys.serverKey': 'clave del servidor',
  'settings.keys.saved': 'Guardada',
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
  'settings.maxTokens': 'Límite de tokens por respuesta',
  'settings.maxTokens.hint': '0 = usa el máximo del modelo. Los valores altos permiten respuestas más largas.',
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
  'settings.language.auto': 'Automático',
  'settings.language.hint': 'Las instrucciones predeterminadas siguen el idioma de la interfaz.',
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
  'settings.data.stats': 'Uso',
  'settings.data.conversations': 'Chats',
  'settings.data.turns': 'Mensajes',
  'settings.data.replies': 'Respuestas',
  'settings.data.characters': 'Caracteres',
  'settings.data.avg': 'Tiempo medio',
  'settings.data.models': 'Modelos usados',
  'settings.data.providers': 'Proveedores',
  'settings.data.prompts': 'Prompts',
  'settings.data.attachments': 'Adjuntos',
  'settings.data.topModel': 'Más usado',
  'settings.data.none': 'Sin datos aún',
  'settings.data.exportStats': 'Exportar estadísticas',
  'settings.about.title': 'Nexo by LBs IAs',
  'settings.about.body':
    'Un espacio de trabajo privado, bilingüe y multimodelo. Tus claves, chats y prompts no salen de este navegador.',
  'settings.about.version': 'Versión {version}',
  'settings.about.privacy': 'Privacidad',
  'settings.about.privacyBody':
    'El servidor solo reenvía tu petición al proveedor que elijas. No guarda claves, conversaciones ni registros de uso.',
  'settings.about.shortcuts': 'Atajos de teclado',
  'settings.about.install': 'Instalar aplicación',
  'settings.about.installed': 'Instalada',
  'settings.about.installHint':
    'Instálala desde el menú del navegador para abrir Nexo como una app y conservar la interfaz sin conexión.',
  'settings.about.status': 'Conexión',
  'settings.about.by': 'Creado por LBs IAs',
  'settings.about.shortcut.newChat': 'Nueva conversación',
  'settings.about.shortcut.palette': 'Paleta de comandos',
  'settings.about.shortcut.search': 'Búsqueda global',
  'settings.about.shortcut.prompts': 'Biblioteca de prompts',
  'settings.about.shortcut.settings': 'Ajustes',
  'settings.about.shortcut.send': 'Enviar mensaje',

  'system.default':
    'Eres Nexo, el asistente de IA de LBs IAs: claro, directo y riguroso. Adapta la longitud a la pregunta: breve si es simple, estructurada si es compleja. Usa Markdown solo cuando aporte (listas, tablas, bloques de código con lenguaje). Si no estás seguro de algo, dilo.',

  'error.http': 'Error {status}',
  'error.serverUnreachable': 'No se pudo contactar con el servidor. Comprueba que está en marcha.',
  'error.noContent': 'El proveedor no devolvió contenido.',
  'error.provider': 'Error del proveedor.',
  'error.unexpected': 'Error inesperado',

  'export.byline': '_Exportado de Nexo el {date}_',
  'export.you': 'Tú',
  'export.empty': '_(sin respuesta)_',
  'export.attachments': 'Adjuntos',

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

  'sidebar.quickSearch': 'Buscar en todo',
  'sidebar.quickPrompts': 'Prompts',
  'sidebar.quickPalette': 'Comandos',
  'sidebar.online': 'En línea',
  'sidebar.offline': 'Sin conexión',

  'chat.attachAria': 'Adjuntar archivo',
  'chat.attachTitle': 'Adjuntar un archivo de texto o código',
  'chat.attachRemove': 'Quitar {name}',
  'chat.attachError.tooMany': 'Máximo 3 archivos por mensaje.',
  'chat.attachError.tooLarge': 'Ese archivo es demasiado grande (máx. 200 KB).',
  'chat.attachError.unsupported': 'Solo archivos de texto o código.',
  'chat.attachError.unreadable': 'No se pudo leer ese archivo.',
  'chat.attachError.total': 'Los adjuntos son demasiado largos en conjunto.',
  'chat.attachments.one': '{count} adjunto',
  'chat.attachments.other': '{count} adjuntos',
  'chat.filesLabel': 'Archivos adjuntos',
  'chat.promptsAria': 'Biblioteca de prompts',
  'chat.promptsTitle': 'Insertar un prompt guardado',
  'chat.searchAria': 'Buscar en las conversaciones',
  'chat.shortcutsHint': '⌘K comandos · ⌘⇧F buscar · ⌘⇧P prompts',

  'empty.meta.private': 'Privado por diseño',
  'empty.meta.multi': '8 proveedores',
  'empty.meta.bilingual': 'ES / EN',

  'palette.title': 'Paleta de comandos',
  'palette.placeholder': 'Escribe un comando o busca…',
  'palette.empty': 'Ningún comando coincide con «{query}».',
  'palette.group.actions': 'Acciones',
  'palette.group.chats': 'Conversaciones',
  'palette.group.prompts': 'Prompts',
  'palette.group.models': 'Modelos',
  'palette.hint': '↑↓ mover · Enter ejecutar · Esc cerrar',
  'palette.action.newChat': 'Nueva conversación',
  'palette.action.search': 'Buscar en todos los mensajes',
  'palette.action.prompts': 'Abrir biblioteca de prompts',
  'palette.action.settings': 'Abrir ajustes',
  'palette.action.theme': 'Cambiar entre tema claro y oscuro',
  'palette.action.compare': 'Activar o desactivar comparación',
  'palette.action.export': 'Exportar este chat en Markdown',
  'palette.action.install': 'Instalar como aplicación',
  'palette.action.spanish': 'Idioma de la interfaz: Español',
  'palette.action.english': 'Idioma de la interfaz: English',

  'search.title': 'Buscar',
  'search.placeholder': 'Buscar en títulos y todos los mensajes…',
  'search.empty': 'Escribe para buscar en todas tus conversaciones.',
  'search.noResults': 'Sin resultados para «{query}».',
  'search.hint': 'Enter abrir · Esc cerrar',
  'search.results.one': '{count} resultado',
  'search.results.other': '{count} resultados',
  'search.kind.title': 'Título',
  'search.kind.user': 'Tú',
  'search.kind.assistant': 'Respuesta',

  'prompts.title': 'Biblioteca de prompts',
  'prompts.subtitle': 'Instrucciones reutilizables, a un clic. Guardadas en este navegador.',
  'prompts.builtin': 'Incluidos',
  'prompts.custom': 'Tuyos',
  'prompts.empty': 'Aún no has guardado ningún prompt.',
  'prompts.new': 'Nuevo prompt',
  'prompts.edit': 'Editar',
  'prompts.name': 'Nombre',
  'prompts.namePlaceholder': 'p. ej. Informe semanal',
  'prompts.body': 'Prompt',
  'prompts.bodyPlaceholder': 'Escribe la instrucción que quieres reutilizar…',
  'prompts.save': 'Guardar prompt',
  'prompts.delete': 'Eliminar prompt',
  'prompts.use': 'Usar',
  'prompts.required': 'Añade un nombre y el texto del prompt.',
  'prompts.count.one': '{count} prompt propio',
  'prompts.count.other': '{count} prompts propios',

  'prompt.code.title': 'Revisar código',
  'prompt.code.body':
    'Revisa el siguiente código buscando errores, casos límite, seguridad y legibilidad. Responde con correcciones concretas, de mayor a menor impacto:\n\n```\n\n```',
  'prompt.review.title': 'Mejorar redacción',
  'prompt.review.body':
    'Reescribe el siguiente texto para que sea claro, conciso y profesional. Conserva el significado y el idioma:\n\n',
  'prompt.summarize.title': 'Resumir',
  'prompt.summarize.body':
    'Resume el siguiente contenido en 5 bullets clave y termina con la frase más importante:\n\n',
  'prompt.translate.title': 'Traducir',
  'prompt.translate.body': 'Traduce el siguiente texto a un inglés natural y profesional. Conserva el formato:\n\n',
  'prompt.email.title': 'Escribir un correo',
  'prompt.email.body': 'Escribe un correo breve y cordial. Contexto:\n\n',
  'prompt.plan.title': 'Planificar un proyecto',
  'prompt.plan.body':
    'Convierte esta idea en un plan práctico: hitos, riesgos y los tres primeros pasos concretos.\n\nIdea: ',

  'toast.copied': 'Copiado.',
  'toast.exported': 'Exportación lista.',
  'toast.cleared': 'Todo se ha borrado de este navegador.',
  'toast.offline': 'Sin conexión. El historial y la interfaz siguen funcionando.',
  'toast.online': 'Conexión restablecida.',
  'toast.installed': 'Aplicación instalada.',
  'toast.promptSaved': 'Prompt guardado.',
  'toast.promptDeleted': 'Prompt eliminado.',
  'toast.exportFailed': 'No se pudo exportar.',
  'toast.autoModel': 'Usando {provider} · {model}: tienes una clave guardada.',
  'toast.skippedModels': 'Algunos modelos comparados no tienen clave y se omitieron.',
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
