import type { Grade, SrsState } from "./store/types";

const MIN = 60_000;
const DAY = 86_400_000;

export function newCard(now = Date.now()): SrsState {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: now };
}

/** SM-2 style scheduling. grade: 0 again, 1 hard, 2 good, 3 easy. */
export function schedule(c: SrsState, grade: Grade, now = Date.now()): SrsState {
  let { ease, interval, reps, lapses } = c;
  if (grade === 0) {
    lapses += 1;
    reps = 0;
    ease = Math.max(1.3, ease - 0.2);
    return { ease, interval: 0, reps, lapses, due: now + 10 * MIN };
  }
  if (reps === 0) interval = grade === 3 ? 4 : grade === 2 ? 1 : 0.5;
  else if (reps === 1) interval = grade === 3 ? 7 : grade === 2 ? 3 : 1.5;
  else interval = interval * (grade === 1 ? 1.2 : grade === 2 ? ease : ease * 1.3);
  ease = Math.min(3, Math.max(1.3, ease + (grade === 1 ? -0.15 : grade === 3 ? 0.15 : 0)));
  reps += 1;
  interval = Math.min(interval, 365);
  return { ease, interval, reps, lapses, due: now + interval * DAY };
}
