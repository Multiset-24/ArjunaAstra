"use client";
import type { ArrayState } from "@/lib/viz/types";
import { cellText, toneClass } from "./tone";
import s from "./ArrayView.module.css";

/** A row of cells with indices, pointer carets and an optional window bracket. */
export function ArrayView({ state, compact = false }: { state: ArrayState; compact?: boolean }) {
  const { values, pointers, tones, window: win, label } = state;
  const n = values.length;
  const showIndex = state.showIndex !== false;

  // Group pointers that land on the same index so their labels share one caret.
  const groups = new Map<number, string[]>();
  for (const [name, idx] of Object.entries(pointers ?? {})) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= n) continue;
    groups.set(idx, [...(groups.get(idx) ?? []), name]);
  }

  let bracket: [number, number] | null = null;
  if (win && n > 0) {
    const l = Math.max(0, Math.min(win[0], win[1]));
    const r = Math.min(n - 1, Math.max(win[0], win[1]));
    if (l <= r) bracket = [l, r];
  }

  const aria =
    `${label ?? "Array"}: ` +
    (n ? values.map((v, i) => `${showIndex ? `${i}: ` : ""}${cellText(v)}`).join(", ") : "empty") +
    (groups.size ? `. Pointers: ${[...groups].map(([i, names]) => `${names.join(" and ")} at ${i}`).join(", ")}` : "") +
    (bracket ? `. Window from ${bracket[0]} to ${bracket[1]}` : "");

  return (
    <figure className={`${s.figure} ${compact ? s.compact : ""}`} role="img" aria-label={aria}>
      {label ? <figcaption className={s.label}>{label}</figcaption> : null}
      {n === 0 ? (
        <div className={s.empty}>empty</div>
      ) : (
        <div className={s.scroller}>
          <div className={s.grid} style={{ ["--n" as string]: n }} aria-hidden="true">
            {bracket ? <div className={s.bracket} style={{ gridColumn: `${bracket[0] + 1} / ${bracket[1] + 2}` }} /> : null}
            {values.map((v, i) => (
              <div key={i} className={`${s.cell} ${toneClass(tones?.[i])}`} style={{ gridColumn: i + 1 }}>
                <span className={s.val}>{cellText(v)}</span>
              </div>
            ))}
            {showIndex
              ? values.map((_, i) => (
                  <div key={`i${i}`} className={s.index} style={{ gridColumn: i + 1 }}>
                    {i}
                  </div>
                ))
              : null}
            {[...groups].map(([i, names]) => (
              <div key={`p${i}`} className={s.ptr} style={{ gridColumn: i + 1 }}>
                <span className={s.caret} />
                <span>{names.join(" · ")}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </figure>
  );
}
