import type { Frame, GraphState, Simulation, Tone } from "../types";
import { heapLayout } from "../layout";
import type { In } from "./util";

const CODE = [
  "push(x): a.append(x); siftUp(last)",
  "siftUp(i):",
  "    while i > 0 and a[parent(i)] > a[i]: swap; i = parent(i)",
  "pop(): min = a[0]; a[0] = a.pop(); siftDown(0)",
  "siftDown(i):",
  "    while a[i] > its smaller child:",
  "        swap with the smaller child; i = that child",
];

export function heap(input: In<"heap">): Simulation {
  const a: number[] = [];
  const frames: Frame[] = [];
  const popped: number[] = [];

  const snap = (tones: Record<number, Tone>, note: string, line: number, extra: Record<string, string | number> = {}) => {
    const pos = heapLayout(a.length);
    const graph: GraphState = {
      nodes: a.map((v, i) => ({ id: String(i), label: String(v), x: pos[i].x, y: pos[i].y })),
      edges: a.flatMap((_, i) => (i > 0 ? [{ from: String(Math.floor((i - 1) / 2)), to: String(i) }] : [])),
      nodeTones: Object.fromEntries(Object.entries(tones).map(([k, v]) => [k, v])),
    };
    frames.push({
      array: { values: [...a], tones, label: "heap stored in an array (children of i are 2i+1 and 2i+2)" },
      graph,
      vars: { size: a.length, min: a.length ? a[0] : "empty", ...extra },
      note,
      line,
    });
  };

  snap({}, "An empty min-heap: the smallest value always sits at the root.", 0);

  for (const op of input.ops) {
    if (op.startsWith("push")) {
      const x = Number(op.split(" ")[1]);
      a.push(x);
      let i = a.length - 1;
      const parentOf = (k: number) => Math.floor((k - 1) / 2);
      if (i === 0 || a[parentOf(i)] <= a[i]) {
        snap(
          { [i]: "active" },
          i === 0 ? `push ${x}: the heap was empty, so it becomes the root.` : `push ${x}: placed at index ${i}; its parent ${a[parentOf(i)]} is not bigger, so nothing to fix.`,
          i === 0 ? 0 : 2,
          { op },
        );
      } else {
        snap({ [i]: "active", [parentOf(i)]: "compare" }, `push ${x}: placed at the end (index ${i}). Parent ${a[parentOf(i)]} is bigger, so it must move up.`, 0, { op });
        while (i > 0 && a[parentOf(i)] > a[i]) {
          const p = parentOf(i);
          [a[p], a[i]] = [a[i], a[p]];
          i = p;
          const stop = i === 0 || a[parentOf(i)] <= a[i];
          snap(
            { [i]: "active" },
            `Swap with the parent: ${x} moves up to index ${i}.${stop ? (i === 0 ? " It reached the root, so the heap is valid." : ` Its new parent ${a[parentOf(i)]} is not bigger, so stop.`) : ` Parent ${a[parentOf(i)]} is still bigger, keep going.`}`,
            2,
            { op },
          );
        }
      }
    } else {
      if (a.length === 0) {
        snap({}, "pop on an empty heap: nothing to remove.", 3, { op });
        continue;
      }
      const min = a[0];
      popped.push(min);
      const last = a.pop() as number;
      if (a.length === 0) {
        snap({}, `pop: removed ${min}. The heap is empty again.`, 3, { op, removed: min });
        continue;
      }
      a[0] = last;
      snap({ 0: "active" }, `pop: remove the minimum ${min}, then move the last leaf ${last} to the root.`, 3, { op, removed: min });
      let i = 0;
      const n = a.length;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < n && a[l] < a[m]) m = l;
        if (r < n && a[r] < a[m]) m = r;
        if (m === i) {
          const tones: Record<number, Tone> = { [i]: "done" };
          snap(tones, l >= n ? `${a[i]} is a leaf now, so the heap is valid.` : `${a[i]} is not bigger than its children, so stop.`, 5, { op, removed: min });
          break;
        }
        const x = a[i];
        const child = a[m];
        [a[i], a[m]] = [a[m], a[i]];
        const tones: Record<number, Tone> = { [m]: "active", [i]: "compare" };
        snap(tones, `${x} is bigger than its smaller child ${child}: swap, ${x} moves down to index ${m}.`, 6, { op, removed: min });
        i = m;
      }
    }
  }
  return {
    frames,
    code: { lang: "pseudocode", lines: CODE },
    result: `heap = [${a.join(", ")}]${popped.length ? `; popped in order: ${popped.join(", ")}` : ""}`,
  };
}
