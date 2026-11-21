import type { DefenseLayerId } from './defenseLayers'

// Example traffic for the defense-in-depth animation. Each scenario is one
// packet (really, one connection) heading from the internet toward the
// critical assets. `events` lists what each control does to it, in order:
// a "flag" raises an alert but lets it continue, a "block" stops it there.
// A scenario with no block reaches the core.
//
// This is a teaching simplification: real traffic does not cross every ring
// in a straight line (for example, only remote users go through the VPN).

export type TrafficAction = 'flag' | 'block'

export interface TrafficEvent {
  layer: DefenseLayerId
  action: TrafficAction
  /** Why this control reacted, in a few words. */
  reason: string
}

export interface TrafficScenario {
  id: string
  label: string
  malicious: boolean
  events: TrafficEvent[]
}

export const trafficScenarios: TrafficScenario[] = [
  {
    id: 'web-visit',
    label: 'Customer loads the website over HTTPS',
    malicious: false,
    events: [],
  },
  {
    id: 'remote-employee',
    label: 'Remote employee connects with VPN and MFA',
    malicious: false,
    events: [],
  },
  {
    id: 'hr-app',
    label: 'Staff open the HR app from a managed laptop',
    malicious: false,
    events: [],
  },
  {
    id: 'port-scan',
    label: 'Port scan probing for open RDP',
    malicious: true,
    events: [{ layer: 'firewall', action: 'block', reason: 'no rule allows inbound 3389' }],
  },
  {
    id: 'bad-ip',
    label: 'Connection from a known botnet IP',
    malicious: true,
    events: [
      { layer: 'firewall', action: 'block', reason: 'source is on the threat-intel deny list' },
    ],
  },
  {
    id: 'direct-db',
    label: 'Direct connection to the internal database',
    malicious: true,
    events: [{ layer: 'dmz', action: 'block', reason: 'only DMZ hosts may reach the inside' }],
  },
  {
    id: 'sqli',
    label: 'SQL injection payload in a login form',
    malicious: true,
    events: [{ layer: 'idsips', action: 'block', reason: 'matches a known injection signature' }],
  },
  {
    id: 'c2',
    label: 'Malware calling home to its C2 server',
    malicious: true,
    events: [{ layer: 'idsips', action: 'block', reason: 'beacon pattern matches known malware' }],
  },
  {
    id: 'plain-admin',
    label: 'Admin login over public Wi-Fi without the VPN',
    malicious: true,
    events: [
      {
        layer: 'vpn',
        action: 'block',
        reason: 'internal admin apps are only reachable through the tunnel',
      },
    ],
  },
  {
    id: 'ransomware',
    label: 'Ransomware spreading from a hacked web server',
    malicious: true,
    events: [
      { layer: 'idsips', action: 'flag', reason: 'unusual SMB traffic from the DMZ' },
      { layer: 'segmentation', action: 'block', reason: 'web zone may not talk to file servers' },
    ],
  },
  {
    id: 'rogue-device',
    label: 'Rogue device plugged into a wall port',
    malicious: true,
    events: [{ layer: 'nac', action: 'block', reason: 'device failed 802.1X authentication' }],
  },
  {
    id: 'stolen-creds',
    label: 'Stolen password used from an unusual country',
    malicious: true,
    events: [
      { layer: 'firewall', action: 'flag', reason: 'login from a new geography' },
      { layer: 'zerotrust', action: 'block', reason: 'unmanaged device and failed MFA' },
    ],
  },
  {
    id: 'dns-exfil',
    label: 'Slow data theft hidden in DNS lookups',
    malicious: true,
    events: [{ layer: 'idsips', action: 'flag', reason: 'odd, long DNS queries' }],
  },
]
