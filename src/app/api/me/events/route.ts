import { sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";
import { batchSchema } from "@/lib/progress-events";

export async function POST(req: Request) {
  const user = await getSessionUser(req.headers);
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: z.prettifyError(parsed.error) }, { status: 400 });
  const db = getDb();
  const userId = user.id;
  const newer = (t: { at: unknown }) => sql`excluded.at > ${t.at}`;

  for (const e of parsed.data.events) {
    switch (e.t) {
      case "lesson": {
        const t = schema.lessonProgress;
        await db.insert(t).values({ userId, key: e.key, at: e.at, done: e.done }).onConflictDoUpdate({ target: [t.userId, t.key], set: { done: e.done, at: e.at }, setWhere: newer(t) });
        break;
      }
      case "problem": {
        const t = schema.problemProgress;
        await db
          .insert(t)
          .values({ userId, key: e.key, at: e.at, status: e.status, source: e.source })
          .onConflictDoUpdate({ target: [t.userId, t.key], set: { status: e.status, source: e.source, at: e.at }, setWhere: newer(t) });
        break;
      }
      case "quiz": {
        const t = schema.quizResult;
        await db
          .insert(t)
          .values({ userId, key: e.key, at: e.at, correct: e.correct, attempts: e.attempts })
          .onConflictDoUpdate({ target: [t.userId, t.key], set: { correct: e.correct, attempts: e.attempts, at: e.at }, setWhere: newer(t) });
        break;
      }
      case "card": {
        const t = schema.reviewCard;
        const v = { ease: e.ease, interval: e.interval, reps: e.reps, lapses: e.lapses, due: e.due, at: e.at };
        await db.insert(t).values({ userId, key: e.key, ...v }).onConflictDoUpdate({ target: [t.userId, t.key], set: v, setWhere: newer(t) });
        break;
      }
      case "note": {
        const t = schema.note;
        await db.insert(t).values({ userId, key: e.key, at: e.at, body: e.body }).onConflictDoUpdate({ target: [t.userId, t.key], set: { body: e.body, at: e.at }, setWhere: newer(t) });
        break;
      }
      case "activity": {
        const t = schema.activity;
        await db
          .insert(t)
          .values({ userId, key: e.key, at: e.at, count: e.count })
          .onConflictDoUpdate({ target: [t.userId, t.key], set: { count: sql`max(${t.count}, excluded.count)`, at: e.at } });
        break;
      }
      case "prefs": {
        const t = schema.profile;
        const prefs = JSON.stringify(e.prefs);
        await db.insert(t).values({ userId, prefs, at: e.at }).onConflictDoUpdate({ target: t.userId, set: { prefs, at: e.at }, setWhere: newer(t) });
        break;
      }
      case "cf": {
        const t = schema.profile;
        const v = { cfHandle: e.handle ?? null, cfRating: e.rating ?? null, cfMaxRating: e.maxRating ?? null, cfRank: e.rank ?? null, cfSyncedAt: e.syncedAt ?? null };
        await db.insert(t).values({ userId, at: 0, ...v }).onConflictDoUpdate({ target: t.userId, set: v });
        break;
      }
    }
  }
  return Response.json({ ok: true, applied: parsed.data.events.length });
}
