import { useState } from 'react'
import { views } from './views'

export default function App() {
  const [activeId, setActiveId] = useState(views[0].id)
  const active = views.find((v) => v.id === activeId) ?? views[0]
  const ActiveView = active.component

  return (
    <div className="app">
      <header className="app-header">
        <h1>Network Protection Techniques</h1>
        <nav aria-label="Visualizations">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-current={v.id === activeId ? 'page' : undefined}
              onClick={() => setActiveId(v.id)}
            >
              {v.title}
            </button>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <ActiveView />
      </main>
    </div>
  )
}
