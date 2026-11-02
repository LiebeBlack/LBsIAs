import { useEffect, useMemo, useRef, useState } from 'react'
import { formatAgo, isStreaming } from '../lib/store'
import type { Conversation } from '../shared/types'
import { CloseIcon, PencilIcon, PlusIcon, SearchIcon, SlidersIcon, TrashIcon } from './icons'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  open: boolean
  keyCount: number
  onSelect(id: string): void
  onNew(): void
  onDelete(id: string): void
  onRename(id: string, title: string): void
  onOpenSettings(): void
  onClose(): void
}

export function Sidebar({
  conversations,
  activeId,
  open,
  keyCount,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onOpenSettings,
  onClose,
}: SidebarProps) {
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId) inputRef.current?.focus()
  }, [editingId])

  // Mantiene «hace 5 min» al día sin recargar.
  const [, setTick] = useState(0)
  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    const list = needle
      ? conversations.filter((conversation) => conversation.title.toLowerCase().includes(needle))
      : conversations
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt)
  }, [conversations, query])

  const commitRename = () => {
    if (editingId) onRename(editingId, draft)
    setEditingId(null)
  }

  return (
    <>
      <div className={`scrim${open ? ' show' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <div className="side-head">
          <a className="brand" href="/">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M12 4v16M4 12h16M6.5 6.5l11 11M17.5 6.5l-11 11" />
              </svg>
            </span>
            <span className="brand-name">
              Nexo
              <small>todos los modelos</small>
            </span>
          </a>
          <button type="button" className="icon-btn only-mobile" onClick={onClose} aria-label="Cerrar menú">
            <CloseIcon />
          </button>
        </div>

        <button type="button" className="btn-new" onClick={onNew}>
          <PlusIcon size={16} />
          Nueva conversación
        </button>

        <label className="search">
          <SearchIcon size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar chats"
            aria-label="Buscar conversaciones"
          />
        </label>

        <nav className="conv-list" aria-label="Conversaciones">
          {filtered.map((conversation) => {
            const busy = isStreaming(conversation.turns)
            const isActive = conversation.id === activeId
            return (
              <div
                key={conversation.id}
                className={`conv${isActive ? ' active' : ''}`}
                role="button"
                tabIndex={0}
                aria-current={isActive ? 'true' : undefined}
                onClick={() => onSelect(conversation.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onSelect(conversation.id)
                  }
                }}
                onDoubleClick={() => {
                  setEditingId(conversation.id)
                  setDraft(conversation.title)
                }}
              >
                {editingId === conversation.id ? (
                  <input
                    ref={inputRef}
                    className="conv-input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') commitRename()
                      if (event.key === 'Escape') setEditingId(null)
                    }}
                    onClick={(event) => event.stopPropagation()}
                  />
                ) : (
                  <>
                    <span className="conv-title">
                      {busy ? <span className="conv-dot" aria-label="Respondiendo" /> : null}
                      {conversation.title}
                    </span>
                    <span className="conv-meta">
                      {conversation.turns.length ? `${Math.ceil(conversation.turns.length / 2)} turnos` : 'vacío'}
                      {' · '}
                      {busy ? 'escribiendo…' : formatAgo(conversation.updatedAt)}
                    </span>
                    <span className="conv-actions">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setEditingId(conversation.id)
                          setDraft(conversation.title)
                        }}
                        aria-label={`Renombrar ${conversation.title}`}
                      >
                        <PencilIcon size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDelete(conversation.id)
                        }}
                        aria-label={`Eliminar ${conversation.title}`}
                      >
                        <TrashIcon size={13} />
                      </button>
                    </span>
                  </>
                )}
              </div>
            )
          })}
          {filtered.length === 0 ? <p className="conv-empty">Aún no hay chats.</p> : null}
        </nav>

        <div className="side-foot">
          <button type="button" className="foot-btn" onClick={onOpenSettings}>
            <SlidersIcon size={16} />
            <span>Ajustes</span>
            <span className={keyCount ? 'badge ok' : 'badge'}>{keyCount ? `${keyCount} claves` : 'sin claves'}</span>
          </button>
          <p className="foot-note">Tus claves viven en este navegador. Nunca se guardan en el servidor.</p>
        </div>
      </aside>
    </>
  )
}
