import type { Frame, GraphState, Simulation, Tone } from "../types";
import { treeLayout } from "../layout";
import type { In } from "./util";
import { fail } from "./util";

const CODE = [
  "find(x):",
  "    if parent[x] != x: parent[x] = find(parent[x])   // path compression",
  "    return parent[x]",
  "union(a, b):",
  "    ra = find(a); rb = find(b)",
  "    if ra == rb: return   // already together",
  "    attach the smaller tree under the larger",
  "    size[big] += size[small]",
];

export function dsu(input: In<"dsu">): Simulation {
  const { n, unions, find: finds } = input;
  for (const [a, b] of unions) if (a >= n || b >= n) fail(`union [${a}, ${b}] uses a node outside 0..${n - 1}.`);
  for (const x of finds) if (x >= n) fail(`find ${x} uses a node outside 0..${n - 1}.`);
  const parent = Array.from({ length: n }, (_, i) => i);
  const size = new Array(n).fill(1);
  const frames: Frame[] = [];

  const root = (x: number) => {
    const path = [x];
    while (parent[x] !== x) {
      x = parent[x];
      path.push(x);
    }
    return path;
  };

  const snap = (note: string, line: number, tones: Record<string, Tone> = {}, edgeTones: Record<string, Tone> = {}, vars: Record<string, string | number> = {}) => {
    const kids: number[][] = Array.from({ length: n }, () => []);
    for (let i = 0; i < n; i++) if (parent[i] !== i) kids[parent[i]].push(i);
    const roots = [...Array(n).keys()].filter((i) => parent[i] === i);
    const pos = treeLayout(kids, roots);
    const graph: GraphState = {
      nodes: pos.map((p, i) => ({ id: String(i), x: p.x, y: p.y, badge: parent[i] === i ? `size ${size[i]}` : undefined })),
      edges: parent.flatMap((p, i) => (p !== i ? [{ from: String(i), to: String(p) }] : [])),
      directed: true,
      nodeTones: tones,
      edgeTones,
    };
    frames.push({
      graph,
      array: { values: [...parent], label: "parent[i] (a node that points to itself is a root)" },
      vars: { sets: roots.length, ...vars },
      note,
      line,
    });
  };

  snap(`Every node starts as its own set: ${n} separate trees, each pointing to itself.`, 0);

  const findStep = (x: number, label: string, line: number) => {
    const path = root(x);
    const r = path[path.length - 1];
    const tones: Record<string, Tone> = {};
    const edgeTones: Record<string, Tone> = {};
    path.forEach((p, i) => {
      tones[p] = i === path.length - 1 ? "match" : "compare";
      if (i > 0) edgeTones[`${path[i - 1]}->${p}`] = "compare";
    });
    tones[x] = "active";
    snap(`find(${x}) for ${label}: follow parents ${path.join(" -> ")} to the root ${r}.`, 1, tones, edgeTones, { root: r });
    if (path.length > 2) {
      for (const p of path.slice(0, -1)) parent[p] = r;
      const t2: Record<string, Tone> = { [r]: "match" };
      for (const p of path.slice(0, -1)) t2[p] = "done";
      snap(`Path compression: every node on that path now points straight at ${r}, so the next find is faster.`, 1, t2, {}, { root: r });
    }
    return r;
  };

  for (const [a, b] of unions) {
    const ra = findStep(a, `union(${a}, ${b})`, 4);
    const rb = findStep(b, `union(${a}, ${b})`, 4);
    if (ra === rb) {
      snap(`Both ${a} and ${b} already have root ${ra}: they are in the same set, nothing to do.`, 5, { [ra]: "match", [a]: "active", [b]: "active" });
      continue;
    }
    const big = size[ra] >= size[rb] ? ra : rb;
    const small = big === ra ? rb : ra;
    parent[small] = big;
    size[big] += size[small];
    snap(`Different roots (${ra} and ${rb}): attach the smaller tree (root ${small}, size ${size[big] - size[small]}) under the larger (root ${big}). The new size is ${size[big]}.`, 6, { [big]: "match", [small]: "active" }, { [`${small}->${big}`]: "active" });
  }
  const answers: string[] = [];
  for (const x of finds) {
    const r = findStep(x, "the query", 1);
    answers.push(`find(${x}) = ${r}`);
  }
  const roots = [...Array(n).keys()].filter((i) => parent[i] === i);
  snap(`Done: ${roots.length} set${roots.length === 1 ? "" : "s"} remain${roots.length === 1 ? "s" : ""}. Trees stay shallow, so find is almost O(1).`, 7, Object.fromEntries(roots.map((r) => [r, "match" as Tone])));
  return {
    frames,
    code: { lang: "pseudocode", lines: CODE },
    result: `${roots.length} set${roots.length === 1 ? "" : "s"}${answers.length ? `; ${answers.join(", ")}` : ""}`,
  };
}
