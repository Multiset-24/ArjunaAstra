"use client";
import { useId, useState } from "react";
import s from "./shared.module.css";
import c from "./Softmax.module.css";
import { num, numArr } from "./util";

function softmax(z: number[], t: number): number[] {
  const m = Math.max(...z);
  const e = z.map((v) => Math.exp((v - m) / t));
  const sum = e.reduce((a, b) => a + b, 0);
  return e.map((v) => v / sum);
}

export default function Softmax({ input }: { input: Record<string, unknown> }) {
  const id = useId();
  const [logits, setLogits] = useState(() => numArr(input.logits, [2, 1, 0.5, -1], -10, 10, 6).concat([]));
  const labels = Array.isArray(input.labels) ? (input.labels as unknown[]).map((x) => String(x)) : [];
  const name = (i: number) => labels[i] || `z${i + 1}`;
  const [temp, setTemp] = useState(() => num(input.temperature, 1, 0.1, 5));

  const p = softmax(logits, temp);
  const p1 = softmax(logits, 1);
  const top = p.indexOf(Math.max(...p));
  const total = p.reduce((a, b) => a + b, 0);
  const set = (i: number, v: number) => setLogits((l) => l.map((x, j) => (j === i ? Math.min(10, Math.max(-10, v)) : x)));

  const mood = temp < 0.95 ? "Low temperature sharpens: the biggest logit takes almost everything." : temp > 1.05 ? "High temperature flattens: the choices get closer to equal." : "Temperature 1 is plain softmax.";

  return (
    <div className={s.root} role="group" aria-label="Softmax and temperature">
      <div className={c.rows}>
        {logits.map((z, i) => (
          <div key={i} className={c.item}>
            <div className={c.line}>
              <label className={`${s.label} ${s.mono}`} htmlFor={`${id}-z${i}`}>
                {name(i)}
              </label>
              <input id={`${id}-z${i}`} className={s.range} type="range" min={-10} max={10} step={0.1} value={z} onChange={(e) => set(i, Number(e.target.value))} aria-label={`logit for ${name(i)}`} />
              <input
                className={`${s.input} ${c.numIn}`}
                type="number"
                step={0.1}
                min={-10}
                max={10}
                value={z}
                aria-label={`logit value for ${name(i)}`}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  if (e.target.value !== "" && Number.isFinite(v)) set(i, v);
                }}
              />
            </div>
            <div className={c.barLine}>
              <div className={c.track} aria-hidden="true">
                <div className={`${c.bar} ${i === top ? c.top : ""}`} style={{ width: `${p[i] * 100}%` }} />
                {temp !== 1 && <div className={c.ref} style={{ left: `${p1[i] * 100}%` }} />}
              </div>
              <span className={`${s.mono} ${c.pct}`}>{(p[i] * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor={`${id}-t`}>
          T
        </label>
        <input id={`${id}-t`} className={s.range} type="range" min={0.1} max={5} step={0.05} value={temp} onChange={(e) => setTemp(Number(e.target.value))} aria-label="Temperature from 0.1 to 5" />
        <span className={s.mono}>{temp.toFixed(2)}</span>
      </div>

      <div className={s.readout}>
        <span>p_i = exp(z_i / T) / sum_j exp(z_j / T)</span>
        <span>
          top: {name(top)} at {(p[top] * 100).toFixed(1)}%, sum of all = {total.toFixed(3)}
        </span>
      </div>
      <p className={s.status} aria-live="polite">
        {mood}
      </p>
      <p className={s.caption}>
        Softmax turns raw scores (logits) into probabilities that are positive and add up to 1. The thin tick on each bar marks where it would sit at T = 1. Size of a logit gap matters, not the absolute values: adding the same number to every logit changes nothing.
      </p>
    </div>
  );
}
