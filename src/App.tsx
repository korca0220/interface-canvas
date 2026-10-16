import { useDocStore } from './model/store'
import { exampleDoc } from './model/example'

useDocStore.getState().loadDoc(exampleDoc())

export function App() {
  const doc = useDocStore((s) => s.doc)
  return (
    <div className="app">
      <h1>{doc.name}</h1>
      <ul>
        {doc.interfaces.map((n) => (
          <li key={n.id}>{n.name}</li>
        ))}
      </ul>
    </div>
  )
}
