"use client";
import type { GridState } from "@/lib/viz/types";
import { cellText, toneClass } from "./tone";
import s from "./GridView.module.css";

/** A table of cells (DP tables, hash buckets, sieve, grids) with optional row / column labels. */
export function GridView({ state }: { state: GridState }) {
  const { cells, tones, rowLabels, colLabels, label } = state;
  const cols = Math.max(0, ...cells.map((r) => r.length));
  const dense = cols > 10 || cells.length > 10;
  return (
    <div className={`${s.wrap} ${dense ? s.dense : ""}`}>
      <div className={s.scroller}>
        <table className={s.table}>
          {label ? <caption className={s.caption}>{label}</caption> : null}
          {colLabels ? (
            <thead>
              <tr>
                {rowLabels ? <td className={s.corner} /> : null}
                {Array.from({ length: cols }, (_, c) => (
                  <th key={c} scope="col" className={s.colLabel}>
                    {colLabels[c] ?? ""}
                  </th>
                ))}
              </tr>
            </thead>
          ) : null}
          <tbody>
            {cells.map((row, r) => (
              <tr key={r}>
                {rowLabels ? (
                  <th scope="row" className={s.rowLabel} title={rowLabels[r]}>
                    {rowLabels[r] ?? ""}
                  </th>
                ) : null}
                {Array.from({ length: cols }, (_, c) => {
                  const v = row[c];
                  const empty = v === null || v === undefined;
                  return (
                    <td key={c} className={`${s.cell} ${empty ? s.blank : ""} ${toneClass(tones?.[`${r},${c}`])}`}>
                      {cellText(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
