import { useEffect, useMemo, useRef, useState } from 'react'
import { searchConversations } from '../lib/search'
import type { SearchHit } from '../lib/search'
import type { Conversation } from '../shared/types'
import { useI18n } from '../lib/i18n'
import { CloseIcon, SearchIcon } from './icons'

interface SearchOverlayProps {
  open: boolean
  conversations: Conversation[]
  onClose(): void
  onSelect(conversationId: string): void
}

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLowerCase()
  if (!needle) return <>{text}</>
  const index = text.toLowerCase().indexOf(needle)
  if (index === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  )
}

export function SearchOverlay({ open, conversations, onClose, onSelect }: SearchOverlayProps) {
  const { t, p } = useI18n()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30)
    return () => window.clearTimeout(timer)
  }, [open])

  const results = useMemo(() => searchConversations(conversations, query), [conversations, query])

  if (!open) return null

  const openHit = (hit: SearchHit) => {
    onSelect(hit.conversationId)
    onClose()
  }

  return (
    <div className="overlay search-overlay" role="presentation" onMouseDown={onClose}>
      <div className="search-panel" role="dialog" aria-modal="true" aria-label={t('search.title')} onMouseDown={(event) => event.stopPropagation()}>
        <div className="search-top">
          <SearchIcon size={17} />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('search.placeholder')}
            aria-label={t('search.placeholder')}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
              } else if (event.key === 'Enter') {
                const first = results[0]
                if (first) openHit(first)
              }
            }}
          />
          {query ? <span className="search-count">{p('search.results', results.length)}</span> : null}
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <CloseIcon size={15} />
          </button>
        </div>

        <div className="search-results">
          {!query.trim() ? <p className="search-empty">{t('search.empty')}</p> : null}
          {query.trim() && results.length === 0 ? (
            <p className="search-empty">{t('search.noResults', { query: query.trim() })}</p>
          ) : null}
          {results.map((hit) => (
            <button key={hit.key} type="button" className="search-hit" onClick={() => openHit(hit)}>
              <span className="search-hit-head">
                <span className={`search-kind ${hit.kind}`}>{t(`search.kind.${hit.kind}`)}</span>
                <span className="search-conv">{hit.conversationTitle}</span>
              </span>
              <span className="search-hit-text">
                <Highlight text={hit.text} query={query} />
              </span>
            </button>
          ))}
        </div>

        <div className="search-foot">
          <span>{t('search.hint')}</span>
          <span>{conversations.length}</span>
        </div>
      </div>
    </div>
  )
}
