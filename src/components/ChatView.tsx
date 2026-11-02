import {
  Suspense,
  forwardRef,
  lazy,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { PROVIDERS, providerById, shortModelId, targetLabel } from '../shared/providers'
import type { Attachment, Conversation, ModelChoice, ReplyPart, Settings } from '../shared/types'
import { extractArtifacts, formatBytes } from '../lib/artifacts'
import {
  ATTACHMENT_ACCEPT,
  MAX_ATTACHMENTS,
  attachmentDataUrl,
  isTotalTooLong,
  readAttachment,
} from '../lib/attachments'
import type { AttachmentError } from '../lib/attachments'
import { useI18n } from '../lib/i18n'
import { availableProviders, hasProviderKey } from '../lib/keys'
import { toast } from '../lib/toast'
import { Artifacts } from './Artifacts'
import { ModelMenu } from './ModelMenu'
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  FileIcon,
  MenuIcon,
  PaperclipIcon,
  RegenerateIcon,
  SearchIcon,
  SendIcon,
  SlidersIcon,
  SparklesIcon,
  StopIcon,
} from './icons'

// El motor de Markdown pesa más que toda la app: se carga aparte, cuando hace
// falta pintar una respuesta, y el primer arranque queda más ligero.
const Markdown = lazy(() => import('./Markdown').then((module) => ({ default: module.Markdown })))

export interface ChatComposerHandle {
  insert(text: string): void
  focus(): void
}

interface ChatViewProps {
  conversation: Conversation | null
  settings: Settings
  keys: Record<string, string>
  serverKeys: Record<string, boolean>
  hasAnyKey: boolean
  keysReady: boolean
  streaming: boolean
  online: boolean
  onSend(text: string, attachments: Attachment[]): void
  onStop(): void
  onRegenerate(turnId: string): void
  onSelectModel(choice: ModelChoice): void
  onToggleCompare(): void
  onOpenSettings(): void
  onOpenSidebar(): void
  onOpenSearch(): void
  onOpenPrompts(): void
  onExportMarkdown(conversation: Conversation): void
}

export const ChatView = forwardRef<ChatComposerHandle, ChatViewProps>(function ChatView(
  {
    conversation,
    settings,
    keys,
    serverKeys,
    hasAnyKey,
    keysReady,
    streaming,
    online,
    onSend,
    onStop,
    onRegenerate,
    onSelectModel,
    onToggleCompare,
    onOpenSettings,
    onOpenSidebar,
    onOpenSearch,
    onOpenPrompts,
    onExportMarkdown,
  },
  ref,
) {
  const { t, p } = useI18n()
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [attachError, setAttachError] = useState<string | null>(null)
  const [attachBusy, setAttachBusy] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const pinned = useRef(true)

  const turns = conversation?.turns ?? []
  const lastSignal = useMemo(() => {
    const last = turns[turns.length - 1]
    if (!last) return 0
    if (last.role === 'user') return last.content.length
    return last.parts.reduce((total, part) => total + part.content.length, 0)
  }, [turns])

  const suggestions = [
    t('chat.suggestion.1'),
    t('chat.suggestion.2'),
    t('chat.suggestion.3'),
    t('chat.suggestion.4'),
  ]

  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const onScroll = () => {
      pinned.current = element.scrollHeight - element.scrollTop - element.clientHeight < 140
    }
    element.addEventListener('scroll', onScroll, { passive: true })
    return () => element.removeEventListener('scroll', onScroll)
  }, [])

  // Un chat vacío empieza arriba; una conversación con mensajes, al final.
  useEffect(() => {
    pinned.current = true
  }, [conversation?.id])

  useEffect(() => {
    const element = scroller.current
    if (!element) return
    if (!turns.length) {
      element.scrollTop = 0
      return
    }
    if (pinned.current) element.scrollTop = element.scrollHeight
  }, [lastSignal, conversation?.id, turns.length])

  useEffect(() => {
    const element = textarea.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 216)}px`
  }, [text])

  useEffect(() => {
    setAttachments([])
    setAttachError(null)
  }, [conversation?.id])

  useImperativeHandle(
    ref,
    () => ({
      insert(value: string) {
        setText((previous) => {
          if (!previous.trim()) return value
          return previous.endsWith('\n') ? `${previous}${value}` : `${previous}\n\n${value}`
        })
        window.setTimeout(() => textarea.current?.focus(), 20)
      },
      focus() {
        textarea.current?.focus()
      },
    }),
    [],
  )

  const errorMessage = (reason: AttachmentError): string => {
    switch (reason) {
      case 'tooLarge':
        return t('chat.attachError.tooLarge')
      case 'unsupported':
        return t('chat.attachError.unsupported')
      default:
        return t('chat.attachError.unreadable')
    }
  }

  const addFiles = async (files: File[]) => {
    if (!files.length) return
    setAttachBusy(true)
    let failure: string | null = null
    const accepted: Attachment[] = []
    let current = attachments

    for (const file of files) {
      if (current.length + accepted.length >= MAX_ATTACHMENTS) {
        failure = t('chat.attachError.tooMany')
        break
      }
      const result = await readAttachment(file)
      if (!result.ok) {
        failure = errorMessage(result.reason)
        continue
      }
      if (isTotalTooLong([...current, ...accepted], result.attachment)) {
        failure = t('chat.attachError.total')
        continue
      }
      accepted.push(result.attachment)
    }

    if (accepted.length) {
      current = [...current, ...accepted]
      setAttachments(current)
    }
    setAttachError(failure)
    setAttachBusy(false)
    if (fileInput.current) fileInput.current.value = ''
  }

  const copy = async (part: ReplyPart) => {
    try {
      await navigator.clipboard.writeText(part.content)
      setCopied(part.id)
      toast(t('toast.copied'), 'ok')
      window.setTimeout(() => setCopied((current) => (current === part.id ? null : current)), 1400)
    } catch {
      // Portapapeles bloqueado por el navegador.
    }
  }

  const submit = () => {
    const value = text.trim()
    if ((!value && !attachments.length) || streaming) return
    if (!keysReady) {
      toast(t('chat.keysChecking'), 'ok')
      return
    }
    if (!hasAnyKey) {
      toast(t('chat.noKey'), 'error')
      onOpenSettings()
      return
    }
    setText('')
    const files = attachments
    setAttachments([])
    setAttachError(null)
    pinned.current = true
    onSend(value, files)
  }

  const activeProvider = providerById(settings.provider)
  const available = availableProviders(keys, serverKeys)
  const alternative = settings.compare
    ? undefined
    : PROVIDERS.find(
        (provider) => provider.id !== settings.provider && available.includes(provider.id),
      )
  const missingKey =
    keysReady && !settings.compare && !hasProviderKey(settings.provider, keys, serverKeys)
  const compareMissing =
    keysReady &&
    settings.compare &&
    settings.compareModels.some((slot) => !hasProviderKey(slot.provider, keys, serverKeys))

  const compareTargets = settings.compareModels
  const firstCompare = compareTargets[0]
  const apiValue = settings.compare
    ? firstCompare
      ? targetLabel(firstCompare.provider, firstCompare.model) +
        (compareTargets.length > 1 ? ' +' + (compareTargets.length - 1) : '')
      : p('chat.compareModels', 0)
    : targetLabel(settings.provider, settings.model)
  const apiTitle = settings.compare
    ? compareTargets.map((slot) => targetLabel(slot.provider, slot.model)).join(' · ')
    : apiValue
  const keyReady = settings.compare
    ? compareTargets.length > 0 &&
      compareTargets.every((slot) => hasProviderKey(slot.provider, keys, serverKeys))
    : hasProviderKey(settings.provider, keys, serverKeys)
  const keyState = !keysReady ? 'checking' : keyReady ? 'ok' : 'missing'
  const keyLabel = !keysReady
    ? t('chat.keysChecking')
    : settings.compare
      ? keyReady
        ? t('chat.keysReady')
        : t('chat.keyMissing')
      : keys[settings.provider]
        ? t('chat.keySaved')
        : serverKeys[settings.provider]
          ? t('chat.keyServer')
          : t('chat.keyMissing')

  const statusLabel = (part: ReplyPart): string => {
    switch (part.status) {
      case 'streaming':
        return t('status.streaming')
      case 'done':
        return part.ms ? `${(part.ms / 1000).toFixed(1)} s` : t('status.done')
      case 'stopped':
        return t('status.stopped')
      case 'error':
        return t('status.error')
      default:
        return ''
    }
  }

  return (
    <main className="chat">
      <header className="chat-head">
        <button type="button" className="icon-btn only-mobile" onClick={onOpenSidebar} aria-label={t('chat.openSidebar')}>
          <MenuIcon />
        </button>
        <div className="chat-title">
          <strong>{conversation?.title ?? t('chat.newChat')}</strong>
          <span className="chat-sub">
            {settings.compare
              ? p('chat.compareModels', settings.compareModels.length)
              : targetLabel(settings.provider, settings.model)}
            {!online ? ` · ${t('sidebar.offline')}` : ''}
          </span>
        </div>
        <div className="head-actions">
          <button
            type="button"
            className="icon-btn head-search"
            onClick={onOpenSearch}
            aria-label={t('chat.searchAria')}
            title={t('search.title')}
          >
            <SearchIcon />
          </button>
          <button
            type="button"
            className={`chip${settings.compare ? ' on' : ''}`}
            onClick={onToggleCompare}
            title={t('chat.compareTitle')}
          >
            {t('chat.compare')}
          </button>
          <ModelMenu value={{ provider: settings.provider, model: settings.model }} keys={keys} onChange={onSelectModel} />
          {conversation && conversation.turns.length > 0 ? (
            <button
              type="button"
              className="icon-btn"
              onClick={() => onExportMarkdown(conversation)}
              aria-label={t('chat.exportAria')}
              title={t('chat.exportTitle')}
            >
              <DownloadIcon />
            </button>
          ) : null}
          <button type="button" className="icon-btn" onClick={onOpenSettings} aria-label={t('chat.settingsAria')}>
            <SlidersIcon />
          </button>
        </div>
      </header>

      <div className="api-model-bar" aria-live="polite">
        <span className="dot" style={{ background: activeProvider?.color ?? 'var(--muted)' }} />
        <span className="api-model-label">{t('chat.apiModel')}</span>
        <strong className="api-model-value" title={apiTitle}>
          {apiValue}
        </strong>
        <span className={`api-model-state ${keyState}`}>{keyLabel}</span>
      </div>

      {(missingKey || compareMissing) && (
        <div className="notice">
          <span>
            {compareMissing
              ? t('chat.missingCompareKey')
              : t('chat.missingKey', { provider: activeProvider?.name ?? settings.provider })}
            {missingKey && alternative
              ? ' ' + t('chat.savedKeyAvailable', { provider: alternative.name })
              : ''}
          </span>
          <div className="notice-actions">
            {missingKey && alternative ? (
              <button
                type="button"
                className="notice-btn ghost"
                onClick={() =>
                  onSelectModel({
                    provider: alternative.id,
                    model: alternative.models[0] ?? settings.model,
                  })
                }
              >
                {t('chat.useProvider', { provider: alternative.name })}
              </button>
            ) : null}
            <button type="button" className="notice-btn" onClick={onOpenSettings}>
              {t('chat.addKey')}
            </button>
          </div>
        </div>
      )}

      <div className="messages" ref={scroller}>
        {turns.length === 0 ? (
          <div className="empty">
            <div className="empty-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 4v16M4 12h16M6.5 6.5l11 11M17.5 6.5l-11 11" />
              </svg>
            </div>
            <span className="empty-badge">{t('settings.about.by')}</span>
            <h1>{t('chat.emptyTitle')}</h1>
            <p>{t('chat.emptyBody')}</p>
            <div className="empty-meta">
              <span>{t('empty.meta.private')}</span>
              <span>{t('empty.meta.multi')}</span>
              <span>{t('empty.meta.bilingual')}</span>
            </div>
            <div className="suggestions">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="suggestion"
                  onClick={() => {
                    setText(suggestion)
                    textarea.current?.focus()
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <p className="empty-hint">{t('chat.shortcutsHint')}</p>
          </div>
        ) : (
          <div className="thread">
            {turns.map((turn) =>
              turn.role === 'user' ? (
                <div key={turn.id} className="turn user">
                  <div className="user-block">
                    {turn.attachments?.some((file) => file.kind === 'image') ? (
                      <div className="bubble-images" aria-label={t('chat.filesLabel')}>
                        {turn.attachments
                          .filter((file) => file.kind === 'image')
                          .map((file) => (
                            <img
                              key={file.id}
                              className="bubble-image"
                              src={attachmentDataUrl(file)}
                              alt={file.name}
                              loading="lazy"
                            />
                          ))}
                      </div>
                    ) : null}
                    {turn.attachments?.some((file) => file.kind !== 'image') ? (
                      <div className="bubble-files" aria-label={t('chat.filesLabel')}>
                        {turn.attachments
                          .filter((file) => file.kind !== 'image')
                          .map((file) => (
                            <span
                              className="file-pill"
                              key={file.id}
                              title={file.kind === 'file' ? t('chat.attachmentUnreadable') : file.name}
                            >
                              <FileIcon size={12} />
                              <span>{file.name}</span>
                            </span>
                          ))}
                      </div>
                    ) : null}
                    {turn.content ? <div className="bubble">{turn.content}</div> : null}
                  </div>
                </div>
              ) : (
                <div key={turn.id} className={`turn assistant parts-${Math.min(turn.parts.length, 3)}`}>
                  {turn.parts.map((part) => {
                    const provider = providerById(part.provider)
                    const artifacts =
                      part.status === 'streaming' ? [] : extractArtifacts(part.content, conversation?.title ?? 'nexo')
                    return (
                      <article key={part.id} className="part" data-status={part.status}>
                        <header className="part-head">
                          <span className="dot" style={{ background: provider?.color ?? 'var(--muted)' }} />
                          <span className="part-name">{provider?.name ?? part.provider}</span>
                          <span className="part-model" title={part.model}>
                            {shortModelId(part.model)}
                          </span>
                          <span className="part-meta">{statusLabel(part)}</span>
                          <span className="part-tools">
                            <button
                              type="button"
                              onClick={() => void copy(part)}
                              aria-label={t('chat.copyAria')}
                              title={t('chat.copyTitle')}
                            >
                              {copied === part.id ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRegenerate(turn.id)}
                              aria-label={t('chat.regenerateAria')}
                              title={t('chat.regenerateTitle')}
                            >
                              <RegenerateIcon size={14} />
                            </button>
                          </span>
                        </header>
                        <div className="part-body">
                          {part.content ? (
                            <Suspense fallback={<p className="md-plain">{part.content}</p>}>
                              <Markdown text={part.content} />
                            </Suspense>
                          ) : null}
                          {!part.content && part.status === 'streaming' ? (
  <span className="thinking" role="status" aria-live="polite">
    <span className="thinking-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
    {t('chat.thinking')}
  </span>
) : null}
                          {part.status === 'streaming' && part.content ? <span className="caret" aria-hidden="true" /> : null}
                          <Artifacts items={artifacts} />
                          {part.error ? <p className="part-error">{part.error}</p> : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <div className="composer-wrap">
        <div
          className={`composer${dragging ? ' dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDragging(false)
            void addFiles(Array.from(event.dataTransfer.files))
          }}
        >
          {attachments.length ? (
            <div className="attachments" aria-label={t('chat.filesLabel')}>
              {attachments.map((file) => (
                <span className="attachment" key={file.id}>
                  {file.kind === 'image' ? (
                    <img className="attachment-thumb" src={attachmentDataUrl(file)} alt="" />
                  ) : (
                    <FileIcon size={13} />
                  )}
                  <span className="attachment-name" title={file.name}>
                    {file.name}
                  </span>
                  <span className="attachment-size">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((current) => current.filter((item) => item.id !== file.id))}
                    aria-label={t('chat.attachRemove', { name: file.name })}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          {attachError ? <p className="attach-error">{attachError}</p> : null}

          <textarea
            ref={textarea}
            value={text}
            rows={1}
            placeholder={streaming ? t('chat.placeholderBusy') : t('chat.placeholderIdle')}
            onChange={(event) => setText(event.target.value)}
            onPaste={(event) => {
              const files = Array.from(event.clipboardData.files)
              if (files.length) void addFiles(files)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey) return
              if (!settings.sendOnEnter && !event.metaKey && !event.ctrlKey) return
              event.preventDefault()
              submit()
            }}
          />

          <div className="composer-actions">
            <div className="composer-tools">
              <button
                type="button"
                className="tool-btn"
                onClick={() => fileInput.current?.click()}
                aria-label={t('chat.attachAria')}
                title={t('chat.attachTitle')}
                disabled={attachBusy}
              >
                <PaperclipIcon size={16} />
              </button>
              <button
                type="button"
                className="tool-btn"
                onClick={onOpenPrompts}
                aria-label={t('chat.promptsAria')}
                title={t('chat.promptsTitle')}
              >
                <SparklesIcon size={16} />
              </button>
              <button
                type="button"
                className="tool-btn only-wide"
                onClick={onOpenSearch}
                aria-label={t('chat.searchAria')}
                title={t('search.title')}
              >
                <SearchIcon size={16} />
              </button>
              <span className="composer-hint">
                {text.length > 0 ? `${p('chat.characters', text.length)} · ` : ''}
                {attachments.length ? `${p('chat.attachments', attachments.length)} · ` : ''}
                {settings.sendOnEnter ? t('chat.enterSends') : t('chat.ctrlEnterSends')}
              </span>
            </div>
            {streaming ? (
              <button type="button" className="send stop" onClick={onStop} aria-label={t('chat.stopAria')}>
                <StopIcon size={16} />
              </button>
            ) : (
              <button
                type="button"
                className="send"
                onClick={submit}
                  disabled={(!text.trim() && !attachments.length) || !online || !keysReady}
                aria-label={t('chat.sendAria')}
                title={
                  !online
                    ? t('sidebar.offline')
                    : !keysReady
                      ? t('chat.keysChecking')
                      : t('chat.sendAria')
                }
              >
                <SendIcon size={17} />
              </button>
            )}
          </div>

          <input
            ref={fileInput}
            type="file"
            accept={ATTACHMENT_ACCEPT}
            multiple
            hidden
            onChange={(event) => void addFiles(Array.from(event.target.files ?? []))}
          />
        </div>
        <p className="legal">{t('chat.legal')}</p>
      </div>
    </main>
  )
})
