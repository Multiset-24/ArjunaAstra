/** npm run data:cf — refresh data/codeforces/problemset.json from the public Codeforces API. */
import fs from "node:fs";
import path from "node:path";

(async () => {
  const res = await fetch("https://codeforces.com/api/problemset.problems", { signal: AbortSignal.timeout(30_000) });
  const body = await res.json();
  if (body.status !== "OK") throw new Error(body.comment ?? "Codeforces API error");
  const solved = new Map<string, number>(body.result.problemStatistics.map((s: { contestId: number; index: string; solvedCount: number }) => [`${s.contestId}${s.index}`, s.solvedCount]));
  const problems = body.result.problems
    .filter((p: { contestId?: number }) => p.contestId)
    .map((p: { contestId: number; index: string; name: string; rating?: number; tags: string[] }) => [p.contestId, p.index, p.name, p.rating ?? 0, solved.get(`${p.contestId}${p.index}`) ?? 0, p.tags]);
  const out = { source: "https://codeforces.com/api/problemset.problems", fetchedAt: new Date().toISOString(), fields: ["contestId", "index", "name", "rating", "solvedCount", "tags"], problems };
  fs.writeFileSync(path.join(__dirname, "../data/codeforces/problemset.json"), JSON.stringify(out));
  console.log(`saved ${problems.length} problems`);
})().catch((e) => {
  console.error("data:cf failed:", e.message);
  process.exit(1);
});
