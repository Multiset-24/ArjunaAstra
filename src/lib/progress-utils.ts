import type { ProgressState } from "./store/types";
import { today } from "./utils";

export function streak(activity: ProgressState["activity"]): number {
  let n = 0;
  const d = new Date();
  if (!activity[today(d)]) d.setDate(d.getDate() - 1); // today not started yet: count from yesterday
  while (activity[today(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function solvedCount(problems: ProgressState["problems"]): number {
  return Object.values(problems).filter((p) => p.status === "solved").length;
}

export function lessonStatus(state: ProgressState, id: string): "done" | "started" | "new" {
  if (state.lessons[id]?.done) return "done";
  if ((state.sections[id] ?? -1) >= 0) return "started";
  return "new";
}
