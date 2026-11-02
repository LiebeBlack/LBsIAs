import { useState } from 'react'
import { formatBytes } from '../lib/artifacts'
import type { Artifact } from '../lib/artifacts'
import { CheckIcon, CopyIcon, DownloadIcon } from './icons'

function download(item: Artifact) {
  const url = URL.createObjectURL(new Blob([item.content], { type: item.mime }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = item.filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  // Damos un tick antes de revocar: algunos navegadores cancelan la descarga.
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function Artifacts({ items }: { items: Artifact[] }) {
  const [copied, setCopied] = useState<string | null>(null)
  if (!items.length) return null

  const copy = async (item: Artifact) => {
    try {
      await navigator.clipboard.writeText(item.content)
      setCopied(item.id)
      window.setTimeout(() => setCopied((current) => (current === item.id ? null : current)), 1400)
    } catch {
      // Portapapeles bloqueado.
    }
  }

  return (
    <div className="artifacts" aria-label="Archivos generados">
      {items.map((item) => (
        <div className="artifact" key={item.id}>
          <span className="artifact-badge" aria-hidden="true">
            {(item.filename.split('.').pop() ?? 'txt').slice(0, 4)}
          </span>
          <span className="artifact-info">
            <span className="artifact-name" title={item.filename}>
              {item.filename}
            </span>
            <span className="artifact-meta">
              {formatBytes(item.bytes)} · {item.language}
            </span>
          </span>
          <span className="artifact-tools">
            <button type="button" className="artifact-btn" onClick={() => download(item)} title={`Descargar ${item.filename}`}>
              <DownloadIcon size={13} />
              Descargar
            </button>
            <button
              type="button"
              className="icon-btn"
              onClick={() => void copy(item)}
              aria-label={`Copiar ${item.filename}`}
              title="Copiar contenido"
            >
              {copied === item.id ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
            </button>
          </span>
        </div>
      ))}
    </div>
  )
}
