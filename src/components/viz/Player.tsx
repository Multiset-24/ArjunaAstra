"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { Simulation } from "@/lib/viz/types";
import { ArrayView } from "./views/ArrayView";
import { BarsView } from "./views/BarsView";
import { GraphView, fitGraphs } from "./views/GraphView";
import { GridView } from "./views/GridView";
import { PlotView } from "./views/PlotView";
import s from "./Player.module.css";

const SPEEDS = [0.5, 1, 2] as const;
const BASE_MS = 1100;

function Icon({ name }: { name: "prev" | "next" | "play" | "pause" | "reset" }) {
  const common = { width: 18, height: 18, viewBox: "0 0 24 24", "aria-hidden": true, focusable: false } as const;
  switch (name) {
    case "prev":
      return (
        <svg {...common} fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          <path d="M6 5v14" fill="none" />
          <path d="M19 5l-10 7 10 7z" />
        </svg>
      );
    case "next":
      return (
        <svg {...common} fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
          <path d="M18 5v14" fill="none" />
          <path d="M5 5l10 7-10 7z" />
        </svg>
      );
    case "play":
      return (
        <svg {...common} fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <path d="M7 4l13 8-13 8z" />
        </svg>
      );
    case "pause":
      return (
        <svg {...common} fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      );
    default:
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12a8 8 0 1 0 2.6-5.9" />
          <path d="M4 4v5h5" />
        </svg>
      );
  }
}

/** Steps through a Simulation: controls, caption, variables, views and pseudocode. */
export function Player({ sim, label }: { sim: Simulation; label?: string }) {
  const { frames, code, result } = sim;
  const last = frames.length - 1;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const maxH = useRef(0);

  const cur = Math.min(idx, last);
  const frame = frames[cur];
  const running = playing && cur < last;
  const fit = useMemo(() => fitGraphs(frames.flatMap((f) => (f.graph ? [f.graph] : []))), [frames]);

  useEffect(() => {
    if (!running) return;
    const t = setTimeout(() => setIdx((i) => Math.min(last, i + 1)), BASE_MS / speed);
    return () => clearTimeout(t);
  }, [running, cur, speed, last]);

  // Keep the stage as tall as the tallest frame seen so far, so playing does not make the page jump.
  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    maxH.current = Math.max(maxH.current, el.offsetHeight);
    el.style.minHeight = `${maxH.current}px`;
  }, [cur]);

  const go = (i: number) => {
    setPlaying(false);
    setIdx(Math.max(0, Math.min(last, i)));
  };
  const togglePlay = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    if (cur >= last) setIdx(0);
    setPlaying(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const t = e.target as HTMLElement;
    const tag = t.tagName;
    if (tag === "TEXTAREA" || tag === "SELECT" || (tag === "INPUT" && (t as HTMLInputElement).type !== "range")) return;
    if (tag === "INPUT" && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End")) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        go(cur + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        go(cur - 1);
        break;
      case "Home":
        e.preventDefault();
        go(0);
        break;
      case "End":
        e.preventDefault();
        go(last);
        break;
      case " ":
        if (tag === "BUTTON" || tag === "INPUT" || tag === "SUMMARY" || tag === "A") return;
        e.preventDefault();
        togglePlay();
        break;
    }
  };

  const vars = frame.vars ? Object.entries(frame.vars) : [];

  return (
    <section className={s.player} role="group" aria-label={label ?? "Step-by-step visualizer"} tabIndex={0} onKeyDown={onKeyDown}>
      <div className={s.body}>
        <div className={s.main}>
          <div className={s.stage} ref={stageRef}>
            {frame.array ? <ArrayView state={frame.array} /> : null}
            {frame.graph ? <GraphView state={frame.graph} fit={fit} /> : null}
            {frame.plot ? <PlotView state={frame.plot} /> : null}
            {frame.bars ? <BarsView state={frame.bars} /> : null}
            {frame.grid ? <GridView state={frame.grid} /> : null}
            {frame.arrays?.map((a, i) => <ArrayView key={`a${i}`} state={a} compact />)}
          </div>

          <p className={s.caption} role="status" aria-live="polite" aria-atomic="true">
            <span className={s.stepTag}>Step {cur + 1}</span> {frame.note}
          </p>

          {vars.length ? (
            <dl className={s.vars} aria-label="Variables">
              {vars.map(([k, v]) => (
                <div key={k} className={s.var}>
                  <dt>{k}</dt>
                  <dd>{String(v)}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {cur === last && result ? (
            <p className={s.result}>
              <span className={s.resultTag}>Result</span> {result}
            </p>
          ) : null}

          <div className={s.controls}>
            <div className={s.btnRow} role="group" aria-label="Playback">
              <button type="button" className={s.btn} onClick={() => go(0)} disabled={cur === 0} aria-label="Reset to first step" title="Reset">
                <Icon name="reset" />
              </button>
              <button type="button" className={s.btn} onClick={() => go(cur - 1)} disabled={cur === 0} aria-label="Previous step" title="Previous (left arrow)">
                <Icon name="prev" />
              </button>
              <button type="button" className={`${s.btn} ${s.primary}`} onClick={togglePlay} aria-label={running ? "Pause" : cur >= last ? "Replay" : "Play"} title={running ? "Pause (space)" : "Play (space)"}>
                <Icon name={running ? "pause" : "play"} />
              </button>
              <button type="button" className={s.btn} onClick={() => go(cur + 1)} disabled={cur >= last} aria-label="Next step" title="Next (right arrow)">
                <Icon name="next" />
              </button>
            </div>
            <div className={s.speeds} role="group" aria-label="Playback speed">
              {SPEEDS.map((v) => (
                <button key={v} type="button" className={s.speed} aria-pressed={speed === v} onClick={() => setSpeed(v)}>
                  {v}x
                </button>
              ))}
            </div>
            <span className={s.counter}>
              {cur + 1} / {frames.length}
            </span>
            <input
              className={s.scrub}
              type="range"
              min={0}
              max={last}
              value={cur}
              onChange={(e) => go(Number(e.target.value))}
              aria-label="Step"
              aria-valuetext={`Step ${cur + 1} of ${frames.length}`}
            />
          </div>
        </div>

        {code ? (
          <aside className={s.codeWrap} aria-label="Pseudocode">
            <h4 className={s.codeTitle}>Pseudocode</h4>
            <ol className={s.code}>
              {code.lines.map((ln, i) => (
                <li key={i} className={s.line} data-active={frame.line === i ? "true" : undefined} aria-current={frame.line === i ? "step" : undefined}>
                  <code>{ln === "" ? " " : ln}</code>
                </li>
              ))}
            </ol>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
