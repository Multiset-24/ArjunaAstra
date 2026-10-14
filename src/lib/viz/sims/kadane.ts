import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";

const CODE = [
  "cur = best = a[0]",
  "for i = 1 .. n-1:",
  "    cur = max(a[i], cur + a[i])   // extend or restart",
  "    best = max(best, cur)",
  "return best",
];

export function kadane(input: In<"kadane">): Simulation {
  const { arr } = input;
  const n = arr.length;
  const frames: Frame[] = [];
  const curs: (number | string)[] = new Array(n).fill("?");
  let cur = arr[0];
  let start = 0;
  let best = cur;
  let bl = 0;
  let br = 0;
  curs[0] = cur;

  const toneBest = (): Record<number, Tone> => {
    const t: Record<number, Tone> = {};
    for (let i = bl; i <= br; i++) t[i] = "done";
    return t;
  };
  frames.push({
    array: { values: arr, window: [0, 0], tones: toneBest(), pointers: { i: 0 } },
    arrays: [{ values: [...curs], label: "best sum of a run ending at each index" }],
    vars: { cur, best },
    note: `Start with the first value: cur = best = ${cur}.`,
    line: 0,
  });
  for (let i = 1; i < n; i++) {
    const extend = cur + arr[i];
    const restart = arr[i] > extend;
    if (restart) {
      cur = arr[i];
      start = i;
    } else cur = extend;
    curs[i] = cur;
    let improved = false;
    if (cur > best) {
      best = cur;
      bl = start;
      br = i;
      improved = true;
    }
    frames.push({
      array: { values: arr, window: [start, i], tones: { ...toneBest(), [i]: "active" }, pointers: { i, start } },
      arrays: [{ values: [...curs], tones: { [i]: "active" }, label: "best sum of a run ending at each index" }],
      vars: { cur, best },
      note: `${restart ? `Restart: ${arr[i]} alone beats ${extend} (the old run was dragging it down)` : `Extend: ${arr[i]} + the old run gives ${extend}, better than ${arr[i]} alone`}, cur = ${cur}${improved ? `; a new best of ${best}` : ""}.`,
      line: improved ? 3 : 2,
    });
  }
  const t: Record<number, Tone> = {};
  for (let i = bl; i <= br; i++) t[i] = "match";
  frames.push({
    array: { values: arr, window: [bl, br], tones: t },
    arrays: [{ values: [...curs], label: "best sum of a run ending at each index" }],
    vars: { best },
    note: `One pass is enough: the maximum subarray sum is ${best}, from index ${bl} to ${br}.`,
    line: 4,
  });
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: `max subarray sum = ${best} (indices ${bl}..${br})` };
}
