import { z } from "zod";

/**
 * The catalog of visualizers a lesson can embed with a ```viz block.
 *
 * kind "frames": a pure simulator turns `input` into step-by-step frames that the shared
 *                Player renders (array / grid / graph / bars / plot views).
 * kind "widget": a free-form interactive component (sliders, drag, toggles).
 *
 * Inputs are validated at build time, and again in the browser when a learner edits them,
 * so the limits below double as guard rails for "try your own input".
 */

const int = z.number().int();
const smallArr = (min = 1, max = 16) => z.array(int.min(-999).max(999)).min(min).max(max);
const edge = z.tuple([int.min(0), int.min(0)]);
const wedge = z.tuple([int.min(0), int.min(0), int.min(0).max(999)]);
const sorted = (a: number[]) => a.every((v, i) => i === 0 || a[i - 1] <= v);

export interface VizSpec {
  title: string;
  kind: "frames" | "widget";
  track: "dsa" | "system-design" | "ai" | "lld";
  summary: string;
  input: z.ZodType;
  example: Record<string, unknown>;
}

export const VIZ = {
  // ---------------- DSA ----------------
  complexity: {
    title: "Will it pass? (complexity vs n)",
    kind: "widget",
    track: "dsa",
    summary: "Slide n and compare operation counts of O(1)…O(2^n) against a ~10^8 ops/second budget.",
    input: z.object({ n: int.min(1).max(1_000_000_000).default(100_000) }).strict(),
    example: { n: 200000 },
  },
  "binary-search": {
    title: "Binary search",
    kind: "frames",
    track: "dsa",
    summary: "lo / mid / hi on a sorted array. mode lower_bound finds the first index with a[i] >= target.",
    input: z
      .object({
        arr: smallArr(1, 16).refine(sorted, "arr must be sorted"),
        target: int.min(-999).max(999),
        mode: z.enum(["exact", "lower_bound"]).default("exact"),
      })
      .strict(),
    example: { arr: [2, 5, 8, 12, 16, 23, 38, 56, 72, 91], target: 23, mode: "exact" },
  },
  "binary-search-answer": {
    title: "Binary search on the answer",
    kind: "frames",
    track: "dsa",
    summary: "Minimum ship capacity to deliver weights within `days`: search capacity with a monotonic check.",
    input: z.object({ weights: smallArr(1, 12).refine((a) => a.every((x) => x > 0), "weights must be positive"), days: int.min(1).max(12) }).strict(),
    example: { weights: [3, 2, 2, 4, 1, 4], days: 3 },
  },
  "two-pointers": {
    title: "Two pointers: pair with target sum",
    kind: "frames",
    track: "dsa",
    summary: "L and R walk inward on a sorted array until a[L] + a[R] = target.",
    input: z.object({ arr: smallArr(2, 16).refine(sorted, "arr must be sorted"), target: int.min(-1998).max(1998) }).strict(),
    example: { arr: [1, 2, 4, 7, 11, 15], target: 15 },
  },
  "sliding-window": {
    title: "Sliding window",
    kind: "frames",
    track: "dsa",
    summary: "fixed: best sum of k consecutive items. variable: shortest window with sum >= s (positive values).",
    input: z
      .object({
        arr: smallArr(1, 16),
        mode: z.enum(["fixed", "variable"]).default("fixed"),
        k: int.min(1).max(16).optional(),
        s: int.min(1).max(9999).optional(),
      })
      .strict(),
    example: { arr: [2, 1, 5, 1, 3, 2], mode: "fixed", k: 3 },
  },
  "prefix-sum": {
    title: "Prefix sums",
    kind: "frames",
    track: "dsa",
    summary: "Build p[i] = a[0] + … + a[i-1], then answer sum(l..r) = p[r+1] − p[l] in O(1).",
    input: z.object({ arr: smallArr(1, 12), queries: z.array(edge).max(4).default([]) }).strict(),
    example: { arr: [3, 1, 4, 1, 5, 9, 2, 6], queries: [[2, 5], [0, 3]] },
  },
  kadane: {
    title: "Kadane's maximum subarray",
    kind: "frames",
    track: "dsa",
    summary: "Keep the best sum ending here; restart when it drops below zero.",
    input: z.object({ arr: smallArr(1, 14) }).strict(),
    example: { arr: [-2, 1, -3, 4, -1, 2, 1, -5, 4] },
  },
  "monotonic-stack": {
    title: "Monotonic stack: next greater element",
    kind: "frames",
    track: "dsa",
    summary: "A decreasing stack of indices; each pop finds its next greater element.",
    input: z.object({ arr: smallArr(1, 14) }).strict(),
    example: { arr: [2, 1, 2, 4, 3, 1, 5] },
  },
  "merge-sort": {
    title: "Merge sort",
    kind: "frames",
    track: "dsa",
    summary: "Split in halves, sort each, merge two sorted halves with two pointers.",
    input: z.object({ arr: smallArr(1, 12) }).strict(),
    example: { arr: [38, 27, 43, 3, 9, 82, 10] },
  },
  "recursion-tree": {
    title: "Recursion tree",
    kind: "frames",
    track: "dsa",
    summary: "Watch calls branch for fib(n) or subsets; turn memo on to see repeated work disappear.",
    input: z
      .object({ fn: z.enum(["fib", "subsets"]).default("fib"), n: int.min(1).max(6), memo: z.boolean().default(false) })
      .strict(),
    example: { fn: "fib", n: 5, memo: false },
  },
  bits: {
    title: "Bit playground",
    kind: "widget",
    track: "dsa",
    summary: "Toggle bits of a and b; see AND, OR, XOR, shifts, lowbit and popcount live.",
    input: z.object({ a: int.min(0).max(255).default(12), b: int.min(0).max(255).default(10) }).strict(),
    example: { a: 12, b: 10 },
  },
  "hash-table": {
    title: "Hash table with chaining",
    kind: "frames",
    track: "dsa",
    summary: "Insert keys into buckets by key mod size; collisions chain in a list.",
    input: z.object({ keys: smallArr(1, 12).refine((a) => a.every((x) => x >= 0), "keys must be >= 0"), size: int.min(2).max(11).default(7) }).strict(),
    example: { keys: [15, 11, 27, 8, 12, 22, 4], size: 7 },
  },
  heap: {
    title: "Binary heap (min-heap)",
    kind: "frames",
    track: "dsa",
    summary: "push sifts up, pop moves the last leaf to the root and sifts down.",
    input: z
      .object({ ops: z.array(z.string().regex(/^(push -?\d{1,3}|pop)$/, 'ops look like "push 5" or "pop"')).min(1).max(14) })
      .strict(),
    example: { ops: ["push 5", "push 3", "push 8", "push 1", "pop", "push 2", "pop"] },
  },
  "grid-bfs": {
    title: "BFS on a grid",
    kind: "frames",
    track: "dsa",
    summary: "Shortest path from S to T; '#' is a wall. The frontier grows one layer at a time.",
    input: z
      .object({
        grid: z
          .array(z.string().regex(/^[.#ST]+$/, "use . # S T"))
          .min(2)
          .max(10)
          .refine((g) => g.every((r) => r.length === g[0].length), "rows must have equal length")
          .refine((g) => g.join("").split("S").length === 2 && g.join("").split("T").length === 2, "need exactly one S and one T"),
      })
      .strict(),
    example: { grid: ["S..#....", ".#.#.##.", ".#...#..", ".####.#.", "......#T"] },
  },
  "graph-traversal": {
    title: "Graph traversal (BFS / DFS)",
    kind: "frames",
    track: "dsa",
    summary: "Visit order, queue/stack contents and the traversal tree on a small graph.",
    input: z
      .object({
        n: int.min(2).max(10),
        edges: z.array(edge).min(1).max(18),
        start: int.min(0).default(0),
        mode: z.enum(["bfs", "dfs"]).default("bfs"),
        directed: z.boolean().default(false),
      })
      .strict(),
    example: { n: 7, edges: [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [4, 6], [5, 6]], start: 0, mode: "bfs" },
  },
  dijkstra: {
    title: "Dijkstra's shortest paths",
    kind: "frames",
    track: "dsa",
    summary: "Pop the closest unfinished node, relax its edges; distances only decrease.",
    input: z
      .object({ n: int.min(2).max(9), edges: z.array(wedge).min(1).max(16), start: int.min(0).default(0), directed: z.boolean().default(false) })
      .strict(),
    example: { n: 6, edges: [[0, 1, 7], [0, 2, 9], [0, 5, 14], [1, 2, 10], [1, 3, 15], [2, 3, 11], [2, 5, 2], [3, 4, 6], [4, 5, 9]], start: 0 },
  },
  "topo-sort": {
    title: "Topological sort (Kahn)",
    kind: "frames",
    track: "dsa",
    summary: "Repeatedly take a node with in-degree 0; if some remain, there is a cycle.",
    input: z.object({ n: int.min(2).max(10), edges: z.array(edge).min(1).max(18) }).strict(),
    example: { n: 6, edges: [[5, 2], [5, 0], [4, 0], [4, 1], [2, 3], [3, 1]] },
  },
  dsu: {
    title: "Disjoint set union",
    kind: "frames",
    track: "dsa",
    summary: "union by size + path compression; watch the forest flatten.",
    input: z.object({ n: int.min(2).max(10), unions: z.array(edge).min(1).max(12), find: z.array(int.min(0)).max(4).default([]) }).strict(),
    example: { n: 8, unions: [[0, 1], [2, 3], [1, 3], [4, 5], [6, 7], [5, 7], [3, 7]], find: [0] },
  },
  "dp-grid": {
    title: "DP table filling",
    kind: "frames",
    track: "dsa",
    summary: "lcs, edit-distance, knapsack (0/1) or grid-paths: each cell from already-solved neighbours.",
    input: z
      .object({
        mode: z.enum(["lcs", "edit-distance", "knapsack", "grid-paths"]),
        a: z.string().max(8).optional(),
        b: z.string().max(8).optional(),
        weights: smallArr(1, 6).optional(),
        values: smallArr(1, 6).optional(),
        capacity: int.min(1).max(10).optional(),
        grid: z.array(z.string().regex(/^[.#]+$/)).max(7).optional(),
      })
      .strict(),
    example: { mode: "lcs", a: "ABCBDAB", b: "BDCAB" },
  },
  lis: {
    title: "LIS in O(n log n)",
    kind: "frames",
    track: "dsa",
    summary: "tails[k] = smallest tail of an increasing subsequence of length k+1; binary-search each value.",
    input: z.object({ arr: smallArr(1, 14) }).strict(),
    example: { arr: [10, 9, 2, 5, 3, 7, 101, 18] },
  },
  "segment-tree": {
    title: "Segment tree (range sum)",
    kind: "frames",
    track: "dsa",
    summary: "Build bottom-up, then see which nodes a query touches and which an update changes.",
    input: z
      .object({
        arr: smallArr(1, 8),
        queries: z.array(edge).max(3).default([]),
        updates: z.array(z.tuple([int.min(0), int.min(-999).max(999)])).max(2).default([]),
      })
      .strict(),
    example: { arr: [5, 8, 6, 3, 2, 7, 2, 6], queries: [[2, 6]], updates: [[3, 10]] },
  },
  sieve: {
    title: "Sieve of Eratosthenes",
    kind: "frames",
    track: "dsa",
    summary: "Cross out multiples of each prime p starting from p*p.",
    input: z.object({ n: int.min(10).max(100) }).strict(),
    example: { n: 50 },
  },
  "prefix-function": {
    title: "Prefix function (KMP)",
    kind: "frames",
    track: "dsa",
    summary: "pi[i] = length of the longest proper border of s[0..i]; fall back through pi on mismatch.",
    input: z.object({ s: z.string().min(1).max(16).regex(/^[a-z#$]+$/) }).strict(),
    example: { s: "aabaaab" },
  },

  // ---------------- System design ----------------
  "consistent-hashing": {
    title: "Consistent hashing ring",
    kind: "widget",
    track: "system-design",
    summary: "Add or remove servers and virtual nodes; see how few keys move.",
    input: z.object({ servers: int.min(1).max(8).default(3), vnodes: int.min(1).max(12).default(3), keys: int.min(4).max(40).default(24) }).strict(),
    example: { servers: 3, vnodes: 3, keys: 24 },
  },
  "lru-cache": {
    title: "LRU cache",
    kind: "frames",
    track: "system-design",
    summary: "get/put on a hash map + doubly linked list; the least recently used entry is evicted.",
    input: z
      .object({
        capacity: int.min(1).max(6),
        ops: z.array(z.string().regex(/^(get \w+|put \w+ \w+)$/, 'ops look like "put a 1" or "get a"')).min(1).max(14),
      })
      .strict(),
    example: { capacity: 3, ops: ["put a 1", "put b 2", "put c 3", "get a", "put d 4", "get b", "get c"] },
  },
  "token-bucket": {
    title: "Token bucket rate limiter",
    kind: "frames",
    track: "system-design",
    summary: "Tokens refill at a fixed rate up to capacity; a request passes only if a token is available.",
    input: z
      .object({
        capacity: int.min(1).max(10),
        refillPerSec: z.number().positive().max(10),
        requests: z.array(z.number().min(0).max(20)).min(1).max(20),
      })
      .strict(),
    example: { capacity: 3, refillPerSec: 1, requests: [0, 0.2, 0.4, 0.6, 1.5, 2.1, 2.2, 4, 4.1, 4.2] },
  },
  "load-balancer": {
    title: "Load balancing strategies",
    kind: "frames",
    track: "system-design",
    summary: "round-robin vs least-connections on requests with different durations.",
    input: z
      .object({
        servers: int.min(2).max(5),
        strategy: z.enum(["round-robin", "least-connections"]),
        requests: z.array(z.tuple([z.number().min(0).max(20), z.number().min(0.5).max(10)])).min(2).max(14),
      })
      .strict(),
    example: { servers: 3, strategy: "least-connections", requests: [[0, 6], [0.5, 1], [1, 1], [1.5, 5], [2, 1], [2.5, 1], [3, 2]] },
  },

  // ---------------- AI ----------------
  "gradient-descent": {
    title: "Gradient descent on a line fit",
    kind: "widget",
    track: "ai",
    summary: "Fit y = wx + b by stepping against the gradient of MSE; try a learning rate that is too big.",
    input: z.object({ lr: z.number().positive().max(2).default(0.1), points: int.min(5).max(40).default(16), noise: z.number().min(0).max(3).default(0.6) }).strict(),
    example: { lr: 0.1, points: 16, noise: 0.6 },
  },
  softmax: {
    title: "Softmax and temperature",
    kind: "widget",
    track: "ai",
    summary: "Edit logits and temperature; watch probabilities sharpen or flatten.",
    input: z
      .object({
        logits: z.array(z.number().min(-10).max(10)).min(2).max(6).default([2, 1, 0.5, -1]),
        labels: z.array(z.string().max(10)).max(6).optional(),
        temperature: z.number().positive().max(5).default(1),
      })
      .strict(),
    example: { logits: [2.0, 1.0, 0.5, -1.0], labels: ["cat", "dog", "fox", "car"], temperature: 1 },
  },
  kmeans: {
    title: "k-means clustering",
    kind: "frames",
    track: "ai",
    summary: "Alternate: assign each point to the nearest centroid, move centroids to the mean.",
    input: z.object({ k: int.min(2).max(5), points: int.min(10).max(60).default(30), seed: int.min(1).max(9999).default(7) }).strict(),
    example: { k: 3, points: 30, seed: 7 },
  },
  attention: {
    title: "Self-attention heatmap",
    kind: "widget",
    track: "ai",
    summary: "Toy query/key vectors per token; softmax(QK^T/sqrt(d)) as a heatmap you can hover.",
    input: z.object({ sentence: z.string().min(3).max(60).default("the cat sat on the mat") }).strict(),
    example: { sentence: "the animal didn't cross the street because it was tired" },
  },
  bpe: {
    title: "Byte-pair encoding",
    kind: "frames",
    track: "ai",
    summary: "Repeatedly merge the most frequent adjacent pair; watch a vocabulary form.",
    input: z.object({ text: z.string().min(3).max(80), merges: int.min(1).max(12).default(6) }).strict(),
    example: { text: "low lower lowest newer wider", merges: 8 },
  },
  cosine: {
    title: "Vectors, dot product and cosine",
    kind: "widget",
    track: "ai",
    summary: "Drag two 2-D vectors; see dot product, lengths and cosine similarity.",
    input: z.object({ a: z.tuple([z.number(), z.number()]).default([3, 1]), b: z.tuple([z.number(), z.number()]).default([1, 2]) }).strict(),
    example: { a: [3, 1], b: [1, 2] },
  },
  neuron: {
    title: "A single neuron",
    kind: "widget",
    track: "ai",
    summary: "Inputs × weights + bias → activation. Try sigmoid, tanh and ReLU.",
    input: z
      .object({
        inputs: z.array(z.number().min(-5).max(5)).min(1).max(4).default([1, 0.5]),
        weights: z.array(z.number().min(-5).max(5)).min(1).max(4).default([0.8, -0.4]),
        bias: z.number().min(-5).max(5).default(0.1),
        activation: z.enum(["sigmoid", "tanh", "relu"]).default("sigmoid"),
      })
      .strict(),
    example: { inputs: [1, 0.5], weights: [0.8, -0.4], bias: 0.1, activation: "sigmoid" },
  },
} satisfies Record<string, VizSpec>;

export type VizName = keyof typeof VIZ;
export const VIZ_NAMES = Object.keys(VIZ) as VizName[];

export function validateVizInput(algo: string, input: unknown): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  const spec = (VIZ as Record<string, VizSpec>)[algo];
  if (!spec) return { ok: false, error: `unknown viz "${algo}". Known: ${VIZ_NAMES.join(", ")}` };
  const r = spec.input.safeParse(input ?? {});
  if (!r.success) return { ok: false, error: z.prettifyError(r.error) };
  return { ok: true, value: r.data as Record<string, unknown> };
}
