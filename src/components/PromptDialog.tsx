import { useEffect, useState } from 'react'
import { BUILTIN_PROMPTS, createPrompt } from '../lib/prompts'
import type { Prompt } from '../lib/prompts'
import { useI18n } from '../lib/i18n'
import { toast } from '../lib/toast'
import { CloseIcon, PencilIcon, PlusIcon, SparklesIcon, TrashIcon } from './icons'

interface PromptDialogProps {
  open: boolean
  prompts: Prompt[]
  onClose(): void
  onUse(body: string): void
  onSave(prompts: Prompt[]): void
}

interface Draft {
  id: string | null
  title: string
  body: string
}

const EMPTY_DRAFT: Draft = { id: null, title: '', body: '' }

export function PromptDialog({ open, prompts, onClose, onUse, onSave }: PromptDialogProps) {
  const { t, p } = useI18n()
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    if (!open) {
      setDraft(EMPTY_DRAFT)
      setError(null)
      setFormOpen(false)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  const startNew = () => {
    setDraft(EMPTY_DRAFT)
    setError(null)
    setFormOpen(true)
  }

  const startEdit = (prompt: Prompt) => {
    setDraft({ id: prompt.id, title: prompt.title, body: prompt.body })
    setError(null)
    setFormOpen(true)
  }

  const save = () => {
    const cleanTitle = draft.title.trim()
    const cleanBody = draft.body.trim()
    if (!cleanTitle || !cleanBody) {
      setError(t('prompts.required'))
      return
    }
    if (draft.id) {
      onSave(prompts.map((prompt) => (prompt.id === draft.id ? { ...prompt, title: cleanTitle, body: cleanBody } : prompt)))
    } else {
      const created = createPrompt(cleanTitle, cleanBody)
      if (!created) {
        setError(t('prompts.required'))
        return
      }
      onSave([...prompts, created])
    }
    toast(t('toast.promptSaved'), 'ok')
    setDraft(EMPTY_DRAFT)
    setError(null)
    setFormOpen(false)
  }

  const remove = (id: string) => {
    onSave(prompts.filter((prompt) => prompt.id !== id))
    if (draft.id === id) {
      setDraft(EMPTY_DRAFT)
      setError(null)
      setFormOpen(false)
    }
    toast(t('toast.promptDeleted'), 'info')
  }

  const use = (body: string) => {
    onUse(body)
    onClose()
  }

  return (
    <div className="overlay" role="presentation" onMouseDown={onClose}>
      <div className="dialog prompt-dialog" role="dialog" aria-modal="true" aria-label={t('prompts.title')} onMouseDown={(event) => event.stopPropagation()}>
        <header className="dialog-head">
          <div>
            <h2>{t('prompts.title')}</h2>
            <p>{t('prompts.subtitle')}</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <CloseIcon />
          </button>
        </header>

        <div className="dialog-body">
          <section className="prompt-section">
            <p className="prompt-section-head">
              <SparklesIcon size={14} />
              {t('prompts.builtin')}
            </p>
            <div className="prompt-grid">
              {BUILTIN_PROMPTS.map((item) => {
                const body = t(item.bodyKey)
                return (
                  <article className="prompt-card" key={item.id}>
                    <div>
                      <h3 className="prompt-card-title">{t(item.titleKey)}</h3>
                      <p className="prompt-card-preview">{body.replace(/\s+/g, ' ').slice(0, 96)}</p>
                    </div>
                    <button type="button" className="btn small" onClick={() => use(body)}>
                      {t('prompts.use')}
                    </button>
                  </article>
                )
              })}
            </div>
          </section>

          <section className="prompt-section">
            <p className="prompt-section-head">
              <span>{t('prompts.custom')}</span>
              <span className="badge">{p('prompts.count', prompts.length)}</span>
              <button type="button" className="btn small prompt-new" onClick={startNew}>
                <PlusIcon size={14} />
                {t('prompts.new')}
              </button>
            </p>

            {formOpen ? (
              <div className="prompt-form">
                <label className="field">
                  <span>{t('prompts.name')}</span>
                  <input
                    className="input"
                    value={draft.title}
                    placeholder={t('prompts.namePlaceholder')}
                    onChange={(event) => setDraft({ ...draft, title: event.target.value })}
                  />
                </label>
                <label className="field">
                  <span>{t('prompts.body')}</span>
                  <textarea
                    className="input area"
                    rows={4}
                    value={draft.body}
                    placeholder={t('prompts.bodyPlaceholder')}
                    onChange={(event) => setDraft({ ...draft, body: event.target.value })}
                  />
                </label>
                {error ? <p className="key-result bad">{error}</p> : null}
                <div className="prompt-actions">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      setDraft(EMPTY_DRAFT)
                      setError(null)
                      setFormOpen(false)
                    }}
                  >
                    {t('common.cancel')}
                  </button>
                  <button type="button" className="btn primary" onClick={save}>
                    {t('prompts.save')}
                  </button>
                </div>
              </div>
            ) : null}

            {prompts.length === 0 && !formOpen ? <p className="hint">{t('prompts.empty')}</p> : null}

            {prompts.length ? (
              <div className="prompt-custom-list">
                {prompts.map((prompt) => (
                  <article className="prompt-custom-row" key={prompt.id}>
                    <div className="prompt-custom-info">
                      <strong>{prompt.title}</strong>
                      <span>{prompt.body.replace(/\s+/g, ' ').slice(0, 110)}</span>
                    </div>
                    <div className="prompt-custom-actions">
                      <button type="button" className="btn small" onClick={() => use(prompt.body)}>
                        {t('prompts.use')}
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => startEdit(prompt)}
                        aria-label={t('prompts.edit')}
                        title={t('prompts.edit')}
                      >
                        <PencilIcon size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => remove(prompt.id)}
                        aria-label={t('prompts.delete')}
                        title={t('prompts.delete')}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  )
}
