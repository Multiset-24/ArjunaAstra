import fs from "node:fs";
import path from "node:path";
import { getProblemset } from "@/lib/cf/ladder";

/** Live (or snapshot) name/rating/tags for every Codeforces problem used in lessons. */
export async function GET() {
  const ps = await getProblemset();
  let keys: string[] = [];
  try {
    const all = JSON.parse(fs.readFileSync(path.join(process.cwd(), ".content/problems.json"), "utf8")) as Record<string, { platform: string }>;
    keys = Object.keys(all).filter((k) => k.startsWith("cf:"));
  } catch {}
  const byId = new Map(ps.problems.map((p) => [`cf:${p[0]}${p[1]}`, p]));
  const meta: Record<string, { name: string; rating: number; tags: string[] }> = {};
  for (const k of keys) {
    const p = byId.get(k);
    if (p) meta[k] = { name: p[2], rating: p[3], tags: p[5] };
  }
  return Response.json({ source: ps.source, fetchedAt: ps.fetchedAt, meta });
}
