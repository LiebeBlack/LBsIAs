export type ToastKind = 'info' | 'ok' | 'error'

export interface ToastItem {
  id: string
  message: string
  kind: ToastKind
}

const DURATION = 3_400
let items: ToastItem[] = []
let counter = 0
const listeners = new Set<(items: ToastItem[]) => void>()

function emit(): void {
  for (const listener of listeners) listener(items)
}

export function toast(message: string, kind: ToastKind = 'info'): void {
  const id = `toast-${Date.now()}-${++counter}`
  items = [...items, { id, message, kind }].slice(-3)
  emit()
  window.setTimeout(() => {
    items = items.filter((item) => item.id !== id)
    emit()
  }, DURATION)
}

export function subscribeToasts(listener: (items: ToastItem[]) => void): () => void {
  listeners.add(listener)
  listener(items)
  return () => {
    listeners.delete(listener)
  }
}
