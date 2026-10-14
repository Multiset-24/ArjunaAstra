"use client";
import { useRef, useState } from "react";
import type { PredictPayload } from "@/lib/content/blocks";
import { useProgress } from "@/lib/store/progress";
import { cx, normalizeOutput } from "@/lib/utils";
import s from "./ix.module.css";

export function Predict({ id, promptHtml, codeHtml, input, output, whyHtml }: PredictPayload) {
  const { recordQuiz } = useProgress();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<"idle" | "right" | "wrong">("idle");
  const [shown, setShown] = useState(false);
  const recorded = useRef(false);

  const check = () => {
    const ok = normalizeOutput(value) === normalizeOutput(output);
    setResult(ok ? "right" : "wrong");
    if (!recorded.current) {
      recorded.current = true;
      recordQuiz(id, ok);
    }
    if (ok) setShown(true);
  };

  return (
    <section className={s.box} aria-label="Predict the output">
      <div className={s.label}>Predict the output</div>
      <div className={s.prompt} dangerouslySetInnerHTML={{ __html: promptHtml }} />
      <div className={s.code} dangerouslySetInnerHTML={{ __html: codeHtml }} />
      {input ? (
        <div className={s.stdin}>
          <span className={s.miniLabel}>stdin</span>
          <pre>{input}</pre>
        </div>
      ) : null}
      <label className={s.miniLabel} htmlFor={`${id}-ans`}>
        Your answer
      </label>
      <textarea
        id={`${id}-ans`}
        className={cx(s.textarea, result === "right" && s.inputGood, result === "wrong" && s.inputBad)}
        rows={Math.min(6, Math.max(2, output.split("\n").length))}
        value={value}
        spellCheck={false}
        onChange={(e) => {
          setValue(e.target.value);
          setResult("idle");
        }}
        placeholder="Type exactly what gets printed"
      />
      <div className={s.actions}>
        <button type="button" className="btn btn-primary" onClick={check} disabled={!value.trim()}>
          Check
        </button>
        {!shown && (
          <button type="button" className="btn btn-ghost" onClick={() => setShown(true)}>
            Reveal
          </button>
        )}
        {result === "wrong" && <span className={s.inlineBad}>Not quite — trace it once more.</span>}
      </div>
      {shown && (
        <div className={cx(s.feedback, result === "right" ? s.good : s.neutral)} aria-live="polite">
          <div className={s.miniLabel}>Output</div>
          <pre className={s.expected}>{output}</pre>
          <div dangerouslySetInnerHTML={{ __html: whyHtml }} />
        </div>
      )}
    </section>
  );
}
