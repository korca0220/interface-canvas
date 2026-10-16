import { useEffect } from 'react'
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

/**
 * 현재 줌을 .canvas의 CSS 변수(--zoom)로 내보낸다. 최소 LOD에서 이름 글자를 줌에 반비례해
 * 키우는 데 쓴다. 노드를 리렌더하지 않도록 DOM에 직접 쓴다.
 */
export function ZoomCssVar() {
  const zoom = useStore((s) => s.transform[2])
  useEffect(() => {
    document.querySelector<HTMLElement>('.canvas')?.style.setProperty('--zoom', String(zoom))
  }, [zoom])
  return null
}
