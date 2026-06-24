// Graph algorithms used by the Routing Graph mechanic:
// Dijkstra (link-state / OSPF) and Bellman-Ford (distance-vector / RIP)

export interface GraphNode {
  id: string
  label: string
}

export interface GraphEdge {
  from: string
  to: string
  /** Link cost / metric */
  weight: number
  /** Whether the link is currently up */
  up: boolean
}

export interface Graph {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export interface PathResult {
  /** Node IDs along the shortest path, start→end inclusive */
  path: string[]
  /** Total cost */
  cost: number
  /** Per-node distance table (for visualization) */
  distances: Record<string, number>
}

/**
 * Dijkstra's shortest-path algorithm (link-state, non-negative weights).
 * Only traverses edges where `up === true`.
 *
 * @param graph - The network graph
 * @param sourceId - Starting node ID
 * @param targetId - Destination node ID
 * @returns PathResult with path, cost, and full distance table; or null if unreachable
 */
export function dijkstra(
  graph: Graph,
  sourceId: string,
  targetId: string,
): PathResult | null {
  const dist: Record<string, number> = {}
  const prev: Record<string, string | null> = {}
  const unvisited = new Set<string>()

  for (const node of graph.nodes) {
    dist[node.id] = Infinity
    prev[node.id] = null
    unvisited.add(node.id)
  }
  dist[sourceId] = 0

  while (unvisited.size > 0) {
    // Pick unvisited node with smallest distance
    let u: string | null = null
    for (const id of unvisited) {
      if (u === null || dist[id] < dist[u]) u = id
    }
    if (u === null || dist[u] === Infinity) break
    if (u === targetId) break

    unvisited.delete(u)

    // Relax neighbours
    const neighbours = graph.edges.filter(
      (e) => e.up && (e.from === u || e.to === u),
    )
    for (const edge of neighbours) {
      const v = edge.from === u ? edge.to : edge.from
      if (!unvisited.has(v)) continue
      const alt = dist[u] + edge.weight
      if (alt < dist[v]) {
        dist[v] = alt
        prev[v] = u
      }
    }
  }

  if (dist[targetId] === Infinity) return null

  // Reconstruct path
  const path: string[] = []
  let cur: string | null = targetId
  while (cur !== null) {
    path.unshift(cur)
    cur = prev[cur]
  }

  return { path, cost: dist[targetId], distances: dist }
}

/**
 * Bellman-Ford shortest-path algorithm (distance-vector, handles negative weights).
 * Only traverses edges where `up === true`.
 *
 * @param graph - The network graph
 * @param sourceId - Starting node ID
 * @returns Distance table from source to all reachable nodes; Infinity if unreachable
 */
export function bellmanFord(
  graph: Graph,
  sourceId: string,
): Record<string, number> {
  const dist: Record<string, number> = {}
  for (const node of graph.nodes) dist[node.id] = Infinity
  dist[sourceId] = 0

  const upEdges = graph.edges.filter((e) => e.up)
  const n = graph.nodes.length

  for (let i = 0; i < n - 1; i++) {
    for (const edge of upEdges) {
      // Treat as undirected
      if (dist[edge.from] + edge.weight < dist[edge.to]) {
        dist[edge.to] = dist[edge.from] + edge.weight
      }
      if (dist[edge.to] + edge.weight < dist[edge.from]) {
        dist[edge.from] = dist[edge.to] + edge.weight
      }
    }
  }

  return dist
}
