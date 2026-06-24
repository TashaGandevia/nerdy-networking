// Module A — Network Layer (Deck 1)
// Mechanics: Address Space, Topology Canvas, Routing Graph, Router Internals
// Topics: IPv4, CIDR, DHCP, Dijkstra, Bellman-Ford, BGP, router architecture

import type { ContentModule } from '@/types'

export const moduleA: ContentModule = {
  id:          'A',
  title:       'Network Layer',
  sourceDeck:  'Deck 1 — Network Layer (67 slides)',
  description: 'IPv4 addressing, CIDR, intra-AS and inter-AS routing, and router internals.',
  accentClass: 'text-module-a',
  mechanics:   ['addressSpace', 'topologyCanvas', 'routingGraph', 'routerInternals'],

  flashcards: [
    {
      id: 'A-01', type: 'term-definition',
      front: 'What is the difference between forwarding and routing?',
      back:  'Forwarding is the data-plane action of moving a packet from an input port to the correct output port (nanoseconds). Routing is the control-plane process of computing paths across the network (seconds to minutes).',
      tags:  ['A', 'forwarding', 'routing'],
    },
    {
      id: 'A-02', type: 'term-definition',
      front: 'What does CIDR stand for, and what problem does it solve?',
      back:  'Classless Inter-Domain Routing. It replaces fixed class boundaries (A/B/C) with variable-length prefix lengths, enabling efficient address allocation and route aggregation.',
      tags:  ['A', 'CIDR', 'addressing'],
    },
    {
      id: 'A-03', type: 'which-protocol',
      front: 'Which routing protocol uses Dijkstra\'s algorithm and distributes link-state advertisements to all routers in an AS?',
      back:  'OSPF (Open Shortest Path First) — and also IS-IS. Both are link-state protocols that flood LSAs and run Dijkstra locally.',
      tags:  ['A', 'OSPF', 'link-state', 'intra-AS'],
    },
    {
      id: 'A-04', type: 'which-protocol',
      front: 'Which routing protocol uses Bellman-Ford / distance-vector and shares routing tables only with direct neighbours?',
      back:  'RIP (Routing Information Protocol). Each router tells neighbours its distance vector; convergence is slower and prone to count-to-infinity.',
      tags:  ['A', 'RIP', 'distance-vector', 'intra-AS'],
    },
    {
      id: 'A-05', type: 'compare-two',
      front: 'Compare iBGP and eBGP.',
      back:  'eBGP runs between routers in *different* ASes; iBGP runs between routers *within* the same AS. eBGP TTL=1 by default; iBGP requires full mesh (or route reflectors). Both use path-vector and policy-driven route selection.',
      tags:  ['A', 'BGP', 'inter-AS'],
    },
    {
      id: 'A-06', type: 'term-definition',
      front: 'What is longest-prefix match, and why does it require TCAM?',
      back:  'The router selects the forwarding-table entry whose prefix most specifically matches the destination IP. TCAM (ternary CAM) enables parallel lookup across all entries in O(1) using wildcard bits.',
      tags:  ['A', 'LPM', 'TCAM', 'forwarding'],
    },
    {
      id: 'A-07', type: 'term-definition',
      front: 'What is HOL blocking and how does VOQ solve it?',
      back:  'Head-of-Line (HOL) blocking: a packet at the head of an input queue destined for a busy output blocks packets behind it destined for free outputs. Virtual Output Queues (VOQ) give each input a separate queue per output port, so blocked packets don\'t delay others.',
      tags:  ['A', 'HOL', 'VOQ', 'router-internals'],
    },
    {
      id: 'A-08', type: 'fill-table',
      front: 'A router has entries: 192.168.1.0/24 → eth0, 192.168.0.0/16 → eth1, 0.0.0.0/0 → eth2. Where is 192.168.1.55 forwarded?',
      back:  'eth0 — /24 is a longer prefix than /16, so longest-prefix match selects it.',
      tags:  ['A', 'LPM', 'forwarding'],
    },
    {
      id: 'A-09', type: 'term-definition',
      front: 'Describe the four steps of DHCP discovery.',
      back:  'DISCOVER (client broadcast) → OFFER (server unicast/broadcast) → REQUEST (client selects offer, broadcasts) → ACK (server confirms lease). Mnemonic: DORA.',
      tags:  ['A', 'DHCP', 'addressing'],
    },
    {
      id: 'A-10', type: 'compare-two',
      front: 'Compare distributed vs. centralized routing control.',
      back:  'Distributed: each router runs its own algorithm (OSPF, RIP, BGP) — no single point of failure, scales to the Internet. Centralized: a controller computes paths for all nodes (SDN) — global visibility, easier policy enforcement, single point of failure unless replicated.',
      tags:  ['A', 'control-plane', 'SDN'],
    },
  ],

  levels: [
    {
      id: 'A-L01', title: 'First Address Block',
      intent:       'Allocate a /24 block into four equal subnets.',
      mechanic:     'addressSpace',
      setup:        { block: '10.0.0.0/24', requiredSubnets: 4, mode: 'equal' },
      winCondition: 'Four valid /26 subnets carved from 10.0.0.0/24 with no overlap.',
      difficulty:   1, isBoss: false,
    },
    {
      id: 'A-L02', title: 'VLSM — Three Departments',
      intent:       'Carve 192.168.10.0/24 for three departments: 100 hosts, 50 hosts, 10 hosts — minimize waste.',
      mechanic:     'addressSpace',
      setup:        { block: '192.168.10.0/24', requirements: [100, 50, 10], mode: 'vlsm' },
      winCondition: 'Valid non-overlapping subnets sized for each department, within the parent block.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'A-L03', title: 'Wire the Office',
      intent:       'Connect the three workstations through the office router so they can all reach each other. Click a node to select it, then click another to draw a link.',
      mechanic:     'topologyCanvas',
      setup:        { template: 'office' },
      winCondition: 'All hosts reachable from each other.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'A-L03B', title: 'Ring Resilience',
      intent:       'Wire four routers into a ring topology — each router must have at least 2 links so there are redundant paths between both hosts.',
      mechanic:     'topologyCanvas',
      setup:        { template: 'ring', minRedundancy: 2 },
      winCondition: 'All hosts reachable; every router has ≥ 2 links.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'A-L03C', title: 'Backbone Boss',
      intent:       'Connect the two core routers and three edge routers to all four branch sites — but you only have 9 links to spend. Plan carefully.',
      mechanic:     'topologyCanvas',
      setup:        { template: 'backbone', maxLinks: 9 },
      winCondition: 'All hosts reachable with ≤ 9 total links.',
      difficulty:   4, isBoss: true,
    },
    {
      id: 'A-L04', title: 'Dijkstra Step-through',
      intent:       'Run Dijkstra on a 6-node graph and fill the forwarding table for router A.',
      mechanic:     'routingGraph',
      setup:        { algorithm: 'dijkstra', nodes: 6, template: 'ospf-basic' },
      winCondition: 'Correct shortest-path forwarding table for all destinations.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'A-L05', title: 'Count to Infinity',
      intent:       'A link fails — watch RIP count to infinity and apply split-horizon to fix it.',
      mechanic:     'routingGraph',
      setup:        { algorithm: 'bellmanFord', template: 'count-to-infinity', failLink: 'A-B' },
      winCondition: 'Convergence achieved without count-to-infinity; split-horizon rule applied.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'A-L06', title: 'BGP Policy Boss',
      intent:       'Configure BGP export policies so customer traffic prefers your backbone, not a competitor.',
      mechanic:     'routingGraph',
      setup:        { algorithm: 'bgp', template: 'policy-boss', ases: 4 },
      winCondition: 'Traffic follows policy (not shortest path); no customer routes leaked to peers.',
      difficulty:   4, isBoss: true,
    },
    {
      id: 'A-L07', title: 'Expand HQ — Boss',
      intent:       'A new department needs 60 hosts. Re-subnet the existing /24 without breaking current allocations, minimizing waste.',
      mechanic:     'addressSpace',
      setup:        { block: '10.10.0.0/24', existing: ['10.10.0.0/26', '10.10.0.64/26'], addHosts: 60, mode: 'vlsm' },
      winCondition: 'New subnet fits in remaining space; no existing ranges disturbed; waste < 10%.',
      difficulty:   4, isBoss: true,
    },
    {
      id: 'A-L08', title: 'HOL Blocking',
      intent:       'Watch HOL blocking happen live. Input 1\'s first packet competes with Input 0 for the same output — everything behind it is stuck. Step through 6 slots and observe the low throughput.',
      mechanic:     'routerInternals',
      setup:        {
        mode: 'hol',
        // Classic HOL pattern: I0 always wants O0; I1 wants O0 first (blocks its O1 packets); I2 wants O2
        queues: [[0, 0, 0, 0], [0, 1, 1, 1], [2, 2, 2, 2]],
        targetThroughput: 0,
        maxSlots: 6,
      },
      winCondition: 'Complete all 6 slots. Notice Input 1 is HOL-blocked every slot.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'A-L09', title: 'VOQ to the Rescue',
      intent:       'The same adversarial traffic pattern, but this time try VOQ mode. Each input keeps a separate queue per output port — no packet blocks another destined for a free output. Achieve ≥ 85% throughput.',
      mechanic:     'routerInternals',
      setup:        {
        mode: 'both',
        queues: [[0, 0, 0, 0], [0, 1, 1, 1], [2, 2, 2, 2]],
        targetThroughput: 0.85,
        maxSlots: 8,
      },
      winCondition: 'Deliver ≥ 85% of packets. Only achievable in VOQ mode.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'A-L10', title: 'Crossbar Boss',
      intent:       'Adversarial uniform traffic — every input wants every output equally. Prove VOQ achieves maximum throughput (100%) while FIFO/HOL staggers. Deliver all packets.',
      mechanic:     'routerInternals',
      setup:        {
        mode: 'both',
        queues: [[0, 1, 2, 0, 1, 2], [1, 2, 0, 1, 2, 0], [2, 0, 1, 2, 0, 1]],
        targetThroughput: 0.9,
        maxSlots: 12,
      },
      winCondition: 'Deliver ≥ 90% of all 18 packets. Requires VOQ mode.',
      difficulty:   4, isBoss: true,
    },
  ],
}
