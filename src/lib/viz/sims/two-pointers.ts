import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";

const CODE = [
  "L = 0; R = n - 1",
  "while L < R:",
  "    s = a[L] + a[R]",
  "    if s == target: return (L, R)",
  "    if s < target: L += 1   // need a bigger sum",
  "    else: R -= 1            // need a smaller sum",
  "return none",
];

export function twoPointers(input: In<"two-pointers">): Simulation {
  const { arr, target } = input;
  const n = arr.length;
  const frames: Frame[] = [];
  let L = 0;
  let R = n - 1;
  const view = (l: number, r: number, hit = false) => {
    const tones: Record<number, Tone> = {};
    for (let i = 0; i < n; i++) if (i < l || i > r) tones[i] = "muted";
    if (l < n) tones[l] = hit ? "match" : "compare";
    if (r >= 0) tones[r] = hit ? "match" : "compare";
    return {
      values: arr,
      pointers: { L: l, R: r },
      tones,
      window: l <= r ? ([l, r] as [number, number]) : undefined,
    };
  };
  frames.push({
    array: view(L, R),
    vars: { L, R, target },
    note: `Sorted array, so start with the smallest (L = 0) and largest (R = ${R}) values.`,
    line: 0,
  });
  let result = "no pair adds up to the target";
  let found = false;
  while (L < R) {
    const s = arr[L] + arr[R];
    if (s === target) {
      frames.push({
        array: view(L, R, true),
        vars: { L, R, sum: s, target },
        note: `${arr[L]} + ${arr[R]} = ${s}, which equals ${target}: found the pair.`,
        line: 3,
      });
      result = `a[${L}] + a[${R}] = ${arr[L]} + ${arr[R]} = ${target}`;
      found = true;
      break;
    }
    const small = s < target;
    frames.push({
      array: view(L, R),
      vars: { L, R, sum: s, target },
      note: small
        ? `${arr[L]} + ${arr[R]} = ${s} < ${target}: too small, so move L right to a bigger value.`
        : `${arr[L]} + ${arr[R]} = ${s} > ${target}: too big, so move R left to a smaller value.`,
      line: small ? 4 : 5,
    });
    if (small) L++;
    else R--;
  }
  if (!found) {
    frames.push({
      array: view(L, R),
      vars: { L, R, target },
      note: `L has met R, so every value has been ruled out: no pair adds up to ${target}.`,
      line: 6,
    });
  }
  return { frames, code: { lang: "pseudocode", lines: CODE }, result };
}
