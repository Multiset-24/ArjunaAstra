"use client";
import { useId, useState } from "react";
import s from "./shared.module.css";
import c from "./Complexity.module.css";
import { num } from "./util";

const BUDGET = 1e8; // simple operations per second (rough)
const AXIS_MAX = 30; // bars drawn on a log10 axis from 10^0 to 10^30

/** log10 of n! (exact for small n, Stirling beyond). */
function log10Fact(n: number): number {
  if (n <= 170) {
    let t = 0;
    for (let i = 2; i <= n; i++) t += Math.log10(i);
    return t;
  }
  return n * Math.log10(n / Math.E) + 0.5 * Math.log10(2 * Math.PI * n);
}

interface Row {
  name: string;
  /** log10 of the operation count */
  log: number;
}

function rows(n: number): Row[] {
  const l = Math.log10(n);
  const lg2 = Math.max(1, Math.log2(n));
  return [
    { name: "O(1)", log: 0 },
    { name: "O(log n)", log: Math.log10(lg2) },
    { name: "O(sqrt n)", log: l / 2 },
    { name: "O(n)", log: l },
    { name: "O(n log n)", log: l + Math.log10(lg2) },
    { name: "O(n^2)", log: 2 * l },
    { name: "O(n^3)", log: 3 * l },
    { name: "O(2^n)", log: n * Math.log10(2) },
    { name: "O(n!)", log: log10Fact(n) },
  ];
}

function ops(log: number): string {
  if (log < 6) return Math.max(1, Math.round(10 ** log)).toLocaleString("en-US");
  if (log < 1e6) {
    let e = Math.floor(log);
    let m = 10 ** (log - e);
    if (m.toFixed(1) === "10.0") {
      m = 1;
      e += 1;
    }
    return `${m.toFixed(1)} x 10^${e}`;
  }
  return `10^${Math.round(log).toLocaleString("en-US")}`;
}

/** Estimated running time at ~10^8 operations per second. */
function duration(log: number): string {
  const sec = log - 8; // log10 of seconds
  if (sec < -6) return "under a microsecond";
  if (sec < -3) return `${(10 ** (sec + 6)).toFixed(0)} microseconds`;
  if (sec < 0) return `${(10 ** (sec + 3)).toFixed(0)} ms`;
  if (sec < 1.778) return `${(10 ** sec).toFixed(1)} s`;
  if (sec < 3.556) return `${(10 ** (sec - 1.778)).toFixed(0)} minutes`;
  if (sec < 4.936) return `${(10 ** (sec - 3.556)).toFixed(0)} hours`;
  if (sec < 7.499) return `${(10 ** (sec - 4.936)).toFixed(0)} days`;
  const years = sec - 7.499;
  if (years < 3) return `${Math.round(10 ** years).toLocaleString("en-US")} years`;
  if (sec < 17.1) return `10^${Math.round(years)} years`;
  return "longer than the age of the universe";
}

function verdict(log: number): { text: string; cls: string } {
  if (log <= Math.log10(5e7)) return { text: "fits", cls: s.pillGood };
  if (log <= Math.log10(2e8)) return { text: "tight", cls: s.pillWarn };
  return { text: "too slow", cls: s.pillBad };
}

const toSlider = (n: number) => Math.round((Math.log10(n) / 9) * 1000);
const fromSlider = (v: number) => Math.min(1e9, Math.max(1, Math.round(10 ** ((v / 1000) * 9))));

export default function Complexity({ input }: { input: Record<string, unknown> }) {
  const id = useId();
  const [n, setN] = useState(() => Math.round(num(input.n, 100000, 1, 1e9)));
  const [text, setText] = useState(String(n));
  const set = (v: number) => {
    const k = Math.min(1e9, Math.max(1, Math.round(v)));
    setN(k);
    setText(String(k));
  };
  const data = rows(n);
  const budgetPct = (Math.log10(BUDGET) / AXIS_MAX) * 100;

  return (
    <div className={s.root} role="group" aria-label="Complexity versus input size">
      <div className={s.field}>
        <label className={s.label} htmlFor={`${id}-n`}>
          n
        </label>
        <input
          id={`${id}-n`}
          className={s.range}
          type="range"
          min={0}
          max={1000}
          step={1}
          value={toSlider(n)}
          onChange={(e) => set(fromSlider(Number(e.target.value)))}
          aria-label="n on a log scale from 1 to one billion"
          aria-valuetext={`n equals ${n.toLocaleString("en-US")}`}
        />
        <input
          className={s.input}
          type="number"
          inputMode="numeric"
          min={1}
          max={1000000000}
          value={text}
          aria-label="n as a number"
          onChange={(e) => {
            setText(e.target.value);
            const v = Number(e.target.value);
            if (Number.isFinite(v) && v >= 1 && v <= 1e9) setN(Math.round(v));
          }}
          onBlur={() => setText(String(n))}
        />
      </div>

      <ul className={c.list} aria-label={`Operation counts for n = ${n.toLocaleString("en-US")}`}>
        {data.map((r) => {
          const v = verdict(r.log);
          const w = Math.min(100, (Math.max(r.log, 0) / AXIS_MAX) * 100);
          const over = r.log > AXIS_MAX;
          return (
            <li key={r.name} className={c.item}>
              <div className={c.head}>
                <span className={`${s.mono} ${c.name}`}>{r.name}</span>
                <span className={`${s.mono} ${c.ops}`}>{ops(r.log)}</span>
                <span className={`${s.pill} ${v.cls}`}>{v.text}</span>
              </div>
              <div className={c.track} aria-hidden="true">
                <div className={c.bar} style={{ width: `${Math.max(w, 0.8)}%`, background: r.log <= Math.log10(5e7) ? "var(--sage)" : r.log <= Math.log10(2e8) ? "var(--gold)" : "var(--rose)" }} />
                <div className={c.budget} style={{ left: `${budgetPct}%` }} />
                {over && <span className={c.over}>off the chart</span>}
              </div>
              <div className={c.time}>estimated time: {duration(r.log)}</div>
            </li>
          );
        })}
      </ul>

      <div className={c.axis} aria-hidden="true">
        <span>1</span>
        <span>10^10</span>
        <span>10^20</span>
        <span>10^30</span>
      </div>
      <p className={s.caption}>
        Bars use a log scale (each tick is 10 billion times the last). The vertical line marks 10^8 operations, about one second. Rule of thumb only: real
        speed depends on the language, memory access and constant factors, so treat fits / tight / too slow as approximate. Here fits means under about 0.5 s,
        tight up to about 2 s.
      </p>
    </div>
  );
}
