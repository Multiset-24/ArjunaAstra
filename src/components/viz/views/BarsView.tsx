"use client";
import type { BarsState } from "@/lib/viz/types";
import { toneClass } from "./tone";
import s from "./BarsView.module.css";

function fmt(v: number, percent?: boolean) {
  if (percent) return `${Math.round(v * 100)}%`;
  return Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
}

/** Vertical bars with value above and label below. */
export function BarsView({ state }: { state: BarsState }) {
  const { values, labels, tones, label, percent } = state;
  const max = state.max ?? Math.max(percent ? 1 : 0, ...values, 1e-9);
  const aria = `${label ?? "Bars"}: ${values.map((v, i) => `${labels?.[i] ?? i}: ${fmt(v, percent)}`).join(", ")}`;
  return (
    <figure className={s.figure} role="img" aria-label={aria}>
      {label ? <figcaption className={s.label}>{label}</figcaption> : null}
      <div className={s.scroller}>
        <div className={s.bars} aria-hidden="true" style={{ ["--n" as string]: values.length }}>
          {values.map((v, i) => {
            const h = Math.max(0, Math.min(1, v / max));
            return (
              <div key={i} className={`${s.col} ${toneClass(tones?.[i])}`}>
                <span className={s.value}>{fmt(v, percent)}</span>
                <div className={s.track}>
                  <div className={s.bar} style={{ height: `${h * 100}%` }} />
                </div>
                <span className={s.name}>{labels?.[i] ?? i}</span>
              </div>
            );
          })}
        </div>
      </div>
    </figure>
  );
}
