"use client";
import { useRef, useState } from "react";
import type { EstimatePayload } from "@/lib/content/blocks";
import { useProgress } from "@/lib/store/progress";
import { cx } from "@/lib/utils";
import s from "./ix.module.css";

function fmt(n: number) {
  if (!isFinite(n)) return String(n);
  const a = Math.abs(n);
  if (a >= 1e6 || (a > 0 && a < 1e-3)) return n.toExponential(2).replace("e+", "×10^");
  return n.toLocaleString("en-US", { maximumFractionDigits: 3 });
}

export function Estimate({ id, qHtml, answer, unit, tolerance, hintHtml, solutionHtml }: EstimatePayload) {
  const { recordQuiz } = useProgress();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<null | { ok: boolean; ratio: number }>(null);
  const [hint, setHint] = useState(false);
  const [shown, setShown] = useState(false);
  const recorded = useRef(false);

  const check = () => {
    const x = Number(value.replace(/[,_\s]/g, "").replace(/x10\^/i, "e"));
    if (!isFinite(x) || x <= 0) return;
    const ratio = Math.max(x / answer, answer / x);
    const ok = tolerance === "order" ? ratio <= 3 : Math.abs(x - answer) / answer <= tolerance;
    setResult({ ok, ratio: x / answer });
    setShown(true);
    if (!recorded.current) {
      recorded.current = true;
      recordQuiz(id, ok);
    }
  };

  const off = result ? Math.round(Math.abs(result.ratio - 1) * 100) : 0;
  return (
    <section className={s.box} aria-label="Estimate">
      <div className={s.label}>Estimate</div>
      <div className={s.prompt} dangerouslySetInnerHTML={{ __html: qHtml }} />
      <div className={s.estRow}>
        <input
          className={cx(s.input, result && (result.ok ? s.inputGood : s.inputBad))}
          inputMode="decimal"
          aria-label="Your estimate"
          placeholder="Your estimate"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setResult(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && check()}
        />
        {unit && <span className={s.unit}>{unit}</span>}
        <button type="button" className="btn btn-primary" onClick={check} disabled={!value.trim()}>
          Check
        </button>
        {hintHtml && !hint && (
          <button type="button" className="btn btn-ghost" onClick={() => setHint(true)}>
            Hint
          </button>
        )}
        {!shown && (
          <button type="button" className="btn btn-ghost" onClick={() => setShown(true)}>
            Show solution
          </button>
        )}
      </div>
      {hint && hintHtml && <div className={s.hintLine} dangerouslySetInnerHTML={{ __html: hintHtml }} />}
      {shown && (
        <div className={cx(s.feedback, result ? (result.ok ? s.good : s.bad) : s.neutral)} aria-live="polite">
          {result && (
            <div>
              <strong>{result.ok ? "Good estimate." : "Off by more than the tolerance."}</strong>{" "}
              {off < 1000 ? `You were ${off}% ${result.ratio >= 1 ? "high" : "low"}.` : `You were off by ${fmt(Math.max(result.ratio, 1 / result.ratio))}×.`}
            </div>
          )}
          <div>
            Reference: <strong>{fmt(answer)}</strong> {unit}
          </div>
          <div dangerouslySetInnerHTML={{ __html: solutionHtml }} />
        </div>
      )}
    </section>
  );
}
