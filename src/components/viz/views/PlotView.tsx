"use client";
import type { PlotPoint, PlotState } from "@/lib/viz/types";
import { toneClass } from "./tone";
import s from "./PlotView.module.css";

const W = 120;
const H = 84;
const PAD = { l: 14, r: 6, t: 6, b: 14 };
const PALETTE = ["--accent", "--sky", "--sage", "--gold", "--rose", "--text-2"];

function shape(kind: number, x: number, y: number, r: number): string {
  switch (kind % 5) {
    case 1: // square
      return `M${x - r},${y - r}h${2 * r}v${2 * r}h${-2 * r}z`;
    case 2: // triangle
      return `M${x},${y - r * 1.15}L${x + r * 1.1},${y + r * 0.9}L${x - r * 1.1},${y + r * 0.9}z`;
    case 3: // diamond
      return `M${x},${y - r * 1.2}L${x + r * 1.2},${y}L${x},${y + r * 1.2}L${x - r * 1.2},${y}z`;
    case 4: // plus
      return `M${x - r * 0.4},${y - r}h${r * 0.8}v${r * 0.6}h${r * 0.6}v${r * 0.8}h${-r * 0.6}v${r * 0.6}h${-r * 0.8}v${-r * 0.6}h${-r * 0.6}v${-r * 0.8}h${r * 0.6}z`;
    default: // circle
      return `M${x - r},${y}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0z`;
  }
}

/** Scatter plot with optional marks (centroids) and lines. */
export function PlotView({ state }: { state: PlotState }) {
  const { points = [], marks = [], lines = [], xRange, yRange, label } = state;
  const [xa, xb] = xRange;
  const [ya, yb] = yRange;
  const sx = (v: number) => PAD.l + ((v - xa) / (xb - xa || 1)) * (W - PAD.l - PAD.r);
  const sy = (v: number) => H - PAD.b - ((v - ya) / (yb - ya || 1)) * (H - PAD.t - PAD.b);
  const style = (p: PlotPoint) => ({ ["--pc" as string]: `var(${PALETTE[(p.c ?? 0) % PALETTE.length]})` });
  const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  const aria = `${label ?? "Plot"}: ${points.length} points${marks.length ? `, ${marks.length} centre marks` : ""}${lines.length ? `, ${lines.length} lines` : ""}`;

  return (
    <figure className={s.figure} role="img" aria-label={aria}>
      {label ? <figcaption className={s.label}>{label}</figcaption> : null}
      <svg className={s.svg} viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false">
        <rect x={PAD.l} y={PAD.t} width={W - PAD.l - PAD.r} height={H - PAD.t - PAD.b} className={s.frame} />
        <g className={s.tick}>
          <text x={PAD.l} y={H - 4} textAnchor="start">{fmt(xa)}</text>
          <text x={W - PAD.r} y={H - 4} textAnchor="end">{fmt(xb)}</text>
          <text x={PAD.l - 2} y={H - PAD.b} textAnchor="end">{fmt(ya)}</text>
          <text x={PAD.l - 2} y={PAD.t + 4} textAnchor="end">{fmt(yb)}</text>
        </g>
        {lines.map((l, i) => (
          <line key={i} x1={sx(l.x1)} y1={sy(l.y1)} x2={sx(l.x2)} y2={sy(l.y2)} className={`${s.line} ${l.tone ? toneClass(l.tone) : ""}`} strokeDasharray={l.dashed ? "2 2" : undefined} data-tone={l.tone ? "1" : undefined} />
        ))}
        {points.map((p, i) => (
          <path key={i} d={shape(p.c ?? 0, sx(p.x), sy(p.y), 1.5 * (p.size ?? 1))} className={`${s.pt} ${p.tone ? toneClass(p.tone) : ""}`} data-tone={p.tone ? "1" : undefined} style={style(p)} />
        ))}
        {marks.map((p, i) => (
          <path key={i} d={shape(p.c ?? 0, sx(p.x), sy(p.y), 3 * (p.size ?? 1))} className={`${s.mark} ${p.tone ? toneClass(p.tone) : ""}`} data-tone={p.tone ? "1" : undefined} style={style(p)} />
        ))}
      </svg>
    </figure>
  );
}
