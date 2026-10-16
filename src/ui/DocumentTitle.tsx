import { useEffect } from 'react'
import { useDocStore } from '../model/store'
import { isDirty, useFileStore } from '../io/file'

export function DocumentTitle() {
  const doc = useDocStore((s) => s.doc)
  const file = useFileStore()
  const dirty = isDirty(doc, file) && !!file.fileName
  useEffect(() => {
    document.title = `${dirty ? '• ' : ''}${doc.name || 'Untitled'} — Interface Canvas`
  }, [doc.name, dirty])
  return null
}
