import { z } from "zod";

/**
 * Interactive blocks are written in lessons as fenced code blocks whose language is the
 * block type and whose body is YAML. See docs/INTERACTIVE_BLOCKS.md.
 */
export const IX_TYPES = ["quiz", "predict", "order", "blanks", "cards", "estimate", "viz", "steps"] as const;
export type IxType = (typeof IX_TYPES)[number];

const md = z.string().min(1); // inline markdown

const quizQuestion = z
  .object({
    q: md,
    options: z.array(md).min(2).max(6),
    answer: z.union([z.number().int().min(0), z.array(z.number().int().min(0)).min(1)]),
    why: md,
  })
  .strict()
  .refine((v) => (Array.isArray(v.answer) ? v.answer : [v.answer]).every((a) => a < v.options.length), {
    message: "answer index is out of range of options (answers are 0-based)",
  });

export const quizSchema = z.union([
  quizQuestion,
  z.object({ questions: z.array(quizQuestion).min(1).max(8) }).strict(),
]);

export const predictSchema = z
  .object({
    prompt: md.optional(),
    lang: z.string().min(1),
    code: z.string().min(1),
    input: z.string().optional(),
    output: z.string(),
    why: md,
  })
  .strict();

export const orderSchema = z
  .object({
    prompt: md.optional(),
    lang: z.string().min(1),
    code: z.string().min(1),
    distractors: z.array(z.string()).max(4).default([]),
    why: md.optional(),
  })
  .strict()
  .refine((v) => v.code.trim().split("\n").length >= 3 && v.code.trim().split("\n").length <= 16, {
    message: "order blocks need 3 to 16 lines of code",
  });

export const blanksSchema = z
  .object({
    prompt: md.optional(),
    lang: z.string().min(1),
    code: z.string().refine((c) => /\[\[[^\]]+\]\]/.test(c), "blanks code needs at least one [[answer]]"),
    why: md.optional(),
  })
  .strict();

const card = z.object({ q: md, a: md }).strict();
export const cardsSchema = z.union([z.array(card).min(1).max(12), z.object({ cards: z.array(card).min(1).max(12) }).strict()]);

export const estimateSchema = z
  .object({
    q: md,
    answer: z.number().positive(),
    unit: z.string().optional(),
    tolerance: z.union([z.number().positive().max(10), z.literal("order")]).default(0.3),
    hint: md.optional(),
    solution: md,
  })
  .strict();

export const vizSchema = z
  .object({
    algo: z.string().min(1),
    input: z.record(z.string(), z.unknown()).default({}),
    editable: z.boolean().default(true),
    title: z.string().optional(),
  })
  .strict();

const tone = z.enum(["active", "compare", "done", "muted", "match", "bad", "focus"]);
const arrayFrame = z
  .object({
    arr: z.array(z.union([z.number(), z.string()])).min(1).max(24),
    pointers: z.record(z.string(), z.number().int()).optional(),
    highlight: z.record(z.string(), tone).optional(),
    window: z.tuple([z.number().int(), z.number().int()]).optional(),
    vars: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    note: z.string().min(1),
  })
  .strict();
const gridFrame = z
  .object({
    grid: z.array(z.array(z.union([z.number(), z.string(), z.null()]))).min(1).max(14),
    highlight: z.record(z.string(), tone).optional(), // keys "r,c"
    rowLabels: z.array(z.string()).optional(),
    colLabels: z.array(z.string()).optional(),
    vars: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
    note: z.string().min(1),
  })
  .strict();

export const stepsSchema = z
  .object({
    title: z.string().optional(),
    view: z.enum(["array", "grid"]).default("array"),
    frames: z.array(z.union([arrayFrame, gridFrame])).min(2).max(30),
  })
  .strict();

export const IX_SCHEMAS: Record<IxType, z.ZodType> = {
  quiz: quizSchema,
  predict: predictSchema,
  order: orderSchema,
  blanks: blanksSchema,
  cards: cardsSchema,
  estimate: estimateSchema,
  viz: vizSchema,
  steps: stepsSchema,
};

// ---- Payloads delivered to the client components (after build-time rendering) ----

export interface QuizPayload {
  id: string;
  questions: { id: string; qHtml: string; optionsHtml: string[]; answer: number[]; whyHtml: string }[];
}
export interface PredictPayload {
  id: string;
  promptHtml: string;
  lang: string;
  codeHtml: string;
  input?: string;
  output: string;
  whyHtml: string;
}
export interface OrderPayload {
  id: string;
  promptHtml: string;
  lang: string;
  lines: { text: string; html: string }[]; // correct order
  distractors: { text: string; html: string }[];
  whyHtml?: string;
}
export interface BlanksPayload {
  id: string;
  promptHtml: string;
  lang: string;
  parts: ({ kind: "text"; text: string } | { kind: "blank"; answers: string[] })[];
  whyHtml?: string;
}
export interface CardsPayload {
  id: string;
  cards: { id: string; qHtml: string; aHtml: string }[];
}
export interface EstimatePayload {
  id: string;
  qHtml: string;
  answer: number;
  unit?: string;
  tolerance: number | "order";
  hintHtml?: string;
  solutionHtml: string;
}
export interface VizPayload {
  id: string;
  algo: string;
  input: Record<string, unknown>;
  editable: boolean;
  title?: string;
}
export interface StepsPayload {
  id: string;
  title?: string;
  view: "array" | "grid";
  frames: z.infer<typeof stepsSchema>["frames"];
}
