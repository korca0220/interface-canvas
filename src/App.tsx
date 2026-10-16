import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Canvas } from './canvas/Canvas'
import { Panel } from './panel/Panel'
import { Toolbar } from './ui/Toolbar'
import { Toast } from './ui/Toast'
import { DocumentTitle } from './ui/DocumentTitle'
import { useShortcuts } from './ui/useShortcuts'
import { ExportDialog } from './export/ExportDialog'
import { SearchDialog } from './ui/SearchDialog'
import { useTheme } from './ui/useTheme'

function Shell() {
  useShortcuts()
  useTheme()
  return (
    <div className="app">
      <Toolbar />
      <div className="main">
        <Canvas />
        <Panel />
      </div>
      <ExportDialog />
      <SearchDialog />
      <Toast />
      <DocumentTitle />
    </div>
  )
}

export function App() {
  return (
    <ReactFlowProvider>
      <Shell />
    </ReactFlowProvider>
  )
}
