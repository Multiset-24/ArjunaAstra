import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { Card, Catalog, Lesson, ProblemRef } from "./types";

/**
 * Reads the compiled content produced by `npm run content` (scripts/content.ts) from .content/.
 * Uses synchronous reads on purpose: with Cache Components, fs.readFileSync results are part of
 * the static shell, so every lesson page is fully prerendered at build time.
 */
const DIR = path.join(process.cwd(), ".content");

function read<T>(rel: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, rel), "utf8")) as T;
  } catch {
    return null;
  }
}

const EMPTY: Catalog = { generatedAt: "", tracks: [], lessons: {}, search: [] };

export function getCatalog(): Catalog {
  return read<Catalog>("catalog.json") ?? EMPTY;
}

export function getTrack(trackId: string) {
  return getCatalog().tracks.find((t) => t.id === trackId) ?? null;
}

export function getLesson(trackId: string, slug: string): Lesson | null {
  if (!/^[a-z0-9-]+$/.test(trackId) || !/^[a-z0-9-]+$/.test(slug)) return null;
  return read<Lesson>(`lessons/${trackId}/${slug}.json`);
}

export function getAllCards(): Card[] {
  return read<Card[]>("cards.json") ?? [];
}

export function getAllProblems(): Record<string, ProblemRef & { lessons: string[] }> {
  return read<Record<string, ProblemRef & { lessons: string[] }>>("problems.json") ?? {};
}

export function lessonHref(lessonId: string) {
  return `/learn/${lessonId}`;
}
