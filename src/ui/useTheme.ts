import { useEffect } from 'react'
import { useUiStore } from './uiStore'

/** colorMode를 <html data-theme>에 반영한다. system이면 속성을 지워 prefers-color-scheme를 따른다. */
export function useTheme() {
  const mode = useUiStore((s) => s.colorMode)
  useEffect(() => {
    const root = document.documentElement
    if (mode === 'system') root.removeAttribute('data-theme')
    else root.setAttribute('data-theme', mode)
  }, [mode])
}
