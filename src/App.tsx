import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Canvas } from './canvas/Canvas'
import { Panel } from './panel/Panel'
import { Toolbar } from './ui/Toolbar'
import { Toast } from './ui/Toast'
import { DocumentTitle } from './ui/DocumentTitle'
import { useShortcuts } from './ui/useShortcuts'

function Shell() {
  useShortcuts()
  return (
    <div className="app">
      <Toolbar />
      <div className="main">
        <Canvas />
        <Panel />
      </div>
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
