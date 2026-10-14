import { z } from "zod";

/** Codeforces problem id: contest number + index, e.g. 4A, 1352C, 1679D1. */
export const CF_ID = /^[1-9]\d{0,4}[A-Z][1-9]?$/;
/** LeetCode slug, e.g. two-sum. */
export const LC_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const cfProblem = z
  .object({
    cf: z.string().regex(CF_ID, "Codeforces id looks like 279B or 1352C"),
    name: z.string().min(1),
    rating: z.number().int().min(800).max(3500).multipleOf(100).optional(),
    core: z.boolean().optional(),
    note: z.string().max(140).optional(),
  })
  .strict();

const lcProblem = z
  .object({
    lc: z.string().regex(LC_SLUG, "LeetCode slug looks like two-sum"),
    name: z.string().min(1),
    difficulty: z.enum(["Easy", "Medium", "Hard"]),
    core: z.boolean().optional(),
    note: z.string().max(140).optional(),
  })
  .strict();

const csesProblem = z
  .object({
    cses: z.number().int().min(1000).max(9999),
    name: z.string().min(1),
    core: z.boolean().optional(),
    note: z.string().max(140).optional(),
  })
  .strict();

const otherProblem = z
  .object({
    url: z.url(),
    name: z.string().min(1),
    site: z.string().min(1),
    core: z.boolean().optional(),
    note: z.string().max(140).optional(),
  })
  .strict();

export const problemSchema = z.union([cfProblem, lcProblem, csesProblem, otherProblem]);
export type ProblemInput = z.infer<typeof problemSchema>;

export const frontmatterSchema = z
  .object({
    title: z.string().min(2).max(70),
    summary: z.string().min(10).max(170),
    minutes: z.number().int().min(3).max(120),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    rating: z
      .tuple([z.number().int().min(800).max(3500), z.number().int().min(800).max(3500)])
      .optional(),
    tags: z.array(z.string().min(1)).max(8).default([]),
    prereqs: z.array(z.string().min(1)).max(6).default([]),
    slug: z.string().regex(LC_SLUG).optional(),
    problems: z.array(problemSchema).max(20).default([]),
    exercises: z.array(z.string().min(5)).max(10).default([]),
    resources: z
      .array(
        z
          .object({ title: z.string().min(2), url: z.url(), note: z.string().max(140).optional() })
          .strict(),
      )
      .max(8)
      .default([]),
  })
  .strict();
export type Frontmatter = z.infer<typeof frontmatterSchema>;

export const trackSchema = z
  .object({
    id: z.string().regex(LC_SLUG),
    title: z.string(),
    short: z.string(),
    tagline: z.string(),
    description: z.string(),
    target: z.string(),
    order: z.number().int(),
    codeLangs: z.array(z.string()),
    reality: z.array(z.string()).min(1),
    /** "soon" hides the lessons and shows the track as coming soon. */
    status: z.enum(["live", "soon"]).default("live"),
    stages: z
      .array(
        z
          .object({
            id: z.string().regex(LC_SLUG),
            title: z.string(),
            goal: z.string(),
            milestone: z.string().optional(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
export type TrackInput = z.infer<typeof trackSchema>;
