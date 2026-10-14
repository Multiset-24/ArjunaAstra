import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";
import { fail } from "./util";

const CODE = [
  "lo = max(w); hi = sum(w)",
  "while lo < hi:",
  "    mid = (lo + hi) / 2",
  "    d = days_needed(mid)   // pack greedily",
  "    if d <= days: hi = mid   // mid is enough",
  "    else: lo = mid + 1       // mid is too small",
  "return lo",
];

function pack(w: number[], cap: number) {
  const day: number[] = [];
  let d = 1;
  let load = 0;
  for (const x of w) {
    if (load + x > cap) {
      d++;
      load = 0;
    }
    load += x;
    day.push(d);
  }
  return { days: d, day };
}

export function binarySearchAnswer(input: In<"binary-search-answer">): Simulation {
  const { weights, days } = input;
  if (days > weights.length) fail("days cannot exceed the number of packages (each day needs at least one).");
  const frames: Frame[] = [];
  let lo = Math.max(...weights);
  let hi = weights.reduce((a, b) => a + b, 0);

  const range = (mid: number | null) => ({
    values: [lo, mid ?? "·", hi] as (number | string)[],
    pointers: { lo: 0, mid: 1, hi: 2 },
    showIndex: false,
    label: "capacity search range",
  });

  frames.push({
    array: { values: weights, label: "package weights (must ship in this order)" },
    arrays: [range(null)],
    vars: { lo, hi, days },
    note: `The capacity is at least the heaviest package (${lo}) and at most the total (${hi}). Binary search it.`,
    line: 0,
  });

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    const { days: d, day } = pack(weights, mid);
    const tones: Record<number, Tone> = {};
    day.forEach((dd, i) => (tones[i] = dd % 2 === 1 ? "focus" : "done"));
    const base = {
      values: weights,
      tones,
      label: `packing with capacity ${mid}: colours alternate per day`,
    };
    frames.push({
      array: base,
      arrays: [range(mid), { values: day, label: "day of each package" }],
      vars: { lo, hi, mid, "days needed": d, days },
      note: `Try capacity ${mid}: greedy packing needs ${d} day${d === 1 ? "" : "s"}.`,
      line: 3,
    });
    const ok = d <= days;
    const nlo = ok ? lo : mid + 1;
    const nhi = ok ? mid : hi;
    lo = nlo;
    hi = nhi;
    frames.push({
      array: base,
      arrays: [range(mid), { values: day, label: "day of each package" }],
      vars: { lo, hi, mid, "days needed": d, days },
      note: ok
        ? `${d} <= ${days} days, so ${mid} is enough: keep it and set hi = ${mid}.`
        : `${d} > ${days} days, so ${mid} is too small: lo = ${mid} + 1 = ${nlo}.`,
      line: ok ? 4 : 5,
    });
  }

  const fin = pack(weights, lo);
  const tones: Record<number, Tone> = {};
  fin.day.forEach((dd, i) => (tones[i] = dd % 2 === 1 ? "match" : "done"));
  frames.push({
    array: { values: weights, tones, label: `final packing with capacity ${lo}` },
    arrays: [range(lo), { values: fin.day, label: "day of each package" }],
    vars: { answer: lo, "days needed": fin.days, days },
    note: `lo meets hi at ${lo}: the smallest capacity that ships everything in ${days} day${days === 1 ? "" : "s"}.`,
    line: 6,
  });
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: `minimum capacity = ${lo}` };
}
