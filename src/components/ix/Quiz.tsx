"use client";
import { useRef, useState } from "react";
import type { QuizPayload } from "@/lib/content/blocks";
import { useProgress } from "@/lib/store/progress";
import { cx } from "@/lib/utils";
import s from "./ix.module.css";

type Q = QuizPayload["questions"][number];

function Question({ q, index, total }: { q: Q; index: number; total: number }) {
  const { recordQuiz } = useProgress();
  const multi = q.answer.length > 1;
  const [picked, setPicked] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const recorded = useRef(false);
  const correctSet = new Set(q.answer);
  const isRight = done && picked.length === q.answer.length && picked.every((p) => correctSet.has(p));

  const finish = (sel: number[]) => {
    setDone(true);
    if (!recorded.current) {
      recorded.current = true;
      recordQuiz(q.id, sel.length === q.answer.length && sel.every((p) => correctSet.has(p)));
    }
  };

  const choose = (i: number) => {
    if (done) return;
    if (multi) setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
    else {
      setPicked([i]);
      finish([i]);
    }
  };

  return (
    <div className={s.question}>
      {total > 1 && (
        <div className={s.qCount}>
          {index + 1} / {total}
        </div>
      )}
      <div className={s.prompt} dangerouslySetInnerHTML={{ __html: q.qHtml }} />
      {multi && <div className={s.sub}>Select all that apply.</div>}
      <div className={s.options} role={multi ? "group" : "radiogroup"}>
        {q.optionsHtml.map((o, i) => {
          const sel = picked.includes(i);
          const state = done ? (correctSet.has(i) ? "right" : sel ? "wrong" : "idle") : sel ? "sel" : "idle";
          return (
            <button
              key={i}
              type="button"
              role={multi ? "checkbox" : "radio"}
              aria-checked={sel}
              className={cx(s.option, s[`o_${state}`])}
              onClick={() => choose(i)}
              disabled={done && !sel && !correctSet.has(i)}
            >
              <span className={s.letter}>{String.fromCharCode(65 + i)}</span>
              <span dangerouslySetInnerHTML={{ __html: o }} />
            </button>
          );
        })}
      </div>
      {multi && !done && (
        <div className={s.actions}>
          <button type="button" className="btn btn-primary" disabled={!picked.length} onClick={() => finish(picked)}>
            Check
          </button>
        </div>
      )}
      {done && (
        <div className={cx(s.feedback, isRight ? s.good : s.bad)} aria-live="polite">
          <strong>{isRight ? "Right." : "Not quite."}</strong> <span dangerouslySetInnerHTML={{ __html: q.whyHtml }} />
          <div className={s.actions}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setPicked([]);
                setDone(false);
              }}
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Quiz({ questions }: QuizPayload) {
  return (
    <section className={s.box} aria-label="Quick check">
      <div className={s.label}>Quick check</div>
      {questions.map((q, i) => (
        <Question key={q.id} q={q} index={i} total={questions.length} />
      ))}
    </section>
  );
}
