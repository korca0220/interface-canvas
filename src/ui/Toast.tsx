import { useUiStore } from './uiStore'

export function Toast() {
  const toast = useUiStore((s) => s.toast)
  if (!toast) return null
  return (
    <div className={`toast ${toast.kind}`} role="status" key={toast.id}>
      {toast.text}
    </div>
  )
}
