import { z } from "zod";

/** Sync events sent from the browser to /api/me/events (last write wins by `at`). */
const key = z.string().min(1).max(200);
const at = z.number().int().nonnegative();
export const eventSchema = z.discriminatedUnion("t", [
  z.object({ t: z.literal("lesson"), key, done: z.boolean(), at }),
  z.object({ t: z.literal("problem"), key, status: z.enum(["solved", "tried", "skip", "none"]), source: z.enum(["manual", "cf"]), at }),
  z.object({ t: z.literal("quiz"), key, correct: z.boolean(), attempts: z.number().int().min(1).max(10000), at }),
  z.object({
    t: z.literal("card"),
    key,
    ease: z.number(),
    interval: z.number(),
    reps: z.number().int(),
    lapses: z.number().int(),
    due: z.number(),
    at,
  }),
  z.object({ t: z.literal("note"), key, body: z.string().max(20000), at }),
  z.object({ t: z.literal("activity"), key: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), count: z.number().int().min(0).max(100000), at }),
  z.object({ t: z.literal("prefs"), prefs: z.record(z.string(), z.string()), at }),
  z.object({
    t: z.literal("cf"),
    handle: z.string().max(40).optional(),
    rating: z.number().int().optional(),
    maxRating: z.number().int().optional(),
    rank: z.string().max(40).optional(),
    syncedAt: z.number().optional(),
    at,
  }),
]);
export type SyncEvent = z.infer<typeof eventSchema>;
export const batchSchema = z.object({ events: z.array(eventSchema).max(2000) });
