import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatView } from './components/ChatView'
import type { ChatComposerHandle } from './components/ChatView'
import { CommandPalette } from './components/CommandPalette'
import type { PaletteItem } from './components/CommandPalette'
import { PromptDialog } from './components/PromptDialog'
import { SearchOverlay } from './components/SearchOverlay'
import { SettingsDialog } from './components/SettingsDialog'
import { Sidebar } from './components/Sidebar'
import { Toasts } from './components/Toasts'
import { fetchServerKeys, streamReply } from './lib/api'
import { messageWithAttachments } from './lib/attachments'
import { I18nProvider, resolveLocale } from './lib/i18n'
import { isStandalone } from './lib/pwa'
import type { InstallPromptEvent } from './lib/pwa'
import { BUILTIN_PROMPTS, loadPrompts, promptCount, savePrompts } from './lib/prompts'
import type { Prompt } from './lib/prompts'
import { computeStats } from './lib/stats'
import { toast } from './lib/toast'
import {
  DEFAULT_SETTINGS,
  KEYS_KEY,
  STATE_KEY,
  isStreaming,
  loadKeys,
  loadWorkspace,
  sanitizeConversations,
  saveKeys,
  saveWorkspace,
  slugFrom,
  titleFrom,
  toChatMessages,
  toMarkdown,
  uid,
} from './lib/store'
import { PROVIDERS, shortModelId } from './shared/providers'
import { defaultSystemPrompt, translate } from './shared/i18n'
import type { Attachment, Conversation, ModelChoice, ReplyPart, Settings, UserTurn, Workspace } from './shared/types'
import type { AssistantTurn } from './shared/types'

function download(filename: string, content: string, type: string): boolean {
  try {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1500)
    return true
  } catch {
    return false
  }
}

export function App() {
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace())
  const [keys, setKeys] = useState<Record<string, string>>(() => loadKeys())
  const [serverKeys, setServerKeys] = useState<Record<string, boolean>>({})
  const [prompts, setPrompts] = useState<Prompt[]>(() => loadPrompts())
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [promptsOpen, setPromptsOpen] = useState(false)
  const [online, setOnline] = useState(() => navigator.onLine)
  const [installed, setInstalled] = useState(() => isStandalone())
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null)

  const locale = useMemo(() => resolveLocale(workspace.settings.locale), [workspace.settings.locale])
  const workspaceRef = useRef(workspace)
  const keysRef = useRef(keys)
  const localeRef = useRef(locale)
  const controllers = useRef(new Map<string, AbortController>())
  const chatRef = useRef<ChatComposerHandle>(null)

  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  useEffect(() => {
    keysRef.current = keys
    saveKeys(keys)
  }, [keys])

  useEffect(() => {
    localeRef.current = locale
  }, [locale])

  useEffect(() => {
    const timer = window.setTimeout(() => saveWorkspace(workspace), 400)
    return () => window.clearTimeout(timer)
  }, [workspace])

  useEffect(() => {
    savePrompts(prompts)
  }, [prompts])

  useEffect(() => {
    void fetchServerKeys().then(setServerKeys)
  }, [])

  const { theme, accent } = workspace.settings
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const next = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
      root.dataset.theme = next
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', next === 'light' ? '#f5f5fa' : '#08090d')
    }
    apply()
    root.style.setProperty('--accent', accent)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme, accent])

  useEffect(() => {
    document.documentElement.lang = locale
    document.title = translate(locale, 'app.title')
    document.querySelector('meta[name="description"]')?.setAttribute('content', translate(locale, 'app.description'))
  }, [locale])

  useEffect(() => {
    const onOnline = () => {
      setOnline(true)
      toast(translate(localeRef.current, 'toast.online'), 'ok')
    }
    const onOffline = () => {
      setOnline(false)
      toast(translate(localeRef.current, 'toast.offline'), 'error')
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault()
      setInstallEvent(event as InstallPromptEvent)
    }
    const onInstalled = () => {
      setInstallEvent(null)
      setInstalled(true)
      toast(translate(localeRef.current, 'toast.installed'), 'ok')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  useEffect(() => () => controllers.current.forEach((controller) => controller.abort()), [])

  const active = useMemo(
    () => workspace.conversations.find((conversation) => conversation.id === workspace.activeId) ?? null,
    [workspace.conversations, workspace.activeId],
  )
  const streaming = active ? isStreaming(active.turns) : false

  const patchPart = useCallback(
    (conversationId: string, turnId: string, partId: string, patch: (part: ReplyPart) => ReplyPart) => {
      setWorkspace((current) => ({
        ...current,
        conversations: current.conversations.map((conversation) =>
          conversation.id !== conversationId
            ? conversation
            : {
                ...conversation,
                updatedAt: Date.now(),
                turns: conversation.turns.map((turn) =>
                  turn.role !== 'assistant' || turn.id !== turnId
                    ? turn
                    : { ...turn, parts: turn.parts.map((part) => (part.id === partId ? patch(part) : part)) },
                ),
              },
        ),
      }))
    },
    [],
  )

  const runReplies = useCallback(
    (conversationId: string, turnId: string, parts: ReplyPart[], history: Parameters<typeof streamReply>[0]['messages'], targets: ModelChoice[]) => {
      const currentSettings = workspaceRef.current.settings
      const system = currentSettings.system.trim() || defaultSystemPrompt(localeRef.current)

      targets.forEach((target, index) => {
        const part = parts[index]
        if (!part) return

        const controller = new AbortController()
        controllers.current.set(part.id, controller)
        const startedAt = Date.now()

        void (async () => {
          try {
            const events = streamReply({
              target,
              messages: history,
              system,
              temperature: currentSettings.temperature,
              maxTokens: currentSettings.maxTokens,
              apiKey: keysRef.current[target.provider] || undefined,
              signal: controller.signal,
            })

            for await (const event of events) {
              if (event.delta) {
                const delta = event.delta
                patchPart(conversationId, turnId, part.id, (previous) => ({
                  ...previous,
                  content: previous.content + delta,
                }))
              }
              if (event.error) {
                const message = event.error
                patchPart(conversationId, turnId, part.id, (previous) => ({
                  ...previous,
                  status: 'error',
                  error: message,
                }))
              }
            }

            patchPart(conversationId, turnId, part.id, (previous) =>
              previous.status === 'streaming' ? { ...previous, status: 'done', ms: Date.now() - startedAt } : previous,
            )
          } catch (error) {
            const aborted = error instanceof Error && error.name === 'AbortError'
            patchPart(conversationId, turnId, part.id, (previous) =>
              aborted
                ? { ...previous, status: 'stopped', ms: Date.now() - startedAt }
                : {
                    ...previous,
                    status: 'error',
                    error:
                      error instanceof TypeError
                        ? translate(localeRef.current, 'error.serverUnreachable')
                        : error instanceof Error
                          ? error.message
                          : String(error),
                  },
            )
          } finally {
            controllers.current.delete(part.id)
          }
        })()
      })
    },
    [patchPart],
  )

  const send = useCallback(
    (text: string, attachments: Attachment[]) => {
      const value = text.trim()
      if (!value) return

      const currentSettings = workspaceRef.current.settings
      const targets: ModelChoice[] =
        currentSettings.compare && currentSettings.compareModels.length > 0
          ? currentSettings.compareModels
          : [{ provider: currentSettings.provider, model: currentSettings.model }]

      const currentWorkspace = workspaceRef.current
      const existing = currentWorkspace.conversations.find((conversation) => conversation.id === currentWorkspace.activeId)
      const conversationId = existing?.id ?? uid()
      const history = [
        ...(existing ? toChatMessages(existing.turns) : []),
        { role: 'user' as const, content: messageWithAttachments(value, attachments) },
      ]

      const userTurn: UserTurn = {
        id: uid(),
        role: 'user',
        content: value,
        at: Date.now(),
        ...(attachments.length ? { attachments } : {}),
      }
      const parts: ReplyPart[] = targets.map((target) => ({
        id: uid(),
        provider: target.provider,
        model: target.model,
        content: '',
        status: 'streaming',
      }))
      const assistantTurn: AssistantTurn = { id: uid(), role: 'assistant', parts, at: Date.now() }

      setWorkspace((current) => {
        const index = current.conversations.findIndex((conversation) => conversation.id === conversationId)
        if (index === -1) {
          const conversation: Conversation = {
            id: conversationId,
            title: titleFrom(value),
            turns: [userTurn, assistantTurn],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }
          return { ...current, activeId: conversationId, conversations: [conversation, ...current.conversations] }
        }
        const list = current.conversations.slice()
        const target = list[index]
        list[index] = {
          ...target,
          title: target.turns.length === 0 ? titleFrom(value) : target.title,
          turns: [...target.turns, userTurn, assistantTurn],
          updatedAt: Date.now(),
        }
        return { ...current, activeId: conversationId, conversations: list }
      })

      runReplies(conversationId, assistantTurn.id, parts, history, targets)
    },
    [runReplies],
  )

  const stop = useCallback(() => {
    controllers.current.forEach((controller) => controller.abort())
    controllers.current.clear()
  }, [])

  const regenerate = useCallback(
    (turnId: string) => {
      const current = workspaceRef.current
      const conversation = current.conversations.find((entry) => entry.id === current.activeId)
      if (!conversation) return

      const index = conversation.turns.findIndex((turn) => turn.id === turnId)
      if (index < 1) return
      const previous = conversation.turns[index - 1]
      if (!previous || previous.role !== 'user') return

      const replaced = conversation.turns[index]
      const previousTargets: ModelChoice[] =
        replaced && replaced.role === 'assistant'
          ? replaced.parts.map((part) => ({ provider: part.provider, model: part.model }))
          : []
      const settingsNow = current.settings
      const targets = previousTargets.length
        ? previousTargets
        : settingsNow.compare
          ? settingsNow.compareModels
          : [{ provider: settingsNow.provider, model: settingsNow.model }]
      if (!targets.length) return

      const parts: ReplyPart[] = targets.map((target) => ({
        id: uid(),
        provider: target.provider,
        model: target.model,
        content: '',
        status: 'streaming',
      }))
      const turnIdNext = uid()
      const history = toChatMessages(conversation.turns.slice(0, index))

      setWorkspace((state) => ({
        ...state,
        conversations: state.conversations.map((entry) =>
          entry.id !== conversation.id
            ? entry
            : {
                ...entry,
                updatedAt: Date.now(),
                turns: [...entry.turns.slice(0, index), { id: turnIdNext, role: 'assistant', parts, at: Date.now() }],
              },
        ),
      }))

      runReplies(conversation.id, turnIdNext, parts, history, targets)
    },
    [runReplies],
  )

  const newChat = useCallback(() => {
    setWorkspace((current) => ({ ...current, activeId: null }))
    setSidebarOpen(false)
  }, [])

  const selectChat = useCallback((id: string) => {
    setWorkspace((current) => ({ ...current, activeId: id }))
    setSidebarOpen(false)
  }, [])

  const deleteChat = useCallback((id: string) => {
    setWorkspace((current) => {
      const conversations = current.conversations.filter((conversation) => conversation.id !== id)
      return {
        ...current,
        conversations,
        activeId: current.activeId === id ? (conversations[0]?.id ?? null) : current.activeId,
      }
    })
  }, [])

  const renameChat = useCallback((id: string, title: string) => {
    const clean = title.trim()
    if (!clean) return
    setWorkspace((current) => ({
      ...current,
      conversations: current.conversations.map((conversation) =>
        conversation.id === id ? { ...conversation, title: clean } : conversation,
      ),
    }))
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setWorkspace((current) => ({ ...current, settings: { ...current.settings, ...patch } }))
  }, [])

  const clearEverything = useCallback(() => {
    controllers.current.forEach((controller) => controller.abort())
    controllers.current.clear()
    try {
      localStorage.removeItem(STATE_KEY)
      localStorage.removeItem(KEYS_KEY)
    } catch {
      // Sin almacenamiento disponible: solo se limpia la memoria.
    }
    keysRef.current = {}
    setKeys({})
    setWorkspace({ conversations: [], activeId: null, settings: { ...DEFAULT_SETTINGS } })
    toast(translate(localeRef.current, 'toast.cleared'), 'ok')
  }, [])

  const exportData = useCallback(() => {
    const current = workspaceRef.current
    const payload = JSON.stringify(
      {
        app: 'nexo',
        version: 2,
        exportedAt: new Date().toISOString(),
        conversations: current.conversations,
        prompts,
        settings: current.settings,
      },
      null,
      2,
    )
    const ok = download(`nexo-${new Date().toISOString().slice(0, 10)}.json`, payload, 'application/json')
    toast(
      translate(localeRef.current, ok ? 'toast.exported' : 'toast.exportFailed'),
      ok ? 'ok' : 'error',
    )
  }, [prompts])

  const exportStats = useCallback(() => {
    const stats = computeStats(workspaceRef.current.conversations)
    const payload = JSON.stringify(
      {
        app: 'nexo',
        version: 2,
        exportedAt: new Date().toISOString(),
        locale: localeRef.current,
        stats,
        prompts: promptCount(prompts),
      },
      null,
      2,
    )
    const ok = download(
      `nexo-stats-${new Date().toISOString().slice(0, 10)}.json`,
      payload,
      'application/json',
    )
    toast(
      translate(localeRef.current, ok ? 'toast.exported' : 'toast.exportFailed'),
      ok ? 'ok' : 'error',
    )
  }, [prompts])

  const exportMarkdown = useCallback((conversation: Conversation) => {
    const ok = download(
      `${slugFrom(conversation.title)}.md`,
      toMarkdown(conversation, localeRef.current),
      'text/markdown;charset=utf-8',
    )
    toast(
      translate(localeRef.current, ok ? 'toast.exported' : 'toast.exportFailed'),
      ok ? 'ok' : 'error',
    )
  }, [])

  const importData = useCallback((incoming: Conversation[], incomingPrompts: Prompt[]) => {
    setWorkspace((current) => {
      const known = new Set(current.conversations.map((conversation) => conversation.id))
      const added = sanitizeConversations(incoming).filter((conversation) => !known.has(conversation.id))
      const conversations = [...current.conversations, ...added]
      return { ...current, conversations, activeId: current.activeId ?? conversations[0]?.id ?? null }
    })
    if (incomingPrompts.length) {
      setPrompts((current) => {
        const known = new Set(current.map((prompt) => prompt.id))
        return [...current, ...incomingPrompts.filter((prompt) => !known.has(prompt.id))]
      })
    }
    if (incoming.length) {
      const key = incoming.length === 1 ? 'settings.data.imported.one' : 'settings.data.imported.other'
      toast(translate(localeRef.current, key, { count: incoming.length }), 'ok')
    }
  }, [])

  const insertPrompt = useCallback((body: string) => {
    chatRef.current?.insert(body)
  }, [])

  const install = useCallback(async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const choice = await installEvent.userChoice
    if (choice.outcome === 'accepted') setInstallEvent(null)
  }, [installEvent])

  // Atajos globales: ⌘K paleta, ⌘⇧F búsqueda, ⌘⇧P prompts, ⌘, ajustes.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return
      const key = event.key.toLowerCase()
      if (key === 'k' && !event.shiftKey) {
        event.preventDefault()
        setPaletteOpen((current) => !current)
        return
      }
      if (key === 'f' && event.shiftKey) {
        event.preventDefault()
        setSearchOpen(true)
        return
      }
      if (key === 'p' && event.shiftKey) {
        event.preventDefault()
        setPromptsOpen(true)
        return
      }
      if (event.key === ',') {
        event.preventDefault()
        setSettingsOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const totalPrompts = promptCount(prompts)

  const paletteItems = useMemo<PaletteItem[]>(() => {
    const items: PaletteItem[] = []
    const groupActions = translate(locale, 'palette.group.actions')
    const groupChats = translate(locale, 'palette.group.chats')
    const groupPrompts = translate(locale, 'palette.group.prompts')
    const groupModels = translate(locale, 'palette.group.models')

    items.push(
      {
        id: 'action:new',
        label: translate(locale, 'palette.action.newChat'),
        group: groupActions,
        keywords: 'nueva new chat conversacion',
        run: newChat,
      },
      {
        id: 'action:search',
        label: translate(locale, 'palette.action.search'),
        group: groupActions,
        hint: '⌘⇧F',
        keywords: 'buscar search',
        run: () => setSearchOpen(true),
      },
      {
        id: 'action:prompts',
        label: translate(locale, 'palette.action.prompts'),
        group: groupActions,
        hint: '⌘⇧P',
        keywords: 'prompt biblioteca library',
        run: () => setPromptsOpen(true),
      },
      {
        id: 'action:settings',
        label: translate(locale, 'palette.action.settings'),
        group: groupActions,
        hint: '⌘,',
        keywords: 'ajustes settings config',
        run: () => setSettingsOpen(true),
      },
      {
        id: 'action:theme',
        label: translate(locale, 'palette.action.theme'),
        group: groupActions,
        keywords: 'tema theme claro oscuro light dark',
        run: () =>
          updateSettings({
            theme: workspaceRef.current.settings.theme === 'light' ? 'dark' : 'light',
          }),
      },
      {
        id: 'action:compare',
        label: translate(locale, 'palette.action.compare'),
        group: groupActions,
        keywords: 'comparar compare modelos',
        run: () => updateSettings({ compare: !workspaceRef.current.settings.compare }),
      },
      {
        id: 'action:lang-es',
        label: translate(locale, 'palette.action.spanish'),
        group: groupActions,
        keywords: 'idioma language español spanish',
        run: () => updateSettings({ locale: 'es' }),
      },
      {
        id: 'action:lang-en',
        label: translate(locale, 'palette.action.english'),
        group: groupActions,
        keywords: 'idioma language english inglés',
        run: () => updateSettings({ locale: 'en' }),
      },
    )

    if (installEvent && !installed) {
      items.push({
        id: 'action:install',
        label: translate(locale, 'palette.action.install'),
        group: groupActions,
        keywords: 'instalar pwa app',
        run: () => void install(),
      })
    }

    if (active && active.turns.length) {
      items.push({
        id: 'action:export',
        label: translate(locale, 'palette.action.export'),
        group: groupActions,
        keywords: 'exportar markdown descargar',
        run: () => exportMarkdown(active),
      })
    }

    const recent = [...workspace.conversations].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8)
    for (const conversation of recent) {
      items.push({
        id: `chat:${conversation.id}`,
        label: conversation.title,
        group: groupChats,
        hint: new Date(conversation.updatedAt).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        keywords: conversation.title,
        run: () => selectChat(conversation.id),
      })
    }

    for (const item of BUILTIN_PROMPTS) {
      const title = translate(locale, item.titleKey)
      items.push({
        id: `prompt:${item.id}`,
        label: title,
        group: groupPrompts,
        keywords: `prompt ${title}`,
        run: () => insertPrompt(translate(locale, item.bodyKey)),
      })
    }
    for (const prompt of prompts) {
      items.push({
        id: `prompt:${prompt.id}`,
        label: prompt.title,
        group: groupPrompts,
        keywords: `prompt ${prompt.title}`,
        run: () => insertPrompt(prompt.body),
      })
    }

    for (const provider of PROVIDERS) {
      const model = provider.models[0]
      if (!model) continue
      items.push({
        id: `model:${provider.id}`,
        label: `${provider.name} · ${shortModelId(model)}`,
        group: groupModels,
        keywords: `${provider.name} ${provider.models.join(' ')}`,
        run: () => updateSettings({ provider: provider.id, model }),
      })
    }

    return items
  }, [locale, newChat, selectChat, updateSettings, prompts, insertPrompt, active, installEvent, installed, install, exportMarkdown, workspace.conversations])

  return (
    <I18nProvider locale={locale}>
      <div className="app">
        <Sidebar
          conversations={workspace.conversations}
          activeId={workspace.activeId}
          open={sidebarOpen}
          keyCount={Object.keys(keys).length}
          promptCount={totalPrompts}
          online={online}
          onSelect={selectChat}
          onNew={newChat}
          onDelete={deleteChat}
          onRename={renameChat}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenPrompts={() => setPromptsOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          onClose={() => setSidebarOpen(false)}
        />
        <ChatView
          ref={chatRef}
          conversation={active}
          settings={workspace.settings}
          keys={keys}
          serverKeys={serverKeys}
          streaming={streaming}
          online={online}
          onSend={send}
          onStop={stop}
          onRegenerate={regenerate}
          onSelectModel={(choice) => updateSettings({ provider: choice.provider, model: choice.model })}
          onToggleCompare={() => updateSettings({ compare: !workspace.settings.compare })}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenPrompts={() => setPromptsOpen(true)}
          onExportMarkdown={exportMarkdown}
        />
        <SettingsDialog
          open={settingsOpen}
          settings={workspace.settings}
          keys={keys}
          serverKeys={serverKeys}
          conversations={workspace.conversations}
          promptCount={totalPrompts}
          online={online}
          installed={installed}
          canInstall={Boolean(installEvent) && !installed}
          onChange={updateSettings}
          onKeys={setKeys}
          onClose={() => setSettingsOpen(false)}
          onClear={clearEverything}
          onExport={exportData}
          onExportStats={exportStats}
          onImport={importData}
          onInstall={() => void install()}
        />
      </div>

      <CommandPalette open={paletteOpen} items={paletteItems} onClose={() => setPaletteOpen(false)} />
      <SearchOverlay
        open={searchOpen}
        conversations={workspace.conversations}
        onClose={() => setSearchOpen(false)}
        onSelect={selectChat}
      />
      <PromptDialog
        open={promptsOpen}
        prompts={prompts}
        onClose={() => setPromptsOpen(false)}
        onUse={insertPrompt}
        onSave={setPrompts}
      />
      <Toasts />
    </I18nProvider>
  )
}
