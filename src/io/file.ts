import { create } from 'zustand'
import { emptyDoc, normalizeDoc, serializeDoc } from '../model/doc'
import { exampleDoc } from '../model/example'
import { useDocStore } from '../model/store'
import type { Doc } from '../model/types'
import { useUiStore } from '../ui/uiStore'
import { loadHandle, saveHandle } from './handleStore'

export const FILE_EXT = '.icanvas.json'
const FILE_TYPES: FilePickerAcceptType[] = [
  { description: 'Interface Canvas 문서', accept: { 'application/json': ['.json'] } },
]
const FILE_NAME_KEY = 'interface-canvas:fileName'

type FileState = {
  handle: FileSystemFileHandle | null
  fileName: string | null
  /** 마지막으로 파일에 저장/파일에서 연 시점의 문서 (참조 비교로 dirty 판단) */
  savedDoc: Doc | null
  /** 화면 맞춤이 필요한 문서 교체가 일어날 때마다 증가 */
  epoch: number
}

export const useFileStore = create<FileState>()(() => ({
  handle: null,
  fileName: readFileName(),
  savedDoc: null,
  epoch: 0,
}))

function readFileName(): string | null {
  try {
    return localStorage.getItem(FILE_NAME_KEY)
  } catch {
    return null
  }
}

function setFile(handle: FileSystemFileHandle | null, fileName: string | null, savedDoc: Doc | null) {
  useFileStore.setState({ handle, fileName, savedDoc })
  try {
    if (fileName) localStorage.setItem(FILE_NAME_KEY, fileName)
    else localStorage.removeItem(FILE_NAME_KEY)
  } catch {
    // 무시
  }
  void saveHandle(handle)
}

export function isDirty(doc: Doc, file: FileState): boolean {
  return file.savedDoc !== doc
}

const toast = (text: string, kind: 'info' | 'error' = 'info') => useUiStore.getState().showToast(text, kind)
const isAbort = (e: unknown) => e instanceof DOMException && e.name === 'AbortError'

/** 앱 시작 시 이전 세션의 파일 핸들을 복원한다 (권한은 저장할 때 다시 요청). */
export async function restoreHandle() {
  const handle = await loadHandle()
  if (handle) useFileStore.setState({ handle, fileName: handle.name })
}

function replaceDoc(doc: Doc) {
  useDocStore.getState().loadDoc(doc)
  useFileStore.setState((s) => ({ epoch: s.epoch + 1 }))
}

function confirmDiscard(): boolean {
  const doc = useDocStore.getState().doc
  const file = useFileStore.getState()
  if (!isDirty(doc, file) || doc.interfaces.length === 0) return true
  return window.confirm('현재 문서에 파일로 저장하지 않은 변경이 있습니다. 계속할까요?')
}

export function newDocument() {
  if (!confirmDiscard()) return
  setFile(null, null, null)
  replaceDoc(emptyDoc())
}

export function loadExample() {
  if (!confirmDiscard()) return
  setFile(null, null, null)
  replaceDoc(exampleDoc())
}

export function parseDocText(text: string): Doc {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('JSON 형식이 아닙니다.')
  }
  return normalizeDoc(json)
}

export async function openFile() {
  if (!confirmDiscard()) return
  try {
    if (window.showOpenFilePicker) {
      const [handle] = await window.showOpenFilePicker({ types: FILE_TYPES, id: 'icanvas' })
      const file = await handle.getFile()
      const doc = parseDocText(await file.text())
      replaceDoc(doc)
      setFile(handle, handle.name, doc)
      toast(`${handle.name} 열기 완료`)
    } else {
      const file = await pickFileFallback()
      if (!file) return
      const doc = parseDocText(await file.text())
      replaceDoc(doc)
      setFile(null, file.name, doc)
      toast(`${file.name} 열기 완료 (이 브라우저는 덮어쓰기를 지원하지 않아 저장 시 다운로드됩니다)`)
    }
  } catch (e) {
    if (isAbort(e)) return
    toast(`열기 실패: ${(e as Error).message}`, 'error')
  }
}

async function ensureWritable(handle: FileSystemFileHandle): Promise<boolean> {
  const opts = { mode: 'readwrite' as const }
  if (!handle.queryPermission) return true
  if ((await handle.queryPermission(opts)) === 'granted') return true
  return (await handle.requestPermission?.(opts)) === 'granted'
}

async function writeTo(handle: FileSystemFileHandle, doc: Doc) {
  const w = await handle.createWritable()
  await w.write(serializeDoc(doc))
  await w.close()
}

/** Cmd+S: 연 파일이 있으면 덮어쓰고, 없으면 다른 이름으로 저장 */
export async function saveFile() {
  const { handle } = useFileStore.getState()
  if (!handle) return saveFileAs()
  const doc = useDocStore.getState().doc
  try {
    if (!(await ensureWritable(handle))) {
      toast('파일 쓰기 권한이 없습니다.', 'error')
      return
    }
    await writeTo(handle, doc)
    setFile(handle, handle.name, doc)
    toast(`${handle.name} 저장됨`)
  } catch (e) {
    if (isAbort(e)) return
    toast(`저장 실패: ${(e as Error).message}`, 'error')
  }
}

function suggestedName(doc: Doc): string {
  const base = doc.name.trim().replace(/[\\/:*?"<>|]+/g, '-') || 'untitled'
  return base + FILE_EXT
}

export async function saveFileAs() {
  const doc = useDocStore.getState().doc
  try {
    if (window.showSaveFilePicker) {
      const handle = await window.showSaveFilePicker({ types: FILE_TYPES, suggestedName: suggestedName(doc), id: 'icanvas' })
      await writeTo(handle, doc)
      setFile(handle, handle.name, doc)
      toast(`${handle.name} 저장됨`)
    } else {
      const name = suggestedName(doc)
      downloadText(name, serializeDoc(doc), 'application/json')
      setFile(null, name, doc)
    }
  } catch (e) {
    if (isAbort(e)) return
    toast(`저장 실패: ${(e as Error).message}`, 'error')
  }
}

export function downloadText(name: string, text: string, type = 'text/plain') {
  downloadBlob(name, new Blob([text], { type }))
}

export function downloadBlob(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function pickFileFallback(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => resolve(input.files?.[0] ?? null)
    input.oncancel = () => resolve(null)
    input.click()
  })
}
