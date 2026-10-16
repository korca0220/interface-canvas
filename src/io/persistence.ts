import { normalizeDoc } from '../model/doc'
import { exampleDoc } from '../model/example'
import { useDocStore } from '../model/store'
import type { Doc } from '../model/types'

export const LOCAL_KEY = 'interface-canvas:doc'

/** localStorage의 작업 사본을 읽는다. 없으면 예시 문서, 깨졌으면 백업 후 예시 문서. */
export function loadInitialDoc(): { doc: Doc; notice?: string } {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(LOCAL_KEY)
  } catch {
    return { doc: exampleDoc(), notice: 'localStorage를 사용할 수 없어 자동 저장이 꺼집니다.' }
  }
  if (!raw) return { doc: exampleDoc() }
  try {
    return { doc: normalizeDoc(JSON.parse(raw)) }
  } catch (e) {
    const backupKey = `${LOCAL_KEY}:corrupt:${Date.now()}`
    try {
      localStorage.setItem(backupKey, raw)
    } catch {
      // 무시
    }
    return {
      doc: exampleDoc(),
      notice: `저장된 문서를 읽지 못해 예시 문서를 열었습니다 (${(e as Error).message}). 원본은 ${backupKey}에 백업했습니다.`,
    }
  }
}

export function writeLocal(doc: Doc): boolean {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(doc))
    return true
  } catch {
    return false
  }
}

/** 문서가 바뀔 때마다 (디바운스) localStorage에 저장한다. 구독 해제 함수를 반환. */
export function startAutosave(delay = 300): () => void {
  let timer: number | undefined
  let pending: Doc | null = null
  const flush = () => {
    if (pending) writeLocal(pending)
    pending = null
  }
  const unsub = useDocStore.subscribe((state, prev) => {
    if (state.doc === prev.doc) return
    pending = state.doc
    window.clearTimeout(timer)
    timer = window.setTimeout(flush, delay)
  })
  window.addEventListener('beforeunload', flush)
  return () => {
    unsub()
    window.removeEventListener('beforeunload', flush)
    flush()
  }
}
