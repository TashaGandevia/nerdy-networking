// Module C — SDN Concepts, Protocols, Use Cases (Deck 3)
// Mechanics: Match-Action, Routing Graph, Topology Canvas
// Topics: control/data-plane separation, OpenFlow, flow tables, traffic engineering, NFV

import type { ContentModule } from '@/types'

export const moduleC: ContentModule = {
  id:          'C',
  title:       'Software Defined Networking',
  sourceDeck:  'Deck 3 — SDN Concepts, Protocols, Use Cases (48 slides)',
  description: 'Play the controller: separate planes, install flow tables, engineer traffic, chain network functions.',
  accentClass: 'text-module-c',
  mechanics:   ['sdnSimulator'],

  flashcards: [
    {
      id: 'C-01', type: 'term-definition',
      front: 'What are the three layers of the SDN architecture?',
      back:  '1. Infrastructure layer (data plane — dumb forwarding switches). 2. Control layer (NOS / controller — computes state, installs rules). 3. Application layer (business logic — routing apps, load balancers, firewalls).',
      tags:  ['C', 'SDN', 'architecture'],
    },
    {
      id: 'C-02', type: 'compare-two',
      front: 'Compare OpenFlow and P4Runtime as southbound APIs.',
      back:  'OpenFlow: controller programs pre-defined match fields and actions on fixed-function switches. P4Runtime: controller programs an arbitrary forwarding pipeline defined by a P4 program — much more flexible but requires programmable hardware.',
      tags:  ['C', 'OpenFlow', 'P4Runtime', 'southbound'],
    },
    {
      id: 'C-03', type: 'term-definition',
      front: 'What is generalized forwarding in SDN?',
      back:  'A single match-action abstraction that can match on *any* header field (L2 src/dst, L3 src/dst, L4 port, VLAN, …) and execute *any* action (forward, drop, modify, encapsulate). One rule set replaces specialised router, switch, firewall, and NAT logic.',
      tags:  ['C', 'generalized-forwarding', 'match-action'],
    },
    {
      id: 'C-04', type: 'which-protocol',
      front: 'A link fails. Describe the controller loop that restores connectivity.',
      back:  '1. Switch detects link failure → sends PORT_STATUS message to controller. 2. Controller recomputes affected paths. 3. Controller pushes new FLOW_MOD messages to affected switches. 4. Switches install new rules; traffic resumes.',
      tags:  ['C', 'link-failure', 'controller-loop'],
    },
    {
      id: 'C-05', type: 'compare-two',
      front: 'What can SDN traffic engineering do that OSPF/ECMP cannot?',
      back:  'SDN can route individual flows onto any path (not just shortest), split traffic across multiple paths in arbitrary ratios, and enforce per-customer policies — OSPF/ECMP only distributes load equally across equal-cost paths.',
      tags:  ['C', 'traffic-engineering', 'ECMP'],
    },
    {
      id: 'C-06', type: 'term-definition',
      front: 'What is NFV and how does service chaining work?',
      back:  'Network Function Virtualisation: run network functions (firewall, IDS, NAT, load balancer) as software on commodity servers instead of dedicated hardware. Service chaining: steer packets through an ordered sequence of VNFs by installing flow rules that forward through each function in turn.',
      tags:  ['C', 'NFV', 'service-chaining'],
    },
    {
      id: 'C-07', type: 'fill-table',
      front: 'Write an OpenFlow rule that drops all TCP traffic arriving on port 80 from 10.0.0.0/8.',
      back:  'Match: ip_src=10.0.0.0/8, ip_proto=TCP, tcp_dst=80. Action: DROP. Priority must be higher than any catch-all forwarding rule.',
      tags:  ['C', 'match-action', 'firewall'],
    },
    {
      id: 'C-08', type: 'term-definition',
      front: 'What is B4 and why did Google build it?',
      back:  'B4 is Google\'s SDN WAN connecting data centres. OSPF/BGPP couldn\'t saturate expensive inter-DC links (max ~30–40% utilisation). B4 uses a centralised controller with full traffic-matrix visibility to route at near-100% utilisation while still meeting priority SLAs.',
      tags:  ['C', 'B4', 'traffic-engineering', 'WAN'],
    },
  ],

  levels: [
    {
      id: 'C-L01', title: 'Network Growth Simulator',
      intent:       'Experience why manual device-by-device configuration stops scaling as NovaNet grows.',
      mechanic:     'sdnSimulator',
      setup:        { game: 'growth', mission: 'growth' },
      winCondition: 'Explain how centralized control reduces network-management complexity.',
      difficulty:   1, isBoss: false,
    },
    {
      id: 'C-L02', title: 'Packet Detective',
      intent:       'Inspect packet headers and identify which flow entry determines the outcome.',
      mechanic:     'sdnSimulator',
      setup:        { game: 'packet-detective', mission: 'flow-rule' },
      winCondition: 'Correctly predict packet matches, priority, and actions.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'C-L03', title: 'Header Match Challenge',
      intent:       'Choose the correct header field for routing, firewall, and generalized-forwarding policies.',
      mechanic:     'sdnSimulator',
      setup:        { game: 'header-match', mission: 'generalized-forwarding' },
      winCondition: 'Identify relevant fields across link, network, and transport headers.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'C-L04', title: 'Flow Rule Builder',
      intent:       'Translate forwarding, blocking, and redirection missions into match-action rules.',
      mechanic:     'sdnSimulator',
      setup:        { game: 'flow-builder', mission: 'flow-rule' },
      winCondition: 'Build the correct match and action for each requested policy.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'C-L05', title: 'Controller Dashboard',
      intent:       'Operate controller events, shared network state, and northbound and southbound APIs.',
      mechanic:     'sdnSimulator',
      setup:        { game: 'controller-dashboard', mission: 'controller-event' },
      winCondition: 'Correctly trace events and requests through the controller architecture.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'C-L06', title: 'Wildcard Puzzle',
      intent:       'Compress equivalent flow entries using safe masks and wildcards.',
      mechanic:     'sdnSimulator',
      setup:        { game: 'wildcard', mission: 'flow-optimizer' },
      winCondition: 'Reduce TCAM usage without changing forwarding behavior.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'C-L07', title: 'Traffic Engineering',
      intent:       'Use global congestion, latency, and capacity information to choose better paths.',
      mechanic:     'sdnSimulator',
      setup:        { game: 'traffic-engineering', mission: 'routing-explorer' },
      winCondition: 'Reroute traffic to improve overall network performance.',
      difficulty:   4, isBoss: false,
    },
    {
      id: 'C-L08', title: 'Build the Controller',
      intent:       'Assemble applications, state management, APIs, the controller, and switches.',
      mechanic:     'sdnSimulator',
      setup:        { game: 'build-controller', mission: 'stack' },
      winCondition: 'Place controller components and interfaces in the correct architecture.',
      difficulty:   4, isBoss: false,
    },
    {
      id: 'C-L09', title: 'Policy Builder',
      intent:       'Convert employee, guest, finance, payroll, and database requirements into network policy.',
      mechanic:     'sdnSimulator',
      setup:        { game: 'policy-builder', mission: 'admin' },
      winCondition: 'Create precise allow and deny behavior for each traffic class.',
      difficulty:   4, isBoss: false,
    },
    {
      id: 'C-L10', title: 'Packet Race',
      intent:       'Predict simultaneous packet outcomes, priority resolution, modification, forwarding, and drops.',
      mechanic:     'sdnSimulator',
      setup:        { game: 'packet-race', mission: 'packet-race' },
      winCondition: 'SSH is dropped, HTTPS reaches payroll, and DNS is redirected to the resolver.',
      difficulty:   5, isBoss: true,
    },
  ],
}
