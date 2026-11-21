import { defenseLayers } from '../../data/defenseLayers'
import type { DefenseLayerId } from '../../data/defenseLayers'
import { trafficScenarios } from '../../data/trafficScenarios'
import type { TrafficScenario } from '../../data/trafficScenarios'
import { checkpointY } from './geometry'

// A small, self-contained simulation clock for the traffic animation.
// Each packet gets a precomputed timeline when it spawns, so drawing a frame
// is a pure function of the clock. Pausing just stops the clock.

const SPEED = 90 // px per second at 1x
const HOLD = 450 // ms a packet pauses at a control that reacts to it
const FADE = 700 // ms to fade out after being blocked or delivered
const SPAWN_EVERY = 1500 // ms between packets at 1x
const START_Y = 6
const FLASH = 900 // ms a ring stays highlighted after it acts

// Lanes sit left and right of the ring labels, inside the core's width.
export const LANES = [226, 256, 464, 494]

const layerIndex = new Map(defenseLayers.map((l, i) => [l.id, i]))
const coreY = checkpointY(defenseLayers.length) + 8

export type PacketStatus = 'moving' | 'flagged' | 'blocked' | 'delivered' | 'slipped'

interface Segment {
  t0: number
  t1: number
  y0: number
  y1: number
}

interface TimedEvent {
  at: number
  layer: DefenseLayerId | null // null = reached the core
  kind: 'flag' | 'block' | 'deliver'
  reason: string
}

interface Packet {
  id: number
  scenario: TrafficScenario
  x: number
  born: number
  segments: Segment[]
  events: TimedEvent[]
  end: number
}

export interface PacketView {
  id: number
  x: number
  y: number
  status: PacketStatus
  opacity: number
  /** 0..1 progress of the block burst, or null. */
  burst: number | null
  label: string
}

export interface RingFlash {
  key: string
  layerIndex: number
  kind: 'flag' | 'block'
  opacity: number
}

export interface Frame {
  packets: PacketView[]
  flashes: RingFlash[]
}

export interface LogEntry {
  key: number
  scenario: string
  malicious: boolean
  layer: DefenseLayerId | null
  kind: 'flag' | 'block' | 'deliver'
  reason: string
}

export interface LayerCount {
  blocked: number
  flagged: number
  lastBlocked: string | null
}

export interface Stats {
  playing: boolean
  speed: number
  perLayer: Record<DefenseLayerId, LayerCount>
  deliveredLegit: number
  slippedThrough: number
  log: LogEntry[]
}

function buildTimeline(scenario: TrafficScenario): Pick<Packet, 'segments' | 'events' | 'end'> {
  const segments: Segment[] = []
  const events: TimedEvent[] = []
  let t = 0
  let y = START_Y
  const moveTo = (y1: number) => {
    const dt = ((y1 - y) / SPEED) * 1000
    segments.push({ t0: t, t1: t + dt, y0: y, y1 })
    t += dt
    y = y1
  }

  for (const ev of scenario.events) {
    const i = layerIndex.get(ev.layer)
    if (i === undefined) continue
    moveTo(checkpointY(i))
    events.push({ at: t, layer: ev.layer, kind: ev.action, reason: ev.reason })
    t += HOLD
    if (ev.action === 'block') {
      return { segments, events, end: t + FADE }
    }
  }

  moveTo(coreY)
  events.push({ at: t, layer: null, kind: 'deliver', reason: '' })
  return { segments, events, end: t + HOLD + FADE }
}

function yAt(segments: Segment[], t: number): number {
  let y = START_Y
  for (const s of segments) {
    if (t < s.t0) break
    if (t >= s.t1) {
      y = s.y1
      continue
    }
    return s.y0 + ((t - s.t0) / (s.t1 - s.t0)) * (s.y1 - s.y0)
  }
  return y
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function emptyCounts(): Record<DefenseLayerId, LayerCount> {
  return Object.fromEntries(
    defenseLayers.map((l) => [l.id, { blocked: 0, flagged: 0, lastBlocked: null }]),
  ) as Record<DefenseLayerId, LayerCount>
}

type Listener = () => void

export class TrafficSim {
  private clock = 0
  private nextSpawn = 0
  private nextId = 1
  private nextLog = 1
  private deck: TrafficScenario[] = []
  private laneFreeAt = LANES.map(() => 0)
  private packets: Packet[] = []
  private raf = 0
  private lastTs: number | null = null

  private frame: Frame = { packets: [], flashes: [] }
  private stats: Stats
  private frameListeners = new Set<Listener>()
  private statsListeners = new Set<Listener>()

  constructor(playing: boolean) {
    this.stats = {
      playing,
      speed: 1,
      perLayer: emptyCounts(),
      deliveredLegit: 0,
      slippedThrough: 0,
      log: [],
    }
  }

  // --- store plumbing for useSyncExternalStore ---
  subscribeFrame = (fn: Listener) => {
    this.frameListeners.add(fn)
    return () => this.frameListeners.delete(fn)
  }
  getFrame = () => this.frame
  subscribeStats = (fn: Listener) => {
    this.statsListeners.add(fn)
    return () => this.statsListeners.delete(fn)
  }
  getStats = () => this.stats

  private setStats(patch: Partial<Stats>) {
    this.stats = { ...this.stats, ...patch }
    this.statsListeners.forEach((fn) => fn())
  }

  // --- lifecycle ---
  start() {
    if (this.raf) return
    this.lastTs = null
    const loop = (ts: number) => {
      const dt = this.lastTs === null ? 0 : Math.min(ts - this.lastTs, 100)
      this.lastTs = ts
      if (this.stats.playing) this.advance(dt * this.stats.speed)
      this.raf = requestAnimationFrame(loop)
    }
    this.raf = requestAnimationFrame(loop)
    this.render()
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.raf = 0
  }

  setPlaying(playing: boolean) {
    this.setStats({ playing })
  }

  setSpeed(speed: number) {
    this.setStats({ speed })
  }

  resetCounts() {
    this.setStats({ perLayer: emptyCounts(), deliveredLegit: 0, slippedThrough: 0, log: [] })
  }

  // --- simulation ---
  private advance(dt: number) {
    const prev = this.clock
    this.clock += dt

    while (this.clock >= this.nextSpawn) {
      this.spawn(this.nextSpawn)
      this.nextSpawn += SPAWN_EVERY
    }

    const fired: { packet: Packet; ev: TimedEvent }[] = []
    for (const p of this.packets) {
      for (const ev of p.events) {
        const at = p.born + ev.at
        if (at > prev && at <= this.clock) fired.push({ packet: p, ev })
      }
    }
    if (fired.length) this.record(fired)

    this.packets = this.packets.filter((p) => this.clock < p.born + p.end)
    this.render()
  }

  private spawn(at: number) {
    if (!this.deck.length) this.deck = shuffle(trafficScenarios)
    const scenario = this.deck.pop()!
    // Use the lane that has been free longest so packets don't stack.
    let lane = 0
    for (let i = 1; i < LANES.length; i++) {
      if (this.laneFreeAt[i] < this.laneFreeAt[lane]) lane = i
    }
    const timeline = buildTimeline(scenario)
    this.laneFreeAt[lane] = at + 2500
    this.packets.push({ id: this.nextId++, scenario, x: LANES[lane], born: at, ...timeline })
  }

  private record(fired: { packet: Packet; ev: TimedEvent }[]) {
    const perLayer = { ...this.stats.perLayer }
    let { deliveredLegit, slippedThrough } = this.stats
    const entries: LogEntry[] = []
    for (const { packet, ev } of fired) {
      const s = packet.scenario
      if (ev.layer) {
        const c = { ...perLayer[ev.layer] }
        if (ev.kind === 'block') {
          c.blocked++
          c.lastBlocked = s.label
        } else {
          c.flagged++
        }
        perLayer[ev.layer] = c
      } else if (s.malicious) {
        slippedThrough++
      } else {
        deliveredLegit++
      }
      entries.push({
        key: this.nextLog++,
        scenario: s.label,
        malicious: s.malicious,
        layer: ev.layer,
        kind: ev.kind,
        reason: ev.reason,
      })
    }
    const log = [...entries.reverse(), ...this.stats.log].slice(0, 6)
    this.setStats({ perLayer, deliveredLegit, slippedThrough, log })
  }

  private render() {
    const now = this.clock
    const packets: PacketView[] = []
    const flashes: RingFlash[] = []

    for (const p of this.packets) {
      const t = now - p.born
      let status: PacketStatus = 'moving'
      let blockAt: number | null = null
      for (const ev of p.events) {
        if (ev.at > t) break
        if (ev.kind === 'block') {
          status = 'blocked'
          blockAt = ev.at
        } else if (ev.kind === 'deliver') {
          status = p.scenario.malicious ? 'slipped' : 'delivered'
        } else {
          status = 'flagged'
        }
        if (ev.layer && ev.kind !== 'deliver' && t - ev.at < FLASH) {
          flashes.push({
            key: `${p.id}-${ev.layer}`,
            layerIndex: layerIndex.get(ev.layer)!,
            kind: ev.kind,
            opacity: 1 - (t - ev.at) / FLASH,
          })
        }
      }
      const fadeStart = p.end - FADE
      const opacity = t > fadeStart ? Math.max(0, 1 - (t - fadeStart) / FADE) : 1
      packets.push({
        id: p.id,
        x: p.x,
        y: yAt(p.segments, t),
        status,
        opacity,
        burst: blockAt === null ? null : Math.min(1, (t - blockAt) / (HOLD + FADE)),
        label: p.scenario.label,
      })
    }

    this.frame = { packets, flashes }
    this.frameListeners.forEach((fn) => fn())
  }
}
