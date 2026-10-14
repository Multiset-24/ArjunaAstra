import type { Frame, GraphState, Simulation, Tone } from "../types";
import { treeLayout } from "../layout";
import type { In } from "./util";

interface CallNode {
  label: string;
  kids: number[];
  value?: number;
  hit?: boolean;
  leaf: boolean;
}
type Ev = { t: "call" | "ret" | "leaf"; id: number };

const CODE_FIB = [
  "fib(n):",
  "    if n <= 1: return n",
  "    if memo has n: return memo[n]   // memo only",
  "    r = fib(n-1) + fib(n-2)",
  "    memo[n] = r                     // memo only",
  "    return r",
];

const CODE_SUB = [
  "subsets(start, cur):",
  "    record cur            // every call is one subset",
  "    for j = start .. n-1:",
  "        subsets(j + 1, cur + [j])",
];

export function recursionTree(input: In<"recursion-tree">): Simulation {
  const { fn, n, memo } = input;
  const nodes: CallNode[] = [];
  const events: Ev[] = [];
  const parent: number[] = [];

  if (fn === "fib") {
    const cache = new Map<number, number>();
    const rec = (k: number, par: number): { id: number; v: number } => {
      const id = nodes.length;
      nodes.push({ label: `fib(${k})`, kids: [], leaf: false });
      parent.push(par);
      if (par >= 0) nodes[par].kids.push(id);
      if (memo && cache.has(k)) {
        nodes[id] = { ...nodes[id], hit: true, leaf: true, value: cache.get(k) };
        events.push({ t: "leaf", id });
        return { id, v: cache.get(k) as number };
      }
      if (k <= 1) {
        nodes[id] = { ...nodes[id], leaf: true, value: k };
        events.push({ t: "leaf", id });
        return { id, v: k };
      }
      events.push({ t: "call", id });
      const a = rec(k - 1, id);
      const b = rec(k - 2, id);
      nodes[id].value = a.v + b.v;
      if (memo) cache.set(k, a.v + b.v);
      events.push({ t: "ret", id });
      return { id, v: a.v + b.v };
    };
    rec(n, -1);
  } else {
    const rec = (start: number, cur: number[], par: number) => {
      const id = nodes.length;
      nodes.push({ label: cur.length ? cur.join("") : "{}", kids: [], leaf: false });
      parent.push(par);
      if (par >= 0) nodes[par].kids.push(id);
      events.push({ t: "call", id });
      for (let j = start; j < n; j++) rec(j + 1, [...cur, j + 1], id);
    };
    rec(0, [], -1);
  }

  const pos = treeLayout(
    nodes.map((x) => x.kids),
    [0],
  );
  const graphNodes = nodes.map((x, i) => ({ id: String(i), label: x.label, x: pos[i].x, y: pos[i].y }));
  const edgesAll = nodes.flatMap((x, i) => x.kids.map((k) => ({ from: String(i), to: String(k) })));

  type St = "pending" | "open" | "done" | "hit";
  const state: St[] = nodes.map(() => "pending");
  const badge: (string | undefined)[] = nodes.map(() => undefined);
  const stack: number[] = [];
  let calls = 0;
  const frames: Frame[] = [];

  const graph = (): GraphState => {
    const nodeTones: Record<string, Tone> = {};
    nodes.forEach((_, i) => {
      const s = state[i];
      nodeTones[i] = s === "pending" ? "muted" : s === "done" ? "done" : s === "hit" ? "match" : i === stack[stack.length - 1] ? "active" : "focus";
    });
    const edgeTones: Record<string, Tone> = {};
    for (const e of edgesAll) edgeTones[`${e.from}->${e.to}`] = state[Number(e.to)] === "pending" ? "muted" : "done";
    return {
      nodes: graphNodes.map((g, i) => ({ ...g, badge: badge[i] })),
      edges: edgesAll,
      directed: true,
      nodeTones,
      edgeTones,
    };
  };

  const vars = (): Record<string, number> => ({ calls, depth: stack.length });
  const isFib = fn === "fib";
  frames.push({
    graph: graph(),
    vars: { calls: 0, depth: 0 },
    note: isFib
      ? `fib(${n}) calls fib(${n - 1}) and fib(${n - 2}). Faded nodes are calls that have not happened yet.`
      : `Each call records its current subset of {1..${n}}, then extends it with every larger element.`,
    line: 0,
  });

  for (const ev of events) {
    const nd = nodes[ev.id];
    if (ev.t === "call") {
      calls++;
      // subsets never emit a return event: finished siblings are closed when the next call starts
      while (stack.length && stack[stack.length - 1] !== parent[ev.id]) state[stack.pop() as number] = "done";
      state[ev.id] = "open";
      stack.push(ev.id);
      frames.push({
        graph: graph(),
        vars: vars(),
        note: isFib ? `Call ${nd.label}: not a base case${memo ? " and not in the memo" : ""}, so it needs two smaller calls.` : `Visit subset {${nd.label === "{}" ? "" : nd.label.split("").join(",")}}.`,
        line: isFib ? 3 : 1,
      });
    } else if (ev.t === "leaf") {
      calls++;
      state[ev.id] = nd.hit ? "hit" : "done";
      badge[ev.id] = String(nd.value);
      frames.push({
        graph: graph(),
        vars: vars(),
        note: nd.hit ? `${nd.label} is already in the memo: reuse ${nd.value} with no further calls.` : `${nd.label} is a base case: return ${nd.value}.`,
        line: nd.hit ? 2 : 1,
      });
    } else {
      state[ev.id] = "done";
      badge[ev.id] = String(nd.value);
      stack.pop();
      const [a, b] = nd.kids;
      frames.push({
        graph: graph(),
        vars: vars(),
        note: `${nd.label} returns ${nodes[a].value} + ${nodes[b].value} = ${nd.value}${memo ? " and stores it in the memo" : ""}.`,
        line: 5,
      });
    }
  }
  if (!isFib) {
    // subset calls are only "entered"; mark all as visited in the closing frame
    nodes.forEach((_, i) => (state[i] = "done"));
    stack.length = 0;
  }
  const result = isFib ? `fib(${n}) = ${nodes[0].value} using ${calls} calls${memo ? " (memoised)" : ""}` : `${nodes.length} subsets = 2^${n} calls`;
  frames.push({
    graph: graph(),
    vars: vars(),
    note: isFib ? `Done: fib(${n}) = ${nodes[0].value}, using ${calls} calls in total.` : `Done: ${nodes.length} calls, one per subset (2^${n}).`,
    line: isFib ? 5 : 3,
  });
  return { frames, code: { lang: "pseudocode", lines: isFib ? CODE_FIB : CODE_SUB }, result };
}
