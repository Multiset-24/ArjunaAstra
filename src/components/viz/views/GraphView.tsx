"use client";
import { useId } from "react";
import type { GraphState, Tone } from "@/lib/viz/types";
import { TONE_NAMES, toneClass } from "./tone";
import s from "./GraphView.module.css";

/** Shared drawing box so nodes do not jump between frames: union of all frames' nodes. */
export interface GraphFit {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Node radius in drawing units. */
  r: number;
}

export function fitGraphs(graphs: GraphState[]): GraphFit {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  let dmin = Infinity;
  let hasBadge = false;
  for (const g of graphs) {
    const ns = g.nodes;
    for (let i = 0; i < ns.length; i++) {
      const a = ns[i];
      x0 = Math.min(x0, a.x);
      x1 = Math.max(x1, a.x);
      y0 = Math.min(y0, a.y);
      y1 = Math.max(y1, a.y);
      if (a.badge) hasBadge = true;
      for (let j = i + 1; j < ns.length; j++) {
        const d = Math.hypot(a.x - ns[j].x, a.y - ns[j].y);
        if (d > 0.5) dmin = Math.min(dmin, d);
      }
    }
  }
  if (!Number.isFinite(x0)) return { x0: 0, y0: 0, x1: 100, y1: 60, r: 5 };
  const r = Math.max(2.6, Math.min(6, Number.isFinite(dmin) ? dmin * 0.4 : 6));
  const padX = r + 3;
  const padTop = r + (hasBadge ? r * 0.95 + 2 : 3);
  const padBottom = r + 3;
  // keep a sensible minimum extent so a 2-node graph is not stretched across the whole width
  const w0 = x1 - x0 + 2 * padX;
  const h0 = y1 - y0 + padTop + padBottom;
  const w = Math.max(w0, 40);
  const h = Math.max(h0, 24);
  const top = y0 - padTop - (h - h0) / 2;
  const cx = (x0 + x1) / 2;
  return { x0: cx - w / 2, x1: cx + w / 2, y0: top, y1: top + h, r };
}

const MARKER_TONES: (Tone | "none")[] = [...TONE_NAMES, "none"];

export function GraphView({ state, fit }: { state: GraphState; fit?: GraphFit }) {
  const uid = useId().replace(/:/g, "");
  const f = fit ?? fitGraphs([state]);
  const bw = f.x1 - f.x0;
  const bh = f.y1 - f.y0;
  const r = f.r;
  const { nodes, edges, nodeTones, edgeTones, directed, label } = state;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  // px per drawing unit at a 340px container; used only to decide when to scroll instead of squeeze
  const minWidth = Math.min(1100, Math.max(0, Math.ceil((12 / r) * bw)));

  const edgeTone = (from: string, to: string): Tone | undefined => edgeTones?.[`${from}->${to}`] ?? (directed ? undefined : edgeTones?.[`${to}->${from}`]);

  const fs = (text: string) => Math.min(r * 1.05, (r * 1.7) / Math.max(1, text.length * 0.62));
  const aria =
    `${label ?? "Graph"}: ` +
    nodes.map((n) => `${n.label ?? n.id}${n.badge ? ` (${n.badge})` : ""}`).join(", ") +
    (edges.length ? `. Edges: ${edges.map((e) => `${e.from} to ${e.to}${e.label ? ` (${e.label})` : ""}`).join(", ")}` : "");

  return (
    <figure className={s.figure} role="img" aria-label={aria.length > 600 ? aria.slice(0, 600) + "…" : aria}>
      {label ? <figcaption className={s.label}>{label}</figcaption> : null}
      {nodes.length === 0 ? (
        <div className={s.empty}>empty</div>
      ) : (
        <div className={s.scroller}>
          <svg
            className={s.svg}
            viewBox={`${f.x0} ${f.y0} ${bw} ${bh}`}
            style={{ aspectRatio: `${bw} / ${bh}`, minWidth: minWidth || undefined }}
            aria-hidden="true"
            focusable="false"
          >
            {directed ? (
              <defs>
                {MARKER_TONES.map((t) => (
                  <marker key={t} id={`${uid}-a-${t}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
                    <path d="M0,0 L10,5 L0,10 z" className={t === "none" ? s.arrowPlain : `${s.arrow} ${toneClass(t)}`} />
                  </marker>
                ))}
              </defs>
            ) : null}
            <g>
              {edges.map((e, i) => {
                const a = byId.get(e.from);
                const b = byId.get(e.to);
                if (!a || !b) return null;
                const tone = edgeTone(e.from, e.to);
                const cls = tone ? `${s.edge} ${toneClass(tone)}` : `${s.edge} ${s.edgePlain}`;
                if (a === b) {
                  const d = `M ${a.x - r * 0.5} ${a.y - r * 0.9} c ${-r} ${-r * 1.6}, ${r * 2} ${-r * 1.6}, ${r} 0`;
                  return <path key={i} d={d} className={cls} fill="none" />;
                }
                const dx = b.x - a.x;
                const dy = b.y - a.y;
                const len = Math.hypot(dx, dy) || 1;
                const ux = dx / len;
                const uy = dy / len;
                const x1 = a.x + ux * r;
                const y1 = a.y + uy * r;
                const x2 = b.x - ux * (r + (directed ? 0.4 : 0));
                const y2 = b.y - uy * (r + (directed ? 0.4 : 0));
                return (
                  <g key={i}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      className={cls}
                      markerEnd={directed ? `url(#${uid}-a-${tone ?? "none"})` : undefined}
                    />
                    {e.label ? (
                      <text
                        x={(a.x + b.x) / 2 - uy * r * 0.7}
                        y={(a.y + b.y) / 2 + ux * r * 0.7}
                        className={s.edgeLabel}
                        fontSize={r * 0.85}
                        textAnchor="middle"
                        dominantBaseline="central"
                      >
                        {e.label}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
            <g>
              {nodes.map((n) => {
                const text = n.label ?? n.id;
                return (
                  <g key={n.id} className={`${s.node} ${toneClass(nodeTones?.[n.id])}`} style={{ transform: `translate(${n.x}px, ${n.y}px)` }}>
                    <circle r={r} className={s.circle} />
                    <text className={s.nodeText} fontSize={fs(text)} textAnchor="middle" dominantBaseline="central">
                      {text}
                    </text>
                    {n.badge ? (
                      <text className={s.badge} y={-(r + r * 0.4)} fontSize={r * 0.8} textAnchor="middle">
                        {n.badge}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      )}
    </figure>
  );
}
