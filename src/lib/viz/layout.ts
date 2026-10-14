/**
 * Graph layouts in a 0..100 x 0..100 box. Pure functions, no randomness.
 */
export interface Pt {
  x: number;
  y: number;
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** n nodes on an ellipse, node 0 at the top, clockwise. */
export function circleLayout(n: number): Pt[] {
  if (n <= 0) return [];
  if (n === 1) return [{ x: 50, y: 50 }];
  const rx = 40;
  const ry = 36;
  return Array.from({ length: n }, (_, i) => {
    const a = -Math.PI / 2 + (2 * Math.PI * i) / n;
    return { x: r1(50 + rx * Math.cos(a)), y: r1(50 + ry * Math.sin(a)) };
  });
}

/**
 * Tidy-ish tree/forest layout. `children[i]` lists the children of node i; `roots` are laid out
 * left to right. Leaves get evenly spaced slots, a parent sits above the middle of its children.
 * Nodes that are not reachable from `roots` are placed at (50, 50).
 */
export function treeLayout(children: number[][], roots: number[]): (Pt & { depth: number })[] {
  const n = children.length;
  const out: (Pt & { depth: number })[] = Array.from({ length: n }, () => ({ x: 50, y: 50, depth: 0 }));
  let slot = 0;
  let maxDepth = 0;
  const rawX: number[] = new Array(n).fill(0);
  const visit = (u: number, depth: number) => {
    out[u].depth = depth;
    if (depth > maxDepth) maxDepth = depth;
    const kids = children[u];
    if (kids.length === 0) {
      rawX[u] = slot++;
      return;
    }
    for (const k of kids) visit(k, depth + 1);
    rawX[u] = (rawX[kids[0]] + rawX[kids[kids.length - 1]]) / 2;
  };
  for (const r of roots) visit(r, 0);
  const margin = 8;
  const span = 100 - 2 * margin;
  const step = Math.min(22, 80 / Math.max(maxDepth, 1));
  const seen = new Set<number>();
  const mark = (u: number) => {
    seen.add(u);
    for (const k of children[u]) mark(k);
  };
  for (const r of roots) mark(r);
  for (const u of seen) {
    out[u].x = r1(slot <= 1 ? 50 : margin + (rawX[u] * span) / (slot - 1));
    out[u].y = r1(10 + out[u].depth * step);
  }
  return out;
}

/** Layers top to bottom, nodes spread evenly inside a layer. Returns positions indexed by node id. */
export function layeredLayout(layers: number[][], n: number): Pt[] {
  const out: Pt[] = Array.from({ length: n }, () => ({ x: 50, y: 50 }));
  const L = layers.length;
  layers.forEach((layer, li) => {
    layer.forEach((u, k) => {
      out[u] = {
        x: r1(((k + 1) / (layer.length + 1)) * 100),
        y: r1(L === 1 ? 50 : 12 + (li * 76) / (L - 1)),
      };
    });
  });
  return out;
}

/** Positions for a binary heap stored in an array of the given size (index 0 is the root). */
export function heapLayout(size: number): Pt[] {
  return Array.from({ length: size }, (_, i) => {
    const level = Math.floor(Math.log2(i + 1));
    const pos = i + 1 - 2 ** level;
    return { x: r1(((pos + 0.5) / 2 ** level) * 100), y: r1(12 + level * 24) };
  });
}
