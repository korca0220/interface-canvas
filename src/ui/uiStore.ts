import { create } from 'zustand'

// 문서와 무관한 화면 상태 (히스토리 대상 아님)
export type ColorMode = 'system' | 'light' | 'dark'

type UiState = {
  /** 검색으로 이동한 노드를 잠시 강조 */
  highlightId: string | null
  colorMode: ColorMode
  setHighlight: (id: string | null) => void
  setColorMode: (mode: ColorMode) => void
}

export const useUiStore = create<UiState>()((set) => ({
  highlightId: null,
  colorMode: 'system',
  setHighlight: (highlightId) => set({ highlightId }),
  setColorMode: (colorMode) => set({ colorMode }),
}))
