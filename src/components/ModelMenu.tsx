import { useEffect, useMemo, useRef, useState } from 'react'
import { PROVIDERS, providerById, shortModelId, targetLabel } from '../shared/providers'
import type { ModelChoice } from '../shared/types'
import { fetchModels } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { PlusIcon } from './icons'

interface ModelMenuProps {
  value: ModelChoice
  keys: Record<string, string>
  onChange(choice: ModelChoice): void
}

export function ModelMenu({ value, keys, onChange }: ModelMenuProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [extra, setExtra] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return PROVIDERS.map((provider) => {
      const models = Array.from(new Set([...provider.models, ...(extra[provider.id] ?? [])]))
      const filtered = needle
        ? models.filter((model) => `${provider.name} ${model}`.toLowerCase().includes(needle))
        : models
      return { provider, models: filtered }
    }).filter((group) => group.models.length > 0)
  }, [extra, query])

  const loadRealModels = async () => {
    setLoading(true)
    const results: Record<string, string[]> = {}
    await Promise.all(
      PROVIDERS.map(async (provider) => {
        if (!keys[provider.id]) return
        try {
          results[provider.id] = await fetchModels(provider.id, keys[provider.id])
        } catch {
          // Si una clave falla, seguimos con las demás.
        }
      }),
    )
    setExtra((previous) => ({ ...previous, ...results }))
    setLoading(false)
  }

  const current = providerById(value.provider)

  return (
    <div className="model-menu" ref={root}>
      <button
        type="button"
        className="model-btn"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={targetLabel(value.provider, value.model)}
      >
        <span className="dot" style={{ background: current?.color ?? 'var(--muted)' }} />
        <span className="model-btn-text">{shortModelId(value.model)}</span>
        <span className="model-btn-provider">{current?.name ?? value.provider}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div className="popover" role="listbox">
          <input
            className="pop-search"
            placeholder={t('models.search')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
          <div className="pop-list">
            {groups.map(({ provider, models }) => (
              <div key={provider.id} className="pop-group">
                <p className="pop-group-title">
                  <span className="dot" style={{ background: provider.color }} />
                  {provider.name}
                </p>
                {models.map((model) => {
                  const selected = provider.id === value.provider && model === value.model
                  return (
                    <button
                      key={`${provider.id}:${model}`}
                      type="button"
                      className={`pop-item${selected ? ' active' : ''}`}
                      onClick={() => {
                        onChange({ provider: provider.id, model })
                        setOpen(false)
                      }}
                    >
                      <span className="pop-item-model">{model}</span>
                      {selected ? <span className="pop-item-tick">✓</span> : null}
                    </button>
                  )
                })}
              </div>
            ))}
            {groups.length === 0 ? <p className="pop-empty">{t('models.noResults', { query })}</p> : null}
          </div>
          <button type="button" className="pop-footer" onClick={() => void loadRealModels()} disabled={loading}>
            <PlusIcon size={14} />
            {loading ? t('models.loading') : t('models.loadReal')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
