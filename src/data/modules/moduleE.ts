// Module E — Programmable Dataplanes & P4 (Deck 4)
// Mechanics: P4 Pipeline Builder, Match-Action
// Topics: fixed vs programmable switches, P4 (parser/ingress/egress/deparser), INT, SwitchML, DPU/RDMA

import type { ContentModule } from '@/types'

export const moduleE: ContentModule = {
  id:          'E',
  title:       'Programmable Dataplanes & P4',
  sourceDeck:  'Deck 4 — Programmable Dataplanes & P4 (66 slides)',
  description: 'Build a P4 pipeline: parser → match-action → deparser. Forward packets, tag telemetry, aggregate in-network.',
  accentClass: 'text-module-e',
  mechanics:   ['p4Pipeline', 'matchAction'],

  flashcards: [
    {
      id: 'E-01', type: 'compare-two',
      front: 'Compare fixed-function and programmable (P4) switches.',
      back:  'Fixed-function: ASIC hardwires the pipeline (parse Ethernet/IP/TCP, match on specific fields, forward/drop). Fast, cheap, inflexible. Programmable: P4 describes the pipeline in software; the chip re-configures parser states and match-action tables. Enables new protocols, in-network computing, INT — at near-ASIC speeds.',
      tags:  ['E', 'P4', 'fixed-vs-programmable'],
    },
    {
      id: 'E-02', type: 'diagram-id',
      front: 'Label the four stages of the P4 V1Model pipeline.',
      back:  '1. Parser — extracts headers from the packet bit-stream into structured header variables. 2. Ingress — match-action processing; decides egress port. 3. Egress — post-routing modifications (TTL decrement, VLAN tag, telemetry). 4. Deparser — reassembles headers back into the packet bit-stream.',
      tags:  ['E', 'P4', 'V1Model', 'pipeline'],
    },
    {
      id: 'E-03', type: 'term-definition',
      front: 'What is INT (In-band Network Telemetry) and how does P4 enable it?',
      back:  'INT inserts telemetry metadata (queue depth, timestamp, egress port) directly into packets as they traverse the network. Fixed switches can\'t do this; P4 programs each switch to read local state and append it to a telemetry header — providing per-packet, per-hop visibility without sampling.',
      tags:  ['E', 'INT', 'telemetry'],
    },
    {
      id: 'E-04', type: 'term-definition',
      front: 'What is SwitchML / in-network aggregation?',
      back:  'Run gradient aggregation for ML training directly on programmable switches. Worker nodes send partial gradient vectors; the switch accumulates them using P4 registers and sends the aggregated result to the parameter server — reducing traffic volume and training time vs. all-reduce through the server.',
      tags:  ['E', 'SwitchML', 'in-network-compute'],
    },
    {
      id: 'E-05', type: 'compare-two',
      front: 'What is the difference between a NIC, SmartNIC, and DPU?',
      back:  'NIC: simple hardware, moves packets between wire and host memory. SmartNIC: adds programmable offload (e.g. VXLAN encap, RSS) with small embedded cores. DPU (Data Processing Unit): full SoC — runs a separate OS, can offload storage, security, and virtualisation functions entirely off the host CPU.',
      tags:  ['E', 'NIC', 'SmartNIC', 'DPU'],
    },
    {
      id: 'E-06', type: 'term-definition',
      front: 'What is RDMA and why does it matter for GPU clusters?',
      back:  'Remote Direct Memory Access: transfers data directly between the memory of two machines without involving the CPU or OS on either end. In GPU clusters (GPUDirect RDMA), GPUs write gradients directly into remote GPU memory over the network — near-zero CPU overhead and μs latency, essential for tight ML training loops.',
      tags:  ['E', 'RDMA', 'RoCE', 'GPUDirect'],
    },
    {
      id: 'E-07', type: 'fill-table',
      front: 'Write a P4 match-action table for longest-prefix-match IPv4 forwarding.',
      back:  'table ipv4_lpm { key = { hdr.ipv4.dstAddr: lpm; } actions = { ipv4_forward; drop; } size = 1024; default_action = drop; } action ipv4_forward(egressSpec_t port, macAddr_t dstMac) { standard_metadata.egress_spec = port; hdr.ethernet.srcAddr = hdr.ethernet.dstAddr; hdr.ethernet.dstAddr = dstMac; hdr.ipv4.ttl = hdr.ipv4.ttl - 1; }',
      tags:  ['E', 'P4', 'LPM', 'match-action'],
    },
    {
      id: 'E-08', type: 'term-definition',
      front: 'What are P4 registers and what makes them different from table entries?',
      back:  'Registers are stateful arrays in the data plane that can be read and written per-packet without controller involvement. Table entries are static (written by the control plane). Registers enable per-flow counting, rate limiting, sketches (HyperLogLog, count-min), and in-network aggregation — persistent state that updates at line rate.',
      tags:  ['E', 'P4', 'registers', 'stateful'],
    },
  ],

  levels: [
    {
      id: 'E-L01', title: 'Build the Parser',
      intent:       'Connect parser states: start → ethernet → ipv4 → tcp/udp. Validate that test packets extract the right headers.',
      mechanic:     'p4Pipeline',
      setup:        { stage: 'parser', headers: ['ethernet', 'ipv4', 'tcp', 'udp'], testPackets: 4 },
      winCondition: 'All test packets extract correct headers; invalid packets remain unextracted.',
      difficulty:   1, isBoss: false,
    },
    {
      id: 'E-L02', title: 'LPM Forwarding Table',
      intent:       'Define an ipv4_lpm table and populate entries so test packets reach the correct egress ports.',
      mechanic:     'p4Pipeline',
      setup:        { stage: 'ingress', tableType: 'lpm', entries: 4, testPackets: 6 },
      winCondition: 'All test packets forwarded to the correct port; no false drops.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'E-L03', title: 'MAC Rewrite + TTL Decrement',
      intent:       'Build an ipv4_forward action that rewrites src/dst MAC and decrements TTL. Verify with test packets.',
      mechanic:     'p4Pipeline',
      setup:        { stage: 'ingress', action: 'ipv4_forward', fields: ['srcMac', 'dstMac', 'ttl'], testPackets: 4 },
      winCondition: 'Output packets have correct MAC rewrite and TTL decremented by 1.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'E-L04', title: 'Multi-Table Pipeline',
      intent:       'Chain ipv4_lpm → mac_fwd as two separate tables. Build both and wire them in the ingress control block.',
      mechanic:     'p4Pipeline',
      setup:        { stage: 'ingress', tables: ['ipv4_lpm', 'mac_fwd'], testPackets: 6 },
      winCondition: 'Packets traverse both tables; correct port and MAC on output.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'E-L05', title: 'INT Telemetry Tag',
      intent:       'Add an egress stage that appends an INT header with queue depth and timestamp. Verify the deparser re-emits it.',
      mechanic:     'p4Pipeline',
      setup:        { stage: 'egress', feature: 'INT', intFields: ['queue_depth', 'timestamp'], testPackets: 3 },
      winCondition: 'Output packets contain correct INT header values.',
      difficulty:   4, isBoss: false,
    },
    {
      id: 'E-L06', title: 'Full Pipeline Boss',
      intent:       'Assemble a complete pipeline: parse Ethernet+IPv4+TCP, LPM forwarding, MAC rewrite + TTL--, INT tagging — then pass a 10-packet test suite.',
      mechanic:     'p4Pipeline',
      setup:        { stage: 'full', features: ['parser', 'lpm', 'mac-rewrite', 'ttl-dec', 'INT'], testPackets: 10 },
      winCondition: 'All 10 test packets produce correct output headers; 0 failures.',
      difficulty:   5, isBoss: true,
    },
  ],
}
