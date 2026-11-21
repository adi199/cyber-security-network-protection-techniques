import { useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import { defenseLayers } from '../../data/defenseLayers'
import type { DefenseLayerId } from '../../data/defenseLayers'
import './DefenseLayers.css'

// Geometry: concentric rounded rectangles, outermost layer first.
const WIDTH = 720
const HEIGHT = 540
const MARGIN = 28 // room for the "Internet" label above the outer ring
const BAND = 30 // thickness of each ring
const CORE_LABEL = 'Critical assets'

export default function DefenseLayers() {
  const [selectedId, setSelectedId] = useState<DefenseLayerId | null>(null)
  const selected = defenseLayers.find((l) => l.id === selectedId) ?? null

  const toggle = (id: DefenseLayerId) => setSelectedId((cur) => (cur === id ? null : id))

  const onKey = (e: KeyboardEvent, id: DefenseLayerId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      toggle(id)
    }
  }

  const n = defenseLayers.length
  const coreInset = n * BAND

  return (
    <section className="defense-layers">
      <h2>Defense in depth</h2>
      <p>
        No single control stops every attack, so networks stack several. Traffic from the internet has
        to get through each ring before it reaches the critical assets at the center. Select a layer to
        see what it does, what it stops, and where it falls short.
      </p>

      <div className="dl-layout">
        <svg
          className="dl-diagram"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="group"
          aria-label="Defense-in-depth layers, outermost to innermost"
        >
          <text className="dl-internet" x={WIDTH / 2} y={MARGIN - 10} textAnchor="middle">
            Internet
          </text>

          {defenseLayers.map((layer, i) => {
            const inset = i * BAND
            const x = inset
            const y = MARGIN + inset
            const w = WIDTH - 2 * inset
            const h = HEIGHT - MARGIN - 2 * inset
            const isSelected = layer.id === selectedId
            return (
              <g
                key={layer.id}
                data-layer={layer.id}
                className={`dl-layer${isSelected ? ' is-selected' : ''}`}
                style={{ '--depth': i / (n - 1) } as CSSProperties}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${layer.name}: ${layer.tagline}`}
                onClick={() => toggle(layer.id)}
                onKeyDown={(e) => onKey(e, layer.id)}
              >
                <rect x={x} y={y} width={w} height={h} rx={18} />
                <text x={WIDTH / 2} y={y + BAND / 2} textAnchor="middle" dominantBaseline="central">
                  {layer.name}
                </text>
              </g>
            )
          })}

          <g className="dl-core">
            <rect
              x={coreInset}
              y={MARGIN + coreInset}
              width={WIDTH - 2 * coreInset}
              height={HEIGHT - MARGIN - 2 * coreInset}
              rx={14}
            />
            <text
              x={WIDTH / 2}
              y={MARGIN + (HEIGHT - MARGIN) / 2}
              textAnchor="middle"
              dominantBaseline="central"
            >
              {CORE_LABEL}
            </text>
          </g>
        </svg>

        <aside className="dl-panel" aria-live="polite">
          {selected ? (
            <>
              <p className="dl-step">
                Layer {defenseLayers.indexOf(selected) + 1} of {n}
              </p>
              <h3>{selected.name}</h3>
              <p className="dl-tagline">{selected.tagline}</p>
              <p>{selected.summary}</p>
              <h4>Helps stop</h4>
              <ul>
                {selected.stops.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              <h4>Limits</h4>
              <p>{selected.limits}</p>
              <h4>Example</h4>
              <p className="dl-example">{selected.example}</p>
              <button type="button" className="dl-close" onClick={() => setSelectedId(null)}>
                Close
              </button>
            </>
          ) : (
            <>
              <h3>Pick a layer</h3>
              <p>Click or tab to any ring in the diagram to read about it.</p>
              <ol className="dl-list">
                {defenseLayers.map((l) => (
                  <li key={l.id}>
                    <button type="button" onClick={() => setSelectedId(l.id)}>
                      {l.name}
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
