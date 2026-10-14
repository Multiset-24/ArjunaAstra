import { sql } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { CfError, cfCall } from "@/lib/cf/client";
import type { CfSyncResult } from "@/lib/cf/types";
import { getDb, schema } from "@/lib/db";

const cache = new Map<string, { at: number; data: CfSyncResult }>();
const HANDLE = /^[A-Za-z0-9_.-]{3,24}$/;

interface Sub {
  verdict?: string;
  problem: { contestId?: number; index: string };
}
interface UserInfo {
  handle: string;
  rating?: number;
  maxRating?: number;
  rank?: string;
}

async function fetchHandle(handle: string): Promise<CfSyncResult> {
  const hit = cache.get(handle.toLowerCase());
  if (hit && Date.now() - hit.at < 60_000) return hit.data;
  const [info] = await cfCall<UserInfo[]>("user.info", { handles: handle });
  const subs = await cfCall<Sub[]>("user.status", { handle: info.handle, from: "1", count: "100000" }, 20_000);
  const solved = new Set<string>();
  const tried = new Set<string>();
  for (const s of subs) {
    const c = s.problem.contestId;
    if (!c || c >= 100000) continue;
    const key = `cf:${c}${s.problem.index}`;
    if (s.verdict === "OK") solved.add(key);
    else tried.add(key);
  }
  for (const k of solved) tried.delete(k);
  const data: CfSyncResult = { handle: info.handle, rating: info.rating, maxRating: info.maxRating, rank: info.rank, solved: [...solved], tried: [...tried] };
  cache.set(handle.toLowerCase(), { at: Date.now(), data });
  return data;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { handle?: string };
  const handle = String(body.handle ?? "").trim();
  if (!HANDLE.test(handle)) return Response.json({ error: "That doesn't look like a Codeforces handle." }, { status: 400 });
  let data: CfSyncResult;
  try {
    data = await fetchHandle(handle);
  } catch (e) {
    const msg = e instanceof CfError ? e.message : "Couldn't reach Codeforces right now. Try again in a minute.";
    return Response.json({ error: msg.includes("not found") ? `Handle "${handle}" was not found on Codeforces.` : msg }, { status: 502 });
  }
  const user = await getSessionUser(req.headers);
  if (user) {
    const db = getDb();
    const now = Date.now();
    const t = schema.problemProgress;
    for (let i = 0; i < data.solved.length; i += 200) {
      const rows = data.solved.slice(i, i + 200).map((key) => ({ userId: user.id, key, at: now, status: "solved", source: "cf" }));
      await db.insert(t).values(rows).onConflictDoUpdate({ target: [t.userId, t.key], set: { status: "solved", source: "cf", at: now }, setWhere: sql`${t.status} <> 'solved'` });
    }
    const p = schema.profile;
    const v = { cfHandle: data.handle, cfRating: data.rating ?? null, cfMaxRating: data.maxRating ?? null, cfRank: data.rank ?? null, cfSyncedAt: now };
    await db.insert(p).values({ userId: user.id, at: 0, ...v }).onConflictDoUpdate({ target: p.userId, set: v });
  }
  return Response.json(data);
}
