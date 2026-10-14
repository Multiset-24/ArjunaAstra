"use client";
import { useRef, useState } from "react";
import s from "./shared.module.css";
import c from "./Cosine.module.css";
import { fmt, numArr } from "./util";

const SIZE = 320;
const R = 5; // plane covers -R..R on both axes
const PX = SIZE / (2 * R);
const toPx = (v: number) => SIZE / 2 + v * PX;
const clampV = (v: number) => Math.min(R, Math.max(-R, Math.round(v * 10) / 10));

type V = [number, number];
type Which = "a" | "b";

export default function Cosine({ input }: { input: Record<string, unknown> }) {
  const start = (v: unknown, d: V): V => {
    const a = numArr(v, d, -R, R, 2);
    return [a[0] ?? d[0], a[1] ?? d[1]];
  };
  const [a, setA] = useState<V>(() => start(input.a, [3, 1]));
  const [b, setB] = useState<V>(() => start(input.b, [1, 2]));
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<Which | null>(null);

  const place = (which: Which, e: React.PointerEvent) => {
    const el = svg.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = clampV(((e.clientX - r.left) / r.width - 0.5) * 2 * R);
    const y = clampV(-((e.clientY - r.top) / r.height - 0.5) * 2 * R);
    (which === "a" ? setA : setB)([x, y]);
  };
  const nudge = (which: Which, e: React.KeyboardEvent) => {
    const step = e.shiftKey ? 0.5 : 0.1;
    const d: Record<string, V> = { ArrowRight: [step, 0], ArrowLeft: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    const cur = which === "a" ? a : b;
    (which === "a" ? setA : setB)([clampV(cur[0] + m[0]), clampV(cur[1] + m[1])]);
  };

  const dot = a[0] * b[0] + a[1] * b[1];
  const la = Math.hypot(a[0], a[1]);
  const lb = Math.hypot(b[0], b[1]);
  const defined = la > 1e-9 && lb > 1e-9;
  const cos = defined ? Math.max(-1, Math.min(1, dot / (la * lb))) : NaN;
  const ang = defined ? (Math.acos(cos) * 180) / Math.PI : NaN;

  const verdict = !defined
    ? "A zero-length vector has no direction, so cosine is undefined."
    : cos > 0.99
      ? "Same direction: cosine is about 1."
      : cos < -0.99
        ? "Opposite directions: cosine is about -1."
        : Math.abs(cos) < 0.05
          ? "At right angles: cosine is about 0 (nothing in common)."
          : cos > 0
            ? "Pointing roughly the same way: positive cosine."
            : "Pointing roughly opposite ways: negative cosine.";

  // angle arc
  const arcR = 34;
  let arc = "";
  if (defined && ang > 0.5 && ang < 179.5) {
    const a1 = Math.atan2(-a[1], a[0]);
    const a2 = Math.atan2(-b[1], b[0]);
    const p1 = [SIZE / 2 + arcR * Math.cos(a1), SIZE / 2 + arcR * Math.sin(a1)];
    const p2 = [SIZE / 2 + arcR * Math.cos(a2), SIZE / 2 + arcR * Math.sin(a2)];
    const cross = a[0] * b[1] - a[1] * b[0]; // b counter-clockwise of a on screen when > 0
    arc = `M${p1[0].toFixed(1)} ${p1[1].toFixed(1)} A${arcR} ${arcR} 0 0 ${cross > 0 ? 0 : 1} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }

  const handle = (which: Which, v: V, color: string, name: string) => (
    <g
      tabIndex={0}
      role="slider"
      aria-label={`Tip of vector ${name}`}
      aria-valuetext={`x ${fmt(v[0], 1)}, y ${fmt(v[1], 1)}. Arrow keys move it, shift for bigger steps.`}
      aria-valuenow={Number(fmt(v[0], 1))}
      aria-valuemin={-R}
      aria-valuemax={R}
      className={c.handle}
      onKeyDown={(e) => nudge(which, e)}
      onPointerDown={(e) => {
        drag.current = which;
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        place(which, e);
      }}
      onPointerMove={(e) => drag.current === which && place(which, e)}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <circle cx={toPx(v[0])} cy={toPx(-v[1])} r="22" fill="transparent" />
      <circle cx={toPx(v[0])} cy={toPx(-v[1])} r="9" fill={color} stroke="var(--bg)" strokeWidth="2" className={c.knob} />
      <text x={toPx(v[0]) + 13} y={toPx(-v[1]) - 11} fill={color} fontSize="14" fontFamily="var(--font-mono)">
        {name}
      </text>
    </g>
  );

  return (
    <div className={s.root} role="group" aria-label="Vectors, dot product and cosine">
      <svg ref={svg} className={`${s.svg} ${c.plane}`} viewBox={`0 0 ${SIZE} ${SIZE}`} role="group" aria-label="Plane with two draggable vectors">
        <rect x="0.5" y="0.5" width={SIZE - 1} height={SIZE - 1} rx="8" fill="var(--bg-elev)" stroke="var(--line-soft)" />
        {Array.from({ length: 2 * R - 1 }, (_, i) => i - R + 1).map((g) => (
          <g key={g} stroke={g === 0 ? "var(--line)" : "var(--line-soft)"}>
            <line x1={toPx(g)} x2={toPx(g)} y1="0" y2={SIZE} />
            <line y1={toPx(g)} y2={toPx(g)} x1="0" x2={SIZE} />
          </g>
        ))}
        {arc && <path d={arc} fill="none" stroke="var(--text-2)" strokeWidth="1.5" />}
        <line x1={SIZE / 2} y1={SIZE / 2} x2={toPx(a[0])} y2={toPx(-a[1])} stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
        <line x1={SIZE / 2} y1={SIZE / 2} x2={toPx(b[0])} y2={toPx(-b[1])} stroke="var(--sky)" strokeWidth="3" strokeLinecap="round" />
        {handle("a", a, "var(--accent)", "a")}
        {handle("b", b, "var(--sky)", "b")}
      </svg>

      <div className={s.readout} aria-live="polite">
        <span>
          a = ({fmt(a[0], 1)}, {fmt(a[1], 1)}) &nbsp; b = ({fmt(b[0], 1)}, {fmt(b[1], 1)})
        </span>
        <span>
          a . b = {fmt(a[0], 1)} x {fmt(b[0], 1)} + {fmt(a[1], 1)} x {fmt(b[1], 1)} = {fmt(dot)}
        </span>
        <span>
          |a| = {fmt(la)} &nbsp; |b| = {fmt(lb)}
        </span>
        <span>cos = a . b / (|a| |b|) = {defined ? fmt(cos, 3) : "undefined"}</span>
        <span>angle = {defined ? `${fmt(ang, 1)} degrees` : "undefined"}</span>
      </div>
      <p className={s.status}>{verdict}</p>
      <div className={s.row}>
        <button type="button" className={s.btn} onClick={() => { setA(start(input.a, [3, 1])); setB(start(input.b, [1, 2])); }}>
          Reset
        </button>
      </div>
      <p className={s.caption}>
        Drag the two dots (or focus one and use the arrow keys). The dot product grows when the vectors point the same way, and cosine ignores their lengths: it only measures the angle, which is why it is used to compare embeddings.
      </p>
    </div>
  );
}
