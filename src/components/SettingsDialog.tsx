import { useEffect, useMemo, useState } from 'react'
import { PROVIDERS, providerById, shortModelId } from '../shared/providers'
import type { Conversation, ModelChoice, Settings, Theme } from '../shared/types'
import type { Prompt } from '../lib/prompts'
import type { LocalePreference } from '../shared/types'
import { APP_NAME, APP_VERSION } from '../shared/meta'
import { computeStats } from '../lib/stats'
import { fetchModels } from '../lib/api'
import { useI18n } from '../lib/i18n'
import { CloseIcon, DownloadIcon, EyeIcon, EyeOffIcon, GlobeIcon, TrashIcon, UploadIcon } from './icons'

const ACCENTS = ['#8b6cff', '#38e8c8', '#ff7a59', '#4d8dff', '#ff5f9e', '#ffc247']

type Tab = 'keys' | 'model' | 'appearance' | 'data' | 'about'

interface SettingsDialogProps {
  open: boolean
  settings: Settings
  keys: Record<string, string>
  serverKeys: Record<string, boolean>
  conversations: Conversation[]
  promptCount: number
  online: boolean
  installed: boolean
  canInstall: boolean
  onChange(patch: Partial<Settings>): void
  onKeys(next: Record<string, string>): void
  onClose(): void
  onClear(): void
  onExport(): void
  onExportStats(): void
  onImport(conversations: Conversation[], prompts: Prompt[]): void
  onInstall(): void
}

function duration(ms: number): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms} ms`
  return `${(ms / 1000).toFixed(1)} s`
}

export function SettingsDialog({
  open,
  settings,
  keys,
  serverKeys,
  conversations,
  promptCount,
  online,
  installed,
  canInstall,
  onChange,
  onKeys,
  onClose,
  onClear,
  onExport,
  onExportStats,
  onImport,
  onInstall,
}: SettingsDialogProps) {
  const { t, p, num, defaultSystem } = useI18n()
  const [tab, setTab] = useState<Tab>('keys')
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { ok: boolean; text: string }>>({})
  const [confirmClear, setConfirmClear] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)

  const stats = useMemo(() => computeStats(conversations), [conversations])
  const themes: Array<{ id: Theme; label: string }> = [
    { id: 'dark', label: t('settings.theme.dark') },
    { id: 'light', label: t('settings.theme.light') },
    { id: 'system', label: t('settings.theme.system') },
  ]
  const languages: Array<{ id: LocalePreference; label: string }> = [
    { id: 'auto', label: t('settings.language.auto') },
    { id: 'es', label: t('settings.language.es') },
    { id: 'en', label: t('settings.language.en') },
  ]

  useEffect(() => {
    if (!open) {
      setConfirmClear(false)
      setImportStatus(null)
      return
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const testKey = async (providerId: string) => {
    const provider = providerById(providerId)
    if (!provider) return
    if (!keys[providerId] && !serverKeys[providerId]) {
      setResults((previous) => ({
        ...previous,
        [providerId]: { ok: false, text: t('server.missingKey', { provider: provider.name }) },
      }))
      return
    }
    setTesting(providerId)
    try {
      const models = await fetchModels(providerId, keys[providerId] || undefined)
      const example = models[0] ? t('settings.keys.example', { model: models[0] }) : ''
      setResults((previous) => ({
        ...previous,
        [providerId]: { ok: true, text: `${p('settings.keys.available', models.length)}${example}` },
      }))
    } catch (error) {
      setResults((previous) => ({
        ...previous,
        [providerId]: { ok: false, text: error instanceof Error ? error.message : t('settings.keys.failed') },
      }))
    } finally {
      setTesting(null)
    }
  }

  const slots = settings.compareModels
  const updateSlot = (index: number, next: ModelChoice) => {
    onChange({ compareModels: slots.map((slot, position) => (position === index ? next : slot)) })
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const parsed = JSON.parse(await file.text()) as { conversations?: unknown; prompts?: unknown }
      const incoming = Array.isArray(parsed.conversations)
        ? (parsed.conversations.filter(
            (entry): entry is Conversation =>
              Boolean(entry) &&
              typeof (entry as Conversation).id === 'string' &&
              Array.isArray((entry as Conversation).turns),
          ) as Conversation[])
        : []
      const incomingPrompts = Array.isArray(parsed.prompts)
        ? (parsed.prompts.flatMap((entry) => {
            if (!entry || typeof entry !== 'object') return []
            const row = entry as Record<string, unknown>
            const title = typeof row.title === 'string' ? row.title.trim() : ''
            const body = typeof row.body === 'string' ? row.body.trim() : ''
            if (!title || !body) return []
            return [{ id: typeof row.id === 'string' ? row.id : `import-${title.slice(0, 12)}`, title, body }]
          }) as Prompt[])
        : []
      if (!incoming.length && !incomingPrompts.length) {
        setImportStatus(t('settings.data.invalidFile'))
        return
      }
      onImport(incoming, incomingPrompts)
      setImportStatus(p('settings.data.imported', incoming.length))
    } catch {
      setImportStatus(t('settings.data.unreadable'))
    }
  }

  const tabs: Array<[Tab, string]> = [
    ['keys', t('settings.tab.keys')],
    ['model', t('settings.tab.model')],
    ['appearance', t('settings.tab.appearance')],
    ['data', t('settings.tab.data')],
    ['about', t('settings.tab.about')],
  ]

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={t('settings.title')}>
      <div className="dialog">
        <header className="dialog-head">
          <div>
            <h2>{t('settings.title')}</h2>
            <p>{t('settings.subtitle')}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <CloseIcon />
          </button>
        </header>

        <nav className="tabs" role="tablist">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              className={`tab${tab === id ? ' active' : ''}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="dialog-body">
          {tab === 'keys' ? (
            <section className="stack">
              <p className="hint">{t('settings.keys.hint')}</p>
              {PROVIDERS.map((provider) => {
                const result = results[provider.id]
                const isRevealed = revealed[provider.id]
                return (
                  <div className="key-row" key={provider.id}>
                    <div className="key-head">
                      <span className="dot" style={{ background: provider.color }} />
                      <strong>{provider.name}</strong>
                      {serverKeys[provider.id] ? <span className="badge ok">{t('settings.keys.serverKey')}</span> : null}
                      <a href={provider.keyUrl} target="_blank" rel="noreferrer noopener">
                        {t('settings.keys.create')}
                      </a>
                    </div>
                    <div className="key-input">
                      <input
                        className="input"
                        type={isRevealed ? 'text' : 'password'}
                        value={keys[provider.id] ?? ''}
                        placeholder="sk-…"
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(event) => onKeys({ ...keys, [provider.id]: event.target.value })}
                      />
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setRevealed((previous) => ({ ...previous, [provider.id]: !previous[provider.id] }))}
                        aria-label={isRevealed ? t('settings.keys.hide') : t('settings.keys.show')}
                      >
                        {isRevealed ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                      </button>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => void testKey(provider.id)}
                        disabled={testing === provider.id}
                      >
                        {testing === provider.id ? t('settings.keys.testing') : t('settings.keys.test')}
                      </button>
                    </div>
                    {result ? <p className={`key-result ${result.ok ? 'ok' : 'bad'}`}>{result.text}</p> : null}
                  </div>
                )
              })}
            </section>
          ) : null}

          {tab === 'model' ? (
            <section className="stack">
              <label className="field">
                <span>{t('settings.system.label')}</span>
                <textarea
                  className="input area"
                  rows={5}
                  value={settings.system}
                  placeholder={defaultSystem}
                  onChange={(event) => onChange({ system: event.target.value })}
                />
                <small>{t('settings.system.hint')}</small>
              </label>
              <button type="button" className="btn small self-start" onClick={() => onChange({ system: '' })}>
                {t('settings.system.reset')}
              </button>

              <label className="field">
                <span>
                  {t('settings.temperature.label')} <em>{settings.temperature.toFixed(1)}</em>
                </span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={settings.temperature}
                  onChange={(event) => onChange({ temperature: Number(event.target.value) })}
                />
                <small>{t('settings.temperature.hint')}</small>
              </label>

              <label className="field">
                <span>{t('settings.maxTokens')}</span>
                <input
                  className="input narrow"
                  type="number"
                  min={64}
                  max={8192}
                  step={64}
                  value={settings.maxTokens}
                  onChange={(event) => onChange({ maxTokens: Number(event.target.value) })}
                />
              </label>

              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.sendOnEnter}
                  onChange={(event) => onChange({ sendOnEnter: event.target.checked })}
                />
                <span>{t('settings.sendOnEnter')}</span>
              </label>

              <div className="divider" />

              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.compare}
                  onChange={(event) => onChange({ compare: event.target.checked })}
                />
                <span>{t('settings.compare')}</span>
              </label>

              {settings.compare ? (
                <div className="slots">
                  {slots.map((slot, index) => {
                    const provider = providerById(slot.provider)
                    return (
                      <div className="slot" key={`${slot.provider}-${index}`}>
                        <select
                          className="input"
                          value={slot.provider}
                          onChange={(event) => {
                            const next = providerById(event.target.value)
                            if (!next) return
                            updateSlot(index, { provider: next.id, model: next.models[0] ?? slot.model })
                          }}
                        >
                          {PROVIDERS.map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.name}
                            </option>
                          ))}
                        </select>
                        <input
                          className="input"
                          value={slot.model}
                          list={`slot-models-${index}`}
                          spellCheck={false}
                          onChange={(event) => updateSlot(index, { provider: slot.provider, model: event.target.value })}
                        />
                        <datalist id={`slot-models-${index}`}>
                          {(provider?.models ?? []).map((model) => (
                            <option key={model} value={model} />
                          ))}
                        </datalist>
                        <button
                          type="button"
                          className="icon-btn"
                          onClick={() => onChange({ compareModels: slots.filter((_, position) => position !== index) })}
                          aria-label={t('settings.removeModelAria')}
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    )
                  })}
                  {slots.length < 3 ? (
                    <button
                      type="button"
                      className="btn self-start"
                      onClick={() =>
                        onChange({
                          compareModels: [...slots, { provider: 'google', model: 'gemini-2.5-flash' }],
                        })
                      }
                    >
                      {t('settings.addModel')}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {tab === 'appearance' ? (
            <section className="stack">
              <div className="field">
                <span>{t('settings.theme')}</span>
                <div className="seg">
                  {themes.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      className={settings.theme === theme.id ? 'active' : ''}
                      onClick={() => onChange({ theme: theme.id })}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <span>{t('settings.accent')}</span>
                <div className="swatches">
                  {ACCENTS.map((accent) => (
                    <button
                      key={accent}
                      type="button"
                      className={`swatch${settings.accent.toLowerCase() === accent ? ' active' : ''}`}
                      style={{ background: accent }}
                      onClick={() => onChange({ accent })}
                      aria-label={t('settings.accentAria', { color: accent })}
                    />
                  ))}
                  <label className="swatch custom" title={t('settings.customColor')}>
                    <input
                      type="color"
                      value={settings.accent}
                      onChange={(event) => onChange({ accent: event.target.value })}
                    />
                  </label>
                </div>
              </div>

              <div className="divider" />

              <div className="field">
                <span>
                  <GlobeIcon size={15} />
                  {t('settings.language')}
                </span>
                <div className="seg">
                  {languages.map((language) => (
                    <button
                      key={language.id}
                      type="button"
                      className={settings.locale === language.id ? 'active' : ''}
                      onClick={() => onChange({ locale: language.id })}
                    >
                      {language.label}
                    </button>
                  ))}
                </div>
                <small>{t('settings.language.hint')}</small>
              </div>
            </section>
          ) : null}

          {tab === 'data' ? (
            <section className="stack">
              <p className="hint">{p('settings.data.summary', conversations.length)}</p>

              <div className="stat-section">
                <p className="section-title">{t('settings.data.stats')}</p>
                <div className="stat-grid">
                  <div className="stat">
                    <span className="stat-value">{num(stats.conversations, 0)}</span>
                    <span className="stat-label">{t('settings.data.conversations')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{num(stats.userTurns, 0)}</span>
                    <span className="stat-label">{t('settings.data.turns')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{num(stats.replies, 0)}</span>
                    <span className="stat-label">{t('settings.data.replies')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{num(stats.characters, 0)}</span>
                    <span className="stat-label">{t('settings.data.characters')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{duration(stats.averageMs)}</span>
                    <span className="stat-label">{t('settings.data.avg')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{num(stats.models.length, 0)}</span>
                    <span className="stat-label">{t('settings.data.models')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{num(stats.providers.length, 0)}</span>
                    <span className="stat-label">{t('settings.data.providers')}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-value">{num(stats.attachments, 0)}</span>
                    <span className="stat-label">{t('settings.data.attachments')}</span>
                  </div>
                </div>
                <div className="stat-bars">
                  {stats.models.slice(0, 4).map((usage) => (
                    <div className="stat-bar" key={`${usage.provider}:${usage.model}`}>
                      <span className="stat-bar-label">{shortModelId(usage.model)}</span>
                      <span className="bar">
                        <span
                          className="bar-fill"
                          style={{ width: `${Math.round((usage.count / Math.max(1, stats.replies)) * 100)}%` }}
                        />
                      </span>
                      <span className="stat-bar-value">{usage.count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="row">
                <button type="button" className="btn" onClick={onExport}>
                  <DownloadIcon size={15} />
                  {t('settings.data.export')}
                </button>
                <button type="button" className="btn" onClick={onExportStats}>
                  {t('settings.data.exportStats')}
                </button>
                <label className="btn">
                  <UploadIcon size={15} />
                  {t('settings.data.import')}
                  <input
                    type="file"
                    accept="application/json,.json"
                    hidden
                    onChange={(event) => void handleFile(event.target.files?.[0])}
                  />
                </label>
              </div>
              {importStatus ? <p className="key-result ok">{importStatus}</p> : null}

              <div className="divider" />
              {confirmClear ? (
                <div className="row">
                  <button type="button" className="btn danger" onClick={onClear}>
                    {t('settings.data.confirm')}
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirmClear(false)}>
                    {t('settings.data.cancel')}
                  </button>
                </div>
              ) : (
                <button type="button" className="btn danger self-start" onClick={() => setConfirmClear(true)}>
                  <TrashIcon size={15} />
                  {t('settings.data.clear')}
                </button>
              )}
            </section>
          ) : null}

          {tab === 'about' ? (
            <section className="stack">
              <div className="about-hero">
                <span className="brand-mark about-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 4v16M4 12h16M6.5 6.5l11 11M17.5 6.5l-11 11" />
                  </svg>
                </span>
                <div>
                  <h3>{APP_NAME}</h3>
                  <p>{t('settings.about.version', { version: APP_VERSION })}</p>
                </div>
              </div>
              <p className="hint">{t('settings.about.body')}</p>

              <div className="about-grid">
                <div>
                  <p className="section-title">{t('settings.about.privacy')}</p>
                  <p className="hint">{t('settings.about.privacyBody')}</p>
                </div>
                <div>
                  <p className="section-title">{t('settings.about.status')}</p>
                  <p className="hint">
                    {online ? t('sidebar.online') : t('sidebar.offline')} · {num(promptCount, 0)} {t('settings.data.prompts')}
                  </p>
                </div>
              </div>

              <div className="install-card">
                <div>
                  <strong>{t('settings.about.install')}</strong>
                  <p>{t('settings.about.installHint')}</p>
                </div>
                {installed ? (
                  <span className="badge ok">{t('settings.about.installed')}</span>
                ) : canInstall ? (
                  <button type="button" className="btn primary" onClick={onInstall}>
                    {t('settings.about.install')}
                  </button>
                ) : null}
              </div>

              <div>
                <p className="section-title">{t('settings.about.shortcuts')}</p>
                <div className="shortcut-list">
                  <div>
                    <span>{t('settings.about.shortcut.palette')}</span>
                    <kbd>⌘K</kbd>
                  </div>
                  <div>
                    <span>{t('settings.about.shortcut.search')}</span>
                    <kbd>⌘⇧F</kbd>
                  </div>
                  <div>
                    <span>{t('settings.about.shortcut.prompts')}</span>
                    <kbd>⌘⇧P</kbd>
                  </div>
                  <div>
                    <span>{t('settings.about.shortcut.settings')}</span>
                    <kbd>⌘,</kbd>
                  </div>
                  <div>
                    <span>{t('settings.about.shortcut.send')}</span>
                    <kbd>Enter</kbd>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}

