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
  mechanics:   ['topologyCanvas', 'matchAction'],

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
      id: 'D-L01', title: 'VLAN Port Assignment',
      intent:       'Assign switch ports to VLAN 10 (sales) and VLAN 20 (engineering) so they cannot communicate.',
      mechanic:     'matchAction',
      setup:        { template: 'vlan-isolation', vlans: [10, 20], ports: 8 },
      winCondition: 'Hosts in the same VLAN can ping each other; cross-VLAN pings are dropped.',
      difficulty:   1, isBoss: false,
    },
    {
      id: 'D-L02', title: '802.1Q Trunk',
      intent:       'Configure a trunk port between two switches carrying both VLANs; verify isolation still holds end-to-end.',
      mechanic:     'topologyCanvas',
      setup:        { template: 'trunk-link', vlans: [10, 20], switches: 2 },
      winCondition: 'Both VLANs pass across the trunk; intra-VLAN reachability holds; inter-VLAN blocked.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'D-L03', title: 'Tunnel Two Tenants',
      intent:       'Two tenants share the same physical network but have overlapping 10.0.0.0/24 ranges. Set up VXLAN tunnels to keep them isolated.',
      mechanic:     'topologyCanvas',
      setup:        { template: 'vxlan-overlay', tenants: 2, overlap: true },
      winCondition: 'Each tenant can reach its own hosts; cross-tenant traffic is blocked.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'D-L04', title: 'Overlapping IP Boss',
      intent:       'Three tenants with overlapping IPs, one shared L4 load balancer, one distributed firewall rule per tenant — all on the same physical fabric.',
      mechanic:     'matchAction',
      setup:        { template: 'multi-tenant-boss', tenants: 3, vnfs: ['firewall', 'load-balancer'] },
      winCondition: 'All tenants isolated, firewall rules enforced per-tenant, LB reachable from all three.',
      difficulty:   5, isBoss: true,
    },
  ],
}
