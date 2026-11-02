import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChatView } from './components/ChatView'
import { SettingsDialog } from './components/SettingsDialog'
import { Sidebar } from './components/Sidebar'
import { fetchServerKeys, streamReply } from './lib/api'
import {
  DEFAULT_SETTINGS,
  KEYS_KEY,
  STATE_KEY,
  isStreaming,
  loadKeys,
  loadWorkspace,
  saveKeys,
  saveWorkspace,
  slugFrom,
  titleFrom,
  toChatMessages,
  toMarkdown,
  uid,
} from './lib/store'
import type {
  AssistantTurn,
  ChatMessage,
  Conversation,
  ModelChoice,
  ReplyPart,
  Settings,
  UserTurn,
  Workspace,
} from './shared/types'

function download(filename: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function App() {
  const [workspace, setWorkspace] = useState<Workspace>(() => loadWorkspace())
  const [keys, setKeys] = useState<Record<string, string>>(() => loadKeys())
  const [serverKeys, setServerKeys] = useState<Record<string, boolean>>({})
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const workspaceRef = useRef(workspace)
  const keysRef = useRef(keys)
  const controllers = useRef(new Map<string, AbortController>())

  useEffect(() => {
    workspaceRef.current = workspace
  }, [workspace])

  useEffect(() => {
    keysRef.current = keys
    saveKeys(keys)
  }, [keys])

  useEffect(() => {
    const timer = window.setTimeout(() => saveWorkspace(workspace), 400)
    return () => window.clearTimeout(timer)
  }, [workspace])

  useEffect(() => {
    void fetchServerKeys().then(setServerKeys)
  }, [])

  const { theme, accent } = workspace.settings
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.dataset.theme = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
    }
    apply()
    root.style.setProperty('--accent', accent)
    if (theme !== 'system') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [theme, accent])

  useEffect(() => () => controllers.current.forEach((controller) => controller.abort()), [])

  const active = useMemo(
    () => workspace.conversations.find((conversation) => conversation.id === workspace.activeId) ?? null,
    [workspace.conversations, workspace.activeId],
  )
  const streaming = active ? isStreaming(active.turns) : false

  const patchPart = useCallback((conversationId: string, turnId: string, partId: string, patch: (part: ReplyPart) => ReplyPart) => {
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
  }, [])

  const runReplies = useCallback(
    (conversationId: string, turnId: string, parts: ReplyPart[], history: ChatMessage[], targets: ModelChoice[]) => {
      const currentSettings = workspaceRef.current.settings

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
              system: currentSettings.system.trim() || undefined,
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
                        ? 'No se pudo contactar con el servidor. Comprueba que está en marcha.'
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
    (text: string) => {
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
      const history: ChatMessage[] = [...(existing ? toChatMessages(existing.turns) : []), { role: 'user', content: value }]

      const userTurn: UserTurn = { id: uid(), role: 'user', content: value, at: Date.now() }
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

  // Atajos: ⌘/Ctrl+K abre un chat nuevo, ⌘/Ctrl+, abre ajustes.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey && !event.ctrlKey) return
      if (event.key.toLowerCase() === 'k') {
        event.preventDefault()
        newChat()
      } else if (event.key === ',') {
        event.preventDefault()
        setSettingsOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [newChat])

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
    setKeys({})
    setWorkspace({ conversations: [], activeId: null, settings: { ...DEFAULT_SETTINGS } })
  }, [])

  const exportData = useCallback(() => {
    const payload = JSON.stringify(
      {
        app: 'nexo',
        version: 1,
        exportedAt: new Date().toISOString(),
        conversations: workspaceRef.current.conversations,
      },
      null,
      2,
    )
    download(`nexo-${new Date().toISOString().slice(0, 10)}.json`, payload, 'application/json')
  }, [])

  const exportMarkdown = useCallback((conversation: Conversation) => {
    download(`${slugFrom(conversation.title)}.md`, toMarkdown(conversation), 'text/markdown;charset=utf-8')
  }, [])

  const importData = useCallback((incoming: Conversation[]) => {
    setWorkspace((current) => {
      const known = new Set(current.conversations.map((conversation) => conversation.id))
      const added = incoming.filter((conversation) => !known.has(conversation.id))
      const conversations = [...current.conversations, ...added]
      return { ...current, conversations, activeId: current.activeId ?? conversations[0]?.id ?? null }
    })
  }, [])

  return (
    <div className="app">
      <Sidebar
        conversations={workspace.conversations}
        activeId={workspace.activeId}
        open={sidebarOpen}
        keyCount={Object.keys(keys).length}
        onSelect={selectChat}
        onNew={newChat}
        onDelete={deleteChat}
        onRename={renameChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onClose={() => setSidebarOpen(false)}
      />
      <ChatView
        conversation={active}
        settings={workspace.settings}
        keys={keys}
        serverKeys={serverKeys}
        streaming={streaming}
        onSend={send}
        onStop={stop}
        onRegenerate={regenerate}
        onSelectModel={(choice) => updateSettings({ provider: choice.provider, model: choice.model })}
        onToggleCompare={() => updateSettings({ compare: !workspace.settings.compare })}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenSidebar={() => setSidebarOpen(true)}
        onExportMarkdown={exportMarkdown}
      />
      <SettingsDialog
        open={settingsOpen}
        settings={workspace.settings}
        keys={keys}
        serverKeys={serverKeys}
        conversations={workspace.conversations}
        onChange={updateSettings}
        onKeys={setKeys}
        onClose={() => setSettingsOpen(false)}
        onClear={clearEverything}
        onExport={exportData}
        onImport={importData}
      />
    </div>
  )
}
