import type { Frame, GraphState, Simulation, Tone } from "../types";
import { layeredLayout } from "../layout";
import type { In } from "./util";
import { fail } from "./util";

const CODE = [
  "indeg[v] = number of incoming edges",
  "queue = all v with indeg[v] == 0",
  "while queue not empty:",
  "    u = queue.pop_front(); order.append(u)",
  "    for v in adj[u]:",
  "        indeg[v] -= 1",
  "        if indeg[v] == 0: queue.push_back(v)",
  "if len(order) < n: there is a cycle",
];

export function topoSort(input: In<"topo-sort">): Simulation {
  const { n, edges } = input;
  for (const [a, b] of edges) if (a >= n || b >= n) fail(`edge [${a}, ${b}] uses a node outside 0..${n - 1}.`);
  const adj: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  for (const [a, b] of edges) {
    adj[a].push(b);
    indeg[b]++;
  }
  // Layers for the picture: longest-path depth from the sources (cycle members go to a last layer).
  const d0 = [...indeg];
  const layerOf = new Array(n).fill(-1);
  let ready = [...Array(n).keys()].filter((i) => d0[i] === 0);
  let depth = 0;
  while (ready.length) {
    const next: number[] = [];
    for (const u of ready) {
      layerOf[u] = depth;
      for (const v of adj[u]) if (--d0[v] === 0) next.push(v);
    }
    ready = next;
    depth++;
  }
  const stuck = layerOf.map((l, i) => (l < 0 ? i : -1)).filter((i) => i >= 0);
  const layers: number[][] = Array.from({ length: depth + (stuck.length ? 1 : 0) }, () => []);
  layerOf.forEach((l, i) => {
    if (l >= 0) layers[l].push(i);
  });
  if (stuck.length) layers[depth] = stuck;
  const pos = layeredLayout(layers.filter((l) => l.length), n);
  const gEdges = edges.map(([a, b]) => ({ from: String(a), to: String(b) }));

  const queue: number[] = [];
  const order: number[] = [];
  const left = [...indeg];
  const used = new Set<string>();
  const frames: Frame[] = [];

  const snap = (note: string, line: number, active: number | null, considered: number[] = [], bad: number[] = []) => {
    const nodeTones: Record<string, Tone> = {};
    for (const q of queue) nodeTones[q] = "focus";
    for (const o of order) nodeTones[o] = "done";
    for (const v of considered) nodeTones[v] = "compare";
    for (const v of bad) nodeTones[v] = "bad";
    if (active !== null) nodeTones[active] = "active";
    const edgeTones: Record<string, Tone> = {};
    for (const k of used) edgeTones[k] = "done";
    const graph: GraphState = {
      nodes: pos.map((p, i) => ({ id: String(i), x: p.x, y: p.y, badge: `in ${left[i]}` })),
      edges: gEdges,
      directed: true,
      nodeTones,
      edgeTones,
    };
    frames.push({
      graph,
      arrays: [
        { values: [...queue], label: "queue of nodes with in-degree 0" },
        { values: [...order], label: "topological order so far" },
      ],
      vars: { placed: order.length, n },
      note,
      line,
    });
  };

  for (let i = 0; i < n; i++) if (left[i] === 0) queue.push(i);
  snap(
    queue.length ? `Count incoming edges (the "in" badge). Nodes with in-degree 0 (${queue.join(", ")}) have no prerequisites, so they start in the queue.` : "Every node has an incoming edge, so none can go first: there is a cycle.",
    1,
    null,
  );
  while (queue.length) {
    const u = queue.shift() as number;
    order.push(u);
    snap(`Take ${u} from the queue and append it to the order: all its prerequisites are already placed.`, 3, u);
    const considered: number[] = [];
    const zero: number[] = [];
    for (const v of adj[u]) {
      left[v]--;
      used.add(`${u}->${v}`);
      considered.push(v);
      if (left[v] === 0) {
        queue.push(v);
        zero.push(v);
      }
    }
    snap(
      adj[u].length
        ? `Remove ${u}'s outgoing edges: ${considered.map((v) => `${v} now has in-degree ${left[v]}`).join(", ")}.${zero.length ? ` ${zero.join(", ")} can go in the queue.` : ""}`
        : `${u} has no outgoing edges, so nothing changes.`,
      6,
      u,
      considered.filter((v) => !zero.includes(v)),
    );
  }
  if (order.length < n) {
    snap(`The queue is empty but only ${order.length} of ${n} nodes are placed. Nodes ${stuck.join(", ")} wait on each other: there is a cycle, so no valid order exists.`, 7, null, [], stuck);
    return { frames, code: { lang: "pseudocode", lines: CODE }, result: `cycle detected: only ${order.length} of ${n} nodes ordered` };
  }
  snap(`All ${n} nodes are placed, so the graph has no cycle and this is a valid order.`, 7, null);
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: `order: ${order.join(", ")}` };
}
