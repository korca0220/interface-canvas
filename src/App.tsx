import { ReactFlowProvider } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Canvas } from './canvas/Canvas'
import { Toolbar } from './ui/Toolbar'
import { useDocStore } from './model/store'
import { exampleDoc } from './model/example'

useDocStore.getState().loadDoc(exampleDoc())

export function App() {
  return (
    <ReactFlowProvider>
      <div className="app">
        <Toolbar />
        <div className="main">
          <Canvas />
        </div>
      </div>
    </ReactFlowProvider>
  )
}
