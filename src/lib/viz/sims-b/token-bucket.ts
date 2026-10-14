import type { BarsState, Frame, Simulator } from "../types";
import { round } from "./util";

interface In {
  capacity: number;
  refillPerSec: number;
  requests: number[];
}

const CODE = [
  "tokens = capacity; last = 0",
  "on request at time t:",
  "  tokens = min(capacity, tokens + (t - last) * rate)",
  "  last = t",
  "  if tokens >= 1:",
  "    tokens -= 1; ACCEPT",
  "  else:",
  "    REJECT",
];

export const tokenBucket: Simulator<In> = ({ capacity, refillPerSec, requests }) => {
  const reqs = [...requests].sort((a, b) => a - b);
  const frames: Frame[] = [];
  const values: number[] = [capacity];
  const labels: string[] = ["start"];
  const tones: Record<number, "match" | "bad" | "compare" | "muted"> = { 0: "muted" };
  let tokens = capacity;
  let last = 0;
  let ok = 0;
  let no = 0;
  const bars = (label: string): BarsState => ({ values: [...values], labels: [...labels], tones: { ...tones }, max: capacity, label });
  frames.push({
    bars: bars("tokens in the bucket over time"),
    vars: { t: 0, tokens: capacity, accepted: 0, rejected: 0 },
    note: `The bucket starts full with ${capacity} tokens and refills ${refillPerSec} per second, never above ${capacity}.`,
    line: 0,
  });
  reqs.forEach((t, i) => {
    const gap = t - last;
    const before = tokens;
    tokens = Math.min(capacity, tokens + gap * refillPerSec);
    last = t;
    const idx = values.length;
    values.push(round(tokens));
    labels.push(`t=${round(t, 1)}`);
    tones[idx] = "compare";
    frames.push({
      bars: bars("tokens in the bucket over time"),
      vars: { t: round(t, 2), request: i + 1, tokens: round(tokens), accepted: ok, rejected: no },
      note: gap > 0
        ? `Request ${i + 1} at t=${round(t, 2)}: ${round(gap, 2)}s passed, so the bucket refilled from ${round(before)} to ${round(tokens)}${tokens === capacity && before + gap * refillPerSec > capacity ? " (capped at capacity)" : ""}.`
        : `Request ${i + 1} at t=${round(t, 2)}: no time passed, no refill. Tokens: ${round(tokens)}.`,
      line: 2,
    });
    if (tokens >= 1) {
      tokens -= 1;
      ok++;
      values[idx] = round(tokens);
      tones[idx] = "match";
      frames.push({
        bars: bars("tokens in the bucket over time"),
        vars: { t: round(t, 2), request: i + 1, tokens: round(tokens), accepted: ok, rejected: no },
        note: `At least 1 token available: take one and ACCEPT request ${i + 1}. ${round(tokens)} left.`,
        line: 5,
      });
    } else {
      no++;
      tones[idx] = "bad";
      frames.push({
        bars: bars("tokens in the bucket over time"),
        vars: { t: round(t, 2), request: i + 1, tokens: round(tokens), accepted: ok, rejected: no },
        note: `Only ${round(tokens)} tokens (less than 1): REJECT request ${i + 1}.`,
        line: 7,
      });
    }
  });
  return { frames, code: { lang: "text", lines: CODE }, result: `${ok} accepted, ${no} rejected` };
};
