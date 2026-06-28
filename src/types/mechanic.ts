// Mechanic identifiers — one per visual engine in the library

export type MechanicId =
  | 'addressSpace'    // Subnet Puzzle — CIDR/VLSM address bar
  | 'topologyCanvas'  // Build-a-Network — drag routers/links
  | 'routingGraph'    // Packet Routing + Dijkstra / Bellman-Ford / BGP
  | 'matchAction'     // Match-Action / Flow Table — shared across SDN, VLAN, P4
  | 'sdnSimulator'    // SDN Controller Lab — architecture, flow rules, controller events
  | 'routerInternals' // Router architecture — fabric, HOL, scheduling
  | 'congestionChart' // CongWin-vs-time live chart
  | 'p4Pipeline'      // Parser → Ingress → Egress → Deparser builder
