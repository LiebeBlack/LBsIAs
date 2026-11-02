import { useEffect, useMemo, useRef, useState } from 'react'
import { isStreaming } from '../lib/store'
import type { Conversation } from '../shared/types'
import { useI18n } from '../lib/i18n'
import {
  CloseIcon,
  CommandIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  SlidersIcon,
  SparklesIcon,
  TrashIcon,
} from './icons'

interface SidebarProps {
  conversations: Conversation[]
  activeId: string | null
  open: boolean
  keyCount: number
  promptCount: number
  online: boolean
  onSelect(id: string): void
  onNew(): void
  onDelete(id: string): void
  onRename(id: string, title: string): void
  onOpenSettings(): void
  onOpenSearch(): void
  onOpenPrompts(): void
  onOpenPalette(): void
  onClose(): void
}

export function Sidebar({
  conversations,
  activeId,
  open,
  keyCount,
  promptCount,
  online,
  onSelect,
  onNew,
  onDelete,
  onRename,
  onOpenSettings,
  onOpenSearch,
  onOpenPrompts,
  onOpenPalette,
  onClose,
}: SidebarProps) {
  const { t, p, ago } = useI18n()
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
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
                <path d="M12 4v16M4 12h16M6.5 6.5l11 11M17.5 6.5l-11 11" />
              </svg>
            </span>
            <span className="brand-name">
              Nexo
              <small>{t('app.tagline')}</small>
            </span>
          </a>
          <div className="side-head-actions">
            <button
              type="button"
              className="icon-btn"
              onClick={onOpenPalette}
              aria-label={t('sidebar.quickPalette')}
              title={`${t('sidebar.quickPalette')} · ⌘K`}
            >
              <CommandIcon size={16} />
            </button>
            <button type="button" className="icon-btn only-mobile" onClick={onClose} aria-label={t('sidebar.closeMenu')}>
              <CloseIcon />
            </button>
          </div>
        </div>

        <button type="button" className="btn-new" onClick={onNew}>
          <PlusIcon size={16} />
          {t('sidebar.newChat')}
        </button>

        <div className="side-tools">
          <button type="button" className="side-tool" onClick={onOpenSearch}>
            <SearchIcon size={15} />
            <span>{t('sidebar.quickSearch')}</span>
            <kbd>⌘⇧F</kbd>
          </button>
          <button type="button" className="side-tool" onClick={onOpenPrompts}>
            <SparklesIcon size={15} />
            <span>{t('sidebar.quickPrompts')}</span>
            <span className="badge">{promptCount}</span>
          </button>
        </div>

        <label className="search">
          <SearchIcon size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('sidebar.searchPlaceholder')}
            aria-label={t('sidebar.searchAria')}
          />
        </label>

        <div className="side-label">
          <span>{t('sidebar.conversationsAria')}</span>
          <span>{filtered.length}</span>
        </div>

        <nav className="conv-list" aria-label={t('sidebar.conversationsAria')}>
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
                      {busy ? <span className="conv-dot" aria-label={t('sidebar.responding')} /> : null}
                      {conversation.title}
                    </span>
                    <span className="conv-meta">
                      {conversation.turns.length
                        ? p('sidebar.turns', Math.ceil(conversation.turns.length / 2))
                        : t('sidebar.empty')}
                      {' · '}
                      {busy ? t('sidebar.writing') : ago(conversation.updatedAt)}
                    </span>
                    <span className="conv-actions">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setEditingId(conversation.id)
                          setDraft(conversation.title)
                        }}
                        aria-label={t('sidebar.renameAria', { title: conversation.title })}
                      >
                        <PencilIcon size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDelete(conversation.id)
                        }}
                        aria-label={t('sidebar.deleteAria', { title: conversation.title })}
                      >
                        <TrashIcon size={13} />
                      </button>
                    </span>
                  </>
                )}
              </div>
            )
          })}
          {filtered.length === 0 ? <p className="conv-empty">{t('sidebar.noChats')}</p> : null}
        </nav>

        <div className="side-foot">
          <span className={`conn-pill${online ? ' on' : ''}`}>
            <span className="conn-dot" aria-hidden="true" />
            {online ? t('sidebar.online') : t('sidebar.offline')}
          </span>
          <button type="button" className="foot-btn" onClick={onOpenSettings}>
            <SlidersIcon size={16} />
            <span>{t('sidebar.settings')}</span>
            <span className={keyCount ? 'badge ok' : 'badge'}>
              {keyCount ? p('sidebar.keys', keyCount) : t('sidebar.noKeys')}
            </span>
          </button>
          <p className="foot-note">{t('sidebar.footNote')}</p>
        </div>
      </aside>
    </>
  )
}
