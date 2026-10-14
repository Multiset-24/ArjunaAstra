import type { Simulator } from "./types";
import { FRAMES_B } from "./registry-b";
import { binarySearch } from "./sims/binary-search";
import { binarySearchAnswer } from "./sims/binary-search-answer";
import { twoPointers } from "./sims/two-pointers";
import { slidingWindow } from "./sims/sliding-window";
import { prefixSum } from "./sims/prefix-sum";
import { kadane } from "./sims/kadane";
import { monotonicStack } from "./sims/monotonic-stack";
import { mergeSort } from "./sims/merge-sort";
import { recursionTree } from "./sims/recursion-tree";
import { hashTable } from "./sims/hash-table";
import { heap } from "./sims/heap";
import { gridBfs } from "./sims/grid-bfs";
import { graphTraversal } from "./sims/graph-traversal";
import { dijkstra } from "./sims/dijkstra";
import { topoSort } from "./sims/topo-sort";
import { dsu } from "./sims/dsu";
import { dpGrid } from "./sims/dp-grid";
import { lis } from "./sims/lis";
import { segmentTree } from "./sims/segment-tree";
import { sieve } from "./sims/sieve";
import { prefixFunction } from "./sims/prefix-function";

/**
 * Every "frames" visualizer: the DSA simulators in ./sims plus the system-design / AI ones from
 * ./registry-b. Inputs are validated by validateVizInput() before a simulator runs.
 * Simulators may throw an Error with a readable message for input the schema cannot reject.
 */
export const FRAMES: Record<string, Simulator<never>> = {
  "binary-search": binarySearch,
  "binary-search-answer": binarySearchAnswer,
  "two-pointers": twoPointers,
  "sliding-window": slidingWindow,
  "prefix-sum": prefixSum,
  kadane,
  "monotonic-stack": monotonicStack,
  "merge-sort": mergeSort,
  "recursion-tree": recursionTree,
  "hash-table": hashTable,
  heap,
  "grid-bfs": gridBfs,
  "graph-traversal": graphTraversal,
  dijkstra,
  "topo-sort": topoSort,
  dsu,
  "dp-grid": dpGrid,
  lis,
  "segment-tree": segmentTree,
  sieve,
  "prefix-function": prefixFunction,
  ...FRAMES_B,
};
