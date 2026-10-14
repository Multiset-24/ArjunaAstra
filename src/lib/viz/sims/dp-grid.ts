import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";
import { fail } from "./util";

type Cell = number | string | null;
type RC = [number, number];
const key = (r: number, c: number) => `${r},${c}`;

interface Step {
  value: number;
  deps: RC[];
  depTone?: Tone;
  note: string;
  line: number;
}
interface Spec {
  rows: number;
  cols: number;
  rowLabels: string[];
  colLabels: string[];
  label: string;
  /** Cells that are filled before the main loop (base cases). */
  base: (T: number[][]) => RC[];
  /** Cells filled by the main loop, in order. */
  order: RC[];
  compute: (T: number[][], r: number, c: number) => Step;
  show?: (v: number, r: number, c: number) => Cell;
  tone?: (r: number, c: number) => Tone | undefined;
  intro: string;
  introLine: number;
  /** Final frame: path cells to highlight, the closing sentence and result text. */
  finish: (T: number[][]) => { path: RC[]; note: string; result: string; line: number };
  code: string[];
}

function run(spec: Spec): Simulation {
  const T: number[][] = Array.from({ length: spec.rows }, () => new Array(spec.cols).fill(NaN));
  const filled: boolean[][] = Array.from({ length: spec.rows }, () => new Array(spec.cols).fill(false));
  const frames: Frame[] = [];
  const show = spec.show ?? ((v: number) => v);
  const cellsNow = () => T.map((row, r) => row.map((v, c) => (filled[r][c] ? show(v, r, c) : null)));
  const baseTones = () => {
    const t: Record<string, Tone> = {};
    if (spec.tone) for (let r = 0; r < spec.rows; r++) for (let c = 0; c < spec.cols; c++) {
      const x = spec.tone(r, c);
      if (x) t[key(r, c)] = x;
    }
    return t;
  };
  const grid = (tones: Record<string, Tone>) => ({
    cells: cellsNow(),
    tones: { ...baseTones(), ...tones },
    rowLabels: spec.rowLabels,
    colLabels: spec.colLabels,
    label: spec.label,
  });

  for (const [r, c] of spec.base(T)) filled[r][c] = true;
  // base() writes values into T; mark every non-NaN cell filled
  for (let r = 0; r < spec.rows; r++) for (let c = 0; c < spec.cols; c++) if (!Number.isNaN(T[r][c])) filled[r][c] = true;
  frames.push({ grid: grid({}), note: spec.intro, line: spec.introLine });

  const perRow = spec.order.length > 48;
  let rowCells: string[] = [];
  spec.order.forEach(([r, c], idx) => {
    const st = spec.compute(T, r, c);
    T[r][c] = st.value;
    filled[r][c] = true;
    const next = spec.order[idx + 1];
    const endOfRow = !next || next[0] !== r;
    if (!perRow) {
      const tones: Record<string, Tone> = {};
      for (const [dr, dc] of st.deps) tones[key(dr, dc)] = st.depTone ?? "compare";
      tones[key(r, c)] = "active";
      frames.push({
        grid: grid(tones),
        vars: { cell: `(${r}, ${c})`, value: st.value },
        note: st.note,
        line: st.line,
      });
    } else {
      rowCells.push(key(r, c));
      if (endOfRow) {
        const tones: Record<string, Tone> = {};
        for (const k of rowCells) tones[k] = "active";
        frames.push({
          grid: grid(tones),
          vars: { row: r, "last cell": st.value },
          note: `Row ${r} (${spec.rowLabels[r]}) is filled left to right, each cell from already-solved neighbours. Last cell: ${st.note}`,
          line: st.line,
        });
        rowCells = [];
      }
    }
  });
  const fin = spec.finish(T);
  const tones: Record<string, Tone> = {};
  for (const [r, c] of fin.path) tones[key(r, c)] = "match";
  frames.push({ grid: grid(tones), vars: { answer: fin.result }, note: fin.note, line: fin.line });
  return { frames, code: { lang: "pseudocode", lines: spec.code }, result: fin.result };
}

const range = (n: number) => [...Array(n).keys()];

function lcs(a: string, b: string): Simulation {
  const m = a.length;
  const n = b.length;
  const order: RC[] = [];
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) order.push([i, j]);
  return run({
    rows: m + 1,
    cols: n + 1,
    rowLabels: ["∅", ...a],
    colLabels: ["∅", ...b],
    label: `T[i][j] = length of the LCS of the first i letters of "${a}" and the first j letters of "${b}"`,
    base: (T) => {
      const out: RC[] = [];
      for (let i = 0; i <= m; i++) {
        T[i][0] = 0;
        out.push([i, 0]);
      }
      for (let j = 0; j <= n; j++) {
        T[0][j] = 0;
        out.push([0, j]);
      }
      return out;
    },
    order,
    compute: (T, i, j) => {
      if (a[i - 1] === b[j - 1]) {
        return { value: T[i - 1][j - 1] + 1, deps: [[i - 1, j - 1]], depTone: "match", note: `'${a[i - 1]}' = '${b[j - 1]}', so extend the diagonal: T[${i}][${j}] = ${T[i - 1][j - 1]} + 1 = ${T[i - 1][j - 1] + 1}.`, line: 4 };
      }
      const up = T[i - 1][j];
      const left = T[i][j - 1];
      return { value: Math.max(up, left), deps: [[i - 1, j], [i, j - 1]], note: `'${a[i - 1]}' != '${b[j - 1]}': take the better of above (${up}) and left (${left}) = ${Math.max(up, left)}.`, line: 5 };
    },
    intro: "Row = prefix of the first string, column = prefix of the second. The first row and column are 0 (an empty prefix shares nothing).",
    introLine: 0,
    finish: (T) => {
      let i = m;
      let j = n;
      const path: RC[] = [[i, j]];
      let s = "";
      while (i > 0 && j > 0) {
        if (a[i - 1] === b[j - 1]) {
          s = a[i - 1] + s;
          i--;
          j--;
        } else if (T[i - 1][j] >= T[i][j - 1]) i--;
        else j--;
        path.push([i, j]);
      }
      return { path, note: `Trace back from the bottom-right corner: diagonal steps are the matched letters. One LCS is "${s}", length ${T[m][n]}.`, result: `LCS length = ${T[m][n]} ("${s}")`, line: 7 };
    },
    code: [
      "T[i][0] = T[0][j] = 0",
      "for i = 1 .. m:",
      "    for j = 1 .. n:",
      "        if a[i-1] == b[j-1]:",
      "            T[i][j] = T[i-1][j-1] + 1",
      "        else:",
      "            T[i][j] = max(T[i-1][j], T[i][j-1])",
      "answer = T[m][n]   // trace back to recover the letters",
    ],
  });
}

function editDistance(a: string, b: string): Simulation {
  const m = a.length;
  const n = b.length;
  const order: RC[] = [];
  for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) order.push([i, j]);
  return run({
    rows: m + 1,
    cols: n + 1,
    rowLabels: ["∅", ...a],
    colLabels: ["∅", ...b],
    label: `T[i][j] = fewest edits to turn the first i letters of "${a}" into the first j letters of "${b}"`,
    base: (T) => {
      const out: RC[] = [];
      for (let i = 0; i <= m; i++) {
        T[i][0] = i;
        out.push([i, 0]);
      }
      for (let j = 0; j <= n; j++) {
        T[0][j] = j;
        out.push([0, j]);
      }
      return out;
    },
    order,
    compute: (T, i, j) => {
      if (a[i - 1] === b[j - 1]) {
        return { value: T[i - 1][j - 1], deps: [[i - 1, j - 1]], depTone: "match", note: `'${a[i - 1]}' = '${b[j - 1]}': no edit needed, copy the diagonal ${T[i - 1][j - 1]}.`, line: 4 };
      }
      const del = T[i - 1][j] + 1;
      const ins = T[i][j - 1] + 1;
      const sub = T[i - 1][j - 1] + 1;
      const v = Math.min(del, ins, sub);
      return { value: v, deps: [[i - 1, j], [i, j - 1], [i - 1, j - 1]], note: `Letters differ: delete = ${del}, insert = ${ins}, substitute = ${sub}. The cheapest is ${v}.`, line: 6 };
    },
    intro: "First column: delete i letters. First row: insert j letters. Fill the rest from the three neighbours above and to the left.",
    introLine: 0,
    finish: (T) => {
      let i = m;
      let j = n;
      const path: RC[] = [[i, j]];
      while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && T[i][j] === T[i - 1][j - 1]) {
          i--;
          j--;
        } else if (i > 0 && j > 0 && T[i][j] === T[i - 1][j - 1] + 1) {
          i--;
          j--;
        } else if (i > 0 && T[i][j] === T[i - 1][j] + 1) i--;
        else j--;
        path.push([i, j]);
      }
      return { path, note: `The bottom-right cell is the answer: ${T[m][n]} edit${T[m][n] === 1 ? "" : "s"} turn "${a}" into "${b}". The green path shows which cells it came from.`, result: `edit distance = ${T[m][n]}`, line: 7 };
    },
    code: [
      "T[i][0] = i; T[0][j] = j",
      "for i = 1 .. m:",
      "    for j = 1 .. n:",
      "        if a[i-1] == b[j-1]:",
      "            T[i][j] = T[i-1][j-1]",
      "        else:",
      "            T[i][j] = 1 + min(T[i-1][j], T[i][j-1], T[i-1][j-1])",
      "answer = T[m][n]",
    ],
  });
}

function knapsack(weights: number[], values: number[], cap: number): Simulation {
  const n = weights.length;
  const order: RC[] = [];
  for (let i = 1; i <= n; i++) for (let c = 0; c <= cap; c++) order.push([i, c]);
  return run({
    rows: n + 1,
    cols: cap + 1,
    rowLabels: ["none", ...weights.map((w, i) => `${i + 1}: w${w} v${values[i]}`)],
    colLabels: range(cap + 1).map(String),
    label: "T[i][c] = best value using the first i items with capacity c",
    base: (T) => {
      const out: RC[] = [];
      for (let c = 0; c <= cap; c++) {
        T[0][c] = 0;
        out.push([0, c]);
      }
      return out;
    },
    order,
    compute: (T, i, c) => {
      const w = weights[i - 1];
      const v = values[i - 1];
      const skip = T[i - 1][c];
      if (c < w) return { value: skip, deps: [[i - 1, c]], note: `Item ${i} (weight ${w}) does not fit in capacity ${c}: keep ${skip}.`, line: 4 };
      const take = T[i - 1][c - w] + v;
      return {
        value: Math.max(skip, take),
        deps: [[i - 1, c], [i - 1, c - w]],
        note: `Capacity ${c}, item ${i}: skip = ${skip}; take = ${v} + T[${i - 1}][${c - w}] = ${take}. Best is ${Math.max(skip, take)}.`,
        line: 5,
      };
    },
    intro: "Rows add one item at a time, columns are the capacity. Row 0 (no items) is worth 0 everywhere.",
    introLine: 0,
    finish: (T) => {
      let c = cap;
      const path: RC[] = [[n, c]];
      const picked: number[] = [];
      for (let i = n; i >= 1; i--) {
        if (T[i][c] !== T[i - 1][c]) {
          picked.push(i);
          c -= weights[i - 1];
        }
        path.push([i - 1, c]);
      }
      picked.reverse();
      const tw = picked.reduce((s, i) => s + weights[i - 1], 0);
      return {
        path,
        note: `The answer is the bottom-right cell: ${T[n][cap]}. Tracing back, a row whose value changed means that item was taken: ${picked.length ? `items ${picked.join(", ")} (total weight ${tw})` : "no items"}.`,
        result: `best value = ${T[n][cap]} (items ${picked.length ? picked.join(", ") : "none"}, weight ${tw}/${cap})`,
        line: 7,
      };
    },
    code: [
      "T[0][c] = 0 for every c",
      "for i = 1 .. n:",
      "    for c = 0 .. capacity:",
      "        T[i][c] = T[i-1][c]            // skip item i",
      "        if c < w[i]: continue          // does not fit",
      "        T[i][c] = max(T[i][c], T[i-1][c-w[i]] + v[i])   // take it",
      "",
      "answer = T[n][capacity]",
    ],
  });
}

function gridPaths(grid: string[]): Simulation {
  const R = grid.length;
  const C = grid[0].length;
  const order: RC[] = [];
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) order.push([r, c]);
  const wall = (r: number, c: number) => grid[r][c] === "#";
  return run({
    rows: R,
    cols: C,
    rowLabels: range(R).map(String),
    colLabels: range(C).map(String),
    label: "T[r][c] = number of ways to reach this cell moving only right or down",
    base: () => [],
    order,
    show: (v, r, c) => (wall(r, c) ? "#" : v),
    tone: (r, c) => (wall(r, c) ? "muted" : undefined),
    compute: (T, r, c) => {
      if (wall(r, c)) return { value: 0, deps: [], note: `(${r}, ${c}) is a wall: 0 ways.`, line: 3 };
      if (r === 0 && c === 0) return { value: 1, deps: [], note: "The start cell has exactly 1 way: stand still.", line: 1 };
      const up = r > 0 ? T[r - 1][c] : 0;
      const left = c > 0 ? T[r][c - 1] : 0;
      const deps: RC[] = [];
      if (r > 0) deps.push([r - 1, c]);
      if (c > 0) deps.push([r, c - 1]);
      return { value: up + left, deps, note: `(${r}, ${c}) is reached from above (${up}) or from the left (${left}): ${up} + ${left} = ${up + left}.`, line: 4 };
    },
    intro: "Walls ('#') are blocked. Every other cell is reached only from the cell above or the cell to its left.",
    introLine: 0,
    finish: (T) => ({
      path: [[R - 1, C - 1]],
      note: wall(0, 0) || wall(R - 1, C - 1) ? "The start or the goal is a wall, so there are no paths." : `The bottom-right cell holds the answer: ${T[R - 1][C - 1]} path${T[R - 1][C - 1] === 1 ? "" : "s"}.`,
      result: `${T[R - 1][C - 1]} path${T[R - 1][C - 1] === 1 ? "" : "s"} from top-left to bottom-right`,
      line: 5,
    }),
    code: [
      "for r in rows, c in cols:",
      "    if start: T[0][0] = 1",
      "    else if wall: T[r][c] = 0",
      "    else:",
      "        T[r][c] = T[r-1][c] + T[r][c-1]   // above + left",
      "answer = T[R-1][C-1]",
    ],
  });
}

export function dpGrid(input: In<"dp-grid">): Simulation {
  const { mode } = input;
  if (mode === "lcs" || mode === "edit-distance") {
    if (input.a === undefined || input.b === undefined) fail(`mode "${mode}" needs strings "a" and "b".`);
    if (!input.a || !input.b) fail('"a" and "b" must not be empty.');
    return mode === "lcs" ? lcs(input.a as string, input.b as string) : editDistance(input.a as string, input.b as string);
  }
  if (mode === "knapsack") {
    const { weights, values, capacity } = input;
    if (!weights || !values || capacity === undefined) fail('mode "knapsack" needs "weights", "values" and "capacity".');
    if ((weights as number[]).length !== (values as number[]).length) fail('"weights" and "values" must have the same length.');
    if ((weights as number[]).some((w) => w < 1)) fail("weights must be at least 1.");
    return knapsack(weights as number[], values as number[], capacity as number);
  }
  const grid = input.grid;
  if (!grid || grid.length === 0) fail('mode "grid-paths" needs a "grid" of "." and "#" rows.');
  const g = grid as string[];
  if (g.some((r) => r.length !== g[0].length)) fail("grid rows must have equal length.");
  if (g[0].length > 10) fail("keep the grid to at most 10 columns.");
  return gridPaths(g);
}
