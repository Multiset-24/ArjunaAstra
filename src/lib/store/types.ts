/**
 * Client progress store contract. Implemented by src/lib/store/progress.tsx
 * (<ProgressProvider> + useProgress()). Works logged-out (localStorage) and logged-in
 * (localStorage cache + server sync through /api/me/*).
 */
export type ProblemStatus = "solved" | "tried" | "skip";
export type CodeLang = "cpp" | "java";
export type Theme = "dark" | "paper";
export type LessonMode = "learn" | "read";

export interface SrsState {
  ease: number; // starts 2.5
  interval: number; // days
  reps: number;
  lapses: number;
  due: number; // epoch ms
}

export interface ProgressState {
  lessons: Record<string, { done: boolean; at: number }>;
  /** lessonId -> furthest section index reached (device-local). */
  sections: Record<string, number>;
  problems: Record<string, { status: ProblemStatus; at: number; source: "manual" | "cf" }>;
  quiz: Record<string, { correct: boolean; attempts: number; at: number }>;
  cards: Record<string, SrsState>;
  notes: Record<string, { text: string; at: number }>;
  /** "YYYY-MM-DD" -> number of meaningful actions that day (solves, lessons, reviews). */
  activity: Record<string, number>;
  prefs: { codeLang: CodeLang; theme: Theme; mode: LessonMode };
  cf: { handle?: string; rating?: number; maxRating?: number; rank?: string; syncedAt?: number };
}

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

/** 0 = again, 1 = hard, 2 = good, 3 = easy */
export type Grade = 0 | 1 | 2 | 3;

export interface ProgressApi {
  state: ProgressState;
  /** true once local state is loaded (and server state merged, when signed in). */
  ready: boolean;
  user: SessionUser | null;
  syncing: boolean;
  setLessonDone(lessonId: string, done: boolean): void;
  setSection(lessonId: string, index: number): void;
  setProblem(key: string, status: ProblemStatus | null): void;
  recordQuiz(blockId: string, correct: boolean): void;
  /** Adds cards to the review deck (due now) if they are not in it yet. */
  enrollCards(cardIds: string[]): void;
  gradeCard(cardId: string, grade: Grade): void;
  saveNote(lessonId: string, text: string): void;
  setPref<K extends keyof ProgressState["prefs"]>(key: K, value: ProgressState["prefs"][K]): void;
  /** Calls /api/cf/sync, marks solved Codeforces problems, stores rating. */
  syncCodeforces(handle: string): Promise<{ ok: boolean; message: string; solved?: number }>;
  exportData(): string;
  importData(json: string): boolean;
  resetLocal(): void;
}

export const EMPTY_STATE: ProgressState = {
  lessons: {},
  sections: {},
  problems: {},
  quiz: {},
  cards: {},
  notes: {},
  activity: {},
  prefs: { codeLang: "cpp", theme: "dark", mode: "learn" },
  cf: {},
};
