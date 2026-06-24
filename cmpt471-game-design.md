# CMPT 471 Networking Game — Content Map & Campaign Design

A study-reinforcement game built from the course lecture decks. Web-based (React + SVG/D3), with flashcards + interactive visual challenges, a campaign, and a sandbox. Progress persists across sessions. **Built modularly so new decks drop in with little rework** — see §6.

---

## 1. Source material (5 decks so far, ~282 slides; more coming)

| Deck | Slides | Core topics |
|------|-------|-------------|
| **1. Congestion Control and TCP Performance** | 76 + *Systems Approach §6.3–6.4* | **§6.3:** CongestionWindow / EffectiveWindow, AIMD (increment = MSS·MSS/CongWin per ACK; halve on timeout), slow start (double per RTT until CongestionThreshold), Tahoe vs Reno, fast retransmit (3 dup-ACKs), fast recovery, CUBIC (CWND(t)=C(t−K)³+W_max, β=0.7). **§6.4 AQM:** DECbit (50% threshold), RED (EWMA AvgLen, Min/MaxThreshold, drop prob P = TempP/(1−count·TempP)), ECN bits (ECT/CE in IP, ECE/CWR in TCP). **§6.4 source-based:** Vegas (BaseRTT, Diff = ExpectedRate − ActualRate, α/β buffer thresholds), BBR (BtlBw + RTprop, Startup/Drain/ProbeBW/ProbeRTT, pacing-gain cycle), DCTCP (single-K marking, cwnd ← cwnd·(1 − α/2)). Plus L4S, throughput ∝ 1/(RTT·√p), high-BDP pipes. |
| **2. Network Layer: Forwarding, Routing Protocols, Router Design** | 67 | Forwarding vs routing, distributed vs centralized control, network-as-graph + Dijkstra, intra-AS (OSPF/RIP/ISIS) vs inter-AS (BGP), link-state vs distance-vector, BGP policy, router architecture (fabric, HOL/VOQ, scheduling), longest-prefix match + TCAM, IPv4/subnets/CIDR, hierarchical allocation, DHCP |
| **3. SDN Concepts, Protocols, Use Cases** | 48 | Control/data-plane separation, centralized control, SDN architecture (controller/NOS, northbound/southbound APIs, OpenFlow/P4Runtime), generalized forwarding, flow tables, match-action abstraction, control↔data interaction (link-failure loop), traffic engineering, NFV/service chaining, B4/SWAN, SD-WAN, SDN+AI |
| **4. Network Virtualization** | 25 | VLANs + 802.1Q, vSwitch (OVS), tunneling/encapsulation, datacenter tiers, multi-tenant overlays, SDN-based virtualization, distributed network functions |
| **5. Programmable Dataplanes and P4** | 66 | Fixed vs programmable switches, INT, NPU pipeline, V1Model, P4 (parser/ingress/egress/deparser, tables, registers/counters/meters), PINT, SwitchML, SHARP, NIC→SmartNIC→DPU, RDMA/RoCE/GPUDirect |

---

## 2. Architecture: a mechanic library + content modules

The game is split into two layers so it scales as decks arrive:

- **Mechanic library** — a handful of reusable visual "engines" (topology canvas, routing graph, match-action table, address space, congestion chart, P4 pipeline). Each is built once and reused across decks.
- **Content modules** — one per deck. A module is mostly *data*: a flashcard set + which mechanic(s) it uses + its campaign levels. Adding a deck = add a module; build a new mechanic only if the topic genuinely needs a new visual.

Because several decks share mechanics, coverage grows faster than the number of mechanics. The clearest example: the **match-action / flow-table engine** serves SDN (flow rules), virtualization (VLAN + firewall rules), and P4 (tables) — one engine, three decks.

---

## 3. Mechanic library

- **Address Space** *(Subnet Puzzle)* — carve a block under constraints (VLSM, CIDR aggregation, hierarchical ISP→org). Visual: address bar / binary tree, waste highlighted. *[picked]* — Deck 2
- **Topology Canvas** *(Build-a-Network)* — drag routers/switches/hosts, wire them, assign subnets/gateways, validate reachability. *[picked]* — Decks 2, 3, 4
- **Routing Graph** *(Packet Routing + algorithm viz)* — step packets hop-by-hop; build/repair forwarding tables; longest-prefix match; visualize Dijkstra (link-state), Bellman-Ford (distance-vector), BGP propagation; per-flow traffic engineering. *[picked]* — Decks 2, 3
- **Match-Action / Flow Table** — write match (multi-field, wildcards/masks) → action (forward/drop/modify) rules; one switch reconfigured as router / L2 / firewall / NAT. *[shared]* — Decks 3, 4, 5
- **Router Internals** — switching fabric (memory/bus/crossbar), HOL blocking vs VOQ, scheduling (FIFO/priority/RR/WFQ/RED). *[optional]* — Deck 2
- **Congestion Chart** — live CongWin-vs-time: AIMD, slow start, fast recovery; swap Reno/CUBIC/Vegas/BBR; fairness arena; ECN/DCTCP/RED toggles. *[new]* — Deck 1
- **P4 Pipeline Builder** — assemble parser state machine → ingress (match-action) → egress → deparser; push a packet through and watch headers parsed/modified. *[new]* — Deck 5

Only two genuinely new mechanics (Congestion Chart, P4 Pipeline) are needed beyond your three picks plus the shared match-action engine.

---

## 4. Content modules (one per deck)

**Module A — Congestion Control and TCP Performance** *(Deck 1; lecture deck + *Systems Approach* §6.3–6.4)* · mechanic: Congestion Chart
*From §6.3:* CongestionWindow vs AdvertisedWindow, AIMD per-ACK increment, slow start doubling and CongestionThreshold, Tahoe vs Reno divergence at loss, fast retransmit (3 dup-ACKs) + fast recovery, CUBIC's cubic growth around W_max (β=0.7) vs Reno's linear AIMD.
*From §6.4 (AQM):* DECbit's single-bit feedback at 50% threshold; RED's EWMA average queue length, Min/MaxThreshold dropping, and the `count`-distributed drop probability; ECN's four bits (IP ECT/CE, TCP ECE/CWR) marking instead of dropping.
*From §6.4 (source-based):* Vegas reads queue buildup from RTT inflation (Diff = ExpectedRate − ActualRate, α/β buffer band); BBR models the path (BtlBw × RTprop) and cycles through Startup → Drain → ProbeBW → ProbeRTT with paced sending; DCTCP uses fine-grained ECN at a single threshold K and reacts proportionally via cwnd ← cwnd·(1 − α/2).
Plus: bottleneck fairness → R/K, throughput ∝ 1/(RTT·√p), high-BDP behavior, L4S.

**Module B — Network Layer: Forwarding, Routing Protocols, Router Design** *(Deck 2)* · mechanics: Address Space, Topology, Routing Graph, Router Internals
Subnetting/CIDR/hierarchical allocation → topology building → intra-AS (Dijkstra/Bellman-Ford) → inter-AS (BGP policy) → router internals.

**Module C — SDN Concepts, Protocols, Use Cases** *(Deck 3)* · mechanics: Match-Action, Routing Graph, Topology
Play the controller. Separate control/data planes; install flow tables; generalized forwarding (match many header fields with wildcards/masks); the match-action abstraction (one bare-metal switch acting as router, L2 switch, firewall, or NAT); the link-failure → controller → recompute → install-flow-tables loop; traffic engineering (push a specific flow onto a non-shortest path; split u→z load across two paths — things OSPF can't do); NFV + service chaining; SD-WAN.

**Module D — Network Virtualization** *(Deck 4)* · mechanics: Topology (extended), Match-Action
VLAN port assignment + 802.1Q isolation; vSwitch; tunneling/overlays; multi-tenant datacenters with overlapping IPs; distributed firewall.

**Module E — Programmable Dataplanes and P4** *(Deck 5)* · mechanics: P4 Pipeline, Match-Action
parser→ingress→egress→deparser; tables/registers/counters/meters; longest-prefix forwarding; INT telemetry; in-network aggregation (SwitchML); DPU/RDMA concepts.

---

## 5. Campaign — "Stand up a network, then make it modern"

Recommended act order (follows how the decks cross-reference each other). Each act is several levels of rising difficulty ending in a "boss". **Order is data, not hardcoded**, so it re-sequences cleanly as decks are added.

1. **Congestion Control** — Congestion Chart — *A.* Boss: maximize goodput on a long-fat pipe without collapse.
2. **Addressing** — Subnet Puzzle — *B.* Boss: re-subnet after a new department is added, minimizing waste.
3. **Topology** — Build-a-Network — *B.* Boss: a bad mask/gateway breaks connectivity — find and fix.
4. **Intra-AS Routing** — Routing Graph — *B.* Boss: cheapest-path delivery under a link failure (re-converge; handle count-to-infinity).
5. **Inter-AS Routing (BGP)** — Routing Graph — *B.* Boss: set exports so traffic follows policy, not shortest path.
6. **Inside the Router** — Router Internals — *B (optional).* Boss: sustain line rate under bursty multi-port input (HOL → VOQ).
7. **SDN** — Match-Action + Routing Graph — *C.* Boss: a link fails — as the controller, recompute and push new flow tables; then force one customer's flow onto a non-shortest path without disturbing other traffic.
8. **Virtualize** — Topology + Match-Action — *D.* Boss: two tenants with overlapping IPs that must stay isolated.
9. **Program the Dataplane** — P4 Pipeline — *E.* Boss: a pipeline that forwards, decrements TTL, and tags telemetry, verified by test packets.

**Sandbox:** every mechanic also gets free-play with a difficulty dial and random generators, so any single skill (VLSM, BGP policy, CUBIC tuning) can be drilled on demand.

---

## 6. How new decks plug in (the expandability bit)

Each deck becomes a content module described by data, roughly:

```
module = {
  id, title, sourceDeck,
  flashcards: [ { front, back, tags, type } ... ],          // pure data
  mechanics:  [ "routingGraph", "matchAction" ],            // reuse from library
  levels:     [ { intent, setup, winCondition, difficulty } ... ]  // data
}
```

To add a deck: (1) drop its flashcards in as data, (2) point it at existing mechanics, (3) build a new mechanic only if the topic needs a genuinely new visual — most won't, since address-space, topology, routing-graph, and match-action already cover a lot of networking. New acts append to the campaign list, the deck becomes a sandbox option, and its cards join the spaced-repetition pool tagged by module. No engine rewrites.

---

## 7. Flashcards

Spaced-repetition deck (Leitner/SM-2), tagged per module. Card types: term↔definition; diagram ID (label a topology, frame, flow table, or pipeline); "which algorithm/protocol?"; compare-two (Reno vs CUBIC, eBGP vs iBGP, OpenFlow vs P4Runtime); fill-the-table (forwarding/flow entries, longest-prefix match). Weak tags resurface automatically; a per-module mastery meter feeds campaign unlocks.

---

## 8. Tech feasibility

All browser-based, no game engine. React for UI/state; SVG (or D3) for topologies, packets, frames, flow tables, and pipelines. Dijkstra and Bellman-Ford are a few dozen lines each; the congestion model is a time-step loop plotted live; the P4 pipeline and flow tables are node/flow diagrams. Session persistence keeps the deck and campaign state between visits.

---

## 9. Game feel & progression

**Design philosophy: competence is the reward.** This is exam-prep for a hard course, so the core loop rewards demonstrable skill, not grinding. The "fun" is the moment a topology lights up green, a sawtooth stabilizes, or a /20 splits cleanly into 8 orgs — plus the pull to do it faster and cleaner next time. Extrinsic rewards stay light and always map to real understanding.

**The session loop (~10 min):**
1. Warm-up — 5–10 spaced-repetition cards from your weakest tags.
2. Play — 1–2 challenge levels (campaign or sandbox).
3. Payoff — mastery meters move, stars/levels unlock, streak ticks.

**Progression model (campaign + sandbox, as requested):**
- **Sandbox is always fully open** — every mechanic, every difficulty, from day one.
- **Campaign is a guided path** with *soft* gating: an act unlocks when its prerequisite modules reach a mastery threshold (~60%). Mastery per module = a blend of flashcard recall + levels cleared. You can always jump ahead via sandbox; the campaign just recommends an order.

**Scoring — stars, not points soup.** Each level earns 1–3 stars on: correctness (it works — packets delivered, isolation held, goodput target met), efficiency (minimal address waste / lowest path cost / least queueing delay), and independence (stars reduced by hints used). Stars are the replay hook: clearing a level invites "now do it in 3 stars."

**Failure teaches, never blocks.** No lives, no hard-fail. A wrong move triggers an inline explanation and a retry. Mistakes optionally auto-generate a review card for that concept, so errors feed the flashcard pool.

**Habit + cram layers:**
- **Daily streak** tied to completing a short review set — a habit loop bound to actual recall, not vanity.
- **Exam Prep mode** — pulls your weakest tags across *all* modules into a timed mixed set, plus a "boss rush" of act challenges for pre-midterm cramming. This is what makes it a study tool, not just a game.

**Deliberately avoided:** lives that block learning, pay-to-progress, points for mere participation, and global leaderboards that reward speed over understanding (a local personal-best is fine).

---

## 10. Theme & visual identity

**Framing: "NetOps — from a startup ISP to a hyperscaler."** You're a network operator, and the campaign is your company growing up: rent your first address block and wire a few routers (Module A), route at scale with BGP, centralize control with SDN, virtualize for tenants, tame congestion, and finally program the dataplane like a hyperscaler. Each module is a growth stage with rising stakes — giving the act sequence a spine and a reason to care, and scaling naturally as new decks (security, QoS, …) become later company stages.

**Aesthetic: a clean network operations console.** A dark "NOC dashboard" base with signal-colored accents, schematic/blueprint topologies, everything legible at a glance. It reads like real network tooling — suits a CS audience and keeps visuals informative rather than decorative.
- **Palette:** dark slate background; link/state colors carry meaning — green = up/healthy, amber = congested/converging, red = down/dropped; packets in a bright accent. Color is a teaching signal.
- **Type:** clean sans for UI, monospace for addresses, tables, and code — reinforcing "this is the real thing."
- **Topologies:** blueprint/schematic; nodes as device glyphs (router / switch / host / controller); links as lines whose **thickness = bandwidth** and **color = utilization/state**.

**A shared visual grammar across every mechanic** (pedagogy, not just art — the same symbol means the same thing everywhere):
- **Packets** = moving dots carrying a small header stack; watch fields change hop-to-hop.
- **Links** = lines; thickness = capacity, color = state; flow direction animates.
- **Tables** = the recurring match-action grid (forwarding tables, flow tables, and P4 tables all look related — because they are).
- **Address space** = filling bars / binary blocks; waste shown as muted hatch.
- **Motion shows process:** packets animate along paths, a matched row flashes, convergence ripples outward from a failed link, the congestion sawtooth draws live. Process is what a static slide can't show — so motion is where this beats the lecture deck.

*Alternative framing, if preferred: a neutral "network lab/sandbox" with no narrative. The console aesthetic and visual grammar carry over either way.*

---

## 11. New mechanic deep-dives

The two builds beyond your three picks + the shared match-action engine. Both are web-feasible (React + SVG/charting).

### 11a. Congestion Chart (Module A / Deck 1)

**Screen:** three linked panels — (1) a live time-series of CongWin (and throughput) vs time in RTTs, where the **sawtooth draws in real time**; (2) the path: sender → bottleneck link with a **queue that visibly fills and drops** → receiver; (3) a goodput meter, plus a fairness panel for multi-flow levels.

**Modes:**
- **Predict** — run a scenario and click where the next loss / window-halving lands on the chart; scored on accuracy. Anticipating the dynamics is how you learn them.
- **Tune** — choose the algorithm (Tahoe / Reno / CUBIC / Vegas / BBR) and/or parameters; goal = hit a goodput target, cap queueing delay, or minimize loss under a given network (RTT, loss rate, BDP). The long-fat-pipe level is where you *feel* why Reno underutilizes and CUBIC/BBR win.
- **Diagnose** — given a drawn chart, label the events: timeout vs 3-dup-ACK, slow start vs congestion avoidance, fast recovery.
- **Fairness arena** (campaign boss) — N flows share a bottleneck; watch convergence toward R/K; toggle RED / ECN / DCTCP and see queueing and fairness shift.

**Win conditions:** goodput ≥ target, queueing delay ≤ cap, fairness within tolerance, or a correct prediction/diagnosis.

**Level ladder (→ slides + *Systems Approach* §6.3–6.4):** AIMD basics (per-ACK increment, halve-on-timeout) → slow start + CongestionThreshold → Tahoe vs Reno at loss → fast retransmit (3 dup-ACKs) + fast recovery → throughput vs loss (the 1/√p law) → long-fat pipe (CUBIC, β=0.7) → DECbit warm-up (50% threshold) → RED (EWMA AvgLen, Min/MaxThreshold, drop probability) → ECN (ECT/CE/ECE/CWR — mark, don't drop) → Vegas (Diff = Expected − Actual, α/β band) → BBR (BtlBw × RTprop; cycle Startup → Drain → ProbeBW → ProbeRTT) → DCTCP (single-K marking, cwnd·(1 − α/2)).

**Build:** a per-RTT discrete-time simulator — each algorithm is a small state machine updating CongWin; loss is a probability p or a scripted event; plotted with a charting lib. CUBIC's curve and BBR's state machine are the only fiddly parts, both tractable.

### 11b. P4 Pipeline Builder (Module E / Deck 5)

**Screen:** a left-to-right pipeline — **Parser → Ingress (match-action) → Egress → Deparser**. A packet enters as a stack of header cards; at each stage you watch headers get extracted, matched, modified, and re-emitted. A toggle reveals the equivalent **P4 snippet** for players who want to connect the visual to the actual language (and to Project 2).

**Modes:**
- **Build the parser** — connect parser states (start → ethernet → ipv4 → tcp/udp) with transition conditions (etherType, protocol); validate that test packets extract the right headers.
- **Fill the tables** — define a match-action table (key = dstAddr `lpm`; actions = forward/drop) and populate entries: the control-plane role. Reuses the shared Match-Action engine.
- **Assemble actions** — build an action like `ipv4_forward` from blocks: set egress port, rewrite src/dst MAC, decrement TTL.
- **Run & verify** — send test packets through; pass when output matches expected. Campaign boss: a pipeline that **forwards + decrements TTL + tags INT telemetry**, checked against a test suite.

**Visual:** packet = stack of header cards; the active stage highlights which header is read/written; the table lookup shows which entry matched and how the mask applied. Abstract P4 flow becomes a concrete, watchable journey.

**Design choice:** you assemble the pipeline from **visual blocks, not raw P4 text** — the game teaches structure and dataflow; the optional code toggle bridges to syntax without making syntax the obstacle.

**Level ladder (→ slides):** parser only → single forwarding table → action with MAC rewrite + TTL-- → multi-table (ipv4_lpm then mac_fwd) → stateful objects (counters/registers, e.g. INT) → in-network aggregation (lighter, conceptual).

**Build:** node-graph parser (SVG), the match-action grid, and a packet-stepping animation. No real P4 compiler — a small interpreter steps the packet through the player's pipeline and checks outputs.
