import type { Root } from "hast";

/** A practice problem referenced by a lesson. `key` is globally unique, e.g. "cf:279B". */
export interface ProblemRef {
  key: string;
  platform: "cf" | "lc" | "cses" | "other";
  id: string;
  name: string;
  url: string;
  /** Codeforces rating as written by the author (verified against the live API at runtime). */
  rating?: number;
  /** LeetCode difficulty. */
  difficulty?: "Easy" | "Medium" | "Hard";
  site?: string;
  core?: boolean;
  note?: string;
}

export interface Resource {
  title: string;
  url: string;
  note?: string;
}

export interface TocEntry {
  id: string;
  text: string;
  depth: 2 | 3;
}

export interface Card {
  id: string;
  lessonId: string;
  q: string;
  a: string;
}

export interface Section {
  id: string;
  title: string;
  hast: Root;
}

export interface Stage {
  id: string;
  title: string;
  goal: string;
  milestone?: string;
  lessons: string[];
}

export interface Track {
  id: string;
  title: string;
  short: string;
  tagline: string;
  description: string;
  target: string;
  order: number;
  codeLangs: string[];
  reality: string[];
  status: "live" | "soon";
  stages: Stage[];
  lessonCount: number;
  minutes: number;
}

export interface LessonMeta {
  id: string; // "<track>/<slug>"
  track: string;
  stage: string;
  slug: string;
  title: string;
  summary: string;
  minutes: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  rating?: [number, number];
  tags: string[];
  prereqs: string[];
  toc: TocEntry[];
  problemCount: number;
  interactiveCount: number;
  cardCount: number;
  prev?: string;
  next?: string;
}

export interface Lesson extends LessonMeta {
  sections: Section[];
  problems: ProblemRef[];
  exercises: string[]; // pre-rendered inline HTML
  resources: Resource[];
  cards: Card[];
}

export interface SearchEntry {
  id: string;
  title: string;
  summary: string;
  track: string;
  stage: string;
  tags: string[];
  headings: string[];
}

export interface Catalog {
  generatedAt: string;
  tracks: Track[];
  lessons: Record<string, LessonMeta>;
  search: SearchEntry[];
}
