import type { Frame, PlotPoint, Simulator } from "../types";
import { gauss, mulberry32, round } from "./util";

interface In {
  k: number;
  points: number;
  seed: number;
}

const CODE = [
  "pick k points as starting centroids",
  "repeat:",
  "  assign each point to its nearest centroid",
  "  move each centroid to the mean of its points",
  "  stop when no assignment changes",
];

const R: [number, number] = [0, 10];

export const kmeans: Simulator<In> = ({ k, points: n, seed }) => {
  const rnd = mulberry32(seed);
  // hidden "true" blobs so the data has real structure; the algorithm never sees them
  const blobs = Array.from({ length: k }, () => ({ x: 1.5 + rnd() * 7, y: 1.5 + rnd() * 7 }));
  const pts = Array.from({ length: n }, (_, i) => {
    const b = blobs[i % k];
    const clamp = (v: number) => Math.min(9.8, Math.max(0.2, v));
    return { x: round(clamp(b.x + gauss(rnd) * 0.9), 2), y: round(clamp(b.y + gauss(rnd) * 0.9), 2) };
  });
  // initial centroids: k distinct data points chosen by the seeded generator
  const chosen: number[] = [];
  while (chosen.length < k) {
    const j = Math.floor(rnd() * n);
    if (!chosen.includes(j)) chosen.push(j);
  }
  let cents = chosen.map((j) => ({ x: pts[j].x, y: pts[j].y }));
  let assign: number[] = new Array(n).fill(-1);
  const frames: Frame[] = [];

  const plot = (colored: boolean, lines: boolean, label: string, dashed?: { x1: number; y1: number; x2: number; y2: number }[]): Frame["plot"] => ({
    points: pts.map((p, i): PlotPoint => (colored && assign[i] >= 0 ? { x: p.x, y: p.y, c: assign[i] } : { x: p.x, y: p.y, tone: "muted" })),
    marks: cents.map((c, i): PlotPoint => ({ x: c.x, y: c.y, c: i })),
    lines: [
      ...(lines ? pts.map((p, i) => ({ x1: p.x, y1: p.y, x2: cents[assign[i]].x, y2: cents[assign[i]].y, tone: "muted" as const })) : []),
      ...(dashed ?? []).map((d) => ({ ...d, tone: "active" as const, dashed: true })),
    ],
    xRange: R,
    yRange: R,
    label,
  });
  const inertia = () => round(pts.reduce((s, p, i) => s + (p.x - cents[assign[i]].x) ** 2 + (p.y - cents[assign[i]].y) ** 2, 0), 1);

  frames.push({
    plot: plot(false, false, `${n} points, ${k} starting centroids (marked)`),
    vars: { iteration: 0, k, points: n },
    note: `${n} unlabelled points. Start with ${k} random points as centroids (the big markers).`,
    line: 0,
  });
  let converged = false;
  for (let it = 1; it <= 15 && !converged; it++) {
    const next = pts.map((p) => {
      let best = 0;
      let bd = Infinity;
      cents.forEach((c, ci) => {
        const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
        if (d < bd) {
          bd = d;
          best = ci;
        }
      });
      return best;
    });
    const changed = next.filter((v, i) => v !== assign[i]).length;
    assign = next;
    frames.push({
      plot: plot(true, true, `iteration ${it}: assignment`),
      vars: { iteration: it, reassigned: changed, inertia: inertia() },
      note: `Iteration ${it}: colour each point by its nearest centroid. ${changed === n ? "Every point is newly assigned." : `${changed} point${changed === 1 ? "" : "s"} changed cluster.`}`,
      line: 2,
    });
    if (changed === 0) {
      converged = true;
      frames[frames.length - 1].note = `Iteration ${it}: no point changed cluster, so the clusters are stable. Converged.`;
      frames[frames.length - 1].line = 4;
      break;
    }
    const old = cents;
    cents = cents.map((c, ci) => {
      const m = pts.filter((_, i) => assign[i] === ci);
      return m.length ? { x: round(m.reduce((s, p) => s + p.x, 0) / m.length, 2), y: round(m.reduce((s, p) => s + p.y, 0) / m.length, 2) } : c;
    });
    frames.push({
      plot: plot(true, false, `iteration ${it}: centroids move`, old.map((o, i) => ({ x1: o.x, y1: o.y, x2: cents[i].x, y2: cents[i].y }))),
      vars: { iteration: it, reassigned: changed, inertia: inertia() },
      note: `Move each centroid to the mean of its points (dashed lines show the move).`,
      line: 3,
    });
  }
  return { frames, code: { lang: "text", lines: CODE }, result: converged ? `converged, total squared distance ${inertia()}` : `stopped after 15 iterations, total squared distance ${inertia()}` };
};
