import type { Frame, Simulation, Tone } from "../types";
import type { In } from "./util";

const CODE = [
  "stack = []",
  "for i = 0 .. n-1:",
  "    while stack and a[stack.top] < a[i]:",
  "        ans[stack.pop()] = a[i]   // a[i] is the next greater",
  "    stack.push(i)",
  "indices left in stack: ans = -1",
];

export function monotonicStack(input: In<"monotonic-stack">): Simulation {
  const { arr } = input;
  const n = arr.length;
  const frames: Frame[] = [];
  const ans: (number | string)[] = new Array(n).fill("?");
  const stack: number[] = [];

  const snap = (i: number | null, extra: Record<number, Tone> = {}, note: string, line: number, popped?: number) => {
    const tones: Record<number, Tone> = {};
    for (const s of stack) tones[s] = "focus";
    for (let k = 0; k < n; k++) if (ans[k] !== "?" && !(k in tones)) tones[k] = "done";
    if (i !== null) tones[i] = "active";
    Object.assign(tones, extra);
    const ansTones: Record<number, Tone> = {};
    ans.forEach((v, k) => {
      if (v !== "?") ansTones[k] = "done";
    });
    if (popped !== undefined) ansTones[popped] = "active";
    frames.push({
      array: { values: arr, tones, pointers: i !== null ? { i } : undefined },
      arrays: [
        {
          values: stack.map((s) => arr[s]),
          label: `stack, bottom to top (indices: ${stack.length ? stack.join(", ") : "none"})`,
        },
        { values: [...ans], tones: ansTones, label: "next greater element of each index" },
      ],
      vars: { i: i ?? "-", "stack size": stack.length },
      note,
      line,
    });
  };

  snap(null, {}, "Keep a stack of indices whose next greater element is still unknown. Its values only ever decrease.", 0);
  for (let i = 0; i < n; i++) {
    while (stack.length && arr[stack[stack.length - 1]] < arr[i]) {
      const t = stack.pop() as number;
      ans[t] = arr[i];
      snap(i, { [t]: "compare" }, `a[${i}] = ${arr[i]} is bigger than a[${t}] = ${arr[t]}: pop ${t}; its next greater element is ${arr[i]}.`, 3, t);
    }
    stack.push(i);
    snap(
      i,
      {},
      stack.length === 1 ? `Stack is empty, so push index ${i}.` : `a[${i}] = ${arr[i]} does not beat the top, so push index ${i}. The stack stays decreasing.`,
      4,
    );
  }
  const rest = [...stack];
  for (const s of stack) ans[s] = -1;
  stack.length = 0;
  snap(null, Object.fromEntries(rest.map((s) => [s, "bad" as Tone])), rest.length ? `Indices ${rest.join(", ")} never meet a bigger value, so their answer is -1.` : "Nothing left on the stack.", 5);
  return { frames, code: { lang: "pseudocode", lines: CODE }, result: `next greater = [${ans.join(", ")}]` };
}
