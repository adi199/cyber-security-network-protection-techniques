// Defense-in-depth layers, ordered outermost (internet edge) to innermost.
// Ids are stable: other views (e.g. traffic animation) key off them.
export type DefenseLayerId =
  | 'firewall'
  | 'dmz'
  | 'idsips'
  | 'vpn'
  | 'segmentation'
  | 'nac'
  | 'zerotrust'

export interface DefenseLayer {
  id: DefenseLayerId
  name: string
  tagline: string
  summary: string
  stops: string[]
  limits: string
  example: string
}

export const defenseLayers: DefenseLayer[] = [
  {
    id: 'firewall',
    name: 'Perimeter firewall',
    tagline: 'The front gate between the internet and your network.',
    summary:
      'A perimeter firewall inspects traffic crossing the network edge and allows or blocks it based on rules: source and destination address, port, protocol, and on modern next-generation firewalls, the application and user behind the connection.',
    stops: ['Unsolicited inbound connections', 'Port scans and exposed services', 'Known-bad IPs and geographies'],
    limits: 'It trusts whatever it lets through, and it cannot see threats that start inside the network or hide in encrypted traffic it does not decrypt.',
    example: 'Allow inbound TCP 443 to the web server only; deny everything else by default.',
  },
  {
    id: 'dmz',
    name: 'DMZ',
    tagline: 'A buffer zone for anything the public must reach.',
    summary:
      'A demilitarized zone is a separate network segment that hosts public-facing services such as web, mail, and DNS servers. It sits between two firewall boundaries, so a compromised public server still cannot reach the internal network directly.',
    stops: ['Direct internet access to internal systems', 'Lateral movement from a hacked public server'],
    limits: 'Servers in the DMZ are still exposed and must be hardened and patched; badly written rules between the DMZ and the LAN undo its value.',
    example: 'The public website lives in the DMZ and may only talk to one database port on the inside.',
  },
  {
    id: 'idsips',
    name: 'IDS / IPS',
    tagline: 'Watches traffic for attacks, and can block them in-line.',
    summary:
      'An intrusion detection system (IDS) analyzes traffic and raises alerts on suspicious patterns. An intrusion prevention system (IPS) sits in the traffic path and drops malicious packets as they happen. Both use signatures of known attacks and anomaly detection for unusual behavior.',
    stops: ['Exploit attempts against known vulnerabilities', 'Malware command-and-control traffic', 'Brute force and scanning patterns'],
    limits: 'Signatures miss novel attacks, encrypted traffic limits visibility, and noisy rules cause alert fatigue or false-positive blocks.',
    example: 'The IPS drops a request carrying a known SQL injection payload before it reaches the web app.',
  },
  {
    id: 'vpn',
    name: 'VPN',
    tagline: 'An encrypted tunnel for remote users and sites.',
    summary:
      'A virtual private network creates an encrypted, authenticated tunnel over an untrusted network, letting remote employees or branch offices reach internal resources as if they were on site, without exposing those resources to the internet.',
    stops: ['Eavesdropping on public Wi-Fi', 'Tampering with traffic in transit', 'Exposing internal apps publicly'],
    limits: 'Classic VPNs often grant broad network access once connected, so a stolen credential or infected laptop gets a wide view of the network.',
    example: 'A remote employee connects with VPN plus MFA before reaching the internal wiki.',
  },
  {
    id: 'segmentation',
    name: 'Segmentation / VLANs',
    tagline: 'Splits the network into rooms with locked doors.',
    summary:
      'Network segmentation divides the internal network into smaller zones, often using VLANs at layer 2 and firewall or ACL rules between them. Each zone (users, servers, payments, IoT, guests) only talks to the zones it genuinely needs.',
    stops: ['Lateral movement after an initial compromise', 'Ransomware spreading across the whole network', 'Guests and IoT devices reaching sensitive systems'],
    limits: 'VLANs alone are not a security control; they need filtering between them, and flat legacy networks are hard to retrofit.',
    example: 'Point-of-sale terminals sit in their own VLAN that can reach only the payment processor.',
  },
  {
    id: 'nac',
    name: 'Network access control',
    tagline: 'Checks every device before it joins the network.',
    summary:
      'NAC authenticates users and devices when they connect (commonly with 802.1X) and checks their posture: patched OS, running antivirus, managed device. Compliant devices get the right VLAN; unknown or unhealthy ones are quarantined or sent to a guest network.',
    stops: ['Rogue devices plugged into a wall port', 'Unpatched or infected laptops joining the LAN', 'Unauthorized wireless clients'],
    limits: 'Needs an accurate device inventory, and headless devices such as printers and cameras often need exceptions that attackers can abuse.',
    example: 'A laptop missing security updates is placed in a remediation VLAN until it patches.',
  },
  {
    id: 'zerotrust',
    name: 'Zero trust',
    tagline: 'Never trust, always verify, for every request.',
    summary:
      'Zero trust drops the idea of a trusted inside. Every request to every resource is authenticated, authorized, and encrypted based on identity, device health, and context, with least-privilege access and continuous monitoring. It wraps the core assets regardless of where the user sits.',
    stops: ['Abuse of implicit trust inside the perimeter', 'Stolen credentials used from unusual devices or locations', 'Over-broad access after login'],
    limits: 'It is an architecture and a journey, not a product; it depends on strong identity, device management, and good data about who needs what.',
    example: 'Even on the office LAN, opening the HR app requires SSO, MFA, and a compliant managed device.',
  },
]
