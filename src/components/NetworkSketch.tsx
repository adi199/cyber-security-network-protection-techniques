import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface Node extends d3.SimulationNodeDatum {
  id: string
  kind: 'internet' | 'control' | 'asset'
  /** Hops from the internet; drives the left-to-right layout. */
  depth: number
}

const nodes: Node[] = [
  { id: 'Internet', kind: 'internet', depth: 0 },
  { id: 'Firewall', kind: 'control', depth: 1 },
  { id: 'IDS/IPS', kind: 'control', depth: 2 },
  { id: 'DMZ web', kind: 'asset', depth: 3 },
  { id: 'Internal LAN', kind: 'asset', depth: 3 },
  { id: 'Database', kind: 'asset', depth: 4 },
]

const links: d3.SimulationLinkDatum<Node>[] = [
  { source: 'Internet', target: 'Firewall' },
  { source: 'Firewall', target: 'IDS/IPS' },
  { source: 'IDS/IPS', target: 'DMZ web' },
  { source: 'IDS/IPS', target: 'Internal LAN' },
  { source: 'Internal LAN', target: 'Database' },
]

const WIDTH = 640
const HEIGHT = 360

/** Small D3 force-layout sketch that proves the React + D3 wiring works. */
export default function NetworkSketch() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = d3.select(svgRef.current)
    const n = nodes.map((d) => ({ ...d }))
    const l = links.map((d) => ({ ...d }))

    const link = svg.select('g.links').selectAll('line').data(l).join('line')
    const node = svg.select('g.nodes').selectAll<SVGGElement, Node>('g').data(n).join('g')
    node.selectAll('*').remove()
    node.append('circle').attr('r', 18).attr('class', (d) => `node node-${d.kind}`)
    node.append('text').attr('dy', 34).attr('text-anchor', 'middle').text((d) => d.id)

    const sim = d3
      .forceSimulation(n)
      .force('link', d3.forceLink<Node, d3.SimulationLinkDatum<Node>>(l).id((d) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('x', d3.forceX<Node>((d) => 70 + d.depth * 125).strength(1))
      .force('y', d3.forceY(HEIGHT / 2).strength(0.1))
      .on('tick', () => {
        link
          .attr('x1', (d) => (d.source as Node).x ?? 0)
          .attr('y1', (d) => (d.source as Node).y ?? 0)
          .attr('x2', (d) => (d.target as Node).x ?? 0)
          .attr('y2', (d) => (d.target as Node).y ?? 0)
        node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

    return () => {
      sim.stop()
    }
  }, [])

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="Example network: internet, firewall, IDS/IPS, DMZ, internal LAN and database"
      className="network-sketch"
    >
      <g className="links" />
      <g className="nodes" />
    </svg>
  )
}
