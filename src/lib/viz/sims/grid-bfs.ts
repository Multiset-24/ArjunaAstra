import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";
import { fail } from "./util";

const CODE = [
  "queue = [S]; dist[S] = 0",
  "while queue not empty:",
  "    cell = queue.pop_front()",
  "    if cell == T: return dist[T]",
  "    for each neighbour (up, right, down, left):",
  "        if inside, not a wall, not seen:",
  "            dist[nb] = dist[cell] + 1",
  "            queue.push_back(nb)",
  "return -1   // T is unreachable",
];

export function gridBfs(input: In<"grid-bfs">): Simulation {
  const g = input.grid;
  const R = g.length;
  const C = g[0].length;
  if (C > 16) fail("grid is too wide: keep it to at most 16 columns.");
  let s: [number, number] = [0, 0];
  let t: [number, number] = [0, 0];
  for (let r = 0; r < R; r++)
    for (let c = 0; c < C; c++) {
      if (g[r][c] === "S") s = [r, c];
      if (g[r][c] === "T") t = [r, c];
    }
  const key = (r: number, c: number) => `${r},${c}`;
  const dist: (number | null)[][] = Array.from({ length: R }, () => new Array(C).fill(null));
  const par = new Map<string, [number, number]>();
  dist[s[0]][s[1]] = 0;
  const frames: Frame[] = [];
  const dirs: [number, number][] = [
    [-1, 0],
    [0, 1],
    [1, 0],
    [0, -1],
  ];

  const cellsNow = () =>
    g.map((row, r) =>
      [...row].map((ch, c) => (ch === "#" ? "#" : dist[r][c] !== null ? dist[r][c] : ch === "S" || ch === "T" ? ch : null)),
    ) as (number | string | null)[][];

  const tonesFor = (frontier: [number, number][], active: [number, number][] = [], path: [number, number][] = []) => {
    const tones: Record<string, Tone> = {};
    for (let r = 0; r < R; r++)
      for (let c = 0; c < C; c++) {
        if (g[r][c] === "#") tones[key(r, c)] = "muted";
        else if (dist[r][c] !== null) tones[key(r, c)] = "done";
      }
    for (const [r, c] of frontier) tones[key(r, c)] = "compare";
    for (const [r, c] of active) tones[key(r, c)] = "active";
    for (const [r, c] of path) tones[key(r, c)] = "match";
    tones[key(t[0], t[1])] = tones[key(t[0], t[1])] ?? "focus";
    return tones;
  };

  let layer: [number, number][] = [s];
  let d = 0;
  let seen = 1;
  frames.push({
    grid: { cells: cellsNow(), tones: tonesFor([], [s]), label: "S = start, T = target, # = wall; numbers are distances from S" },
    vars: { layer: 0, queue: 1, seen },
    note: "Start at S with distance 0. BFS explores cells in rings of equal distance, so the first time it reaches T is the shortest path.",
    line: 0,
  });
  let found = false;
  while (layer.length && !found) {
    const next: [number, number][] = [];
    for (const [r, c] of layer) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= R || nc >= C || g[nr][nc] === "#" || dist[nr][nc] !== null) continue;
        dist[nr][nc] = d + 1;
        par.set(key(nr, nc), [r, c]);
        next.push([nr, nc]);
        seen++;
        if (g[nr][nc] === "T") found = true;
      }
    }
    d++;
    if (found) {
      // reconstruct the shortest path
      const path: [number, number][] = [];
      let cur: [number, number] | undefined = t;
      while (cur) {
        path.push(cur);
        cur = par.get(key(cur[0], cur[1]));
      }
      frames.push({
        grid: { cells: cellsNow(), tones: tonesFor(next, [], path), label: "green cells are one shortest path" },
        vars: { layer: d, queue: next.length, seen },
        note: `Ring ${d} reaches T: the shortest path has ${d} steps. Following the parent links back gives the green route.`,
        line: 3,
      });
      return { frames, code: { lang: "pseudocode", lines: CODE }, result: `shortest distance = ${d}` };
    }
    if (next.length === 0) break;
    frames.push({
      grid: { cells: cellsNow(), tones: tonesFor(next) },
      vars: { layer: d, queue: next.length, seen },
      note: `Expand every cell at distance ${d - 1}: ${next.length} new cell${next.length === 1 ? "" : "s"} found at distance ${d} (gold).`,
      line: 6,
    });
    layer = next;
  }
  frames.push({
    grid: { cells: cellsNow(), tones: tonesFor([]) },
    vars: { layer: d, queue: 0, seen },
    note: "The queue ran empty without reaching T: walls cut it off from S.",
    line: 8,
  });
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: "T is unreachable (-1)" };
}
