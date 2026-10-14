import type { Frame, GraphState, Simulation, Tone } from "../types";
import { circleLayout } from "../layout";
import type { In } from "./util";
import { fail } from "./util";

const CODE_BFS = [
  "queue = [start]; seen = {start}",
  "while queue not empty:",
  "    u = queue.pop_front()",
  "    visit(u)",
  "    for v in adj[u]:",
  "        if v not in seen:",
  "            seen.add(v); queue.push_back(v)",
];
const CODE_DFS = [
  "dfs(u):",
  "    seen.add(u); visit(u)",
  "    for v in adj[u]:",
  "        if v not in seen:",
  "            dfs(v)",
  "dfs(start)",
];

export function graphTraversal(input: In<"graph-traversal">): Simulation {
  const { n, edges, start, mode, directed } = input;
  if (start >= n) fail(`start = ${start} must be a node between 0 and ${n - 1}.`);
  for (const [a, b] of edges) if (a >= n || b >= n) fail(`edge [${a}, ${b}] uses a node outside 0..${n - 1}.`);
  const adj: number[][] = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    if (!adj[a].includes(b)) adj[a].push(b);
    if (!directed && !adj[b].includes(a)) adj[b].push(a);
  }
  adj.forEach((l) => l.sort((x, y) => x - y));
  const pos = circleLayout(n);
  const gEdges = edges.map(([a, b]) => ({ from: String(a), to: String(b) }));
  const frames: Frame[] = [];

  const seen = new Set<number>([start]);
  const order: number[] = [];
  const treeEdges = new Set<string>();
  const badge = new Map<number, string>();

  const graph = (active: number | null, inStruct: number[], considered: [number, number][] = []): GraphState => {
    const nodeTones: Record<string, Tone> = {};
    for (const v of order) nodeTones[v] = "done";
    for (const v of inStruct) nodeTones[v] = "focus";
    if (active !== null) nodeTones[active] = "active";
    const edgeTones: Record<string, Tone> = {};
    for (const k of treeEdges) edgeTones[k] = "done";
    for (const [a, b] of considered) edgeTones[`${a}->${b}`] = "compare";
    return {
      nodes: pos.map((p, i) => ({ id: String(i), x: p.x, y: p.y, badge: badge.get(i) })),
      edges: gEdges,
      directed,
      nodeTones,
      edgeTones,
    };
  };
  const orderArr = (hl?: number) => ({
    values: [...order],
    tones: hl !== undefined ? ({ [hl]: "active" } as Record<number, Tone>) : undefined,
    label: "visit order",
  });

  if (mode === "bfs") {
    const queue: number[] = [start];
    const dist = new Map<number, number>([[start, 0]]);
    badge.set(start, "d=0");
    frames.push({
      graph: graph(null, queue),
      arrays: [{ values: [...queue], label: "queue (front on the left)" }, orderArr()],
      vars: { start },
      note: `Put ${start} in the queue and mark it seen. BFS visits nodes in rings: distance 0, then 1, then 2.`,
      line: 0,
    });
    while (queue.length) {
      const u = queue.shift() as number;
      order.push(u);
      frames.push({
        graph: graph(u, queue),
        arrays: [{ values: [...queue], label: "queue (front on the left)" }, orderArr(order.length - 1)],
        vars: { u, dist: dist.get(u) as number },
        note: `Take ${u} from the front of the queue and visit it (distance ${dist.get(u)}).`,
        line: 3,
      });
      const added: number[] = [];
      const considered: [number, number][] = [];
      for (const v of adj[u]) {
        considered.push([u, v]);
        if (!seen.has(v)) {
          seen.add(v);
          queue.push(v);
          added.push(v);
          dist.set(v, (dist.get(u) as number) + 1);
          badge.set(v, `d=${dist.get(v)}`);
          treeEdges.add(`${u}->${v}`);
        }
      }
      frames.push({
        graph: graph(u, queue, considered),
        arrays: [{ values: [...queue], label: "queue (front on the left)" }, orderArr()],
        vars: { u, queue: queue.length },
        note: added.length ? `Neighbours of ${u}: ${adj[u].join(", ")}. New ones (${added.join(", ")}) join the back of the queue.` : `Neighbours of ${u}: ${adj[u].length ? adj[u].join(", ") : "none"}. All already seen, nothing is added.`,
        line: 6,
      });
    }
  } else {
    const stack: number[] = [];
    let prevLen = 0;
    const dfs = (u: number, from: number | null) => {
      seen.add(u);
      stack.push(u);
      order.push(u);
      badge.set(u, `#${order.length}`);
      if (from !== null) treeEdges.add(`${from}->${u}`);
      const back = prevLen >= stack.length ? ` After backtracking, go from ${from} to ${u}.` : "";
      frames.push({
        graph: graph(u, stack.slice(0, -1), from !== null ? [[from, u]] : []),
        arrays: [{ values: [...stack], label: "call stack (current node on the right)" }, orderArr(order.length - 1)],
        vars: { u, depth: stack.length },
        note: from === null ? `Start at ${u}: mark it seen and look at its neighbours (${adj[u].join(", ") || "none"}).` : `Visit ${u} (via ${from}).${back} Go as deep as possible before turning back.`,
        line: from === null ? 5 : 1,
      });
      prevLen = stack.length;
      for (const v of adj[u]) if (!seen.has(v)) dfs(v, u);
      stack.pop();
    };
    dfs(start, null);
  }
  frames.push({
    graph: graph(null, []),
    arrays: [orderArr()],
    vars: { visited: order.length, unreachable: n - order.length },
    note: `Finished: visited ${order.length} of ${n} node${n === 1 ? "" : "s"}${order.length < n ? " (the rest are not reachable from the start)" : ""}.`,
    line: mode === "bfs" ? 1 : 5,
  });
  return { frames, code: { lang: "pseudocode", lines: mode === "bfs" ? CODE_BFS : CODE_DFS }, result: `${mode.toUpperCase()} order: ${order.join(" → ")}` };
}
