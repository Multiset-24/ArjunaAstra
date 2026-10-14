import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";
import { fail } from "./util";

const CODE_FIXED = [
  "sum = a[0] + ... + a[k-1]; best = sum",
  "for r = k .. n-1:",
  "    sum += a[r]      // value enters",
  "    sum -= a[r-k]    // value leaves",
  "    best = max(best, sum)",
  "return best",
];

const CODE_VAR = [
  "l = 0; sum = 0; best = INF",
  "for r = 0 .. n-1:",
  "    sum += a[r]",
  "    while sum >= s:",
  "        best = min(best, r - l + 1)",
  "        sum -= a[l]; l += 1",
  "return best   // 0 if still INF",
];

export function slidingWindow(input: In<"sliding-window">): Simulation {
  const { arr, mode } = input;
  const n = arr.length;
  const frames: Frame[] = [];
  const total = arr.reduce((a, b) => a + b, 0);

  if (mode === "fixed") {
    const k = input.k ?? Math.min(3, n);
    if (k > n) fail(`k = ${k} is larger than the array length (${n}).`);
    let sum = 0;
    for (let i = 0; i < k; i++) sum += arr[i];
    let best = sum;
    let bestStart = 0;
    frames.push({
      array: { values: arr, window: [0, k - 1], pointers: { l: 0, r: k - 1 } },
      vars: { k, sum, best },
      note: `Add the first ${k} values: sum = ${sum}. This is the best window so far.`,
      line: 0,
    });
    for (let r = k; r < n; r++) {
      const out = arr[r - k];
      sum += arr[r] - out;
      const improved = sum > best;
      if (improved) {
        best = sum;
        bestStart = r - k + 1;
      }
      const tones: Record<number, Tone> = { [r]: "active", [r - k]: "bad" };
      frames.push({
        array: { values: arr, window: [r - k + 1, r], pointers: { l: r - k + 1, r }, tones },
        vars: { k, sum, best },
        note: `Slide right: add ${arr[r]}, drop ${out}, sum = ${sum}${improved ? `, a new best.` : `, best stays ${best}.`}`,
        line: improved ? 4 : 3,
      });
    }
    const tones: Record<number, Tone> = {};
    for (let i = bestStart; i < bestStart + k; i++) tones[i] = "match";
    frames.push({
      array: { values: arr, window: [bestStart, bestStart + k - 1], tones },
      vars: { k, best },
      note: `Every window was checked once: the best sum of ${k} consecutive values is ${best}.`,
      line: 5,
    });
    return { frames, code: { lang: "pseudocode", lines: CODE_FIXED }, result: `best sum of ${k} in a row = ${best} (indices ${bestStart}..${bestStart + k - 1})` };
  }

  // variable: shortest window with sum >= s
  const s = input.s ?? Math.max(1, Math.round(total / 2));
  let l = 0;
  let sum = 0;
  let best = Infinity;
  let bl = -1;
  let br = -1;
  const win = (a: number, b: number): [number, number] | undefined => (a <= b ? [a, b] : undefined);
  frames.push({
    array: { values: arr },
    vars: { s, sum, best: "none" },
    note: `Find the shortest run of consecutive values whose sum is at least ${s} (values must be positive).`,
    line: 0,
  });
  for (let r = 0; r < n; r++) {
    sum += arr[r];
    frames.push({
      array: { values: arr, window: win(l, r), pointers: { l, r }, tones: { [r]: "active" } },
      vars: { s, sum, best: Number.isFinite(best) ? best : "none" },
      note:
        sum >= s
          ? `Extend right with ${arr[r]}: sum = ${sum} >= ${s}, so the window is long enough. Try shrinking it.`
          : `Extend right with ${arr[r]}: sum = ${sum} < ${s}, keep growing.`,
      line: 2,
    });
    while (sum >= s && l <= r) {
      const len = r - l + 1;
      const better = len < best;
      if (better) {
        best = len;
        bl = l;
        br = r;
      }
      const left = arr[l];
      const tones: Record<number, Tone> = { [l]: "bad" };
      frames.push({
        array: { values: arr, window: [l, r], pointers: { l, r }, tones },
        vars: { s, sum, len, best },
        note: `Window [${l}..${r}] has length ${len}${better ? " (a new shortest)" : ""}. Drop ${left} from the left.`,
        line: 4,
      });
      sum -= left;
      l++;
    }
  }
  const tones: Record<number, Tone> = {};
  if (bl >= 0) for (let i = bl; i <= br; i++) tones[i] = "match";
  frames.push({
    array: { values: arr, window: bl >= 0 ? [bl, br] : undefined, tones },
    vars: { s, best: Number.isFinite(best) ? best : 0 },
    note: bl >= 0 ? `Done: the shortest window with sum >= ${s} has length ${best}.` : `Done: even the whole array sums to less than ${s}, so there is no such window.`,
    line: 6,
  });
  return {
    frames,
    code: { lang: "pseudocode", lines: CODE_VAR },
    result: bl >= 0 ? `shortest length = ${best} (indices ${bl}..${br})` : "no window reaches the target (0)",
  };
}
