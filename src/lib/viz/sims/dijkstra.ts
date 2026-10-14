import type { Frame, GraphState, Simulation, Tone } from "../types";
import { circleLayout } from "../layout";
import type { In } from "./util";
import { fail, INF } from "./util";

const CODE = [
  "dist[*] = INF; dist[start] = 0",
  "while some unfinished node has finite dist:",
  "    u = unfinished node with the smallest dist   // a heap does this",
  "    mark u finished",
  "    for each edge (u, v, w):",
  "        if dist[u] + w < dist[v]:",
  "            dist[v] = dist[u] + w; parent[v] = u",
  "return dist",
];

export function dijkstra(input: In<"dijkstra">): Simulation {
  const { n, edges, start, directed } = input;
  if (start >= n) fail(`start = ${start} must be a node between 0 and ${n - 1}.`);
  for (const [a, b] of edges) if (a >= n || b >= n) fail(`edge [${a}, ${b}, ...] uses a node outside 0..${n - 1}.`);
  const adj: { v: number; w: number }[][] = Array.from({ length: n }, () => []);
  for (const [a, b, w] of edges) {
    adj[a].push({ v: b, w });
    if (!directed) adj[b].push({ v: a, w });
  }
  const pos = circleLayout(n);
  const dist: number[] = new Array(n).fill(Infinity);
  const par: number[] = new Array(n).fill(-1);
  const done: boolean[] = new Array(n).fill(false);
  dist[start] = 0;
  const frames: Frame[] = [];
  const fmt = (d: number) => (Number.isFinite(d) ? String(d) : INF);
  const gEdges = edges.map(([a, b, w]) => ({ from: String(a), to: String(b), label: String(w) }));

  const snap = (note: string, line: number, active: number | null, considered: number[] = [], improved: number[] = []) => {
    const nodeTones: Record<string, Tone> = {};
    for (let i = 0; i < n; i++) {
      if (done[i]) nodeTones[i] = "done";
      else if (Number.isFinite(dist[i])) nodeTones[i] = "focus";
    }
    for (const v of considered) nodeTones[v] = "compare";
    for (const v of improved) nodeTones[v] = "active";
    if (active !== null) nodeTones[active] = "active";
    const edgeTones: Record<string, Tone> = {};
    for (let v = 0; v < n; v++) if (par[v] >= 0) edgeTones[`${par[v]}->${v}`] = "done";
    if (active !== null) for (const v of considered) edgeTones[`${active}->${v}`] = improved.includes(v) ? "active" : "compare";
    const graph: GraphState = {
      nodes: pos.map((p, i) => ({ id: String(i), x: p.x, y: p.y, badge: fmt(dist[i]) })),
      edges: gEdges,
      directed,
      nodeTones,
      edgeTones,
    };
    const dt: Record<number, Tone> = {};
    for (let i = 0; i < n; i++) if (done[i]) dt[i] = "done";
    if (active !== null) dt[active] = "active";
    frames.push({
      graph,
      array: { values: dist.map(fmt), tones: dt, label: "dist from the start (index = node)" },
      vars: { finished: done.filter(Boolean).length, ...(active !== null ? { u: active } : {}) },
      note,
      line,
    });
  };

  snap(`Every distance starts at infinity except the start node ${start}, which is 0.`, 0, null);
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && Number.isFinite(dist[i]) && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) break;
    done[u] = true;
    snap(`Pick the closest unfinished node: ${u} with distance ${dist[u]}. No shorter route to it can exist, so it is final.`, 2, u);
    const considered: number[] = [];
    const improved: number[] = [];
    const parts: string[] = [];
    for (const { v, w } of adj[u]) {
      if (done[v]) {
        parts.push(`${v} is already final`);
        continue;
      }
      considered.push(v);
      const cand = dist[u] + w;
      if (cand < dist[v]) {
        parts.push(`${v}: ${fmt(dist[v])} -> ${cand}`);
        dist[v] = cand;
        par[v] = u;
        improved.push(v);
      } else parts.push(`${v}: ${cand} is not better than ${dist[v]}`);
    }
    if (adj[u].length === 0) snap(`Node ${u} has no outgoing edges, so there is nothing to relax.`, 4, u);
    else snap(`Relax edges from ${u} (${dist[u]} + weight): ${parts.join("; ")}.`, improved.length ? 6 : 5, u, considered, improved);
  }
  const unreachable = dist.map((d, i) => (Number.isFinite(d) ? -1 : i)).filter((i) => i >= 0);
  snap(
    unreachable.length ? `All reachable nodes are final. Node${unreachable.length > 1 ? "s" : ""} ${unreachable.join(", ")} cannot be reached.` : "Every node is final: the green edges form the shortest-path tree.",
    7,
    null,
  );
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: `dist from ${start} = [${dist.map(fmt).join(", ")}]` };
}
