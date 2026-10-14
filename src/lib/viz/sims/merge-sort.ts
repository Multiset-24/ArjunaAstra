import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";

const CODE = [
  "mergeSort(l, r):",
  "    if l == r: return",
  "    m = (l + r) / 2",
  "    mergeSort(l, m); mergeSort(m+1, r)",
  "    merge(l, m, r)",
  "merge(l, m, r):",
  "    i = l; j = m + 1",
  "    while i <= m and j <= r:",
  "        take the smaller of a[i], a[j] into out",
  "    copy the leftovers into out",
  "    copy out back into a[l..r]",
];

export function mergeSort(input: In<"merge-sort">): Simulation {
  const cur = [...input.arr];
  const n = cur.length;
  const frames: Frame[] = [];
  frames.push({
    array: { values: [...cur] },
    note: "Split in halves again and again until every piece has one value; then merge pieces back, smaller first.",
    line: 3,
  });

  const merge = (l: number, m: number, r: number) => {
    const left = cur.slice(l, m + 1);
    const right = cur.slice(m + 1, r + 1);
    const out: number[] = [];
    let i = 0;
    let j = 0;
    const header = `Merge [${l}..${m}] and [${m + 1}..${r}]. `;
    let first = true;
    const emit = (note: string, line: number, cmp: number[], finished: boolean, taken?: number) => {
      const values = finished ? [...cur.slice(0, l), ...out, ...cur.slice(r + 1)] : [...cur];
      const tones: Record<number, Tone> = {};
      for (let k = 0; k < n; k++) if (k < l || k > r) tones[k] = "muted";
      if (!finished) {
        for (let k = l; k < l + i; k++) tones[k] = "done";
        for (let k = m + 1; k < m + 1 + j; k++) tones[k] = "done";
        for (const c of cmp) tones[c] = "compare";
        if (taken !== undefined) tones[taken] = "active";
      } else {
        for (let k = l; k <= r; k++) tones[k] = "done";
      }
      const pointers: Record<string, number> = {};
      if (!finished) {
        if (i < left.length) pointers.i = l + i;
        if (j < right.length) pointers.j = m + 1 + j;
      }
      frames.push({
        array: { values, tones, pointers, window: [l, r] },
        arrays: [{ values: [...out], label: `merged output for [${l}..${r}]` }],
        vars: { l, m, r },
        note: (first ? header : "") + note,
        line,
      });
      first = false;
    };
    while (i < left.length && j < right.length) {
      const takeLeft = left[i] <= right[j];
      const v = takeLeft ? left[i] : right[j];
      const a = left[i];
      const b = right[j];
      const cmp = takeLeft ? [m + 1 + j] : [l + i];
      const taken = takeLeft ? l + i : m + 1 + j;
      out.push(v);
      if (takeLeft) i++;
      else j++;
      const last = out.length === r - l + 1;
      if (last) {
        for (let k = 0; k < out.length; k++) cur[l + k] = out[k];
      }
      emit(`Compare ${a} and ${b}: take the smaller, ${v}.${last ? " Copy the merged run back." : ""}`, 8, cmp, last, taken);
    }
    while (i < left.length || j < right.length) {
      const v = i < left.length ? left[i++] : right[j++];
      out.push(v);
      const last = out.length === r - l + 1;
      if (last) for (let k = 0; k < out.length; k++) cur[l + k] = out[k];
      emit(`One side is empty, so take the leftover ${v}.${last ? " Copy the merged run back." : ""}`, 9, [], last);
    }
  };

  const sort = (l: number, r: number) => {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    sort(l, m);
    sort(m + 1, r);
    merge(l, m, r);
  };
  sort(0, n - 1);
  if (n === 1) {
    frames.push({ array: { values: [...cur], tones: { 0: "done" } }, note: "A single value is already sorted.", line: 1 });
  }
  const tones: Record<number, Tone> = {};
  for (let k = 0; k < n; k++) tones[k] = "match";
  frames.push({ array: { values: [...cur], tones }, note: "Everything is merged: the array is sorted.", line: 4 });
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: `sorted: [${cur.join(", ")}]` };
}
