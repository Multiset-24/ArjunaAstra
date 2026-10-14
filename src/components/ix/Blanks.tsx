"use client";
import { useRef, useState } from "react";
import type { BlanksPayload } from "@/lib/content/blocks";
import { useProgress } from "@/lib/store/progress";
import { cx } from "@/lib/utils";
import s from "./ix.module.css";

const norm = (x: string) => x.replace(/\s+/g, "");

export function Blanks({ id, promptHtml, parts, whyHtml }: BlanksPayload) {
  const { recordQuiz } = useProgress();
  const blanks = parts.filter((p) => p.kind === "blank") as { kind: "blank"; answers: string[] }[];
  const [values, setValues] = useState<string[]>(blanks.map(() => ""));
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const recorded = useRef(false);
  const ok = (i: number) => blanks[i].answers.some((a) => norm(a) === norm(values[i]));
  const allOk = blanks.every((_, i) => ok(i));

  let bi = -1;
  return (
    <section className={s.box} aria-label="Fill in the blanks">
      <div className={s.label}>Fill in</div>
      <div className={s.prompt} dangerouslySetInnerHTML={{ __html: promptHtml }} />
      <pre className={s.blanksCode}>
        {parts.map((p, k) => {
          if (p.kind === "text") return <span key={k}>{p.text}</span>;
          bi++;
          const i = bi;
          const w = Math.max(3, ...p.answers.map((a) => a.length)) + 1;
          return (
            <input
              key={k}
              aria-label={`Blank ${i + 1}`}
              className={cx(s.blank, checked && (ok(i) ? s.inputGood : s.inputBad))}
              style={{ width: `${w}ch` }}
              value={revealed ? p.answers[0] : values[i]}
              readOnly={revealed}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              onChange={(e) => {
                const v = values.slice();
                v[i] = e.target.value;
                setValues(v);
                setChecked(false);
              }}
            />
          );
        })}
      </pre>
      <div className={s.actions}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            setChecked(true);
            if (!recorded.current) {
              recorded.current = true;
              recordQuiz(id, allOk);
            }
          }}
        >
          Check
        </button>
        {!revealed && (
          <button type="button" className="btn btn-ghost" onClick={() => setRevealed(true)}>
            Reveal
          </button>
        )}
        {checked && !allOk && !revealed && <span className={s.inlineBad}>Some blanks need another look.</span>}
      </div>
      {((checked && allOk) || revealed) && whyHtml && (
        <div className={cx(s.feedback, allOk && !revealed ? s.good : s.neutral)} dangerouslySetInnerHTML={{ __html: whyHtml }} />
      )}
    </section>
  );
}
