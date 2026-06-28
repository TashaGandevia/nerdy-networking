// Module E — Programmable Dataplanes and P4 (Deck 5)
// Mechanics: P4 Pipeline Builder, Match-Action
// Topics: fixed vs programmable switches, P4 (parser/ingress/egress/deparser), INT, SwitchML, DPU/RDMA

import type { ContentModule } from '@/types'

export const moduleE: ContentModule = {
  id:          'E',
  title:       'Programmable Dataplanes & P4',
  sourceDeck:  'Deck 5 — Programmable Dataplanes and P4 (66 slides)',
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
      id: 'E-L01', title: 'Why Program the Dataplane?',
      intent:       'Trace the management problem from growing traditional networks to centralized programmable control.',
      mechanic:     'p4Pipeline',
      setup:        { questionTopic: 'networking-problem', stage: 'parser' },
      winCondition: 'Explain the management motivation for programmable networks.',
      difficulty:   1, isBoss: false,
    },
    {
      id: 'E-L02', title: 'Headers & Abstractions',
      intent:       'Inspect encapsulated packets and the graph abstractions used by programmable pipelines.',
      mechanic:     'p4Pipeline',
      setup:        { questionTopic: 'abstractions', stage: 'parser' },
      winCondition: 'Identify protocol layers, headers, and topology abstractions.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'E-L03', title: 'Data Plane Forwarding',
      intent:       'Follow packets through hardware forwarding decisions and table-miss behavior.',
      mechanic:     'p4Pipeline',
      setup:        { questionTopic: 'forwarding', stage: 'ingress' },
      winCondition: 'Distinguish line-rate data-plane execution from control-plane decisions.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'E-L04', title: 'Match-Action Programming',
      intent:       'Program flexible matches, actions, and priorities across packet headers.',
      mechanic:     'p4Pipeline',
      setup:        { questionTopic: 'match-action', stage: 'ingress' },
      winCondition: 'Resolve overlapping rules and select correct packet actions.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'E-L05', title: 'Flow Tables & TCAM',
      intent:       'Optimize hardware flow tables with priorities, masks, and wildcard aggregation.',
      mechanic:     'p4Pipeline',
      setup:        { questionTopic: 'flow-tables', stage: 'ingress' },
      winCondition: 'Preserve line-rate behavior while reducing scarce TCAM usage.',
      difficulty:   4, isBoss: false,
    },
    {
      id: 'E-L06', title: 'Network OS & P4 Control',
      intent:       'Connect applications, shared network state, controller APIs, and programmable switches.',
      mechanic:     'p4Pipeline',
      setup:        { questionTopic: 'network-os', stage: 'full' },
      winCondition: 'Explain how controller services consistently program the P4 data plane.',
      difficulty:   4, isBoss: false,
    },
    {
      id: 'E-L07', title: 'Code Builder IDE',
      intent:       'Build complete packet-processing programs with visual match, action, logic, metadata, and pipeline blocks.',
      mechanic:     'p4Pipeline',
      setup:        { codeBuilder: true, stage: 'full' },
      winCondition: 'The visual program produces the requested behavior for every test packet.',
      difficulty:   5, isBoss: true,
    },
  ],
}
