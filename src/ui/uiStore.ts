import { create } from 'zustand'

// 문서와 무관한 화면 상태 (히스토리 대상 아님). 일부는 localStorage에 기억한다.
export type ColorMode = 'system' | 'light' | 'dark'
export type ExportScope = 'selection' | 'all'

const PREFS_KEY = 'interface-canvas:prefs'

type Prefs = { panelWidth: number; panelOpen: boolean; memoPreview: boolean; colorMode: ColorMode }

const DEFAULT_PREFS: Prefs = { panelWidth: 380, panelOpen: true, memoPreview: false, colorMode: 'system' }

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) }
  } catch {
    // localStorage를 쓸 수 없으면 기본값
  }
  return DEFAULT_PREFS
}

function savePrefs(p: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p))
  } catch {
    // 무시
  }
}

export const clampPanelWidth = (w: number) => Math.round(Math.min(Math.max(w, 280), Math.min(900, window.innerWidth - 320)))

type UiState = Prefs & {
  /** 검색으로 이동한 노드를 잠시 강조 */
  highlightId: string | null
  searchOpen: boolean
  exportScope: ExportScope | null
  toast: { id: number; text: string; kind: 'info' | 'error' } | null
  setHighlight: (id: string | null) => void
  setColorMode: (mode: ColorMode) => void
  setPanelWidth: (w: number) => void
  togglePanel: () => void
  setMemoPreview: (v: boolean) => void
  setSearchOpen: (v: boolean) => void
  openExport: (scope: ExportScope) => void
  closeExport: () => void
  showToast: (text: string, kind?: 'info' | 'error') => void
}

export const useUiStore = create<UiState>()((set, get) => {
  const persist = (patch: Partial<Prefs>) => {
    set(patch)
    const { panelWidth, panelOpen, memoPreview, colorMode } = get()
    savePrefs({ panelWidth, panelOpen, memoPreview, colorMode })
  }
  return {
    ...loadPrefs(),
    highlightId: null,
    searchOpen: false,
    exportScope: null,
    toast: null,
    setHighlight: (highlightId) => set({ highlightId }),
    setColorMode: (colorMode) => persist({ colorMode }),
    setPanelWidth: (w) => persist({ panelWidth: clampPanelWidth(w) }),
    togglePanel: () => persist({ panelOpen: !get().panelOpen }),
    setMemoPreview: (memoPreview) => persist({ memoPreview }),
    setSearchOpen: (searchOpen) => set({ searchOpen }),
    openExport: (exportScope) => set({ exportScope }),
    closeExport: () => set({ exportScope: null }),
    showToast: (text, kind = 'info') => {
      const id = Date.now()
      set({ toast: { id, text, kind } })
      window.setTimeout(() => {
        if (get().toast?.id === id) set({ toast: null })
      }, kind === 'error' ? 5000 : 2200)
    },
  }
})
