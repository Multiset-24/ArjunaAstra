"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Lesson } from "@/lib/content/types";
import { useProgress } from "@/lib/store/progress";
import { lessonStatus } from "@/lib/progress-utils";
import { cx } from "@/lib/utils";
import { PracticeList } from "./PracticeList";
import { MyNotes } from "./MyNotes";
import s from "./lesson.module.css";

type LessonLite = Omit<Lesson, "sections" | "cards"> & { cardIds: string[] };
interface NavStage {
  id: string;
  title: string;
  lessons: { id: string; title: string }[];
}

export function LessonView({
  lesson,
  track,
  stageTitle,
  prevTitle,
  nextTitle,
  sections,
}: {
  lesson: LessonLite;
  track: { id: string; title: string; nav: NavStage[] };
  stageTitle: string;
  prevTitle?: string;
  nextTitle?: string;
  sections: { id: string; title: string; node: ReactNode }[];
}) {
  const p = useProgress();
  const { state, ready } = p;
  const done = !!state.lessons[lesson.id]?.done;
  const [mode, setMode] = useState<"learn" | "read">("learn");
  const [current, setCurrent] = useState(0);
  const [zen, setZen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const refs = useRef<(HTMLElement | null)[]>([]);
  const initialised = useRef<string | null>(null);

  // initial mode + position once state is loaded
  useEffect(() => {
    if (!ready || initialised.current === lesson.id) return;
    initialised.current = lesson.id;
    const saved = state.sections[lesson.id] ?? 0;
    setCurrent(Math.min(saved, sections.length - 1));
    setMode(done || state.prefs.mode === "read" ? "read" : "learn");
  }, [ready, lesson.id, state.sections, state.prefs.mode, done, sections.length]);

  useEffect(() => {
    document.body.classList.toggle("zen", zen);
    return () => document.body.classList.remove("zen");
  }, [zen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName);
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "f" || e.key === "F") setZen((z) => !z);
      if (e.key === "Escape") setZen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const total = sections.length;
  const learn = mode === "learn";
  const visible = learn ? current + 1 : total;
  const finishedReading = !learn || current >= total - 1;

  const advance = useCallback(() => {
    const n = Math.min(current + 1, total - 1);
    setCurrent(n);
    p.setSection(lesson.id, n);
    requestAnimationFrame(() => refs.current[n]?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [current, total, p, lesson.id]);

  const complete = () => {
    p.setLessonDone(lesson.id, !done);
    if (!done) p.enrollCards(lesson.cardIds);
  };

  const ratingText = lesson.rating ? `${lesson.rating[0]}–${lesson.rating[1]}` : null;

  return (
    <div className={cx(s.shell, zen && s.zen)}>
      {/* sidebar */}
      <aside className={cx(s.sidebar, drawer && s.sidebarOpen)} aria-label={`${track.title} lessons`}>
        <div className={s.sideHead}>
          <Link href={`/learn/${track.id}`} className={s.sideTrack}>
            {track.title}
          </Link>
          <button type="button" className={s.closeDrawer} onClick={() => setDrawer(false)} aria-label="Close lesson list">
            ×
          </button>
        </div>
        <nav>
          {track.nav.map((st) => (
            <details key={st.id} open={st.lessons.some((l) => l.id === lesson.id)} className={s.sideStage}>
              <summary>{st.title}</summary>
              <ol>
                {st.lessons.map((l) => {
                  const status = ready ? lessonStatus(state, l.id) : "new";
                  return (
                    <li key={l.id}>
                      <Link href={`/learn/${l.id}`} aria-current={l.id === lesson.id ? "page" : undefined} className={s.sideLink} onClick={() => setDrawer(false)}>
                        <span className={cx(s.sDot, s[`sd_${status}`])} aria-hidden />
                        {l.title}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </details>
          ))}
        </nav>
      </aside>
      {drawer && <div className={s.scrim} onClick={() => setDrawer(false)} />}

      {/* main column */}
      <article className={s.main}>
        <div className={s.toolbar}>
          <button type="button" className={cx("btn btn-ghost btn-sm", s.drawerBtn)} onClick={() => setDrawer(true)} aria-label="Open lesson list">
            ☰ Lessons
          </button>
          <nav className={s.crumbs} aria-label="Breadcrumb">
            <Link href={`/learn/${track.id}`}>{track.title}</Link>
            <span aria-hidden>/</span>
            <span>{stageTitle}</span>
          </nav>
          <div className={s.tools}>
            <div className={s.seg} role="group" aria-label="Lesson mode">
              <button type="button" aria-pressed={learn} onClick={() => setMode("learn")}>
                Learn
              </button>
              <button type="button" aria-pressed={!learn} onClick={() => setMode("read")}>
                Read
              </button>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" aria-pressed={zen} onClick={() => setZen((z) => !z)} title="Focus mode (F)">
              {zen ? "Exit focus" : "Focus"}
            </button>
            <button type="button" className={cx("btn btn-ghost btn-sm", s.notesBtn)} onClick={() => setNotesOpen((o) => !o)} aria-expanded={notesOpen}>
              My notes
            </button>
          </div>
        </div>

        <header className={s.lessonHead}>
          <h1>{lesson.title}</h1>
          <p className={s.summary}>{lesson.summary}</p>
          <div className={s.meta}>
            <span>{lesson.minutes} min</span>
            {ratingText && <span className="mono">CF {ratingText}</span>}
            {lesson.interactiveCount > 0 && <span>{lesson.interactiveCount} interactive</span>}
            {lesson.problemCount > 0 && <span>{lesson.problemCount} problems</span>}
            {done && <span className={s.doneTag}>Completed</span>}
          </div>
          {learn && total > 1 && (
            <div className={s.dots} aria-label={`Step ${current + 1} of ${total}`}>
              {sections.map((sec, i) => (
                <button
                  key={sec.id}
                  type="button"
                  className={cx(s.stepDot, i <= current && s.stepDone, i === current && s.stepNow)}
                  aria-label={sec.title || "Introduction"}
                  title={sec.title || "Introduction"}
                  disabled={i > (state.sections[lesson.id] ?? current)}
                  onClick={() => refs.current[i]?.scrollIntoView({ behavior: "smooth", block: "start" })}
                />
              ))}
            </div>
          )}
        </header>

        <div className="prose">
          {sections.slice(0, visible).map((sec, i) => {
            const isCollapsed = !learn && collapsed[sec.id];
            return (
              <section
                key={sec.id}
                ref={(el) => void (refs.current[i] = el)}
                className={cx(s.section, learn && i < current && s.past, learn && i === current && s.now)}
                aria-labelledby={sec.title ? sec.id : undefined}
              >
                {!learn && sec.title && (
                  <button
                    type="button"
                    className={s.collapse}
                    aria-expanded={!isCollapsed}
                    onClick={() => setCollapsed((c) => ({ ...c, [sec.id]: !c[sec.id] }))}
                    aria-label={isCollapsed ? `Expand ${sec.title}` : `Collapse ${sec.title}`}
                  >
                    {isCollapsed ? "+" : "−"}
                  </button>
                )}
                <div className={cx(isCollapsed && s.collapsedBody)}>{sec.node}</div>
                {learn && i === current && i < total - 1 && (
                  <div className={s.continue}>
                    <button type="button" className="btn" onClick={advance}>
                      Continue{sections[i + 1]?.title ? `: ${sections[i + 1].title}` : ""}
                    </button>
                    <span className="faint">
                      {i + 1} of {total}
                    </span>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {finishedReading && (
          <div className={s.after}>
            {lesson.problems.length > 0 && <PracticeList problems={lesson.problems} />}
            {lesson.exercises.length > 0 && (
              <section className={s.block}>
                <h2 className={s.blockTitle}>Exercises</h2>
                <ol className={s.exercises}>
                  {lesson.exercises.map((e, i) => (
                    <li key={i} dangerouslySetInnerHTML={{ __html: e }} />
                  ))}
                </ol>
              </section>
            )}
            {lesson.resources.length > 0 && (
              <section className={s.block}>
                <h2 className={s.blockTitle}>Further reading</h2>
                <ul className={s.resources}>
                  {lesson.resources.map((r) => (
                    <li key={r.url}>
                      <a href={r.url} target="_blank" rel="noreferrer">
                        {r.title}
                      </a>
                      {r.note && <span className="faint"> — {r.note}</span>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div className={cx(s.complete, done && s.completeDone)}>
              <div>
                <strong>{done ? "Lesson complete." : "Finished reading?"}</strong>
                <span className="faint">
                  {" "}
                  {done
                    ? lesson.cardIds.length
                      ? `${lesson.cardIds.length} flashcards are in your review deck.`
                      : ""
                    : lesson.problemCount
                      ? "Mark it complete, then solve at least the core problems."
                      : "Mark it complete to add its flashcards to your review deck."}
                </span>
              </div>
              <button type="button" className={done ? "btn" : "btn btn-primary"} onClick={complete}>
                {done ? "Mark as not done" : "Mark lesson complete"}
              </button>
            </div>
          </div>
        )}

        <nav className={s.pager} aria-label="Lesson navigation">
          {lesson.prev ? (
            <Link href={`/learn/${lesson.prev}`} className={s.pg}>
              <span className="faint">Previous</span>
              <span>{prevTitle}</span>
            </Link>
          ) : (
            <span />
          )}
          {lesson.next ? (
            <Link href={`/learn/${lesson.next}`} className={cx(s.pg, s.pgNext)}>
              <span className="faint">Next</span>
              <span>{nextTitle}</span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      </article>

      {/* right rail */}
      <aside className={cx(s.rail, notesOpen && s.railOpen)} aria-label="On this page">
        {lesson.toc.length > 0 && (
          <div className={s.toc}>
            <div className="eyebrow">On this page</div>
            <ol>
              {lesson.toc
                .filter((t) => t.depth === 2)
                .map((t) => {
                  const idx = sections.findIndex((x) => x.id === t.id);
                  const locked = learn && idx > current;
                  return (
                    <li key={t.id}>
                      {locked ? (
                        <span className={s.tocLocked}>{t.text}</span>
                      ) : (
                        <a href={`#${t.id}`}>{t.text}</a>
                      )}
                    </li>
                  );
                })}
            </ol>
          </div>
        )}
        <MyNotes lessonId={lesson.id} onClose={() => setNotesOpen(false)} />
      </aside>
    </div>
  );
}
