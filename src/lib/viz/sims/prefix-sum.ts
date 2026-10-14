import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";
import { fail } from "./util";

const CODE = [
  "p[0] = 0",
  "for i = 0 .. n-1:",
  "    p[i+1] = p[i] + a[i]",
  "",
  "sum(l, r) = p[r+1] - p[l]   // O(1) per query",
];

export function prefixSum(input: In<"prefix-sum">): Simulation {
  const { arr, queries } = input;
  const n = arr.length;
  for (const [l, r] of queries) {
    if (l > r || r >= n) fail(`query [${l}, ${r}] must satisfy 0 <= l <= r <= ${n - 1}.`);
  }
  const frames: Frame[] = [];
  const p: (number | string)[] = new Array(n + 1).fill("?");
  p[0] = 0;
  const pArr = (tones?: Record<number, Tone>, pointers?: Record<string, number>) => ({
    values: [...p],
    tones,
    pointers,
    label: "prefix sums p (p[i] = sum of the first i values)",
  });
  frames.push({
    array: { values: arr, label: "a" },
    arrays: [pArr({ 0: "done" })],
    note: "Start with p[0] = 0: the sum of zero values.",
    line: 0,
  });
  for (let i = 0; i < n; i++) {
    p[i + 1] = (p[i] as number) + arr[i];
    frames.push({
      array: { values: arr, label: "a", tones: { [i]: "active" }, pointers: { i } },
      arrays: [pArr({ [i]: "compare", [i + 1]: "active" })],
      vars: { i, [`p[${i}]`]: p[i] as number, [`a[${i}]`]: arr[i] },
      note: `p[${i + 1}] = p[${i}] + a[${i}] = ${(p[i] as number) - arr[i]} + ${arr[i]} = ${p[i + 1]}.`,
      line: 2,
    });
  }
  const answers: string[] = [];
  for (const [l, r] of queries) {
    const hi = p[r + 1] as number;
    const lo = p[l] as number;
    const tones: Record<number, Tone> = {};
    for (let i = l; i <= r; i++) tones[i] = "match";
    answers.push(`sum(${l}..${r}) = ${hi - lo}`);
    frames.push({
      array: { values: arr, label: "a", tones, window: [l, r] },
      arrays: [pArr({ [r + 1]: "compare", [l]: "compare" })],
      vars: { l, r, [`p[${r + 1}]`]: hi, [`p[${l}]`]: lo },
      note: `sum(${l}..${r}) = p[${r + 1}] - p[${l}] = ${hi} - ${lo} = ${hi - lo}, with no loop over the range.`,
      line: 4,
    });
  }
  return {
    frames,
    code: { lang: "pseudocode", lines: CODE },
    result: answers.length ? answers.join("; ") : `prefix array built: [${p.join(", ")}]`,
  };
}
