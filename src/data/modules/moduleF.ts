// Module F — Exam Practice Questions
// All sample exam questions provided by the instructor, converted to flashcards.
// Topics span: Introduction, Congestion Control, Network Layer, SDN, Network Virtualization,
//              P4 / Programmable Dataplanes, Cloud Computing, TCP/IP Security

import type { ContentModule } from '@/types'

export const moduleF: ContentModule = {
  id:          'F',
  title:       'Exam Practice',
  sourceDeck:  'Instructor Sample Exam Questions',
  description: 'Full-coverage exam-style questions across all course topics.',
  accentClass: 'text-module-e',
  mechanics:   [],
  levels:      [],

  flashcards: [
    // ── Introduction ──────────────────────────────────────────────────────────
    {
      id: 'F-01', type: 'term-definition',
      front: 'Describe the general architecture of the Internet.',
      back: 'The Internet is a network of networks: end hosts connect to access ISPs, which connect to regional ISPs, which connect to global (Tier-1) ISPs. Tier-1 ISPs peer with each other via IXPs. Content providers (e.g., Google) often build private backbones and connect at many IXPs to reach users efficiently.',
      tags: ['F', 'intro', 'architecture'],
    },
    {
      id: 'F-02', type: 'term-definition',
      front: 'Why do we say that the Internet architecture is roughly hierarchical?',
      back: 'Traffic generally flows up from access ISPs → regional ISPs → Tier-1 ISPs and then back down. No single Tier-1 ISP covers the whole globe, so routing is not strictly a tree, but the commercial/peering relationships form a loose hierarchy of stubs, regional, and transit providers.',
      tags: ['F', 'intro', 'hierarchy'],
    },
    {
      id: 'F-03', type: 'term-definition',
      front: 'What is the role of IXPs (Internet Exchange Points)?',
      back: 'IXPs are physical locations where multiple ISPs and networks interconnect and exchange traffic directly (peering), bypassing upstream transit providers. They reduce latency, cut transit costs, and improve redundancy. Major IXPs (e.g., DE-CIX, AMS-IX) handle hundreds of Tbps.',
      tags: ['F', 'intro', 'IXP'],
    },
    {
      id: 'F-04', type: 'term-definition',
      front: 'What is a PoP (Point of Presence) of an ISP? What does it do and what equipment does it typically have?',
      back: 'A PoP is a physical site where an ISP has equipment to connect customers or peer with other ISPs. It contains high-speed routers, optical transmission gear, and sometimes servers. PoPs aggregate local traffic before sending it over the ISP\'s backbone.',
      tags: ['F', 'intro', 'PoP'],
    },

    // ── Congestion Control ────────────────────────────────────────────────────
    {
      id: 'F-05', type: 'term-definition',
      front: 'Summarize the main steps of TCP Reno\'s congestion control algorithm, specifying each phase and what occurs in it.',
      back: `• **Slow Start:** cwnd starts at 1 MSS and doubles each RTT (exponential growth) until it reaches ssthresh or a loss event.
• **Congestion Avoidance:** cwnd grows by 1 MSS per RTT (linear/AIMD) once cwnd ≥ ssthresh.
• **Fast Retransmit:** on 3 duplicate ACKs, retransmit the lost segment immediately without waiting for a timeout.
• **Fast Recovery:** set ssthresh = cwnd/2, cwnd = ssthresh + 3 MSS, then enter congestion avoidance (Reno does NOT drop to 1 on triple-dup-ACK).
• **Timeout:** on RTO expiry, set ssthresh = cwnd/2, cwnd = 1 MSS, restart slow start.`,
      tags: ['F', 'congestion', 'TCP-Reno'],
    },
    {
      id: 'F-06', type: 'term-definition',
      front: 'What is meant by the "fairness" of TCP?',
      back: 'TCP is fair if N flows sharing a bottleneck link each converge to roughly 1/N of the bandwidth. The AIMD mechanism drives flows toward equal shares: additive increase moves all toward the efficiency line; multiplicative decrease keeps them near the fairness line. Fairness holds under equal RTTs; different RTTs break it (short RTTs get more).',
      tags: ['F', 'congestion', 'fairness'],
    },
    {
      id: 'F-07', type: 'term-definition',
      front: 'Using the periodic loss model, derive TCP throughput as a function of RTT and packet loss rate p.',
      back: 'In one cycle of ~(1/√p) segments, the average window is (0.75 × W_max) where W_max = (1/√p) MSS. Throughput = (average window × MSS) / RTT ≈ (1.22 × MSS) / (RTT × √p). So throughput ∝ 1/(RTT · √p): halving RTT or quartering loss rate doubles throughput.',
      tags: ['F', 'congestion', 'throughput', 'derivation'],
    },
    {
      id: 'F-08', type: 'term-definition',
      front: 'What is meant by bandwidth-delay product? Relate this to TCP.',
      back: 'BDP = bandwidth × RTT — the number of bits "in flight" to keep a pipe full. TCP\'s receive window and congestion window must be at least BDP to fully utilise the link. On high-BDP links (e.g., 10 Gbps intercontinental), TCP Reno\'s cwnd grows too slowly after each loss to fill the pipe efficiently.',
      tags: ['F', 'congestion', 'BDP'],
    },
    {
      id: 'F-09', type: 'term-definition',
      front: 'Can TCP Reno efficiently utilize links with high bandwidth-delay products? Why or why not?',
      back: 'No. After a loss event cwnd is halved and must grow back linearly at +1 MSS/RTT. On a 10 Gbps link with 100 ms RTT (BDP = 125,000 packets), recovering from a single loss takes ~125,000 RTTs. A single bit error per 10^10 bits makes steady-state throughput far below line rate.',
      tags: ['F', 'congestion', 'high-BDP', 'TCP-Reno'],
    },
    {
      id: 'F-10', type: 'term-definition',
      front: 'Describe TCP CUBIC\'s congestion window function over time and summarize its key ideas.',
      back: 'CUBIC sets cwnd as a cubic function of time since the last loss: W(t) = C(t − K)³ + W_max, where K = ∛(W_max·β/C). Key ideas: (1) window growth is independent of RTT (fair to long-RTT flows); (2) growth is aggressive far from W_max and cautious near it; (3) after loss, it quickly probes back to the previous W_max then explores beyond it.',
      tags: ['F', 'congestion', 'CUBIC'],
    },
    {
      id: 'F-11', type: 'term-definition',
      front: 'Describe a recent, deployed congestion control algorithm that does not rely directly on packet losses to adjust its congestion window.',
      back: 'BBR (Bottleneck Bandwidth and RTT, Google 2016). BBR estimates the bottleneck bandwidth (max delivery rate) and minimum RTT separately, then sets cwnd = BtlBw × RTprop. It probes for more bandwidth periodically rather than reacting to drops, achieving high throughput and low latency even on paths where buffers are shallow or shared.',
      tags: ['F', 'congestion', 'BBR'],
    },
    {
      id: 'F-12', type: 'compare-two',
      front: 'What are the differences between congestion avoidance and congestion control? Give at least one example of each.',
      back: 'Congestion **control** reacts after congestion is detected (e.g., TCP Reno halving cwnd on loss). Congestion **avoidance** tries to prevent congestion before it occurs (e.g., RED/AQM dropping packets probabilistically before the queue is full, or ECN signalling). Control is reactive; avoidance is proactive.',
      tags: ['F', 'congestion', 'avoidance-vs-control'],
    },
    {
      id: 'F-13', type: 'term-definition',
      front: 'How does DCTCP use ECN? Describe the steps and key ideas.',
      back: `1. Switches mark packets with ECN-CE when queue depth exceeds a threshold K.
2. Receivers echo CE marks back to the sender via the ECE flag in ACKs.
3. The sender maintains α = (1−g)·α + g·F, where F is the fraction of ECN-marked ACKs in one RTT.
4. cwnd is reduced by cwnd·(α/2) — a small, proportional cut instead of halving.
Key idea: react early and proportionally to the *degree* of congestion, keeping queues near zero and latency ultra-low in data centres.`,
      tags: ['F', 'congestion', 'DCTCP', 'ECN'],
    },
    {
      id: 'F-14', type: 'term-definition',
      front: 'Describe RED (Random Early Detection). How does it impact TCP congestion control?',
      back: `RED maintains an average queue length avg_q.
• avg_q < min_th → no action.
• min_th ≤ avg_q < max_th → drop (or mark) packets with probability p proportional to how far avg_q is above min_th.
• avg_q ≥ max_th → drop all packets.
Impact on TCP: early drops trigger TCP\'s congestion response before the queue overflows, reducing synchronised drops and global TCP sawtooth synchronisation. Multiple flows receive independent early signals, spreading their reduction in time.`,
      tags: ['F', 'congestion', 'RED', 'AQM'],
    },

    // ── Network Layer ─────────────────────────────────────────────────────────
    {
      id: 'F-15', type: 'compare-two',
      front: 'What is the difference between routing and forwarding?',
      back: 'Routing (control plane) computes paths — algorithms like OSPF/BGP build forwarding tables over seconds to minutes. Forwarding (data plane) uses those tables to move each packet from an input port to the correct output port in nanoseconds. Routing is global and slow; forwarding is local and fast.',
      tags: ['F', 'network-layer', 'routing', 'forwarding'],
    },
    {
      id: 'F-16', type: 'term-definition',
      front: 'Why is IP called the "waist" of the hourglass model? Draw the hourglass model.',
      back: `Many link-layer technologies (Ethernet, Wi-Fi, optical …) sit below IP; many transport protocols (TCP, UDP, QUIC …) and applications sit above. IP is the single narrow layer both sides must speak, enabling any application over any link.

Hourglass (top→bottom):
  Apps (HTTP, DNS, …)
  Transport (TCP, UDP)
  ━━━━ IP ━━━━  ← waist
  Link (Ethernet, Wi-Fi, …)
  Physical`,
      tags: ['F', 'network-layer', 'hourglass', 'IP'],
    },
    {
      id: 'F-17', type: 'term-definition',
      front: 'Describe how hosts on a subnet in one AS communicate with hosts in another AS. Mention the protocol(s) used in each step.',
      back: `1. Host ARP-resolves its default gateway (ARP within subnet).
2. Packet forwarded inside AS using intra-AS routing (OSPF or IS-IS).
3. Border router runs eBGP to learn routes to the remote AS and installs them in the forwarding table.
4. Packet crosses the inter-AS link; the receiving border router uses iBGP to propagate the route inside the remote AS.
5. Intra-AS routing (OSPF) delivers the packet to the destination subnet.
6. Final ARP resolves the destination host's MAC.`,
      tags: ['F', 'network-layer', 'inter-AS', 'BGP'],
    },
    {
      id: 'F-18', type: 'term-definition',
      front: 'Explain why routing in the Internet may not necessarily be optimal.',
      back: 'BGP routing is policy-driven, not metric-driven. ISPs prefer routes that maximise revenue (e.g., customer routes over peer routes, avoiding transit costs). A packet may travel more hops than the shortest path because the chosen route satisfies business policies, not minimum latency or hop count.',
      tags: ['F', 'network-layer', 'BGP', 'policy'],
    },
    {
      id: 'F-19', type: 'diagram-id',
      front: 'Draw and label the main components of a router. Where does packet queuing and scheduling occur?',
      back: `Components:
• Input ports — line termination, link-layer processing, lookup (TCAM), input queue
• Switching fabric — crossbar, memory, or bus
• Output ports — output queue, scheduler, line termination
• Routing processor — runs routing protocols, manages forwarding table

Queuing & scheduling occur at **output ports** (primary) and can also occur at **input ports** when the fabric is slower than line rate (causing HOL blocking).`,
      tags: ['F', 'network-layer', 'router-architecture'],
    },
    {
      id: 'F-20', type: 'term-definition',
      front: 'Describe the head-of-line (HOL) blocking problem and a solution for it.',
      back: `Problem: in a shared input-queued switch, a packet at the head of an input queue destined for a busy output port blocks all packets behind it, even those destined for free output ports.

Diagram: [In1→Out2 blocked] [In1 packet for Out1 stuck behind it] [Out1 is free]

Solution — Virtual Output Queues (VOQ): each input port maintains a separate FIFO per output port. A scheduling algorithm (e.g., iSLIP) selects a maximum matching each slot. HOL blocking is eliminated because a busy output only blocks its own VOQ, not others.`,
      tags: ['F', 'network-layer', 'HOL', 'VOQ'],
    },
    {
      id: 'F-21', type: 'term-definition',
      front: 'Describe Weighted Fair Queuing (WFQ) in routers. Where is it implemented?',
      back: 'WFQ maintains a separate queue per flow (or class). Each queue is assigned a weight wᵢ. The scheduler services queues in proportion to their weights: a queue with weight 2 gets twice the bandwidth of a queue with weight 1. It approximates Generalised Processor Sharing (GPS) in a packet-by-packet manner. Implemented at **output ports** of routers.',
      tags: ['F', 'network-layer', 'WFQ', 'scheduling'],
    },
    {
      id: 'F-22', type: 'term-definition',
      front: 'Describe the architecture of TCAMs and their pros and cons. How are they used in routers?',
      back: `TCAM (Ternary Content-Addressable Memory): each cell stores 0, 1, or X (don't-care). All entries are compared in parallel against an input in a single clock cycle.

Pros: O(1) lookup speed; handles wildcard/prefix matching natively.
Cons: expensive, power-hungry, limited capacity (typically 1–4 Mb), cannot do complex computation.

In routers: used for longest-prefix match (LPM) in IPv4/IPv6 forwarding, and for ACL/firewall rule matching. Entries are sorted by prefix length (most specific first) so the first match wins.`,
      tags: ['F', 'network-layer', 'TCAM'],
    },

    // ── SDN ───────────────────────────────────────────────────────────────────
    {
      id: 'F-23', type: 'term-definition',
      front: 'What are the two fundamental concepts of SDN? Mention the benefits of each.',
      back: `1. **Control/data plane separation** — the control plane runs on external software controllers, not in each switch. Benefit: centralised view of the network → easier policy, optimisation, and rapid protocol innovation without firmware changes.
2. **Programmable control plane (flow-based forwarding)** — switches match on any header field and execute actions. Benefit: generalised forwarding enables new network functions (firewalls, load balancers, TE) with the same hardware.`,
      tags: ['F', 'SDN', 'fundamentals'],
    },
    {
      id: 'F-24', type: 'diagram-id',
      front: 'Draw the basic architecture of SDN.',
      back: `┌──────────────────────────────────┐
│     Network Applications          │  ← northbound API (REST/gRPC)
│  (OSPF app, TE, firewall app …)   │
├──────────────────────────────────┤
│         SDN Controller            │  ← control plane
│  (topology, flow table mgmt,      │
│   stats, path computation)        │
├──────────────────────────────────┤
│  OpenFlow / southbound API        │
├───────┬───────┬───────┬──────────┤
│  SW1  │  SW2  │  SW3  │  SW4    │  ← data plane (dumb switches)
└───────┴───────┴───────┴──────────┘`,
      tags: ['F', 'SDN', 'architecture'],
    },
    {
      id: 'F-25', type: 'compare-two',
      front: 'Compare destination-based forwarding vs. generalized forwarding. What network functions does generalised forwarding enable?',
      back: `Destination-based: match only on destination IP; action is always "forward out port X".
Generalised: match on any header field (src IP, dst IP, port, MAC, VLAN, …); actions include forward, drop, modify, flood, send-to-controller.

Functions enabled: firewalling, NAT, load balancing, traffic engineering, monitoring/mirroring, VLAN tagging, rate limiting — all in a single programmable flow table.`,
      tags: ['F', 'SDN', 'generalised-forwarding'],
    },
    {
      id: 'F-26', type: 'term-definition',
      front: 'Describe the main functions of SDN controllers. Draw a diagram showing the main layers and elements.',
      back: `Functions: topology discovery (via LLDP), flow-table management, link-state database, statistics collection, path computation, northbound API for apps.

Layers (bottom→top):
  Southbound interface (OpenFlow, NETCONF)
  Core services: topology, stats, device manager
  State/event bus (pub-sub)
  Northbound API (REST)
  Network applications`,
      tags: ['F', 'SDN', 'controller'],
    },
    {
      id: 'F-27', type: 'term-definition',
      front: 'In an SDN network running OSPF as an application, describe what happens when a link fails. List each entity and protocol involved.',
      back: `1. Switch detects link down → sends OpenFlow Port-Status message to **SDN controller** (OpenFlow).
2. Controller updates its **topology graph**.
3. **OSPF application** (northbound) is notified; recomputes shortest paths (Dijkstra).
4. App pushes new flow rules to all affected switches via the controller's southbound API (OpenFlow Flow-Mod messages).
5. Switches update their flow tables; traffic reroutes.`,
      tags: ['F', 'SDN', 'link-failure', 'OSPF'],
    },
    {
      id: 'F-28', type: 'term-definition',
      front: 'What is Traffic Engineering (TE)? Give three examples.',
      back: `TE = controlling how traffic is distributed across network paths to optimise utilisation, latency, or cost.

Examples:
1. Load-balancing flows across parallel equal-cost paths (ECMP).
2. Routing latency-sensitive traffic over low-latency paths even if they are not shortest by hop count.
3. Shifting bulk traffic off peak paths during congested periods (time-of-day routing).`,
      tags: ['F', 'SDN', 'traffic-engineering'],
    },
    {
      id: 'F-29', type: 'term-definition',
      front: 'Give two examples of Network Functions. How does SDN help in managing them?',
      back: `Examples: firewall (packet filtering by 5-tuple) and load balancer (distributing flows to server replicas).

SDN helps by: (1) centralising policy — one controller pushes firewall/LB rules to all switches as flow entries; (2) enabling dynamic, on-the-fly rule updates without per-box CLI configuration; (3) allowing NFs to be placed anywhere in the logical topology regardless of physical switch location.`,
      tags: ['F', 'SDN', 'network-functions'],
    },
    {
      id: 'F-30', type: 'term-definition',
      front: 'Why do major companies like Microsoft and Google use SDN to manage traffic between datacenters?',
      back: 'WAN links between datacenters are expensive and heavily loaded. SDN (e.g., Google B4, Microsoft SWAN) allows centralised traffic engineering: flows are routed in a coordinated, globally optimal way, pushing utilisation to near 100% by shifting non-urgent bulk traffic, whereas distributed BGP/OSPF would leave links ~40–60% utilised due to worst-case headroom.',
      tags: ['F', 'SDN', 'WAN', 'datacenter'],
    },

    // ── Network Virtualization ────────────────────────────────────────────────
    {
      id: 'F-31', type: 'compare-two',
      front: 'Explain the differences between Layer 2 VLANs and complete network virtualization.',
      back: `VLANs: isolate broadcast domains within a single physical L2 domain using an 802.1Q tag. Limited to ~4096 VLANs; hosts must be on the same or connected physical infrastructure.

Complete network virtualization: creates fully isolated virtual networks (each with its own topology, address space, routing protocol) over a shared physical substrate. Uses encapsulation (VXLAN, GRE) to tunnel across the underlay. Supports millions of virtual networks and arbitrary topologies.`,
      tags: ['F', 'virtualization', 'VLAN'],
    },
    {
      id: 'F-32', type: 'term-definition',
      front: 'What are the main building blocks to implement complete network virtualization?',
      back: `1. **Virtual switches** (e.g., Open vSwitch) on each hypervisor host — forward overlay traffic.
2. **Tunneling / encapsulation** (VXLAN, GRE, STT) — encapsulate tenant frames inside UDP/IP for transport across the physical underlay.
3. **Control plane / SDN controller** (e.g., VMware NSX, OpenDaylight) — distributes virtual network state and tunnel endpoints to all vSwitches.
4. **Network hypervisor** — maps virtual network addresses to physical tunnel endpoints (VTEP directory / distributed ARP).`,
      tags: ['F', 'virtualization', 'building-blocks'],
    },
    {
      id: 'F-33', type: 'term-definition',
      front: 'Can we deploy an IPv6 virtual network on a datacenter whose switches only process IPv4? How?',
      back: 'Yes. Use tunneling: encapsulate IPv6 packets inside IPv4 UDP (e.g., VXLAN or GRE). The physical switches see only IPv4 headers and forward normally. Virtual switches at each host encapsulate outgoing IPv6 traffic and decapsulate incoming traffic. The IPv6 network is invisible to the underlay.',
      tags: ['F', 'virtualization', 'IPv6', 'tunneling'],
    },
    {
      id: 'F-34', type: 'term-definition',
      front: 'Can SDN help implement distributed network functions (e.g., firewalls)? What are the advantages and disadvantages?',
      back: `Yes. The SDN controller pushes firewall rules as flow entries to every switch. Traffic is filtered at the ingress switch closest to the source.

Advantages: lower latency (filtering near source), no single bottleneck, easy horizontal scaling, consistent policy from one place.

Disadvantages: increased rule table usage in all switches, policy updates must propagate to many devices (consistency window), more complex rule management, potential for stale rules during failures.`,
      tags: ['F', 'virtualization', 'SDN', 'firewall', 'distributed'],
    },
    {
      id: 'F-35', type: 'term-definition',
      front: 'How do virtual switches optimize longest-prefix matching (LPM)? Draw a diagram and describe.',
      back: `Physical switches use TCAMs for O(1) LPM. Virtual switches (software) cannot use TCAM.

Optimization — **flow caching (microflow cache)**:
1. First packet of a new flow is processed by the slow path (full rule evaluation in software).
2. The resulting action is cached as an exact-match entry (hash table) keyed by 5-tuple.
3. Subsequent packets of the same flow hit the fast-path cache in O(1) — no prefix lookup needed.
4. Cache entries expire on flow timeout.

Diagram: Packet → [Hash table lookup] → hit → fast forward; miss → [Slow-path LPM/OVS classifier] → install cache entry → forward.`,
      tags: ['F', 'virtualization', 'LPM', 'flow-cache', 'OVS'],
    },

    // ── P4 / Programmable Dataplanes ──────────────────────────────────────────
    {
      id: 'F-36', type: 'term-definition',
      front: 'Why would we need P4 to run programs in the data plane of network switches?',
      back: 'Standard protocols (OpenFlow) only match/act on a fixed set of header fields. P4 lets operators define new protocols, custom telemetry (INT), in-network computation (key-value stores, aggregation), and new forwarding behaviours without waiting for vendor firmware. It separates the definition of the forwarding pipeline from the hardware.',
      tags: ['F', 'P4', 'dataplane'],
    },
    {
      id: 'F-37', type: 'diagram-id',
      front: 'Draw the main components of a bare-metal programmable switch.',
      back: `Ports → [Parser] → [Ingress Pipeline (Match-Action tables)] → [Traffic Manager / Queues] → [Egress Pipeline (Match-Action tables)] → [Deparser] → Ports

Additional components:
• Packet headers buffer (PHV — Packet Header Vector)
• Ingress/egress metadata buses
• Control plane CPU (loads table entries via gRPC/P4Runtime)`,
      tags: ['F', 'P4', 'switch-architecture'],
    },
    {
      id: 'F-38', type: 'compare-two',
      front: 'What is the difference between intrinsic metadata and user-defined metadata in P4?',
      back: `Intrinsic metadata: provided by the hardware/architecture (e.g., ingress port, timestamp, packet length, queue depth). Read-only or architecture-defined; available without user declaration.

User-defined metadata: structs declared by the P4 programmer to carry intermediate results between pipeline stages (e.g., a computed hash, a flag set in ingress used by egress). Allocated in the PHV; zero overhead beyond what the programmer declares.`,
      tags: ['F', 'P4', 'metadata'],
    },
    {
      id: 'F-39', type: 'term-definition',
      front: 'Can P4 code support loops? Why or why not?',
      back: 'No. P4 pipelines are deliberately loop-free (acyclic). This guarantees bounded, deterministic processing time — essential for line-rate forwarding. Loops would make worst-case latency unbounded and prevent the compiler from allocating fixed hardware resources. Iteration is instead handled by pipeline recirculation (sending the packet back through the pipeline a known number of times).',
      tags: ['F', 'P4', 'loops'],
    },
    {
      id: 'F-40', type: 'term-definition',
      front: 'Mention at least two constructs that support stateful objects in P4, with a use case for each.',
      back: `1. **Register arrays** — persistent arrays of values readable/writable per packet. Use case: per-flow packet counter or byte counter for telemetry.
2. **Meters** — track sending rate of a flow and mark packets as green/yellow/red. Use case: rate-limiting traffic policing.

(Also: **Counters** — read-only increment-only; use case: match-action hit statistics. **Digest** — send extracted fields to control plane; use case: MAC learning.)`,
      tags: ['F', 'P4', 'stateful'],
    },
    {
      id: 'F-41', type: 'term-definition',
      front: 'What are the main tasks performed by Parsers and Deparsers in P4?',
      back: `**Parser:** extracts header fields from the raw packet bytes into a structured Packet Header Vector (PHV). Implemented as a state machine; each state extracts a fixed-width header and transitions based on field values (e.g., ethertype → IPv4 or IPv6 → TCP or UDP).

**Deparser:** reassembles the (possibly modified) PHV headers back into a byte stream for transmission. Serializes headers in the order specified by the programmer; fills in any fields updated during match-action processing.`,
      tags: ['F', 'P4', 'parser', 'deparser'],
    },
    {
      id: 'F-42', type: 'term-definition',
      front: 'Describe INT (In-Band Network Telemetry). Draw a diagram illustrating the basic idea and mention its benefits.',
      back: `INT embeds telemetry data (queue depth, timestamps, port IDs, etc.) directly into data packets as they traverse the network.

Roles:
• **INT source** (edge switch/host) — adds an INT header to packets.
• **INT transit** switches — append their own metadata (e.g., local queue occupancy, hop latency) to the INT header stack.
• **INT sink** — strips the INT data, forwards the original packet, and exports the telemetry to a collector.

Diagram: Host → [Source adds INT] → [Transit appends stats] → [Transit appends stats] → [Sink strips & reports] → Collector

Benefits: per-packet, per-hop visibility; no out-of-band probing; detects microbursts and congestion in real time; zero packet sampling error.`,
      tags: ['F', 'P4', 'INT', 'telemetry'],
    },

    // ── Cloud Computing ───────────────────────────────────────────────────────
    {
      id: 'F-43', type: 'term-definition',
      front: 'What does "Computing as a Utility" mean? What are the main advantages of cloud computing?',
      back: `Like electricity or water, compute/storage/network is available on demand, metered by use, with no upfront capital. Advantages: (1) elasticity — scale up/down instantly; (2) pay-as-you-go — no stranded capex; (3) economies of scale — providers buy hardware cheaply; (4) global reach; (5) outsourced operations (patching, cooling, power).`,
      tags: ['F', 'cloud', 'utility-computing'],
    },
    {
      id: 'F-44', type: 'diagram-id',
      front: 'Draw a tree-structured datacenter network with 4-port commodity switches supporting at least 4 racks.',
      back: `Core switches (layer 3)
       [C1]   [C2]
       /  \\  /  \\
    [A1]  [A2] [A3]  [A4]   ← Aggregation (layer 2)
    / \\   / \\  / \\  / \\
  [T1][T2][T3][T4][T5][T6][T7][T8]  ← ToR (Top-of-Rack)
  R1  R2  R3  R4  R5  R6  R7  R8   ← Racks

With 4-port switches: each ToR has 2 uplinks + 2 server ports (or more servers with oversubscription). This illustrates the 2-tier fat-tree/3-tier concept; actual designs use k-port switches to scale.`,
      tags: ['F', 'cloud', 'datacenter-network', 'fat-tree'],
    },
    {
      id: 'F-45', type: 'term-definition',
      front: 'Mention two characteristics of software applications that benefit from moving to the cloud.',
      back: `1. **Bursty or unpredictable workloads** — demand spikes (e.g., seasonal retail, viral events) can be handled by elastic scaling rather than over-provisioning on-premises.
2. **Globally distributed user base** — cloud providers have regions worldwide; apps can be deployed close to users to reduce latency without the company building its own PoPs.`,
      tags: ['F', 'cloud', 'application-characteristics'],
    },
    {
      id: 'F-46', type: 'term-definition',
      front: 'What is energy non-proportionality in servers? Which component(s) cause it?',
      back: 'A server draws ~50–70% of peak power even when idle — power consumption does not scale proportionally with utilisation. Caused mainly by the **CPU** (leakage current at idle) and **DRAM** (refresh power). This means idle servers waste energy, motivating consolidation and aggressive power management (sleep states, dynamic voltage/frequency scaling).',
      tags: ['F', 'cloud', 'energy', 'datacenter'],
    },
    {
      id: 'F-47', type: 'term-definition',
      front: 'Define PUE. Why is it a rough metric? What is the ideal value? Name a better metric.',
      back: `PUE = Total facility power / IT equipment power. Ideal value = 1.0 (all power goes to IT).

Shortcomings: it does not account for how efficiently the IT equipment itself does useful work (a datacenter full of idle servers has good PUE but wastes energy). It also varies with weather/load.

Better metric: **CUE** (Carbon Usage Effectiveness) or **ERE** (Energy Reuse Effectiveness), which factor in carbon emissions and heat reuse. Green Grid also proposed **DPPE** (Datacenter Performance per Energy) measuring useful work per joule.`,
      tags: ['F', 'cloud', 'PUE', 'energy'],
    },
    {
      id: 'F-48', type: 'term-definition',
      front: 'What is a container-based datacenter? How is it different? What are its pros and cons?',
      back: `A container-based DC ships pre-built, self-contained modules (shipping-container-sized) with racks, power, and cooling pre-installed. Deployed on a concrete pad with external power/cooling connections.

Differences: faster deployment, modular scaling (add containers), optimised for density, factory-built and tested.

Pros: rapid deployment, modularity, high density, lower construction cost.
Cons: less flexible layout, harder to service individual components, cooling needs external infrastructure, not suitable for all climates without modification.`,
      tags: ['F', 'cloud', 'container-datacenter'],
    },
    {
      id: 'F-49', type: 'fill-table',
      front: 'What is the oversubscription factor in Facebook\'s F16 datacenter? (48 servers/rack, 10 Gbps server links, 100 Gbps ToR uplinks.)',
      back: `Rack bandwidth down (servers → ToR): 48 × 10 Gbps = 480 Gbps
ToR uplink bandwidth: assume 4 × 100 Gbps uplinks = 400 Gbps (F16 uses a 4:1 ratio of uplinks).

Oversubscription = downlink capacity / uplink capacity = 480 / 400 = **1.2 : 1** (approximately).

Note: exact value depends on the number of ToR uplinks in the specific F16 design. With fewer uplinks (e.g., 2 × 100 Gbps = 200 Gbps), oversubscription = 480/200 = 2.4:1.`,
      tags: ['F', 'cloud', 'oversubscription', 'Facebook-F16'],
    },

    // ── TCP/IP Security ───────────────────────────────────────────────────────
    {
      id: 'F-50', type: 'term-definition',
      front: 'What are the four common goals of security? Define each.',
      back: `1. **Confidentiality** — only authorised parties can read the data (encryption).
2. **Integrity** — data cannot be modified undetected in transit (MACs, digital signatures).
3. **Authentication** — verify the identity of communicating parties (certificates, challenge-response).
4. **Availability** — the system/service remains accessible to legitimate users (defence against DoS).`,
      tags: ['F', 'security', 'CIA'],
    },
    {
      id: 'F-51', type: 'term-definition',
      front: 'What are the main sources of vulnerabilities in computer networks?',
      back: `• Protocol design flaws (e.g., TCP trusts source IP; BGP has no origin authentication).
• Implementation bugs (buffer overflows, off-by-one errors in network stacks).
• Configuration errors (open recursive DNS resolvers, default credentials).
• Lack of encryption / authentication in legacy protocols (Telnet, HTTP, RIP).
• Insider threats and compromised infrastructure.`,
      tags: ['F', 'security', 'vulnerabilities'],
    },
    {
      id: 'F-52', type: 'term-definition',
      front: 'Can SSH protect against TCP SYN and RST attacks? If not, how can we defend against them?',
      back: `No. SSH operates above TCP; SYN/RST attacks target the TCP handshake before SSH is established.

Defences:
• **SYN cookies** — server encodes state in the ISN, not in memory; drops half-open connections after timeout.
• **Firewalls / rate limiting** — drop excessive SYN rates from a single source.
• **Ingress filtering (BCP38)** — ISPs drop packets with spoofed source IPs, reducing RST injection.
• **TCP MD5 / TCP-AO** — authenticate TCP segments between known endpoints (e.g., BGP sessions) to prevent RST injection.`,
      tags: ['F', 'security', 'TCP', 'SYN-flood', 'RST'],
    },
    {
      id: 'F-53', type: 'compare-two',
      front: 'What are the main differences between IPSec and TLS tunnels in VPNs? Which is easier to deploy?',
      back: `IPSec: operates at Layer 3 (network layer); tunnels entire IP packets; requires OS/kernel support or dedicated hardware; harder to traverse NAT (needs NAT-T); protects any IP traffic transparently.

TLS (e.g., OpenVPN, WireGuard over TLS): operates at Layer 4–7; uses TUN/TAP to encapsulate IP inside TLS over UDP/TCP; traverses NAT easily; runs in user space; easier to deploy (just install a binary).

**TLS-based VPNs are easier to deploy** — no kernel changes, works through firewalls/NAT, software-only.`,
      tags: ['F', 'security', 'VPN', 'IPSec', 'TLS'],
    },
    {
      id: 'F-54', type: 'compare-two',
      front: 'What are the differences between TUN and TAP virtual network interfaces in Linux?',
      back: `**TUN** (network TUNnel): operates at Layer 3 — handles raw IP packets. Used for routing-based VPNs (OpenVPN routed mode, WireGuard). The OS sees it as a point-to-point IP interface.

**TAP** (network TAP): operates at Layer 2 — handles Ethernet frames. Used when you need to bridge L2 segments over a VPN (OpenVPN bridged mode, KVM VM networking). The OS sees it as an Ethernet interface and can run DHCP, ARP, etc. over it.`,
      tags: ['F', 'security', 'TUN', 'TAP', 'VPN'],
    },
    {
      id: 'F-55', type: 'diagram-id',
      front: 'Draw a diagram illustrating TLS-based VPN basic principles, showing how tunnels are created and at what layer.',
      back: `Client                       VPN Server               Remote Network
 ┌──────┐    TUN/TAP (L3/L2)    ┌──────────┐   Normal IP   ┌──────────┐
 │ App  │ → [IP pkt] →          │          │ → [IP pkt] →  │  Server  │
 │  OS  │   TLS encrypt (L4)    │  Decrypt │               │          │
 │ TUN0 │ ══════TLS over TCP/UDP════════════╗               └──────────┘
 └──────┘  (encapsulated in L4)  └──────────┘

Tunnel creation: client and VPN server complete a TLS handshake (certificate auth); OS routes traffic to the TUN interface; packets are encrypted and encapsulated in TLS/TCP|UDP at L4; VPN server decapsulates and forwards into the remote network at L3.`,
      tags: ['F', 'security', 'VPN', 'TLS', 'diagram'],
    },
    {
      id: 'F-56', type: 'term-definition',
      front: 'Why do we need TUN or TAP to implement a VPN?',
      back: 'A VPN must inject decrypted traffic back into the OS network stack as if it arrived on a real interface — and encrypt outgoing traffic before it leaves. TUN/TAP provides a virtual interface the OS can route/bridge through. Without it, there is no hook to intercept packets inside the kernel stack; a user-space program cannot transparently redirect IP traffic to/from applications.',
      tags: ['F', 'security', 'VPN', 'TUN', 'TAP'],
    },
    {
      id: 'F-57', type: 'term-definition',
      front: 'What are iptables and netfilter in Linux? What can we use them for?',
      back: `**netfilter** is the Linux kernel framework that provides hooks at key points in the packet processing path (PREROUTING, INPUT, FORWARD, OUTPUT, POSTROUTING).

**iptables** is the user-space tool to define rules that netfilter evaluates at those hooks. Rules are organised in tables (filter, nat, mangle) and chains.

Use cases: packet filtering (firewall), NAT/masquerade (SNAT, DNAT), port forwarding, connection tracking (stateful firewall), traffic marking for QoS, logging.`,
      tags: ['F', 'security', 'iptables', 'netfilter', 'Linux'],
    },
    {
      id: 'F-58', type: 'term-definition',
      front: 'What is IP source routing? Explain how it can be used to attack an IP network.',
      back: `IP source routing (loose/strict) allows the sender to specify the path a packet must follow by listing intermediate router IPs in an IP options field.

Attack uses:
• **Spoofing bypass** — attacker specifies a return path through a compromised router, so replies come back to them even though the source IP is spoofed.
• **Firewall bypass** — route packets through routers that are not firewall-protected.
• **Reconnaissance** — map internal network topology via path tracing.

Mitigation: routers should drop (or ignore) packets with source-routing options (RFC 6860 recommends disabling it).`,
      tags: ['F', 'security', 'source-routing', 'attack'],
    },
  ],
}
