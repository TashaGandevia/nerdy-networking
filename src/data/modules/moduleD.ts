// Module D — Network Virtualization (Deck 4)
// Mechanics: Topology Canvas (extended), Match-Action
// Topics: VLANs, 802.1Q, vSwitch/OVS, tunneling, multi-tenant overlays, SDN virtualization

import type { ContentModule } from '@/types'

export const moduleD: ContentModule = {
  id:          'D',
  title:       'Network Virtualization',
  sourceDeck:  'Deck 4 — Network Virtualization (25 slides)',
  description: 'VLANs, virtual switches, tunneling overlays, and multi-tenant isolation.',
  accentClass: 'text-module-d',
  mechanics:   ['virtualizationLab'],

  flashcards: [
    {
      id: 'D-01', type: 'term-definition',
      front: 'What problem do VLANs solve, and how does 802.1Q implement them?',
      back:  'VLANs isolate broadcast domains without requiring separate physical switches. 802.1Q adds a 4-byte tag (12-bit VLAN ID) to the Ethernet frame between the source MAC and EtherType. Switches strip or add the tag at access ports; trunk ports carry the tag between switches.',
      tags:  ['D', 'VLAN', '802.1Q'],
    },
    {
      id: 'D-02', type: 'term-definition',
      front: 'What is a vSwitch (e.g. OVS) and where does it live?',
      back:  'A virtual switch (Open vSwitch) runs in the hypervisor kernel, connecting VMs to the physical network. It supports OpenFlow, VLAN tagging, tunneling (VXLAN/GRE), and QoS — the same as a physical switch but in software between VMs on the same host.',
      tags:  ['D', 'vSwitch', 'OVS'],
    },
    {
      id: 'D-03', type: 'term-definition',
      front: 'Why is tunneling/encapsulation needed in multi-tenant datacenters?',
      back:  'Tenants may use overlapping IP ranges. Encapsulating tenant packets inside an outer header (VXLAN, GRE) lets the underlay route by outer IP while the inner tenant IP is invisible — providing isolation and address-space independence.',
      tags:  ['D', 'tunneling', 'overlay', 'multi-tenant'],
    },
    {
      id: 'D-04', type: 'compare-two',
      front: 'Compare VXLAN and GRE as overlay encapsulations.',
      back:  'VXLAN: UDP encapsulation, 24-bit VNI (16 M tenants), checksum optional, better ECMP load balancing via UDP src port hashing. GRE: IP-in-IP, 32-bit key, simpler but no built-in ECMP entropy without extensions.',
      tags:  ['D', 'VXLAN', 'GRE', 'tunneling'],
    },
    {
      id: 'D-05', type: 'diagram-id',
      front: 'In a 3-tier datacenter: what are the roles of access, aggregation, and core layers?',
      back:  'Access: connects servers (top-of-rack switches). Aggregation: connects access-layer racks, enforces policy. Core: high-speed backbone, routes between aggregation blocks and to the WAN. Modern fat-tree / spine-leaf collapses these into two tiers for lower latency.',
      tags:  ['D', 'datacenter', 'topology'],
    },
    {
      id: 'D-06', type: 'term-definition',
      front: 'What is a distributed firewall in a virtualized datacenter?',
      back:  'Firewall rules enforced at each vSwitch (hypervisor), not at a central appliance. Each VM\'s traffic is filtered at its own virtual port — scales with the number of VMs and doesn\'t create a bottleneck.',
      tags:  ['D', 'distributed-firewall', 'vSwitch'],
    },
  ],

  levels: [
    {
      id: 'D-L01', title: 'Virtual Circuits',
      intent:       'Create logical paths with predictable performance across shared infrastructure.',
      mechanic:     'virtualizationLab',
      setup:        { virtualizationTopic: 'virtual-circuits' },
      winCondition: 'Explain virtual-circuit setup, benefits, and trade-offs.',
      difficulty:   1, isBoss: false,
    },
    {
      id: 'D-L02', title: 'VLAN Isolation',
      intent:       'Segment a shared Layer 2 network and carry multiple VLANs across trunk links.',
      mechanic:     'virtualizationLab',
      setup:        { virtualizationTopic: 'vlans' },
      winCondition: 'Preserve broadcast-domain and tenant isolation across the fabric.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'D-L03', title: 'Virtual Networks',
      intent:       'Build independent Layer 2 and Layer 3 tenant networks over one physical datacenter.',
      mechanic:     'virtualizationLab',
      setup:        { virtualizationTopic: 'virtual-networks' },
      winCondition: 'Multiple customers share hardware without leaking traffic.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'D-L04', title: 'Secure VPN Tunnels',
      intent:       'Connect remote employees, branch offices, and cloud networks securely over the Internet.',
      mechanic:     'virtualizationLab',
      setup:        { virtualizationTopic: 'vpns' },
      winCondition: 'Select secure tunneling behavior while accounting for encryption overhead.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'D-L05', title: 'Virtual Switches',
      intent:       'Connect VMs through hypervisor switches and debug virtual-port and VLAN configuration.',
      mechanic:     'virtualizationLab',
      setup:        { virtualizationTopic: 'virtual-switches' },
      winCondition: 'Configure scalable software switching for cloud workloads.',
      difficulty:   4, isBoss: false,
    },
    {
      id: 'D-L06', title: 'VXLAN Overlay Datacenter',
      intent:       'Stretch isolated tenant networks across a routed multi-site physical fabric.',
      mechanic:     'virtualizationLab',
      setup:        { virtualizationTopic: 'overlays' },
      winCondition: 'Maintain tenant identity and connectivity through VM migration.',
      difficulty:   5, isBoss: true,
    },
  ],
}
