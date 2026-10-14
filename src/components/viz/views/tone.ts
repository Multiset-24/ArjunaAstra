import type { Tone } from "@/lib/viz/types";
import tones from "./tones.module.css";

/** CSS-module class that defines --t-bg / --t-fg / --t-line / --t-bar for a tone. */
export function toneClass(t?: Tone): string {
  return (t && tones[t]) || tones.none;
}

export const TONE_NAMES: Tone[] = ["active", "compare", "done", "muted", "match", "bad", "focus"];

export function cellText(v: number | string | null | undefined): string {
  return v === null || v === undefined ? "" : String(v);
}
