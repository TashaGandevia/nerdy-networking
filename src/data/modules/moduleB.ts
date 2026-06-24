// Module B — Software Defined Networking (Deck 5)
// Mechanics: Match-Action, Routing Graph, Topology Canvas
// Topics: control/data-plane separation, OpenFlow, flow tables, traffic engineering, NFV

import type { ContentModule } from '@/types'

export const moduleB: ContentModule = {
  id:          'B',
  title:       'Software Defined Networking',
  sourceDeck:  'Deck 5 — SDN (48 slides)',
  description: 'Play the controller: separate planes, install flow tables, engineer traffic, chain network functions.',
  accentClass: 'text-module-b',
  mechanics:   ['matchAction', 'routingGraph', 'topologyCanvas'],

  flashcards: [
    {
      id: 'B-01', type: 'term-definition',
      front: 'What are the three layers of the SDN architecture?',
      back:  '1. Infrastructure layer (data plane — dumb forwarding switches). 2. Control layer (NOS / controller — computes state, installs rules). 3. Application layer (business logic — routing apps, load balancers, firewalls).',
      tags:  ['B', 'SDN', 'architecture'],
    },
    {
      id: 'B-02', type: 'compare-two',
      front: 'Compare OpenFlow and P4Runtime as southbound APIs.',
      back:  'OpenFlow: controller programs pre-defined match fields and actions on fixed-function switches. P4Runtime: controller programs an arbitrary forwarding pipeline defined by a P4 program — much more flexible but requires programmable hardware.',
      tags:  ['B', 'OpenFlow', 'P4Runtime', 'southbound'],
    },
    {
      id: 'B-03', type: 'term-definition',
      front: 'What is generalized forwarding in SDN?',
      back:  'A single match-action abstraction that can match on *any* header field (L2 src/dst, L3 src/dst, L4 port, VLAN, …) and execute *any* action (forward, drop, modify, encapsulate). One rule set replaces specialised router, switch, firewall, and NAT logic.',
      tags:  ['B', 'generalized-forwarding', 'match-action'],
    },
    {
      id: 'B-04', type: 'which-protocol',
      front: 'A link fails. Describe the controller loop that restores connectivity.',
      back:  '1. Switch detects link failure → sends PORT_STATUS message to controller. 2. Controller recomputes affected paths. 3. Controller pushes new FLOW_MOD messages to affected switches. 4. Switches install new rules; traffic resumes.',
      tags:  ['B', 'link-failure', 'controller-loop'],
    },
    {
      id: 'B-05', type: 'compare-two',
      front: 'What can SDN traffic engineering do that OSPF/ECMP cannot?',
      back:  'SDN can route individual flows onto any path (not just shortest), split traffic across multiple paths in arbitrary ratios, and enforce per-customer policies — OSPF/ECMP only distributes load equally across equal-cost paths.',
      tags:  ['B', 'traffic-engineering', 'ECMP'],
    },
    {
      id: 'B-06', type: 'term-definition',
      front: 'What is NFV and how does service chaining work?',
      back:  'Network Function Virtualisation: run network functions (firewall, IDS, NAT, load balancer) as software on commodity servers instead of dedicated hardware. Service chaining: steer packets through an ordered sequence of VNFs by installing flow rules that forward through each function in turn.',
      tags:  ['B', 'NFV', 'service-chaining'],
    },
    {
      id: 'B-07', type: 'fill-table',
      front: 'Write an OpenFlow rule that drops all TCP traffic arriving on port 80 from 10.0.0.0/8.',
      back:  'Match: ip_src=10.0.0.0/8, ip_proto=TCP, tcp_dst=80. Action: DROP. Priority must be higher than any catch-all forwarding rule.',
      tags:  ['B', 'match-action', 'firewall'],
    },
    {
      id: 'B-08', type: 'term-definition',
      front: 'What is B4 and why did Google build it?',
      back:  'B4 is Google\'s SDN WAN connecting data centres. OSPF/BGPP couldn\'t saturate expensive inter-DC links (max ~30–40% utilisation). B4 uses a centralised controller with full traffic-matrix visibility to route at near-100% utilisation while still meeting priority SLAs.',
      tags:  ['B', 'B4', 'traffic-engineering', 'WAN'],
    },
  ],

  levels: [
    {
      id: 'B-L01', title: 'Install Your First Flow',
      intent:       'As the controller, install a flow rule on a single switch to forward traffic from host A to host B.',
      mechanic:     'matchAction',
      setup:        { template: 'single-switch', hosts: ['A', 'B'] },
      winCondition: 'A matching flow rule installed; packet reaches B.',
      difficulty:   1, isBoss: false,
    },
    {
      id: 'B-L02', title: 'One Switch, Four Roles',
      intent:       'Reconfigure a single bare-metal switch as: (1) L2 switch, (2) IP router, (3) firewall, (4) NAT — by changing only the flow table.',
      mechanic:     'matchAction',
      setup:        { template: 'multi-role', roles: ['l2', 'router', 'firewall', 'nat'] },
      winCondition: 'Each configuration passes its validation test packets.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'B-L03', title: 'Non-Shortest-Path Flow',
      intent:       'Force customer C\'s traffic onto a specific non-shortest path without disrupting other flows.',
      mechanic:     'routingGraph',
      setup:        { template: 'te-basic', flows: 3, targetFlow: 'C' },
      winCondition: 'C\'s traffic follows the designated path; other flows unaffected.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'B-L04', title: 'Service Chain',
      intent:       'Chain a firewall VNF then a NAT VNF for tenant traffic using flow rules.',
      mechanic:     'matchAction',
      setup:        { template: 'service-chain', vnfs: ['firewall', 'nat'] },
      winCondition: 'Tenant traffic passes through both VNFs in order; other traffic bypasses them.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'B-L05', title: 'Link Failure Boss',
      intent:       'A core link fails. Recompute paths and push new flow tables; then prove a priority flow takes a non-shortest path while best-effort flows share the remainder.',
      mechanic:     'routingGraph',
      setup:        { template: 'failure-boss', failLink: 'C-D', priorityFlow: 'tenant-X' },
      winCondition: 'All flows restored within 2 RTTs; tenant-X on designated path; no flow starved.',
      difficulty:   5, isBoss: true,
    },
  ],
}
