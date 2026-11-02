import { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react'
import { providerById, shortModelId, targetLabel } from '../shared/providers'
import type { Conversation, ModelChoice, ReplyPart, Settings } from '../shared/types'
import { extractArtifacts } from '../lib/artifacts'
import { Artifacts } from './Artifacts'
import { ModelMenu } from './ModelMenu'
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  MenuIcon,
  RegenerateIcon,
  SendIcon,
  SlidersIcon,
  StopIcon,
} from './icons'

// El motor de Markdown pesa más que toda la app: se carga aparte, cuando hace
// falta pintar una respuesta, y el primer arranque queda más ligero.
const Markdown = lazy(() => import('./Markdown').then((module) => ({ default: module.Markdown })))

const SUGGESTIONS = [
  'Explícame cómo funciona el interés compuesto con un ejemplo rápido.',
  'Redacta un correo amable reclamando una factura pendiente.',
  'Dame una rutina de 20 minutos sin material para casa.',
  'Compara las ventajas de PostgreSQL y SQLite para una app pequeña.',
]

interface ChatViewProps {
  conversation: Conversation | null
  settings: Settings
  keys: Record<string, string>
  serverKeys: Record<string, boolean>
  streaming: boolean
  onSend(text: string): void
  onStop(): void
  onRegenerate(turnId: string): void
  onSelectModel(choice: ModelChoice): void
  onToggleCompare(): void
  onOpenSettings(): void
  onOpenSidebar(): void
  onExportMarkdown(conversation: Conversation): void
}

function statusLabel(part: ReplyPart): string {
  switch (part.status) {
    case 'streaming':
      return 'escribiendo…'
    case 'done':
      return part.ms ? `${(part.ms / 1000).toFixed(1)} s` : 'listo'
    case 'stopped':
      return 'detenido'
    case 'error':
      return 'error'
    default:
      return ''
  }
}

export function ChatView({
  conversation,
  settings,
  keys,
  serverKeys,
  streaming,
  onSend,
  onStop,
  onRegenerate,
  onSelectModel,
  onToggleCompare,
  onOpenSettings,
  onOpenSidebar,
  onExportMarkdown,
}: ChatViewProps) {
  const [text, setText] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const textarea = useRef<HTMLTextAreaElement>(null)
  const pinned = useRef(true)

  const turns = conversation?.turns ?? []
  const lastSignal = useMemo(() => {
    const last = turns[turns.length - 1]
    if (!last) return 0
    if (last.role === 'user') return last.content.length
    return last.parts.reduce((total, part) => total + part.content.length, 0)
  }, [turns])

  useEffect(() => {
    const element = scroller.current
    if (!element) return
    const onScroll = () => {
      pinned.current = element.scrollHeight - element.scrollTop - element.clientHeight < 140
    }
    element.addEventListener('scroll', onScroll, { passive: true })
    return () => element.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const element = scroller.current
    if (element && pinned.current) element.scrollTop = element.scrollHeight
  }, [lastSignal, conversation?.id])

  useEffect(() => {
    const element = textarea.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 216)}px`
  }, [text])

  const copy = async (part: ReplyPart) => {
    try {
      await navigator.clipboard.writeText(part.content)
      setCopied(part.id)
      window.setTimeout(() => setCopied((current) => (current === part.id ? null : current)), 1400)
    } catch {
      // Portapapeles bloqueado por el navegador.
    }
  }

  const submit = () => {
    const value = text.trim()
    if (!value || streaming) return
    setText('')
    pinned.current = true
    onSend(value)
  }

  const activeProvider = providerById(settings.provider)
  const missingKey = !settings.compare && !keys[settings.provider] && !serverKeys[settings.provider]
  const compareMissing =
    settings.compare &&
    settings.compareModels.some((slot) => !keys[slot.provider] && !serverKeys[slot.provider])

  return (
    <main className="chat">
      <header className="chat-head">
        <button type="button" className="icon-btn only-mobile" onClick={onOpenSidebar} aria-label="Abrir chats">
          <MenuIcon />
        </button>
        <div className="chat-title">
          <strong>{conversation?.title ?? 'Nuevo chat'}</strong>
          <span className="chat-sub">
            {settings.compare
              ? `${settings.compareModels.length} modelos en paralelo`
              : targetLabel(settings.provider, settings.model)}
          </span>
        </div>
        <div className="head-actions">
          <button
            type="button"
            className={`chip${settings.compare ? ' on' : ''}`}
            onClick={onToggleCompare}
            title="Enviar cada pregunta a varios modelos a la vez"
          >
            Comparar
          </button>
          <ModelMenu value={{ provider: settings.provider, model: settings.model }} keys={keys} onChange={onSelectModel} />
          {conversation && conversation.turns.length > 0 ? (
            <button
              type="button"
              className="icon-btn"
              onClick={() => onExportMarkdown(conversation)}
              aria-label="Exportar conversación"
              title="Exportar como Markdown"
            >
              <DownloadIcon />
            </button>
          ) : null}
          <button type="button" className="icon-btn" onClick={onOpenSettings} aria-label="Ajustes">
            <SlidersIcon />
          </button>
        </div>
      </header>

      {(missingKey || compareMissing) && (
        <div className="notice">
          <span>
            {compareMissing
              ? 'Alguno de los modelos comparados no tiene clave asignada.'
              : `Falta la clave de ${activeProvider?.name ?? settings.provider} para hablar con este modelo.`}
          </span>
          <button type="button" className="notice-btn" onClick={onOpenSettings}>
            Añadir clave
          </button>
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
            <h1>Un chat, todos los modelos.</h1>
            <p>Cambia de proveedor sin cambiar de conversación. O compara respuestas en paralelo y quédate con la mejor.</p>
            <div className="suggestions">
              {SUGGESTIONS.map((suggestion) => (
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
          </div>
        ) : (
          <div className="thread">
            {turns.map((turn) =>
              turn.role === 'user' ? (
                <div key={turn.id} className="turn user">
                  <div className="bubble">{turn.content}</div>
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
                            <button type="button" onClick={() => void copy(part)} aria-label="Copiar respuesta" title="Copiar">
                              {copied === part.id ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => onRegenerate(turn.id)}
                              aria-label="Regenerar respuesta"
                              title="Regenerar"
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
                          {!part.content && part.status === 'streaming' ? <span className="thinking">Pensando…</span> : null}
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
        <div className="composer">
          <textarea
            ref={textarea}
            value={text}
            rows={1}
            placeholder={streaming ? 'Esperando respuesta…' : 'Escribe lo que necesites…'}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' || event.shiftKey) return
              if (!settings.sendOnEnter && !event.metaKey && !event.ctrlKey) return
              event.preventDefault()
              submit()
            }}
          />
          <div className="composer-actions">
            <span className="composer-hint">
              {text.length > 0 ? `${text.length} caracteres · ` : ''}
              {settings.sendOnEnter ? 'Enter envía · Shift+Enter salto' : 'Ctrl/⌘+Enter envía'}
            </span>
            {streaming ? (
              <button type="button" className="send stop" onClick={onStop} aria-label="Detener respuesta">
                <StopIcon size={16} />
              </button>
            ) : (
              <button type="button" className="send" onClick={submit} disabled={!text.trim()} aria-label="Enviar">
                <SendIcon size={17} />
              </button>
            )}
          </div>
        </div>
        <p className="legal">
          Nexo no guarda tus claves ni tus conversaciones en ningún servidor. Todo vive en este navegador.
        </p>
      </div>
    </main>
  )
}
