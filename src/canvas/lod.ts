import { useStore } from '@xyflow/react'

export type Lod = 'full' | 'compact' | 'min'

export function lodForZoom(zoom: number): Lod {
  if (zoom >= 0.55) return 'full'
  if (zoom >= 0.3) return 'compact'
  return 'min'
}

/** 줌 단계가 바뀔 때만 리렌더되도록 단계 값만 구독한다. */
export function useLod(): Lod {
  return useStore((s) => lodForZoom(s.transform[2]))
}
