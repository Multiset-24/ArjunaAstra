"use client";
import Link from "next/link";
import type { LessonMeta, Stage } from "@/lib/content/types";
import { useProgress } from "@/lib/store/progress";
import { lessonStatus } from "@/lib/progress-utils";
import { cx } from "@/lib/utils";
import s from "./track.module.css";

export type TrackLesson = Pick<LessonMeta, "title" | "summary" | "minutes" | "rating">;

export function TrackPath({ stages, lessons }: { stages: Stage[]; lessons: Record<string, TrackLesson> }) {
  const { state, ready } = useProgress();
  return (
    <>
      {stages.length > 1 && (
        <nav className={s.index} aria-label="Jump to a stage">
          {stages.map((st, i) => (
            <a key={st.id} href={`#stage-${st.id}`}>
              <span className={s.indexNum}>{String(i + 1).padStart(2, "0")}</span>
              <span>{st.title}</span>
            </a>
          ))}
        </nav>
      )}
      <ol className={s.stages}>
        {stages.map((st, si) => {
          const ids = st.lessons;
          const done = ready ? ids.filter((id) => state.lessons[id]?.done).length : 0;
          return (
            <li key={st.id} id={`stage-${st.id}`} className={s.stage}>
              <div className={s.stone} aria-hidden>
                <span className={cx(s.stoneDot, done === ids.length && ids.length > 0 && s.stoneDone)} />
              </div>
              <div className={s.stageBody}>
                <div className={s.stageHead}>
                  <span className="eyebrow">Stage {si + 1}</span>
                  <span className={s.stageCount}>
                    {done}/{ids.length}
                  </span>
                </div>
                <h2 className={s.stageTitle}>{st.title}</h2>
                <p className={s.stageGoal}>{st.goal}</p>
                {st.milestone && <p className={s.milestone}>Milestone: {st.milestone}</p>}
                {ids.length === 0 && <p className={s.milestone} style={{ marginTop: 12 }}>Lessons for this stage are being written and will appear here soon.</p>}
                <ol className={s.lessons}>
                  {ids.map((id, i) => {
                    const l = lessons[id];
                    if (!l) return null;
                    const status = ready ? lessonStatus(state, id) : "new";
                    return (
                      <li key={id}>
                        <Link href={`/learn/${id}`} className={s.lesson}>
                          <span className={cx(s.dot, s[`d_${status}`])} aria-label={status === "done" ? "Done" : status === "started" ? "In progress" : "Not started"} />
                          <span className={s.lNum}>{String(i + 1).padStart(2, "0")}</span>
                          <span className={s.lMain}>
                            <span className={s.lTitle}>{l.title}</span>
                            <span className={s.lSum}>{l.summary}</span>
                          </span>
                          <span className={s.lMeta}>
                            {l.rating ? <span className="mono">{l.rating[0]}–{l.rating[1]}</span> : null}
                            <span>{l.minutes} min</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
