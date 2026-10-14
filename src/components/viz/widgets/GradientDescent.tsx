"use client";
import { useEffect, useId, useMemo, useReducer, useState } from "react";
import { gauss, mulberry32 } from "@/lib/viz/sims-b/util";
import s from "./shared.module.css";
import c from "./GradientDescent.module.css";
import { fmt, num } from "./util";

const W0 = -1.5;
const B0 = -1;
const MAX_STEPS = 400;
const LR_MIN = 0.001;
const LR_MAX = 2;

interface St {
  w: number;
  b: number;
  steps: number;
  losses: number[];
}

type Pt = { x: number; y: number };

function loss(pts: Pt[], w: number, b: number): number {
  let t = 0;
  for (const p of pts) t += (w * p.x + b - p.y) ** 2;
  return t / pts.length;
}

function init(pts: Pt[]): St {
  return { w: W0, b: B0, steps: 0, losses: [loss(pts, W0, B0)] };
}

function reducer(pts: Pt[], lr: number) {
  return (st: St, a: "step" | "reset"): St => {
    if (a === "reset") return init(pts);
    if (st.steps >= MAX_STEPS) return st;
    let gw = 0;
    let gb = 0;
    for (const p of pts) {
      const e = st.w * p.x + st.b - p.y;
      gw += 2 * e * p.x;
      gb += 2 * e;
    }
    gw /= pts.length;
    gb /= pts.length;
    const w = st.w - lr * gw;
    const b = st.b - lr * gb;
    return { w, b, steps: st.steps + 1, losses: [...st.losses, loss(pts, w, b)] };
  };
}

const toSlider = (lr: number) => Math.round(((Math.log10(lr) - Math.log10(LR_MIN)) / (Math.log10(LR_MAX) - Math.log10(LR_MIN))) * 1000);
const fromSlider = (v: number) => 10 ** (Math.log10(LR_MIN) + (v / 1000) * (Math.log10(LR_MAX) - Math.log10(LR_MIN)));

const PW = 320;
const PH = 200;

export default function GradientDescent({ input }: { input: Record<string, unknown> }) {
  const id = useId();
  const nPts = Math.round(num(input.points, 16, 5, 40));
  const noise = num(input.noise, 0.6, 0, 3);
  const [lr, setLr] = useState(() => num(input.lr, 0.1, LR_MIN, LR_MAX));
  const pts = useMemo<Pt[]>(() => {
    const rnd = mulberry32(2024);
    return Array.from({ length: nPts }, (_, i) => {
      const x = -1 + (2 * (i + rnd() * 0.8)) / nPts;
      return { x, y: 1.5 * x + 0.5 + noise * gauss(rnd) * 0.5 };
    });
  }, [nPts, noise]);
  const [st, dispatch] = useReducer(
    (state: St, action: "step" | "reset") => reducer(pts, lr)(state, action),
    pts,
    init,
  );
  const [running, setRunning] = useState(false);

  // a new dataset restarts the run
  useEffect(() => {
    dispatch("reset");
    setRunning(false);
  }, [pts]);

  const last = st.losses[st.losses.length - 1];
  const first = st.losses[0];
  const broken = !Number.isFinite(last) || last > 1e9;
  const diverging = !broken && st.steps >= 3 && last > first * 2 && last > st.losses[st.losses.length - 2];
  const converged = !broken && st.steps > 0 && Math.abs(last - st.losses[Math.max(0, st.losses.length - 2)]) < 1e-7;
  const finished = broken || st.steps >= MAX_STEPS || converged;

  useEffect(() => {
    if (!running) return;
    if (finished) {
      setRunning(false);
      return;
    }
    const t = setTimeout(() => dispatch("step"), 90);
    return () => clearTimeout(t);
  }, [running, st, finished]);

  // plot geometry
  const ys = pts.map((p) => p.y);
  const yMin = Math.min(...ys, -2.5) - 0.3;
  const yMax = Math.max(...ys, 2.5) + 0.3;
  const X = (x: number) => 14 + ((x + 1.2) / 2.4) * (PW - 28);
  const Y = (y: number) => PH - 12 - ((y - yMin) / (yMax - yMin)) * (PH - 24);
  const lineOk = Number.isFinite(st.w) && Number.isFinite(st.b);
  const clip = `${id}-clip`;

  // loss sparkline on a log axis
  const logs = st.losses.map((l) => (Number.isFinite(l) ? Math.log10(Math.max(l, 1e-6)) : 12));
  const lMin = Math.min(...logs, -2);
  const lMax = Math.max(...logs, 1);
  const SW = 320;
  const SH = 72;
  const SX = (i: number) => 4 + (st.losses.length <= 1 ? 0 : (i / Math.max(st.losses.length - 1, 30)) * (SW - 8));
  const SY = (v: number) => SH - 6 - ((v - lMin) / (lMax - lMin)) * (SH - 12);
  const path = logs.map((v, i) => `${i ? "L" : "M"}${SX(i).toFixed(1)} ${SY(v).toFixed(1)}`).join(" ");

  const status = broken
    ? "The numbers blew up. The learning rate is far too big: each step overshoots the minimum by more than it corrects."
    : diverging
      ? "Loss is growing: the learning rate is too big, so every step overshoots the valley and lands higher up the other side."
      : converged
        ? "Converged: the gradient is almost zero, so the steps have stopped."
        : st.steps === 0
          ? "Press Step or Run. Each step moves w and b a little against the gradient of the loss."
          : lr < 0.01
            ? "Loss is falling, but slowly: the learning rate is small, so many steps are needed."
            : "Loss is falling. Each step moves downhill on the loss surface.";

  return (
    <div className={s.root} role="group" aria-label="Gradient descent on a line fit">
      <svg className={s.svg} viewBox={`0 0 ${PW} ${PH}`} role="img" aria-label={`Scatter of ${nPts} points with the current line y equals ${fmt(st.w)} x plus ${fmt(st.b)}`}>
        <defs>
          <clipPath id={clip}>
            <rect x="0" y="0" width={PW} height={PH} />
          </clipPath>
        </defs>
        <rect x="0.5" y="0.5" width={PW - 1} height={PH - 1} rx="8" fill="var(--bg-elev)" stroke="var(--line-soft)" />
        <line x1={X(-1.2)} x2={X(1.2)} y1={Y(0)} y2={Y(0)} stroke="var(--line)" />
        <line x1={X(0)} x2={X(0)} y1={Y(yMin)} y2={Y(yMax)} stroke="var(--line)" />
        {lineOk && (
          <line clipPath={`url(#${clip})`} x1={X(-1.2)} y1={Y(st.w * -1.2 + st.b)} x2={X(1.2)} y2={Y(st.w * 1.2 + st.b)} stroke={broken || diverging ? "var(--rose)" : "var(--accent)"} strokeWidth="2.5" />
        )}
        {pts.map((p, i) => (
          <circle key={i} cx={X(p.x)} cy={Y(p.y)} r="3.5" fill="var(--sky)" />
        ))}
      </svg>

      <div className={s.row}>
        <button type="button" className={s.btn} disabled={finished || running} onClick={() => dispatch("step")}>
          Step
        </button>
        <button type="button" className={`${s.btn} ${s.btnPrimary}`} disabled={finished && !running} onClick={() => setRunning((r) => !r)}>
          {running ? "Pause" : "Run"}
        </button>
        <button type="button" className={s.btn} onClick={() => { setRunning(false); dispatch("reset"); }}>
          Reset
        </button>
      </div>

      <div className={s.field}>
        <label className={s.label} htmlFor={`${id}-lr`}>
          lr
        </label>
        <input
          id={`${id}-lr`}
          className={s.range}
          type="range"
          min={0}
          max={1000}
          value={toSlider(lr)}
          onChange={(e) => setLr(Number(fromSlider(Number(e.target.value)).toPrecision(2)))}
          aria-label="Learning rate, log scale from 0.001 to 2"
          aria-valuetext={`learning rate ${lr}`}
        />
        <span className={s.mono}>{lr}</span>
      </div>

      <div className={s.readout}>
        <span>
          y = {fmt(st.w)} x + {fmt(st.b)}
        </span>
        <span>
          step {st.steps}, loss (MSE) {fmt(last, 3)}
        </span>
      </div>

      <figure className={c.fig}>
        <svg className={s.svg} viewBox={`0 0 ${SW} ${SH}`} role="img" aria-label={`Loss history on a log scale, ${st.losses.length} points, currently ${fmt(last, 3)}`}>
          <rect x="0.5" y="0.5" width={SW - 1} height={SH - 1} rx="6" fill="var(--bg-elev)" stroke="var(--line-soft)" />
          <path d={path} fill="none" stroke={broken || diverging ? "var(--rose)" : "var(--sage)"} strokeWidth="2" strokeLinejoin="round" />
        </svg>
        <figcaption className={s.caption}>Loss over steps, log scale (a straight line going up means exponential blow-up).</figcaption>
      </figure>

      <p className={s.status} aria-live="polite">
        {status}
      </p>
      <p className={s.caption}>
        Loss = average of (w x + b - y)^2 over the points. Gradient: how the loss changes when w or b nudge up. Update: w = w - lr x dLoss/dw, same for b. Try lr near 1 or above to see divergence.
      </p>
    </div>
  );
}
