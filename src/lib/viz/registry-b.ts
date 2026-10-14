/** Frames simulators owned by the viz-b agent (system design + AI). */
import type { Simulator } from "./types";
import { bpe } from "./sims-b/bpe";
import { kmeans } from "./sims-b/kmeans";
import { loadBalancer } from "./sims-b/load-balancer";
import { lruCache } from "./sims-b/lru-cache";
import { tokenBucket } from "./sims-b/token-bucket";

export const FRAMES_B: Record<string, Simulator<never>> = {
  "lru-cache": lruCache as Simulator<never>,
  "token-bucket": tokenBucket as Simulator<never>,
  "load-balancer": loadBalancer as Simulator<never>,
  kmeans: kmeans as Simulator<never>,
  bpe: bpe as Simulator<never>,
};
