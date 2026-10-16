import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { useDocStore } from './model/store'
import { loadInitialDoc, startAutosave } from './io/persistence'
import { restoreHandle } from './io/file'
import { useUiStore } from './ui/uiStore'
import './styles.css'

const { doc, notice } = loadInitialDoc()
useDocStore.getState().loadDoc(doc)
startAutosave()
void restoreHandle()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (notice) useUiStore.getState().showToast(notice, 'error')
