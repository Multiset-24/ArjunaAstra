"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Card } from "@/lib/content/types";
import type { Grade } from "@/lib/store/types";
import { useProgress } from "@/lib/store/progress";
import { cx } from "@/lib/utils";
import s from "./review.module.css";

const GRADES: { g: Grade; label: string; hint: string }[] = [
  { g: 0, label: "Again", hint: "forgot" },
  { g: 1, label: "Hard", hint: "slow" },
  { g: 2, label: "Good", hint: "recalled" },
  { g: 3, label: "Easy", hint: "instant" },
];

export function Review({ cards, titles }: { cards: Card[]; titles: Record<string, string> }) {
  const { state, ready, gradeCard } = useProgress();
  const [now, setNow] = useState(0);
  const [queue, setQueue] = useState<string[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  useEffect(() => setNow(Date.now()), []);
  useEffect(() => {
    if (!ready || !now || queue) return;
    const due = Object.entries(state.cards)
      .filter(([id, c]) => c.due <= now && byId.has(id))
      .sort((a, b) => a[1].due - b[1].due)
      .map(([id]) => id);
    setQueue(due);
  }, [ready, now, state.cards, byId, queue]);

  const enrolled = Object.keys(state.cards).filter((id) => byId.has(id)).length;
  const id = queue?.[0];
  const card = id ? byId.get(id) : undefined;

  const grade = (g: Grade) => {
    if (!id) return;
    gradeCard(id, g);
    setFlipped(false);
    setDoneCount((n) => n + 1);
    setQueue((q) => {
      const rest = (q ?? []).slice(1);
      return g === 0 ? [...rest, id] : rest; // "again" comes back in this session
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!card) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped(true);
      } else if (flipped && ["1", "2", "3", "4"].includes(e.key)) grade((Number(e.key) - 1) as Grade);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const upcoming = Object.values(state.cards).filter((c) => c.due > now).sort((a, b) => a.due - b.due)[0];

  return (
    <div className="container narrow page">
      <div className="eyebrow">Review</div>
      <h1 className={s.h1}>Remember what you learned</h1>
      <p className="muted">
        Cards from lessons you completed come back just before you would forget them. A few minutes a day is enough. Be honest with yourself when you grade.
      </p>
      <div className={s.counts}>
        <span>
          <strong>{queue?.length ?? 0}</strong> due now
        </span>
        <span>
          <strong>{doneCount}</strong> reviewed this session
        </span>
        <span>
          <strong>{enrolled}</strong> in your deck
        </span>
      </div>

      {!ready || queue === null ? (
        <div className={s.card} aria-busy />
      ) : card ? (
        <div className={s.stage}>
          <button type="button" className={cx(s.card, flipped && s.flipped)} onClick={() => setFlipped(true)} aria-label={flipped ? "Answer" : "Show answer"}>
            <span className={s.from}>{titles[card.lessonId] ?? card.lessonId}</span>
            <span className={s.q} dangerouslySetInnerHTML={{ __html: card.q }} />
            {flipped ? <span className={s.a} dangerouslySetInnerHTML={{ __html: card.a }} /> : <span className={s.tap}>Think of the answer, then tap or press Space</span>}
          </button>
          {flipped && (
            <div className={s.grades}>
              {GRADES.map((x, i) => (
                <button key={x.g} type="button" className={cx("btn", s.grade, s[`g${x.g}`])} onClick={() => grade(x.g)}>
                  {x.label}
                  <span className="faint">
                    {i + 1} · {x.hint}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className={s.empty}>
          {enrolled ? (
            <>
              <h2>Nothing due right now.</h2>
              <p className="muted">
                {upcoming ? `Next card comes back ${new Date(upcoming.due).toLocaleString()}.` : ""} Use the time to solve a problem instead.
              </p>
              <Link href="/practice" className="btn">
                Go to practice
              </Link>
            </>
          ) : (
            <>
              <h2>Your deck is empty.</h2>
              <p className="muted">Finish a lesson and mark it complete — its flashcards will appear here.</p>
              <Link href="/learn" className="btn">
                Choose a lesson
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
