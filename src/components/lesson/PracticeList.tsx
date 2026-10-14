"use client";
import type { ProblemRef } from "@/lib/content/types";
import { useProgress } from "@/lib/store/progress";
import { cx } from "@/lib/utils";
import s from "./lesson.module.css";

const SITE: Record<string, string> = { cf: "CF", lc: "LC", cses: "CSES", other: "" };

export function PracticeList({ problems, title = "Practice" }: { problems: ProblemRef[]; title?: string }) {
  const { state, setProblem } = useProgress();
  const solved = problems.filter((p) => state.problems[p.key]?.status === "solved").length;
  return (
    <section className={s.block}>
      <div className={s.blockHead}>
        <h2 className={s.blockTitle}>{title}</h2>
        <span className="faint mono">
          {solved}/{problems.length} solved
        </span>
      </div>
      <p className="faint" style={{ fontSize: "var(--fs-sm)", marginBottom: 10 }}>
        Easiest first. Give each one an honest 30–45 minutes before reading a hint or the editorial. Core problems are the minimum.
      </p>
      <ul className={s.problems}>
        {problems.map((p) => {
          const st = state.problems[p.key]?.status;
          const isSolved = st === "solved";
          return (
            <li key={p.key} className={cx(s.problem, isSolved && s.solved)}>
              <input
                type="checkbox"
                className={s.check}
                checked={isSolved}
                aria-label={`Mark ${p.name} as solved`}
                onChange={(e) => setProblem(p.key, e.target.checked ? "solved" : null)}
              />
              <span className={cx(s.site, s[`site_${p.platform}`])}>{SITE[p.platform] || p.site}</span>
              <a href={p.url} target="_blank" rel="noreferrer" className={s.pName}>
                {p.name}
              </a>
              {p.core && <span className={s.core}>core</span>}
              <span className={s.pRight}>
                {p.note && <span className={s.pNote}>{p.note}</span>}
                {p.rating && <span className="mono">{p.rating}</span>}
                {p.difficulty && <span>{p.difficulty}</span>}
                {st === "tried" && <span className={s.tried}>tried</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
