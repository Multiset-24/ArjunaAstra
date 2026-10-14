import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";

const CODE = [
  "tails = []   // tails[k] = smallest tail of an increasing run of length k+1",
  "for x in a:",
  "    p = lower_bound(tails, x)   // first tail >= x",
  "    if p == len(tails): tails.append(x)   // longer run",
  "    else: tails[p] = x                    // smaller tail",
  "return len(tails)",
];

export function lis(input: In<"lis">): Simulation {
  const { arr } = input;
  const frames: Frame[] = [];
  const tails: number[] = [];
  frames.push({
    array: { values: arr, label: "input" },
    arrays: [{ values: [], label: "tails (always sorted)" }],
    vars: { length: 0 },
    note: "tails[k] is the smallest possible last value of an increasing subsequence of length k+1. It stays sorted, so we can binary search it.",
    line: 0,
  });
  arr.forEach((x, i) => {
    let lo = 0;
    let hi = tails.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tails[mid] >= x) hi = mid;
      else lo = mid + 1;
    }
    const p = lo;
    const append = p === tails.length;
    const tones: Record<number, Tone> = {};
    for (let k = 0; k < i; k++) tones[k] = "done";
    tones[i] = "active";
    const before = [...tails];
    frames.push({
      array: { values: arr, tones, pointers: { x: i }, label: "input" },
      arrays: [{ values: before, tones: append ? {} : { [p]: "compare" }, pointers: append ? undefined : { p }, label: "tails (always sorted)" }],
      vars: { x, p, length: tails.length },
      note: append
        ? `Binary search: every tail is smaller than ${x}, so ${x} can extend the longest run.`
        : `Binary search: the first tail >= ${x} is ${tails[p]} at index ${p}, so ${x} can replace it.`,
      line: 2,
    });
    if (append) tails.push(x);
    else tails[p] = x;
    frames.push({
      array: { values: arr, tones, pointers: { x: i }, label: "input" },
      arrays: [{ values: [...tails], tones: { [p]: "active" }, label: "tails (always sorted)" }],
      vars: { x, length: tails.length },
      note: append ? `Append ${x}: the longest increasing subsequence so far has length ${tails.length}.` : `Replace ${before[p]} by ${x}: same length ${tails.length}, but a smaller tail leaves more room to grow.`,
      line: append ? 3 : 4,
    });
  });
  const tones: Record<number, Tone> = {};
  tails.forEach((_, k) => (tones[k] = "match"));
  frames.push({
    array: { values: arr, label: "input" },
    arrays: [{ values: [...tails], tones, label: "tails (always sorted)" }],
    vars: { length: tails.length },
    note: `The length of tails is the answer: LIS = ${tails.length}. (tails itself is not necessarily a real subsequence.)`,
    line: 5,
  });
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: `LIS length = ${tails.length}` };
}
