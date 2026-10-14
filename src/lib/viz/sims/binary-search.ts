import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";

const CODE_EXACT = [
  "lo = 0; hi = n - 1",
  "while lo <= hi:",
  "    mid = (lo + hi) / 2",
  "    if a[mid] == target: return mid",
  "    if a[mid] < target: lo = mid + 1",
  "    else: hi = mid - 1",
  "return -1",
];

const CODE_LOWER = [
  "lo = 0; hi = n          // answer is in [lo, hi]",
  "while lo < hi:",
  "    mid = (lo + hi) / 2",
  "    if a[mid] >= target: hi = mid",
  "    else: lo = mid + 1",
  "return lo   // first index with a[i] >= target",
];

export function binarySearch(input: In<"binary-search">): Simulation {
  const { arr, target, mode } = input;
  const n = arr.length;
  const exact = mode === "exact";
  const frames: Frame[] = [];

  /** Last index still in play: hi for exact, hi - 1 for lower_bound (hi is exclusive there). */
  const last = (hi: number) => (exact ? hi : hi - 1);

  const view = (lo: number, hi: number, mid: number | null, extra: Record<number, Tone> = {}) => {
    const tones: Record<number, Tone> = {};
    for (let i = 0; i < n; i++) if (i < lo || i > last(hi)) tones[i] = "muted";
    if (mid !== null) tones[mid] = "compare";
    Object.assign(tones, extra);
    const pointers: Record<string, number> = { lo, hi };
    if (mid !== null) pointers.mid = mid;
    return {
      values: arr,
      pointers,
      tones,
      window: lo <= last(hi) ? ([lo, last(hi)] as [number, number]) : undefined,
    };
  };

  let lo = 0;
  let hi = exact ? n - 1 : n;
  frames.push({
    array: view(lo, hi, null),
    vars: { lo, hi, target },
    note: exact
      ? `Look for ${target} in the sorted array. The answer can be anywhere in [0, ${n - 1}].`
      : `Find the first index with a[i] >= ${target}. The answer is in [0, ${n}] (n means "none").`,
    line: 0,
  });

  let result = "";
  if (exact) {
    let found = -1;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      frames.push({
        array: view(lo, hi, mid),
        vars: { lo, hi, mid, "a[mid]": arr[mid], target },
        note: `mid = (${lo} + ${hi}) / 2 = ${mid}, so a[${mid}] = ${arr[mid]}.`,
        line: 2,
      });
      if (arr[mid] === target) {
        found = mid;
        frames.push({
          array: view(lo, hi, mid, { [mid]: "match" }),
          vars: { lo, hi, mid, "a[mid]": arr[mid], target },
          note: `a[${mid}] = ${arr[mid]} equals ${target}: found it.`,
          line: 3,
        });
        break;
      }
      const small = arr[mid] < target;
      const nlo = small ? mid + 1 : lo;
      const nhi = small ? hi : mid - 1;
      frames.push({
        array: view(nlo, nhi, mid),
        vars: { lo: nlo, hi: nhi, mid, "a[mid]": arr[mid], target },
        note: small
          ? `${arr[mid]} < ${target}, so the target is to the right: lo = ${mid} + 1 = ${nlo}.`
          : `${arr[mid]} > ${target}, so the target is to the left: hi = ${mid} - 1 = ${nhi}.`,
        line: small ? 4 : 5,
      });
      lo = nlo;
      hi = nhi;
    }
    if (found < 0) {
      frames.push({
        array: view(lo, hi, null),
        vars: { lo, hi, target },
        note: `lo = ${lo} is past hi = ${hi}: nothing is left to check, so ${target} is not in the array.`,
        line: 6,
      });
      result = "not found (-1)";
    } else {
      result = `found at index ${found}`;
    }
  } else {
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      frames.push({
        array: view(lo, hi, mid),
        vars: { lo, hi, mid, "a[mid]": arr[mid], target },
        note: `mid = (${lo} + ${hi}) / 2 = ${mid}, so a[${mid}] = ${arr[mid]}.`,
        line: 2,
      });
      const big = arr[mid] >= target;
      const nlo = big ? lo : mid + 1;
      const nhi = big ? mid : hi;
      frames.push({
        array: view(nlo, nhi, mid),
        vars: { lo: nlo, hi: nhi, mid, "a[mid]": arr[mid], target },
        note: big
          ? `${arr[mid]} >= ${target}: mid could be the answer, so keep it and set hi = ${mid}.`
          : `${arr[mid]} < ${target}: mid is too small, so lo = ${mid} + 1 = ${nlo}.`,
        line: big ? 3 : 4,
      });
      lo = nlo;
      hi = nhi;
    }
    frames.push({
      array: view(lo, hi, null, lo < n ? { [lo]: "match" } : {}),
      vars: { lo, hi, target },
      note:
        lo < n
          ? `lo meets hi at ${lo}: a[${lo}] = ${arr[lo]} is the first value >= ${target}.`
          : `lo meets hi at ${n}: every value is smaller than ${target}.`,
      line: 5,
    });
    result = lo < n ? `lower_bound = ${lo} (a[${lo}] = ${arr[lo]})` : `lower_bound = ${n} (no value >= ${target})`;
  }

  return { frames, code: { lang: "pseudocode", lines: exact ? CODE_EXACT : CODE_LOWER }, result };
}
