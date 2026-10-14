import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth";
import { getDb, schema } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getSessionUser(req.headers);
  if (!user) return Response.json({ error: "Not signed in" }, { status: 401 });
  const db = getDb();
  const uid = user.id;
  const [lessons, problems, quiz, cards, notes, activity, prof] = await Promise.all([
    db.select().from(schema.lessonProgress).where(eq(schema.lessonProgress.userId, uid)),
    db.select().from(schema.problemProgress).where(eq(schema.problemProgress.userId, uid)),
    db.select().from(schema.quizResult).where(eq(schema.quizResult.userId, uid)),
    db.select().from(schema.reviewCard).where(eq(schema.reviewCard.userId, uid)),
    db.select().from(schema.note).where(eq(schema.note.userId, uid)),
    db.select().from(schema.activity).where(eq(schema.activity.userId, uid)),
    db.select().from(schema.profile).where(eq(schema.profile.userId, uid)),
  ]);
  const p = prof[0];
  let prefs: Record<string, string> = {};
  try {
    prefs = JSON.parse(p?.prefs ?? "{}");
  } catch {}
  return Response.json({
    user: { id: user.id, name: user.name, email: user.email, image: user.image ?? null },
    state: {
      lessons: Object.fromEntries(lessons.map((r) => [r.key, { done: r.done, at: r.at }])),
      problems: Object.fromEntries(problems.map((r) => [r.key, { status: r.status, at: r.at, source: r.source }])),
      quiz: Object.fromEntries(quiz.map((r) => [r.key, { correct: r.correct, attempts: r.attempts, at: r.at }])),
      cards: Object.fromEntries(cards.map((r) => [r.key, { ease: r.ease, interval: r.interval, reps: r.reps, lapses: r.lapses, due: r.due, at: r.at }])),
      notes: Object.fromEntries(notes.map((r) => [r.key, { text: r.body, at: r.at }])),
      activity: Object.fromEntries(activity.map((r) => [r.key, r.count])),
      prefs,
      prefsAt: p?.at ?? 0,
      cf: p?.cfHandle ? { handle: p.cfHandle, rating: p.cfRating ?? undefined, maxRating: p.cfMaxRating ?? undefined, rank: p.cfRank ?? undefined, syncedAt: p.cfSyncedAt ?? undefined } : {},
    },
  });
}
