import { useEffect, useMemo, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { CommandIcon } from './icons'

export interface PaletteItem {
  id: string
  label: string
  group: string
  hint?: string
  keywords?: string
  run(): void
}

interface CommandPaletteProps {
  open: boolean
  items: PaletteItem[]
  onClose(): void
}

export function CommandPalette({ open, items, onClose }: CommandPaletteProps) {
  const { t } = useI18n()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setQuery('')
    setActive(0)
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    const scored = items
      .map((item) => {
        const haystack = `${item.label} ${item.keywords ?? ''} ${item.group}`.toLowerCase()
        const index = haystack.indexOf(needle)
        return index === -1 ? null : { item, score: index }
      })
      .filter((entry): entry is { item: PaletteItem; score: number } => entry !== null)
      .sort((a, b) => a.score - b.score)
    return scored.map((entry) => entry.item)
  }, [items, query])

  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector('.palette-item.active')
    node?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  if (!open) return null

  const choose = (item: PaletteItem) => {
    onClose()
    item.run()
  }

  let lastGroup = ''

  return (
    <div className="overlay palette-overlay" role="presentation" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label={t('palette.title')}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="palette-head">
          <CommandIcon size={16} />
          <input
            className="palette-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('palette.placeholder')}
            aria-label={t('palette.placeholder')}
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
              } else if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActive((current) => (filtered.length ? (current + 1) % filtered.length : 0))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActive((current) => (filtered.length ? (current - 1 + filtered.length) % filtered.length : 0))
              } else if (event.key === 'Enter') {
                event.preventDefault()
                const item = filtered[active]
                if (item) choose(item)
              }
            }}
          />
          <kbd>Esc</kbd>
        </div>

        <div className="palette-list" ref={listRef}>
          {filtered.length === 0 ? <p className="palette-empty">{t('palette.empty', { query })}</p> : null}
          {filtered.map((item, index) => {
            const heading = item.group !== lastGroup ? item.group : null
            lastGroup = item.group
            return (
              <div key={item.id}>
                {heading ? <p className="palette-group-title">{heading}</p> : null}
                <button
                  type="button"
                  className={`palette-item${index === active ? ' active' : ''}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(item)}
                >
                  <span className="palette-item-label">{item.label}</span>
                  {item.hint ? <span className="palette-item-hint">{item.hint}</span> : null}
                </button>
              </div>
            )
          })}
        </div>

        <div className="palette-foot">
          <span>{t('palette.hint')}</span>
          <span className="palette-count">{filtered.length}</span>
        </div>
      </div>
    </div>
  )
}
