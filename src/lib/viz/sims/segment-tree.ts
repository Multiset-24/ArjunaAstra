import type { Frame, GraphState, Simulation, Tone } from "../types";
import { treeLayout } from "../layout";
import type { In } from "./util";
import { fail } from "./util";

const CODE = [
  "build(node, l, r):",
  "    leaf: tree[node] = a[l]",
  "    else: tree[node] = tree[left] + tree[right]",
  "query(node, l, r, ql, qr):",
  "    if [l, r] is outside [ql, qr]: return 0",
  "    if [l, r] is inside [ql, qr]: return tree[node]",
  "    return query(left) + query(right)",
  "update(i, v): go down to leaf i, set it,",
  "    then recompute every sum on the way back up",
];

interface Nd {
  l: number;
  r: number;
  kids: number[];
  parent: number;
  sum: number | null;
}

export function segmentTree(input: In<"segment-tree">): Simulation {
  const a = [...input.arr];
  const n = a.length;
  const { queries, updates } = input;
  for (const [l, r] of queries) if (l > r || r >= n) fail(`query [${l}, ${r}] must satisfy 0 <= l <= r <= ${n - 1}.`);
  for (const [i] of updates) if (i >= n) fail(`update index ${i} must be between 0 and ${n - 1}.`);

  const nodes: Nd[] = [];
  const build = (l: number, r: number, parent: number): number => {
    const id = nodes.length;
    nodes.push({ l, r, kids: [], parent, sum: null });
    if (l < r) {
      const m = (l + r) >> 1;
      nodes[id].kids.push(build(l, m, id));
      nodes[id].kids.push(build(m + 1, r, id));
    }
    return id;
  };
  build(0, n - 1, -1);
  const pos = treeLayout(
    nodes.map((x) => x.kids),
    [0],
  );
  const frames: Frame[] = [];
  const rng = (x: Nd) => (x.l === x.r ? `[${x.l}]` : `[${x.l}..${x.r}]`);

  const snap = (note: string, line: number, tones: Record<number, Tone>, arrTones: Record<number, Tone> = {}, window?: [number, number], vars: Record<string, string | number> = {}) => {
    const nodeTones: Record<string, Tone> = {};
    for (const [k, v] of Object.entries(tones)) nodeTones[k] = v;
    const graph: GraphState = {
      nodes: nodes.map((x, i) => ({ id: String(i), label: x.sum === null ? "?" : String(x.sum), x: pos[i].x, y: pos[i].y, badge: rng(x) })),
      edges: nodes.flatMap((x, i) => x.kids.map((k) => ({ from: String(i), to: String(k) }))),
      nodeTones,
    };
    frames.push({ graph, array: { values: [...a], tones: arrTones, window, label: "array a" }, vars, note, line });
  };

  // ---- build: leaves are known, internal nodes are computed bottom-up ----
  nodes.forEach((x) => {
    if (x.l === x.r) x.sum = a[x.l];
  });
  const leafTones: Record<number, Tone> = {};
  nodes.forEach((x, i) => {
    if (x.kids.length) leafTones[i] = "muted";
  });
  snap("Each leaf holds one array value; every other node will hold the sum of its range. Badges show the range a node covers.", 1, leafTones);
  const post: number[] = [];
  const walk = (u: number) => {
    nodes[u].kids.forEach(walk);
    if (nodes[u].kids.length) post.push(u);
  };
  walk(0);
  for (const u of post) {
    const [x, y] = nodes[u].kids;
    nodes[u].sum = (nodes[x].sum as number) + (nodes[y].sum as number);
    const t: Record<number, Tone> = {};
    nodes.forEach((nd, i) => {
      if (nd.sum === null) t[i] = "muted";
    });
    t[u] = "active";
    t[x] = "compare";
    t[y] = "compare";
    snap(`Node ${rng(nodes[u])} = ${nodes[x].sum} + ${nodes[y].sum} = ${nodes[u].sum}.`, 2, t);
  }

  // ---- queries ----
  const summary: string[] = [];
  for (const [ql, qr] of queries) {
    const state: Record<number, Tone> = {};
    const arrTones: Record<number, Tone> = {};
    let total = 0;
    const visit = (u: number) => {
      const x = nodes[u];
      if (x.r < ql || x.l > qr) {
        state[u] = "muted";
        return;
      }
      if (ql <= x.l && x.r <= qr) {
        state[u] = "match";
        total += x.sum as number;
        for (let i = x.l; i <= x.r; i++) arrTones[i] = "match";
        snap(`${rng(x)} is fully inside [${ql}..${qr}]: take its sum ${x.sum} without looking deeper. Running total ${total}.`, 5, { ...state }, { ...arrTones }, [ql, qr], { query: `[${ql}..${qr}]`, total });
        return;
      }
      state[u] = "compare";
      snap(`${rng(x)} only partly overlaps [${ql}..${qr}], so ask both children.`, 6, { ...state }, { ...arrTones }, [ql, qr], { query: `[${ql}..${qr}]`, total });
      x.kids.forEach(visit);
    };
    visit(0);
    snap(`sum(${ql}..${qr}) = ${total}. Only a few nodes were touched, about 2 log n instead of ${qr - ql + 1} additions.`, 6, { ...state }, { ...arrTones }, [ql, qr], { query: `[${ql}..${qr}]`, total });
    summary.push(`sum(${ql}..${qr}) = ${total}`);
  }

  // ---- updates ----
  for (const [idx, val] of updates) {
    const path: number[] = [];
    let u = 0;
    for (;;) {
      path.push(u);
      if (nodes[u].kids.length === 0) break;
      u = idx <= nodes[nodes[u].kids[0]].r ? nodes[u].kids[0] : nodes[u].kids[1];
    }
    const t: Record<number, Tone> = {};
    path.forEach((p) => (t[p] = "compare"));
    snap(`Update a[${idx}] from ${a[idx]} to ${val}: walk down to the leaf covering index ${idx}. Only the ${path.length} nodes on this path can change.`, 7, t, { [idx]: "compare" });
    const old = a[idx];
    a[idx] = val;
    nodes[path[path.length - 1]].sum = val;
    for (let k = path.length - 2; k >= 0; k--) {
      const [x, y] = nodes[path[k]].kids;
      nodes[path[k]].sum = (nodes[x].sum as number) + (nodes[y].sum as number);
    }
    const t2: Record<number, Tone> = {};
    path.forEach((p) => (t2[p] = "active"));
    snap(`Set the leaf to ${val} and recompute each sum on the way back up (the root is now ${nodes[0].sum}). The other ${nodes.length - path.length} nodes are untouched.`, 8, t2, { [idx]: "active" }, undefined, { change: `${old} -> ${val}` });
    summary.push(`a[${idx}] = ${val}`);
  }

  const doneTones: Record<number, Tone> = {};
  nodes.forEach((_, i) => (doneTones[i] = "done"));
  snap(`The tree answers any range sum in O(log n) and changes a value in O(log n). Total of the array: ${nodes[0].sum}.`, 6, doneTones);
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: summary.length ? summary.join("; ") : `root sum = ${nodes[0].sum}` };
}
