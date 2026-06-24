// Seed content for the Study Zone — subsections per module.
// Each subsection has a markdown body the user can edit (overrides persisted
// to localStorage via useStudyStore). Empty bodies are placeholders waiting
// for the user to add their own notes.

export interface SubsectionSeed {
  id:    string     // stable; used as the localStorage key
  title: string
  body:  string
}

export interface ModuleSection {
  moduleId:    string   // 'A' | 'B' | 'C' | 'D' | 'E'
  moduleTitle: string
  subsections: SubsectionSeed[]
}

const AIMD_BODY = `## Foundations + AIMD

**The goal (what we're forcing to happen):**
- Congestion avoidance must grow the window by **exactly 1 MSS per RTT** — no more, no less
- That's the "additive" in AIMD

**The constraint (what TCP actually has to work with):**
- TCP doesn't act once per RTT — it reacts **per ACK**, as ACKs trickle back
- So it must spread that "+1 MSS" across all the ACKs in one RTT

**The derivation (why the formula is what it is):**
- ACKs per RTT ≈ \`W / MSS\` (one ACK per in-flight segment), call it \`N\`
- We want the N nudges to sum to MSS, so each nudge = \`MSS / N\`
- Substitute \`N = W/MSS\`:  \`MSS / (W/MSS) = MSS²/W = MSS × (MSS/W)\` ← **that's the formula**
- Check with the picture: W=4000, MSS=1000 → N=4, each nudge = 1000²/4000 = 250 B, ×4 = **1000 B = 1 MSS** ✓

**Why the leading \`MSS\` matters (units):**
- \`MSS/W\` is just a **fraction** (dimensionless) — adding that to a byte count is meaningless
- Multiplying by MSS turns it back into **bytes**, so the math is dimensionally correct

**In segment units it's cleaner:**
- If you track the window in *segments* (\`cwnd = W/MSS\`), the rule is simply: \`cwnd += 1/cwnd\` per ACK
- Same idea: \`cwnd\` ACKs × \`1/cwnd\` = +1 segment per RTT

**Self-clocking — the deeper point:**
- The **ACK is the trigger** — new data goes out when an ACK comes back
- Growth is paced by **actual delivery**, not a wall-clock timer
- *Why this is good:* if the network is slow, ACKs return slowly, so the window grows slowly too — TCP automatically matches the path's real pace. The network itself "clocks" the sender.

**Why it's the *additive* (linear) phase, not exponential:**
- Bigger W → bigger denominator → **smaller** per-ACK nudge
- So no matter how large the window, each RTT adds just 1 MSS → **straight-line growth**
- Contrast: slow start adds a *full* MSS per ACK (no \`/W\`), so it **doubles** each RTT → exponential

---

### Two subtleties worth knowing (the "why it's approximate")

**1. W changes during the RTT.**
- W sits in the denominator, but it's creeping up as ACKs arrive within the same RTT
- Strictly you'd integrate; in practice the per-RTT change (+1 MSS) is tiny next to a large window, so treating W as constant for one RTT gives ≈ exactly 1 MSS. Error is negligible for big windows.

**2. Delayed ACKs break the "1 ACK per segment" assumption.**
- Many receivers ACK every **2** segments → you get ~half as many ACKs → window would grow at only ~½ MSS/RTT
- Fix used in real stacks: **Appropriate Byte Counting** (RFC 3465) — increment based on *bytes acknowledged*, not number of ACKs, so growth stays at 1 MSS/RTT regardless of delayed ACKs

---

### Review questions

1. In **slow start**, the per-ACK rule drops the \`/W\` and just does \`CongWin += MSS\` per ACK. Using W=4000, MSS=1000 — how much does the window grow over one RTT, and what shape is that growth?

2. Why does the *same* per-ACK formula produce a **smaller** nudge as the connection runs longer (window gets bigger)? One sentence on the mechanism.
`

export const STUDY_SECTIONS: ModuleSection[] = [
  {
    moduleId:    'A',
    moduleTitle: 'Congestion Control and TCP Performance',
    subsections: [
      { id: 'A-1-foundations-aimd',    title: 'Foundations + AIMD',                                  body: AIMD_BODY },
      { id: 'A-2-slow-start',          title: 'Slow Start + Tahoe/Reno (the full algorithm)',        body: '' },
      { id: 'A-3-throughput-sqrt-p',   title: 'Throughput analysis (the √p law)',                    body: '' },
      { id: 'A-4-fairness',            title: 'Fairness',                                            body: '' },
      { id: 'A-5-high-speed-cubic',    title: 'High-speed TCP + CUBIC',                              body: '' },
      { id: 'A-6-delay-vegas-bbr',     title: 'Delay-based: Vegas + BBR',                            body: '' },
      { id: 'A-7-aqm-ecn-dctcp',       title: 'Network-assisted: ECN, DCTCP, RED, L4S',              body: '' },
    ],
  },
  {
    moduleId:    'B',
    moduleTitle: 'Network Layer',
    subsections: [
      { id: 'B-1-forwarding-vs-routing', title: 'Forwarding vs Routing (data plane vs control plane)', body: '' },
      { id: 'B-2-addressing-cidr',       title: 'IPv4 addressing, subnetting, CIDR',                   body: '' },
      { id: 'B-3-dhcp',                  title: 'DHCP and address assignment',                         body: '' },
      { id: 'B-4-intra-as-dijkstra',     title: 'Intra-AS routing: Dijkstra / OSPF',                   body: '' },
      { id: 'B-5-intra-as-bellman',      title: 'Intra-AS routing: Bellman-Ford / RIP (count-to-∞)',   body: '' },
      { id: 'B-6-inter-as-bgp',          title: 'Inter-AS routing: BGP path-vector + policy',          body: '' },
      { id: 'B-7-router-architecture',   title: 'Router architecture: fabric, HOL vs VOQ, scheduling', body: '' },
    ],
  },
  {
    moduleId:    'C',
    moduleTitle: 'Software Defined Networking',
    subsections: [
      { id: 'C-1-control-data-split',   title: 'Control / data plane separation',         body: '' },
      { id: 'C-2-sdn-architecture',     title: 'SDN architecture + controllers',          body: '' },
      { id: 'C-3-southbound-openflow',  title: 'OpenFlow / P4Runtime southbound APIs',    body: '' },
      { id: 'C-4-generalized-fwd',      title: 'Generalized forwarding + match-action',   body: '' },
      { id: 'C-5-traffic-engineering',  title: 'Traffic engineering: B4, SWAN, SD-WAN',   body: '' },
      { id: 'C-6-nfv-service-chaining', title: 'NFV + service chaining',                  body: '' },
    ],
  },
  {
    moduleId:    'D',
    moduleTitle: 'Network Virtualization',
    subsections: [
      { id: 'D-1-vlans-8021q',     title: 'VLANs + 802.1Q tagging',                     body: '' },
      { id: 'D-2-vswitch-ovs',     title: 'Virtual switches (OVS) in the hypervisor',   body: '' },
      { id: 'D-3-tunneling-vxlan', title: 'Tunneling / overlays: VXLAN, GRE',           body: '' },
      { id: 'D-4-multi-tenant',    title: 'Multi-tenant datacenters + overlapping IPs', body: '' },
      { id: 'D-5-distributed-fw',  title: 'Distributed firewalls',                      body: '' },
    ],
  },
  {
    moduleId:    'E',
    moduleTitle: 'Programmable Dataplanes and P4',
    subsections: [
      { id: 'E-1-fixed-vs-prog',    title: 'Fixed-function vs programmable switches',                body: '' },
      { id: 'E-2-p4-pipeline',      title: 'P4 pipeline: parser → ingress → egress → deparser',      body: '' },
      { id: 'E-3-tables-actions',   title: 'Tables, registers, counters, meters',                    body: '' },
      { id: 'E-4-int-telemetry',    title: 'INT — In-network telemetry',                             body: '' },
      { id: 'E-5-in-network-compute', title: 'In-network aggregation: SwitchML, SHARP',              body: '' },
      { id: 'E-6-smartnics-dpus',   title: 'SmartNICs / DPUs / RDMA / RoCE',                         body: '' },
    ],
  },
]
