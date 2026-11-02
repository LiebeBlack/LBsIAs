import { useEffect, useState } from 'react'
import { PROVIDERS, providerById } from '../shared/providers'
import type { Conversation, ModelChoice, Settings, Theme } from '../shared/types'
import { fetchModels } from '../lib/api'
import { CloseIcon, DownloadIcon, EyeIcon, EyeOffIcon, TrashIcon, UploadIcon } from './icons'

const ACCENTS = ['#8b6cff', '#38e8c8', '#ff7a59', '#4d8dff', '#ff5f9e', '#ffc247']
const THEMES: Array<{ id: Theme; label: string }> = [
  { id: 'dark', label: 'Oscuro' },
  { id: 'light', label: 'Claro' },
  { id: 'system', label: 'Sistema' },
]

type Tab = 'claves' | 'comportamiento' | 'apariencia' | 'datos'

interface SettingsDialogProps {
  open: boolean
  settings: Settings
  keys: Record<string, string>
  serverKeys: Record<string, boolean>
  conversations: Conversation[]
  onChange(patch: Partial<Settings>): void
  onKeys(next: Record<string, string>): void
  onClose(): void
  onClear(): void
  onExport(): void
  onImport(conversations: Conversation[]): void
}

export function SettingsDialog({
  open,
  settings,
  keys,
  serverKeys,
  conversations,
  onChange,
  onKeys,
  onClose,
  onClear,
  onExport,
  onImport,
}: SettingsDialogProps) {
  const [tab, setTab] = useState<Tab>('claves')
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [testing, setTesting] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { ok: boolean; text: string }>>({})
  const [confirmClear, setConfirmClear] = useState(false)
  const [importStatus, setImportStatus] = useState<string | null>(null)

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
    setTesting(providerId)
    try {
      const models = await fetchModels(providerId, keys[providerId] || undefined)
      setResults((previous) => ({
        ...previous,
        [providerId]: {
          ok: true,
          text: `${models.length} modelos disponibles${models[0] ? ` · p. ej. ${models[0]}` : ''}`,
        },
      }))
    } catch (error) {
      setResults((previous) => ({
        ...previous,
        [providerId]: { ok: false, text: error instanceof Error ? error.message : 'No se pudo validar.' },
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
      const parsed = JSON.parse(await file.text()) as { conversations?: Conversation[] }
      const incoming = Array.isArray(parsed.conversations)
        ? parsed.conversations.filter((entry) => entry && typeof entry.id === 'string' && Array.isArray(entry.turns))
        : []
      if (!incoming.length) {
        setImportStatus('El archivo no contiene conversaciones válidas.')
        return
      }
      onImport(incoming)
      setImportStatus(`${incoming.length} conversaciones importadas.`)
    } catch {
      setImportStatus('No se pudo leer el archivo.')
    }
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Ajustes">
      <div className="dialog">
        <header className="dialog-head">
          <div>
            <h2>Ajustes</h2>
            <p>Todo se guarda en este navegador.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar">
            <CloseIcon />
          </button>
        </header>

        <nav className="tabs" role="tablist">
          {(
            [
              ['claves', 'Claves'],
              ['comportamiento', 'Modelo'],
              ['apariencia', 'Aspecto'],
              ['datos', 'Datos'],
            ] as Array<[Tab, string]>
          ).map(([id, label]) => (
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
          {tab === 'claves' ? (
            <section className="stack">
              <p className="hint">
                Pega tus claves: se quedan en este navegador y viajan solo al servidor que reenvía tu pregunta al proveedor.
                Nunca se escriben en disco ni se registran.
              </p>
              {PROVIDERS.map((provider) => {
                const result = results[provider.id]
                const isRevealed = revealed[provider.id]
                return (
                  <div className="key-row" key={provider.id}>
                    <div className="key-head">
                      <span className="dot" style={{ background: provider.color }} />
                      <strong>{provider.name}</strong>
                      {serverKeys[provider.id] ? <span className="badge ok">clave del servidor</span> : null}
                      <a href={provider.keyUrl} target="_blank" rel="noreferrer noopener">
                        crear clave ↗
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
                        aria-label={isRevealed ? 'Ocultar clave' : 'Mostrar clave'}
                      >
                        {isRevealed ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
                      </button>
                      <button
                        type="button"
                        className="btn small"
                        onClick={() => void testKey(provider.id)}
                        disabled={testing === provider.id}
                      >
                        {testing === provider.id ? 'Probando…' : 'Probar'}
                      </button>
                    </div>
                    {result ? <p className={`key-result ${result.ok ? 'ok' : 'bad'}`}>{result.text}</p> : null}
                  </div>
                )
              })}
            </section>
          ) : null}

          {tab === 'comportamiento' ? (
            <section className="stack">
              <label className="field">
                <span>Instrucciones del asistente</span>
                <textarea
                  className="input area"
                  rows={5}
                  value={settings.system}
                  onChange={(event) => onChange({ system: event.target.value })}
                />
              </label>

              <label className="field">
                <span>
                  Temperatura <em>{settings.temperature.toFixed(1)}</em>
                </span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={settings.temperature}
                  onChange={(event) => onChange({ temperature: Number(event.target.value) })}
                />
                <small>Baja para respuestas precisas, alta para respuestas creativas.</small>
              </label>

              <label className="field">
                <span>Máximo de tokens por respuesta</span>
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
                <span>Enter envía el mensaje (Shift+Enter hace un salto de línea)</span>
              </label>

              <div className="divider" />

              <label className="switch">
                <input
                  type="checkbox"
                  checked={settings.compare}
                  onChange={(event) => onChange({ compare: event.target.checked })}
                />
                <span>Modo comparación: enviar cada pregunta a varios modelos</span>
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
                          aria-label="Quitar modelo"
                        >
                          <TrashIcon size={15} />
                        </button>
                      </div>
                    )
                  })}
                  {slots.length < 3 ? (
                    <button
                      type="button"
                      className="btn"
                      onClick={() =>
                        onChange({
                          compareModels: [...slots, { provider: 'google', model: 'gemini-2.5-flash' }],
                        })
                      }
                    >
                      Añadir modelo
                    </button>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {tab === 'apariencia' ? (
            <section className="stack">
              <div className="field">
                <span>Tema</span>
                <div className="seg">
                  {THEMES.map((theme) => (
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
                <span>Color de acento</span>
                <div className="swatches">
                  {ACCENTS.map((accent) => (
                    <button
                      key={accent}
                      type="button"
                      className={`swatch${settings.accent.toLowerCase() === accent ? ' active' : ''}`}
                      style={{ background: accent }}
                      onClick={() => onChange({ accent })}
                      aria-label={`Acento ${accent}`}
                    />
                  ))}
                  <label className="swatch custom" title="Color personalizado">
                    <input
                      type="color"
                      value={settings.accent}
                      onChange={(event) => onChange({ accent: event.target.value })}
                    />
                  </label>
                </div>
              </div>
            </section>
          ) : null}

          {tab === 'datos' ? (
            <section className="stack">
              <p className="hint">
                {conversations.length} conversaciones guardadas en este navegador. Exporta un respaldo antes de limpiar.
              </p>
              <div className="row">
                <button type="button" className="btn" onClick={onExport}>
                  <DownloadIcon size={15} />
                  Exportar JSON
                </button>
                <label className="btn">
                  <UploadIcon size={15} />
                  Importar JSON
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
                    Sí, borrar todo
                  </button>
                  <button type="button" className="btn" onClick={() => setConfirmClear(false)}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <button type="button" className="btn danger" onClick={() => setConfirmClear(true)}>
                  <TrashIcon size={15} />
                  Borrar chats y claves
                </button>
              )}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
