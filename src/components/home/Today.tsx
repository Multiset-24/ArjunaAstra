"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useProgress } from "@/lib/store/progress";
import { solvedCount, streak } from "@/lib/progress-utils";
import s from "./home.module.css";

export function Today({ order, titles }: { order: string[]; titles: Record<string, string> }) {
  const { state, ready } = useProgress();
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), []);
  if (!ready || !now) return <div className={s.today} aria-hidden />;

  const started = Object.entries(state.sections)
    .filter(([id]) => !state.lessons[id]?.done && titles[id])
    .map(([id]) => id);
  const next = started[0] ?? order.find((id) => !state.lessons[id]?.done);
  const due = Object.values(state.cards).filter((c) => c.due <= now).length;
  const st = streak(state.activity);
  const solved = solvedCount(state.problems);
  const fresh = !Object.keys(state.lessons).length && !solved;

  return (
    <section className={s.today} aria-label="Today">
      <div className={s.todayMain}>
        <div className="eyebrow">{fresh ? "Begin" : started.length ? "Continue" : "Next lesson"}</div>
        {next ? (
          <Link href={`/learn/${next}`} className={s.next}>
            {titles[next]}
            <span aria-hidden> →</span>
          </Link>
        ) : (
          <span className={s.next}>Every lesson is done. Keep practising.</span>
        )}
      </div>
      <dl className={s.stats}>
        <div>
          <dt>Reviews due</dt>
          <dd>{due ? <Link href="/review">{due}</Link> : 0}</dd>
        </div>
        <div>
          <dt>Solved</dt>
          <dd>
            <Link href="/practice">{solved}</Link>
          </dd>
        </div>
        <div>
          <dt>Streak</dt>
          <dd>
            {st} {st === 1 ? "day" : "days"}
          </dd>
        </div>
      </dl>
    </section>
  );
}
