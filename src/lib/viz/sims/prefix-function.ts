import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";

const CODE = [
  "pi[0] = 0",
  "for i = 1 .. n-1:",
  "    k = pi[i-1]",
  "    while k > 0 and s[i] != s[k]:",
  "        k = pi[k-1]          // fall back to a shorter border",
  "    if s[i] == s[k]: k += 1",
  "    pi[i] = k",
];

export function prefixFunction(input: In<"prefix-function">): Simulation {
  const s = input.s;
  const n = s.length;
  const frames: Frame[] = [];
  const pi: (number | string)[] = new Array(n).fill("?");
  pi[0] = 0;

  const snap = (i: number, k: number, tones: Record<number, Tone>, note: string, line: number, extra: Record<string, number | string> = {}) => {
    frames.push({
      array: { values: [...s], tones, pointers: { i, k }, label: "string s" },
      arrays: [{ values: [...pi], tones: { [i]: "active" }, label: "pi[i] = length of the longest proper border of s[0..i]" }],
      vars: { i, k, ...extra },
      note,
      line,
    });
  };

  frames.push({
    array: { values: [...s], tones: { 0: "done" }, label: "string s" },
    arrays: [{ values: [...pi], tones: { 0: "done" }, label: "pi[i] = length of the longest proper border of s[0..i]" }],
    note: "A border is a prefix that is also a suffix. A single letter has no proper border, so pi[0] = 0.",
    line: 0,
  });
  for (let i = 1; i < n; i++) {
    let k = pi[i - 1] as number;
    for (;;) {
      if (s[i] === s[k]) {
        pi[i] = k + 1;
        snap(i, k, { [i]: "match", [k]: "match" }, `s[${i}] = '${s[i]}' equals s[${k}] = '${s[k]}', so the border grows: pi[${i}] = ${k} + 1 = ${k + 1}.`, 5, { "pi[i]": k + 1 });
        break;
      }
      if (k === 0) {
        pi[i] = 0;
        snap(i, k, { [i]: "bad", [k]: "bad" }, `s[${i}] = '${s[i]}' differs from s[0] = '${s[0]}' and no shorter border is left: pi[${i}] = 0.`, 6, { "pi[i]": 0 });
        break;
      }
      const back = pi[k - 1] as number;
      snap(i, k, { [i]: "compare", [k]: "compare" }, `s[${i}] = '${s[i]}' differs from s[${k}] = '${s[k]}': fall back to the next shorter border, k = pi[${k - 1}] = ${back}.`, 4);
      k = back;
    }
  }
  frames.push({
    array: { values: [...s], tones: Object.fromEntries([...s].map((_, i) => [i, "match" as Tone])), label: "string s" },
    arrays: [{ values: [...pi], label: "pi[i] = length of the longest proper border of s[0..i]" }],
    note: `Done in one left-to-right pass: pi = [${pi.join(", ")}].`,
    line: 6,
  });
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: `pi = [${pi.join(", ")}]` };
}
