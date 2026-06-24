// Module D — TCP Congestion Control (Deck 3)
// Mechanics: Congestion Chart
// Topics: AIMD, slow start, Tahoe/Reno, CUBIC, Vegas, BBR, ECN, DCTCP, AQM/RED

import type { ContentModule } from '@/types'

export const moduleD: ContentModule = {
  id:          'D',
  title:       'TCP Congestion Control',
  sourceDeck:  'Deck 3 — TCP Congestion Control (76 slides)',
  description: 'Watch the sawtooth live: AIMD, slow start, fast recovery, and modern algorithms.',
  accentClass: 'text-module-d',
  mechanics:   ['congestionChart'],

  flashcards: [
    {
      id: 'D-01', type: 'term-definition',
      front: 'Describe AIMD — what does each letter mean and why is it fair?',
      back:  'Additive Increase: grow CongWin by 1 MSS per RTT during congestion avoidance. Multiplicative Decrease: halve CongWin on loss. AIMD is fair because flows converge toward equal share R/K (R = link rate, K = flows) — proven geometrically: both additive increase lines slope toward the fairness line.',
      tags:  ['D', 'AIMD', 'fairness'],
    },
    {
      id: 'D-02', type: 'term-definition',
      front: 'What triggers slow start, and when does it end?',
      back:  'Slow start begins at connection open and after a timeout. CongWin doubles each RTT (one MSS added per ACK). It ends when CongWin reaches ssthresh (switch to congestion avoidance) or loss occurs (timeout → reset; 3-dup-ACK → fast retransmit).',
      tags:  ['D', 'slow-start', 'ssthresh'],
    },
    {
      id: 'D-03', type: 'compare-two',
      front: 'How does TCP Reno handle 3-dup-ACKs differently from a timeout?',
      back:  'Timeout: ssthresh = CongWin/2, CongWin = 1 MSS, restart slow start (severe). 3-dup-ACK (fast retransmit/recovery): ssthresh = CongWin/2, CongWin = ssthresh + 3 MSS, retransmit lost segment, enter fast recovery (inflate by 1 per dup-ACK, deflate on new ACK). Network less congested → milder response.',
      tags:  ['D', 'Reno', 'fast-retransmit', 'fast-recovery'],
    },
    {
      id: 'D-04', type: 'term-definition',
      front: 'State the TCP throughput formula and what each variable means.',
      back:  'Throughput ≈ (0.75 × MSS) / (RTT × √p). MSS = max segment size, RTT = round-trip time, p = packet loss probability. Throughput is inversely proportional to RTT and √p — doubling RTT halves goodput.',
      tags:  ['D', 'throughput', 'loss-rate'],
    },
    {
      id: 'D-05', type: 'compare-two',
      front: 'Why does CUBIC outperform Reno on high-BDP links?',
      back:  'Reno\'s additive increase (+1 MSS/RTT) is too slow to fill a 10 Gbps × 100 ms pipe. CUBIC uses a cubic function of time since last loss — grows aggressively far from the previous window peak and cautiously near it, reaching full utilisation much faster while staying fair to other CUBIC flows.',
      tags:  ['D', 'CUBIC', 'high-BDP'],
    },
    {
      id: 'D-06', type: 'compare-two',
      front: 'How does BBR differ from loss-based congestion control?',
      back:  'Loss-based (Reno/CUBIC) infers congestion from packet loss — which occurs only after queues overflow. BBR directly models bottleneck bandwidth (BtlBw) and RTprop using measured delivery rate and min RTT. It targets BtlBw × RTprop = BDP, avoiding queue buildup and achieving high throughput at low latency.',
      tags:  ['D', 'BBR', 'delay-based'],
    },
    {
      id: 'D-07', type: 'term-definition',
      front: 'What is ECN and how does it differ from drop-based congestion signalling?',
      back:  'Explicit Congestion Notification: a router marks packets (sets ECN bits) when its queue is filling, before dropping. The receiver echoes the mark to the sender (via ECE flag in ACK), which halves its window — same reaction as 3-dup-ACK but *without* losing the packet. Avoids retransmission overhead.',
      tags:  ['D', 'ECN', 'AQM'],
    },
    {
      id: 'D-08', type: 'term-definition',
      front: 'What is DCTCP and why was it designed for datacenters?',
      back:  'Data Center TCP: uses ECN marks proportionally — CongWin reduction is proportional to the *fraction* of marked packets (α), not always halved. Datacenters have low RTT, high bandwidth, and bursty incast traffic; proportional response keeps queues small and latency low.',
      tags:  ['D', 'DCTCP', 'datacenter'],
    },
    {
      id: 'D-09', type: 'term-definition',
      front: 'What is AQM / RED and what problem does it address?',
      back:  'Active Queue Management / Random Early Detection: drops (or marks) packets probabilistically as queue length rises — before the queue is full. Prevents global synchronisation (all flows halving at once when a tail-drop queue fills), smoothing throughput.',
      tags:  ['D', 'AQM', 'RED'],
    },
  ],

  levels: [
    {
      id: 'D-L01', title: 'Draw the Sawtooth',
      intent:       'Predict where the next window-halving lands on a live AIMD trace.',
      mechanic:     'congestionChart',
      setup:        { mode: 'predict', algorithm: 'reno', events: ['3dup-ack', 'timeout'], rtts: 20 },
      winCondition: 'Prediction within ±1 RTT of actual event.',
      difficulty:   1, isBoss: false,
    },
    {
      id: 'D-L02', title: 'Slow Start to Avoidance',
      intent:       'Diagnose a CongWin chart — label slow start, congestion avoidance, fast recovery, and timeout.',
      mechanic:     'congestionChart',
      setup:        { mode: 'diagnose', algorithm: 'reno', scenario: 'mixed-events' },
      winCondition: 'All four phases correctly labelled.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'D-L03', title: 'The 1/√p Law',
      intent:       'Verify throughput ≈ 0.75×MSS / (RTT×√p) by tuning loss rate and observing goodput.',
      mechanic:     'congestionChart',
      setup:        { mode: 'tune', algorithm: 'reno', variable: 'loss-rate', target: 'formula' },
      winCondition: 'Measured goodput matches formula prediction within 5%.',
      difficulty:   2, isBoss: false,
    },
    {
      id: 'D-L04', title: 'Long Fat Pipe',
      intent:       'Reno can\'t fill a 1 Gbps × 80 ms pipe. Switch to CUBIC and hit the goodput target.',
      mechanic:     'congestionChart',
      setup:        { mode: 'tune', algorithms: ['reno', 'cubic'], bw: 1e9, rtt: 80, goodputTarget: 0.9 },
      winCondition: 'CUBIC achieves ≥ 90% link utilisation; Reno shown underperforming.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'D-L05', title: 'Fairness Arena',
      intent:       'Three Reno flows share a bottleneck — watch AIMD converge to R/3. Then enable RED and see how it changes.',
      mechanic:     'congestionChart',
      setup:        { mode: 'fairness', algorithm: 'reno', flows: 3, aqm: 'none', toggleAqm: 'red' },
      winCondition: 'Flows converge within 10% of R/3; fairness metric > 0.95.',
      difficulty:   3, isBoss: false,
    },
    {
      id: 'D-L06', title: 'Goodput Boss — ECN/DCTCP',
      intent:       'Maximize goodput on a low-RTT datacenter path: start with Reno (queueing delay high), switch to DCTCP+ECN and minimise both delay and loss.',
      mechanic:     'congestionChart',
      setup:        { mode: 'tune', algorithms: ['reno', 'dctcp'], rtt: 1, bw: 10e9, target: 'max-goodput-min-latency', toggleEcn: true },
      winCondition: 'Goodput ≥ 95%, queue depth < 10 packets, zero losses.',
      difficulty:   5, isBoss: true,
    },
  ],
}
