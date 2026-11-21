import { useSyncExternalStore } from 'react'
import { defenseLayers } from '../../data/defenseLayers'
import type { DefenseLayerId } from '../../data/defenseLayers'
import { ringRect } from './geometry'
import type { PacketStatus, TrafficSim } from './trafficSim'

const R = 9

const STATUS_TEXT: Record<PacketStatus, string> = {
  moving: 'in transit',
  flagged: 'flagged',
  blocked: 'blocked',
  delivered: 'delivered',
  slipped: 'slipped through',
}

/** Animated packets, drawn inside the diagram's SVG. Purely decorative for
 *  screen readers; the panel below carries the same information as text. */
export function TrafficOverlay({ sim }: { sim: TrafficSim }) {
  const frame = useSyncExternalStore(sim.subscribeFrame, sim.getFrame)

  return (
    <g className="tr-overlay" aria-hidden="true">
      {frame.flashes.map((f) => {
        const r = ringRect(f.layerIndex)
        return (
          <rect
            key={f.key}
            className={`tr-flash tr-flash-${f.kind}`}
            x={r.x + 1.5}
            y={r.y + 1.5}
            width={r.width - 3}
            height={r.height - 3}
            rx={17}
            style={{ opacity: f.opacity }}
          />
        )
      })}

      {frame.packets.map((p) => (
        <g
          key={p.id}
          className={`tr-packet tr-${p.status}`}
          transform={`translate(${p.x} ${p.y})`}
          style={{ opacity: p.opacity }}
        >
          <title>{`${p.label} (${STATUS_TEXT[p.status]})`}</title>
          {p.burst !== null && (
            <circle className="tr-burst" r={R + p.burst * 16} style={{ opacity: 1 - p.burst }} />
          )}
          <circle className="tr-dot" r={R} />
          {p.status === 'blocked' && <path className="tr-glyph" d="M-4,-4 L4,4 M4,-4 L-4,4" />}
          {(p.status === 'flagged' || p.status === 'slipped') && (
            <path className="tr-glyph" d="M0,-5 L0,1.5 M0,4.5 L0,4.6" />
          )}
          {p.status === 'delivered' && <path className="tr-glyph" d="M-4,0 L-1,3.5 L4.5,-3.5" />}
        </g>
      ))}
    </g>
  )
}

const layerName = new Map(defenseLayers.map((l) => [l.id, l.name]))

/** Play/pause, speed, reset, and the color legend. Sits under the diagram. */
export function TrafficControls({ sim }: { sim: TrafficSim }) {
  const stats = useSyncExternalStore(sim.subscribeStats, sim.getStats)

  return (
    <div className="tr-controls">
      <button
        type="button"
        onClick={() => sim.setPlaying(!stats.playing)}
        aria-pressed={stats.playing}
      >
        {stats.playing ? 'Pause traffic' : 'Play traffic'}
      </button>
      <button
        type="button"
        onClick={() => sim.setSpeed(stats.speed === 1 ? 2 : 1)}
        aria-label={`Speed ${stats.speed}x, switch to ${stats.speed === 1 ? 2 : 1}x`}
      >
        {stats.speed}x
      </button>
      <button type="button" onClick={() => sim.resetCounts()}>
        Reset counts
      </button>
      <ul className="tr-legend" aria-label="Legend">
        <li>
          <span className="tr-swatch tr-moving" /> In transit
        </li>
        <li>
          <span className="tr-swatch tr-flagged" /> Flagged (alert, still allowed)
        </li>
        <li>
          <span className="tr-swatch tr-blocked" /> Blocked
        </li>
        <li>
          <span className="tr-swatch tr-delivered" /> Legitimate, delivered
        </li>
      </ul>
    </div>
  )
}

interface StatsProps {
  sim: TrafficSim
  selectedId: DefenseLayerId | null
  onSelect: (id: DefenseLayerId) => void
}

/** Per-layer tallies and a running log of what happened. */
export function TrafficStats({ sim, selectedId, onSelect }: StatsProps) {
  const stats = useSyncExternalStore(sim.subscribeStats, sim.getStats)
  const malicious =
    defenseLayers.reduce((n, l) => n + stats.perLayer[l.id].blocked, 0) + stats.slippedThrough

  return (
    <div className="tr-stats">
      <table className="tr-table">
        <caption>What each control caught</caption>
        <thead>
          <tr>
            <th scope="col">Layer</th>
            <th scope="col">Blocked</th>
            <th scope="col">Flagged</th>
          </tr>
        </thead>
        <tbody>
          {defenseLayers.map((l) => {
            const c = stats.perLayer[l.id]
            return (
              <tr key={l.id} className={l.id === selectedId ? 'is-selected' : undefined}>
                <th scope="row">
                  <button type="button" onClick={() => onSelect(l.id)}>
                    {l.name}
                  </button>
                  {c.lastBlocked && <span className="tr-last">Last stopped: {c.lastBlocked}</span>}
                </th>
                <td>{c.blocked}</td>
                <td>{c.flagged}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Reached the core</th>
            <td colSpan={2}>{stats.deliveredLegit} legitimate</td>
          </tr>
        </tfoot>
      </table>
      {stats.slippedThrough > 0 && (
        <p className="tr-slipped">
          {stats.slippedThrough} of {malicious} attacks reached the core anyway: they were flagged,
          but nothing blocked them. Alerts only help if someone acts on them.
        </p>
      )}

      <h4 className="tr-log-title">Latest events</h4>
      <ol className="tr-log" aria-live="off">
        {stats.log.length === 0 && <li className="tr-empty">Press play to send traffic.</li>}
        {stats.log.map((e) => (
          <li
            key={e.key}
            className={`tr-log-${e.kind}${e.kind === 'deliver' && e.malicious ? ' is-malicious' : ''}`}
          >
            <strong>{e.scenario}</strong>{' '}
            {e.kind === 'deliver'
              ? e.malicious
                ? 'reached the core. Detection is not prevention.'
                : 'was delivered.'
              : `${e.kind === 'block' ? 'blocked' : 'flagged'} by ${layerName.get(e.layer!)}: ${e.reason}.`}
          </li>
        ))}
      </ol>
    </div>
  )
}
