/**
 * Frame contract shared by every "frames" visualizer and the Player.
 * A simulator is a pure function: input -> Simulation. No DOM, no randomness without a seed.
 */
export type Tone = "active" | "compare" | "done" | "muted" | "match" | "bad" | "focus";

export interface ArrayState {
  values: (number | string)[];
  /** Pointer labels drawn under cells, e.g. { L: 0, R: 5, mid: 2 }. Out-of-range indices are hidden. */
  pointers?: Record<string, number>;
  /** Per-index tone. */
  tones?: Record<number, Tone>;
  /** Inclusive window [l, r] drawn as a bracket. */
  window?: [number, number];
  label?: string;
  /** Show indices under cells (default true). */
  showIndex?: boolean;
}

export interface GridState {
  cells: (number | string | null)[][];
  /** Keys are "r,c". */
  tones?: Record<string, Tone>;
  rowLabels?: string[];
  colLabels?: string[];
  label?: string;
}

export interface GraphNode {
  id: string;
  label?: string;
  /** Position in a 0..100 x 0..100 box. */
  x: number;
  y: number;
  /** Small text above the node (distance, rank, size…). */
  badge?: string;
}
export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
}
export interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed?: boolean;
  nodeTones?: Record<string, Tone>;
  /** Keys are "from->to" (also matched as "to->from" for undirected graphs). */
  edgeTones?: Record<string, Tone>;
  label?: string;
}

export interface BarsState {
  values: number[];
  labels?: string[];
  tones?: Record<number, Tone>;
  max?: number;
  label?: string;
  /** Format values as percentages. */
  percent?: boolean;
}

export interface PlotPoint {
  x: number;
  y: number;
  /** Cluster / class index -> colour. */
  c?: number;
  tone?: Tone;
  size?: number;
}
export interface PlotState {
  points?: PlotPoint[];
  /** Larger marked points (e.g. centroids). */
  marks?: PlotPoint[];
  lines?: { x1: number; y1: number; x2: number; y2: number; tone?: Tone; dashed?: boolean }[];
  xRange: [number, number];
  yRange: [number, number];
  label?: string;
}

export interface Frame {
  array?: ArrayState;
  /** Extra arrays drawn under the main one (e.g. prefix array, stack, tails, buckets). */
  arrays?: ArrayState[];
  grid?: GridState;
  graph?: GraphState;
  bars?: BarsState;
  plot?: PlotState;
  /** Variables panel, e.g. { lo: 0, hi: 9, mid: 4 }. */
  vars?: Record<string, string | number | boolean>;
  /** One short sentence explaining this step. Required. */
  note: string;
  /** 0-based line in `Simulation.code.lines` to highlight. */
  line?: number;
}

export interface Simulation {
  frames: Frame[];
  /** Optional pseudocode shown beside the visual. Keep it under ~14 lines. */
  code?: { lang: string; lines: string[] };
  /** Final one-line result, e.g. "found at index 5". */
  result?: string;
}

export type Simulator<I = Record<string, unknown>> = (input: I) => Simulation;
