import type { z } from "zod";
import type { VIZ } from "../catalog";

/** Validated (zod output) input type of a catalog entry. */
export type In<K extends keyof typeof VIZ> = z.output<(typeof VIZ)[K]["input"]>;

/** Semantic input errors (things the schema cannot express). The Viz component shows the message. */
export function fail(message: string): never {
  throw new Error(message);
}

export const INF = "∞";
