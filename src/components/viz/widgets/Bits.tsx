"use client";
import { useState } from "react";
import s from "./shared.module.css";
import c from "./Bits.module.css";
import { num } from "./util";

const W = 8;
const pop = (x: number) => x.toString(2).split("1").length - 1;
const bin = (x: number) => (x & 255).toString(2).padStart(W, "0");

function Cells({ value, on, label }: { value: number; on?: (bit: number) => void; label: string }) {
  const b = bin(value);
  return (
    <div className={c.cells} role={on ? "group" : "img"} aria-label={on ? `${label} bits` : `${label} in binary: ${b}`}>
      {[...b].map((ch, i) => {
        const bit = W - 1 - i;
        const cls = `${c.cell} ${ch === "1" ? c.one : ""}`;
        return on ? (
          <button key={bit} type="button" className={`${cls} ${c.toggle}`} aria-pressed={ch === "1"} aria-label={`${label} bit ${bit}, currently ${ch}`} onClick={() => on(bit)}>
            {ch}
          </button>
        ) : (
          <span key={bit} className={cls} aria-hidden="true">
            {ch}
          </span>
        );
      })}
    </div>
  );
}

export default function Bits({ input }: { input: Record<string, unknown> }) {
  const [a, setA] = useState(() => Math.round(num(input.a, 12, 0, 255)));
  const [b, setB] = useState(() => Math.round(num(input.b, 10, 0, 255)));

  const lowbit = a & -a & 255;
  const results: { expr: string; note: string; v: number }[] = [
    { expr: "a & b", note: "1 only where both are 1", v: a & b },
    { expr: "a | b", note: "1 where either is 1", v: a | b },
    { expr: "a ^ b", note: "1 where they differ", v: a ^ b },
    { expr: "~a", note: "flip every bit (8-bit view)", v: ~a & 255 },
    { expr: "a << 1", note: a >= 128 ? "double it; the top bit falls off in 8 bits" : "double it: shift left by one", v: (a << 1) & 255 },
    { expr: "a >> 1", note: "halve it, rounding down", v: a >> 1 },
    { expr: "a & -a", note: "keep only the lowest set bit", v: lowbit },
    { expr: "popcount(a)", note: "how many 1 bits a has", v: pop(a) },
  ];

  return (
    <div className={s.root} role="group" aria-label="Bit playground">
      <div className={c.inputs}>
        <div className={c.num}>
          <div className={c.numHead}>
            <span className={s.mono}>a</span>
            <span className={`${s.mono} ${c.dec}`}>{a}</span>
          </div>
          <Cells value={a} label="a" on={(bit) => setA((v) => v ^ (1 << bit))} />
        </div>
        <div className={c.num}>
          <div className={c.numHead}>
            <span className={s.mono}>b</span>
            <span className={`${s.mono} ${c.dec}`}>{b}</span>
          </div>
          <Cells value={b} label="b" on={(bit) => setB((v) => v ^ (1 << bit))} />
        </div>
      </div>
      <p className={s.caption}>Tap a bit to flip it. Bit 7 is on the left, bit 0 (the 1s place) on the right.</p>

      <ul className={c.rows}>
        {results.map((r) => (
          <li key={r.expr} className={c.rowItem}>
            <div className={c.rowHead}>
              <span className={s.mono}>{r.expr}</span>
              <span className={`${s.mono} ${c.dec}`} aria-label={`result ${r.v}`}>
                = {r.v}
              </span>
            </div>
            {r.expr === "popcount(a)" ? <Cells value={a} label="a (counted)" /> : <Cells value={r.v} label={r.expr} />}
            <span className={s.caption}>{r.note}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
