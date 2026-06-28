// Module A — Congestion Control and TCP Performance (Deck 1)
// Mechanics: Congestion Chart
// Topics: AIMD, slow start, Tahoe/Reno, CUBIC, Vegas, BBR, ECN, DCTCP, AQM/RED

import type { ContentModule } from '@/types'

export const moduleA: ContentModule = {
  id:          'A',
  title:       'Congestion Control and TCP Performance',
  sourceDeck:  'Deck 1 — Congestion Control and TCP Performance (76 slides) + Systems Approach §6.3–6.4',
  description: 'Watch the sawtooth live: AIMD, slow start, fast recovery, and modern algorithms.',
  accentClass: 'text-module-a',
  mechanics:   ['congestionChart'],

  flashcards: [
    {
      id: 'A-01', type: 'term-definition',
      front: 'Describe AIMD — what does each letter mean and why is it fair?',
      back:  'Additive Increase: grow CongWin by 1 MSS per RTT during congestion avoidance. Multiplicative Decrease: halve CongWin on loss. AIMD is fair because flows converge toward equal share R/K (R = link rate, K = flows) — proven geometrically: both additive increase lines slope toward the fairness line.',
      tags:  ['A', 'AIMD', 'fairness'],
    },
    {
      id: 'A-02', type: 'term-definition',
      front: 'What triggers slow start, and when does it end?',
      back:  'Slow start begins at connection open and after a timeout. CongWin doubles each RTT (one MSS added per ACK). It ends when CongWin reaches ssthresh (switch to congestion avoidance) or loss occurs (timeout → reset; 3-dup-ACK → fast retransmit).',
      tags:  ['A', 'slow-start', 'ssthresh'],
    },
    {
      id: 'A-03', type: 'compare-two',
      front: 'How does TCP Reno handle 3-dup-ACKs differently from a timeout?',
      back:  'Timeout: ssthresh = CongWin/2, CongWin = 1 MSS, restart slow start (severe). 3-dup-ACK (fast retransmit/recovery): ssthresh = CongWin/2, CongWin = ssthresh + 3 MSS, retransmit lost segment, enter fast recovery (inflate by 1 per dup-ACK, deflate on new ACK). Network less congested → milder response.',
      tags:  ['A', 'Reno', 'fast-retransmit', 'fast-recovery'],
    },
    {
      id: 'A-04', type: 'term-definition',
      front: 'State the TCP throughput formula and what each variable means.',
      back:  'Throughput ≈ (0.75 × MSS) / (RTT × √p). MSS = max segment size, RTT = round-trip time, p = packet loss probability. Throughput is inversely proportional to RTT and √p — doubling RTT halves goodput.',
      tags:  ['A', 'throughput', 'loss-rate'],
    },
    {
      id: 'A-05', type: 'compare-two',
      front: 'Why does CUBIC outperform Reno on high-BDP links?',
      back:  'Reno\'s additive increase (+1 MSS/RTT) is too slow to fill a 10 Gbps × 100 ms pipe. CUBIC uses a cubic function of time since last loss — CWND(t) = C·(t−K)³ + W_max with β=0.7 — growing aggressively far from the previous peak and cautiously near it, reaching full utilisation much faster while staying fair to other CUBIC flows.',
      tags:  ['A', 'CUBIC', 'high-BDP'],
    },
    {
      id: 'A-06', type: 'compare-two',
      front: 'How does BBR differ from loss-based congestion control?',
      back:  'Loss-based (Reno/CUBIC) infers congestion from packet loss — which occurs only after queues overflow. BBR directly models bottleneck bandwidth (BtlBw) and RTprop using measured delivery rate and min RTT. It cycles through Startup → Drain → ProbeBW → ProbeRTT with paced sending, targeting BtlBw × RTprop = BDP, avoiding queue buildup and achieving high throughput at low latency.',
      tags:  ['A', 'BBR', 'delay-based'],
    },
    {
      id: 'A-07', type: 'term-definition',
      front: 'What is ECN and how does it differ from drop-based congestion signalling?',
      back:  'Explicit Congestion Notification: a router marks packets (sets ECN bits) when its queue is filling, before dropping. IP carries ECT/CE; TCP carries ECE/CWR. The receiver echoes the mark via ECE in ACK; the sender halves its window — same reaction as 3-dup-ACK but *without* losing the packet. Avoids retransmission overhead.',
      tags:  ['A', 'ECN', 'AQM'],
    },
    {
      id: 'A-08', type: 'term-definition',
      front: 'What is DCTCP and why was it designed for datacenters?',
      back:  'Data Center TCP: uses ECN marks proportionally — CongWin reduction is cwnd ← cwnd · (1 − α/2), where α is the smoothed fraction of marked packets. Switches mark with a single threshold K (no RED complexity). Datacenters have low RTT, high bandwidth, and bursty incast traffic; proportional response keeps queues small and latency low.',
      tags:  ['A', 'DCTCP', 'datacenter'],
    },
    {
      id: 'A-09', type: 'term-definition',
      front: 'What is AQM / RED and what problem does it address?',
      back:  'Active Queue Management / Random Early Detection: maintains AvgLen via EWMA; drops (or marks) packets probabilistically once AvgLen exceeds MinThreshold, with probability rising to MaxP at MaxThreshold. Prevents global synchronisation (all flows halving at once when a tail-drop queue fills), smoothing throughput.',
      tags:  ['A', 'AQM', 'RED'],
    },
    {
      id: 'A-10', type: 'compare-two',
      front: 'How does TCP Vegas detect congestion before loss?',
      back:  'Vegas measures BaseRTT (min observed RTT) and computes ExpectedRate = CongWin / BaseRTT vs ActualRate over one RTT. Diff = Expected − Actual estimates extra bytes queued at the bottleneck. If Diff < α: increase window. If Diff > β: decrease. Otherwise hold. Detects queue buildup *before* packets are dropped.',
      tags:  ['A', 'Vegas', 'delay-based'],
    },
  ],

  levels: [
    {
      id: 'A-L01', title: 'TCP Fundamentals',
      intent:       'Complete the missing lines that control slow start, congestion avoidance, and loss response.',
      mechanic:     'congestionChart',
      setup:        { codeSection: 'fundamentals' },
      winCondition: 'All missing code blocks are placed correctly.',
      difficulty:   1, isBoss: false,
    },
    {
      id: 'A-L02', title: 'TCP Tahoe',
      intent:       'Build Tahoe\'s slow start, timeout, and duplicate-ACK reactions from code blocks.',
      mechanic:     'congestionChart',
      setup:        { codeSection: 'tahoe' },
      winCondition: 'All missing Tahoe blocks are placed correctly.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'A-L03', title: 'TCP Reno & NewReno',
      intent:       'Complete fast retransmit, fast recovery, and partial-ACK handling.',
      mechanic:     'congestionChart',
      setup:        { codeSection: 'reno' },
      winCondition: 'All missing Reno and NewReno blocks are placed correctly.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'A-L04', title: 'TCP Vegas',
      intent:       'Use RTT measurements to complete Vegas\'s delay-based congestion response.',
      mechanic:     'congestionChart',
      setup:        { codeSection: 'vegas' },
      winCondition: 'All missing Vegas blocks are placed correctly.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'A-L05', title: 'BBR',
      intent:       'Complete BBR\'s bandwidth model, pacing target, and operating-state transitions.',
      mechanic:     'congestionChart',
      setup:        { codeSection: 'bbr' },
      winCondition: 'All missing BBR blocks are placed correctly.',
      difficulty:   4, isBoss: false,
    },
    {
      id: 'A-L06', title: 'TCP CUBIC',
      intent:       'Finish CUBIC\'s time-based window function and loss response.',
      mechanic:     'congestionChart',
      setup:        { codeSection: 'cubic' },
      winCondition: 'All missing CUBIC blocks are placed correctly.',
      difficulty:   5, isBoss: true,
    },
  ],
}
