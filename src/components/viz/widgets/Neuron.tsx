"use client";
import { useId, useState } from "react";
import s from "./shared.module.css";
import c from "./Neuron.module.css";
import { fmt, num, numArr, str } from "./util";

type Act = "sigmoid" | "tanh" | "relu";
const ACTS: Act[] = ["sigmoid", "tanh", "relu"];
const f = (a: Act, z: number) => (a === "sigmoid" ? 1 / (1 + Math.exp(-z)) : a === "tanh" ? Math.tanh(z) : Math.max(0, z));
const YR: Record<Act, [number, number]> = { sigmoid: [-0.1, 1.1], tanh: [-1.1, 1.1], relu: [-0.5, 6] };
const ZR = 6;

const DW = 360;
const PW = 320;
const PH = 180;

export default function Neuron({ input }: { input: Record<string, unknown> }) {
  const id = useId();
  const x0 = numArr(input.inputs, [1, 0.5], -5, 5, 4);
  const w0 = numArr(input.weights, [0.8, -0.4], -5, 5, 4);
  const n = x0.length;
  const [xs, setXs] = useState<number[]>(x0);
  const [ws, setWs] = useState<number[]>(() => Array.from({ length: n }, (_, i) => w0[i] ?? 0));
  const [bias, setBias] = useState(() => num(input.bias, 0.1, -5, 5));
  const [act, setAct] = useState<Act>(() => {
    const a = str(input.activation, "sigmoid");
    return (ACTS as string[]).includes(a) ? (a as Act) : "sigmoid";
  });

  const terms = xs.map((x, i) => x * ws[i]);
  const z = terms.reduce((a, b) => a + b, 0) + bias;
  const out = f(act, z);

  // diagram geometry
  const rowH = 56;
  const dh = Math.max(150, n * rowH + 30);
  const midY = dh / 2;
  const inY = (i: number) => (dh - (n - 1) * rowH) / 2 + i * rowH;

  // plot geometry
  const [y0, y1] = YR[act];
  const PX = (zv: number) => 28 + ((zv + ZR) / (2 * ZR)) * (PW - 40);
  const PY = (yv: number) => PH - 20 - ((yv - y0) / (y1 - y0)) * (PH - 32);
  const curve = Array.from({ length: 121 }, (_, i) => {
    const zv = -ZR + (i / 120) * 2 * ZR;
    return `${i ? "L" : "M"}${PX(zv).toFixed(1)} ${PY(f(act, zv)).toFixed(1)}`;
  }).join(" ");
  const zc = Math.max(-ZR, Math.min(ZR, z));
  const outc = Math.max(y0, Math.min(y1, out));
  const off = Math.abs(z) > ZR;

  const slider = (label: string, value: number, set: (v: number) => void, key: string) => (
    <div className={s.field} key={key}>
      <label className={`${s.label} ${s.mono}`} htmlFor={`${id}-${key}`}>
        {label}
      </label>
      <input id={`${id}-${key}`} className={s.range} type="range" min={-5} max={5} step={0.1} value={value} onChange={(e) => set(Number(e.target.value))} />
      <span className={`${s.mono} ${c.val}`}>{fmt(value, 1)}</span>
    </div>
  );

  return (
    <div className={s.root} role="group" aria-label="A single neuron">
      <svg className={s.svg} viewBox={`0 0 ${DW} ${dh}`} role="img" aria-label={`Neuron diagram: ${n} inputs multiplied by weights and summed with bias ${fmt(bias, 1)} gives z equals ${fmt(z)}, then ${act} gives ${fmt(out, 3)}.`}>
        {xs.map((x, i) => {
          const y = inY(i);
          const w = ws[i];
          return (
            <g key={i}>
              <line x1="52" y1={y} x2="190" y2={midY} stroke={w >= 0 ? "var(--sage)" : "var(--rose)"} strokeWidth={0.8 + Math.abs(w) * 1.2} strokeLinecap="round" opacity="0.9" />
              <circle cx="36" cy={y} r="17" fill="var(--surface-2)" stroke="var(--line)" />
              <text x="36" y={y} textAnchor="middle" dominantBaseline="central" fill="var(--text)" fontSize="11" fontFamily="var(--font-mono)">
                {fmt(x, 1)}
              </text>
              <text x="36" y={y - 23} textAnchor="middle" fill="var(--text-3)" fontSize="10" fontFamily="var(--font-mono)">
                x{i + 1}
              </text>
              <text x={52 + (190 - 52) * 0.42} y={y + (midY - y) * 0.42 - 6} textAnchor="middle" fill={w >= 0 ? "var(--sage)" : "var(--rose)"} fontSize="11" fontFamily="var(--font-mono)">
                w={fmt(w, 1)}
              </text>
            </g>
          );
        })}
        <line x1="190" y1="14" x2="190" y2={midY - 20} stroke="var(--gold)" strokeWidth={0.8 + Math.abs(bias) * 1.2} strokeLinecap="round" />
        <text x="198" y="16" fill="var(--gold)" fontSize="11" fontFamily="var(--font-mono)">
          bias {fmt(bias, 1)}
        </text>
        <circle cx="190" cy={midY} r="21" fill="var(--surface-2)" stroke="var(--accent)" strokeWidth="2" />
        <text x="190" y={midY - 4} textAnchor="middle" dominantBaseline="central" fill="var(--text-2)" fontSize="13">
          sum
        </text>
        <text x="190" y={midY + 9} textAnchor="middle" dominantBaseline="central" fill="var(--text)" fontSize="10" fontFamily="var(--font-mono)">
          {fmt(z, 2)}
        </text>
        <line x1="211" y1={midY} x2="254" y2={midY} stroke="var(--text-3)" strokeWidth="2" />
        <rect x="254" y={midY - 20} width="46" height="40" rx="8" fill="var(--surface-2)" stroke="var(--line)" />
        <text x="277" y={midY} textAnchor="middle" dominantBaseline="central" fill="var(--text)" fontSize="11" fontFamily="var(--font-mono)">
          {act}
        </text>
        <line x1="300" y1={midY} x2="320" y2={midY} stroke="var(--text-3)" strokeWidth="2" />
        <circle cx="338" cy={midY} r="18" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
        <text x="338" y={midY} textAnchor="middle" dominantBaseline="central" fill="var(--text)" fontSize="11" fontFamily="var(--font-mono)">
          {fmt(out, 2)}
        </text>
      </svg>

      <div className={c.sliders}>
        {xs.map((x, i) => slider(`x${i + 1}`, x, (v) => setXs((a) => a.map((q, j) => (j === i ? v : q))), `x${i}`))}
        {ws.map((w, i) => slider(`w${i + 1}`, w, (v) => setWs((a) => a.map((q, j) => (j === i ? v : q))), `w${i}`))}
        {slider("bias", bias, setBias, "b")}
        <div className={s.field}>
          <label className={s.label} htmlFor={`${id}-act`}>
            activation
          </label>
          <select id={`${id}-act`} className={s.select} value={act} onChange={(e) => setAct(e.target.value as Act)}>
            {ACTS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <span />
        </div>
      </div>

      <div className={s.readout} aria-live="polite">
        <span>
          z = {terms.map((t, i) => `(${fmt(ws[i], 1)} x ${fmt(xs[i], 1)})`).join(" + ")} + {fmt(bias, 1)} = {fmt(z, 3)}
        </span>
        <span>
          output = {act}(z) = {fmt(out, 3)}
        </span>
      </div>

      <svg className={s.svg} viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label={`Plot of ${act}. Current point: z ${fmt(z, 2)}, output ${fmt(out, 3)}${off ? ", beyond the plotted range" : ""}.`}>
        <rect x="0.5" y="0.5" width={PW - 1} height={PH - 1} rx="8" fill="var(--bg-elev)" stroke="var(--line-soft)" />
        <line x1={PX(-ZR)} x2={PX(ZR)} y1={PY(0)} y2={PY(0)} stroke="var(--line)" />
        <line x1={PX(0)} x2={PX(0)} y1={PY(y0)} y2={PY(y1)} stroke="var(--line)" />
        <path d={curve} fill="none" stroke="var(--sky)" strokeWidth="2.5" />
        <line x1={PX(zc)} x2={PX(zc)} y1={PY(outc)} y2={PY(0)} stroke="var(--accent)" strokeDasharray="4 3" />
        <line x1={PX(0)} x2={PX(zc)} y1={PY(outc)} y2={PY(outc)} stroke="var(--accent)" strokeDasharray="4 3" />
        <circle cx={PX(zc)} cy={PY(outc)} r="6" fill="var(--accent)" stroke="var(--bg)" strokeWidth="2" />
        <text x={PW - 8} y={PY(0) - 6} textAnchor="end" fill="var(--text-3)" fontSize="10">
          z
        </text>
        <text x={PX(-ZR)} y={PH - 5} fill="var(--text-3)" fontSize="10" fontFamily="var(--font-mono)">
          -{ZR}
        </text>
        <text x={PX(ZR)} y={PH - 5} textAnchor="end" fill="var(--text-3)" fontSize="10" fontFamily="var(--font-mono)">
          {ZR}
        </text>
      </svg>
      <p className={s.caption}>
        A neuron multiplies each input by a weight, adds them up with a bias (z), then squashes z with an activation function. Sigmoid squeezes to 0..1, tanh to -1..1, ReLU keeps positives and zeroes negatives. Green lines are positive weights, red are negative.
        {off ? " The dot is pinned at the edge: z is outside the plotted range." : ""}
      </p>
    </div>
  );
}
