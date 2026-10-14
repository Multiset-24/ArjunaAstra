import "server-only";
import fs from "node:fs";
import path from "node:path";
import { cacheLife } from "next/cache";
import { cfCall } from "./client";
import type { CfRow, Ladder, Problemset } from "./types";

function readSnapshot(): Problemset {
  const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/codeforces/problemset.json"), "utf8"));
  return { source: "snapshot", fetchedAt: raw.fetchedAt, problems: raw.problems };
}

interface ApiProblems {
  problems: { contestId?: number; index: string; name: string; rating?: number; tags: string[] }[];
  problemStatistics: { contestId?: number; index: string; solvedCount: number }[];
}

/** Live problem set (cached for a day), falling back to the bundled snapshot. */
export async function getProblemset(): Promise<Problemset> {
  "use cache";
  cacheLife("days");
  try {
    const r = await cfCall<ApiProblems>("problemset.problems", {}, 15_000);
    const solved = new Map(r.problemStatistics.map((s) => [`${s.contestId}${s.index}`, s.solvedCount]));
    const problems: CfRow[] = r.problems
      .filter((p) => p.contestId)
      .map((p) => [p.contestId!, p.index, p.name, p.rating ?? 0, solved.get(`${p.contestId}${p.index}`) ?? 0, p.tags]);
    return { source: "live", fetchedAt: new Date().toISOString(), problems };
  } catch {
    return readSnapshot();
  }
}

/** Rating ladder 800–2400: the most-solved problems per rung, at most one per contest. */
export function buildLadder(ps: Problemset, perRung = 40): Ladder {
  const rungs: Ladder["rungs"] = [];
  const tagCount = new Map<string, number>();
  for (let r = 800; r <= 2400; r += 100) {
    const pool = ps.problems.filter((p) => p[3] === r && !p[5].includes("*special")).sort((a, b) => b[4] - a[4]);
    const used = new Set<number>();
    const pick: CfRow[] = [];
    for (const p of pool) {
      if (used.has(p[0])) continue;
      used.add(p[0]);
      pick.push(p);
      if (pick.length >= perRung) break;
    }
    pick.forEach((p) => p[5].forEach((t) => tagCount.set(t, (tagCount.get(t) ?? 0) + 1)));
    rungs.push({ rating: r, problems: pick });
  }
  const tags = [...tagCount.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  return { source: ps.source, fetchedAt: ps.fetchedAt, rungs, tags };
}
