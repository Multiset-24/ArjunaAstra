"use client";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import type { VizPayload } from "@/lib/content/blocks";
import { VIZ, validateVizInput } from "@/lib/viz/catalog";
import type { VizSpec } from "@/lib/viz/catalog";
import { FRAMES } from "@/lib/viz/registry";
import type { Simulation, Simulator } from "@/lib/viz/types";
import { WIDGETS } from "@/components/viz/widgets";
import { Player } from "./Player";
import s from "./Viz.module.css";

type Outcome =
  | { kind: "error"; message: string }
  | { kind: "missing" }
  | { kind: "sim"; sim: Simulation }
  | { kind: "widget"; Widget: ComponentType<{ input: Record<string, unknown> }>; value: Record<string, unknown> };

/** Validate, then simulate (frames) or look up the widget. Never throws. */
function resolve(algo: string, raw: unknown): Outcome {
  const v = validateVizInput(algo, raw);
  if (!v.ok) return { kind: "error", message: v.error };
  const spec = (VIZ as Record<string, VizSpec>)[algo];
  if (spec.kind === "widget") {
    const Widget = WIDGETS[algo];
    return Widget ? { kind: "widget", Widget, value: v.value } : { kind: "missing" };
  }
  const sim = FRAMES[algo] as Simulator | undefined;
  if (!sim) return { kind: "missing" };
  try {
    const out = sim(v.value);
    if (!out.frames.length) return { kind: "error", message: "This input produced no steps." };
    return { kind: "sim", sim: out };
  } catch (e) {
    return { kind: "error", message: e instanceof Error ? e.message : "Could not run this input." };
  }
}

function fmtValue(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(fmtValue).join(", ")}]`;
  return JSON.stringify(v);
}
/** One key per line, arrays kept on a single line so the editor stays short. */
function formatInput(obj: unknown): string {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return JSON.stringify(obj ?? {}, null, 2);
  const entries = Object.entries(obj as Record<string, unknown>);
  if (!entries.length) return "{}";
  return `{\n${entries.map(([k, v]) => `  ${JSON.stringify(k)}: ${fmtValue(v)}`).join(",\n")}\n}`;
}

export function Viz({ algo, input, editable, title }: VizPayload) {
  const spec = (VIZ as Record<string, VizSpec>)[algo];
  const initialText = useMemo(() => {
    const v = validateVizInput(algo, input);
    return formatInput(v.ok ? v.value : input);
  }, [algo, input]);

  const [value, setValue] = useState<unknown>(input);
  const [text, setText] = useState(initialText);
  const [editError, setEditError] = useState<string | null>(null);

  const outcome = useMemo(() => resolve(algo, value), [algo, value]);

  const apply = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setEditError(`Not valid JSON: ${e instanceof Error ? e.message : "parse error"}`);
      return;
    }
    const next = resolve(algo, parsed);
    if (next.kind === "error") {
      setEditError(next.message);
      return;
    }
    setEditError(null);
    setValue(parsed);
  };
  const reset = () => {
    setValue(input);
    setText(initialText);
    setEditError(null);
  };

  const heading = title ?? spec?.title ?? algo;
  const rows = Math.min(12, Math.max(4, text.split("\n").length + 1));

  return (
    <figure className={s.viz} data-viz={algo}>
      <figcaption className={s.head}>
        <span className={s.title}>{heading}</span>
        {spec ? <span className={s.summary}>{spec.summary}</span> : null}
      </figcaption>

      {outcome.kind === "error" ? (
        <div className={s.error} role="alert">
          <strong>This input cannot be visualised.</strong>
          <pre className={s.errorText}>{outcome.message}</pre>
        </div>
      ) : null}

      {outcome.kind === "sim" ? <Player key={JSON.stringify(value)} sim={outcome.sim} label={heading} /> : null}

      {outcome.kind === "widget" ? (
        <div className={s.widget}>
          <outcome.Widget key={JSON.stringify(value)} input={outcome.value} />
        </div>
      ) : null}

      {outcome.kind === "missing" ? (
        <div className={s.soon}>This interactive is coming soon.</div>
      ) : null}

      {editable && spec ? (
        <details className={s.edit}>
          <summary className={s.editSummary}>Edit input</summary>
          <div className={s.editBody}>
            <label className={s.editLabel} htmlFor={`viz-input-${algo}`}>
              Input as JSON
            </label>
            <textarea
              id={`viz-input-${algo}`}
              className={s.textarea}
              value={text}
              rows={rows}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              onChange={(e) => setText(e.target.value)}
              aria-invalid={editError ? true : undefined}
              aria-describedby={editError ? `viz-err-${algo}` : undefined}
            />
            {editError ? (
              <pre id={`viz-err-${algo}`} className={s.errorText} role="alert">
                {editError}
              </pre>
            ) : null}
            <div className={s.editActions}>
              <button type="button" className={`${s.action} ${s.actionPrimary}`} onClick={apply}>
                Apply
              </button>
              <button type="button" className={s.action} onClick={reset}>
                Reset
              </button>
            </div>
          </div>
        </details>
      ) : null}
    </figure>
  );
}
