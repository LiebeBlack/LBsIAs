import { useEffect, useState } from 'react'
import { subscribeToasts } from '../lib/toast'
import type { ToastItem } from '../lib/toast'
import { CheckIcon, CloseIcon } from './icons'

export function Toasts() {
  const [items, setItems] = useState<ToastItem[]>([])

  useEffect(() => subscribeToasts(setItems), [])

  if (!items.length) return null

  return (
    <div className="toasts" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`toast ${item.kind}`}>
          <span className="toast-icon" aria-hidden="true">
            {item.kind === 'error' ? <CloseIcon size={13} /> : <CheckIcon size={13} />}
          </span>
          <span>{item.message}</span>
        </div>
      ))}
    </div>
  )
}
