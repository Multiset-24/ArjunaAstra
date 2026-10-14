"use client";
import { useMemo, useRef, useState } from "react";
import type { OrderPayload } from "@/lib/content/blocks";
import { useProgress } from "@/lib/store/progress";
import { cx, seededShuffle } from "@/lib/utils";
import s from "./ix.module.css";

interface Item {
  key: string;
  text: string;
  html: string;
}

export function Order({ id, promptHtml, lines, distractors, whyHtml }: OrderPayload) {
  const { recordQuiz } = useProgress();
  const initial = useMemo(() => {
    const all: Item[] = [...lines, ...distractors].map((l, i) => ({ key: `${i}`, text: l.text, html: l.html }));
    let mixed = seededShuffle(all, id);
    const target = lines.map((l) => l.text).join("\n");
    for (let k = 1; k < 5 && mixed.map((m) => m.text).join("\n").startsWith(target); k++) mixed = seededShuffle(all, id + k);
    return mixed;
  }, [id, lines, distractors]);

  const [list, setList] = useState<Item[]>(initial);
  const [tray, setTray] = useState<Item[]>([]);
  const [checked, setChecked] = useState<null | boolean>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const recorded = useRef(false);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= list.length) return;
    setList((l) => {
      const c = l.slice();
      const [x] = c.splice(from, 1);
      c.splice(to, 0, x);
      return c;
    });
    setChecked(null);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (drag === null) return;
    const y = e.clientY;
    let target = drag;
    rows.current.forEach((el, i) => {
      if (!el) return;
      const r = el.getBoundingClientRect();
      if (y > r.top && y < r.bottom) target = i;
    });
    if (target !== drag) {
      move(drag, target);
      setDrag(target);
    }
  };

  const correctTexts = lines.map((l) => l.text);
  const check = () => {
    const ok = list.length === correctTexts.length && list.every((it, i) => it.text === correctTexts[i]);
    setChecked(ok);
    if (!recorded.current) {
      recorded.current = true;
      recordQuiz(id, ok);
    }
  };

  return (
    <section className={s.box} aria-label="Put the lines in order">
      <div className={s.label}>Put in order</div>
      <div className={s.prompt} dangerouslySetInnerHTML={{ __html: promptHtml }} />
      <ol className={s.orderList} onPointerMove={onPointerMove} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
        {list.map((it, i) => {
          const pos = checked !== null ? (it.text === correctTexts[i] ? s.rowGood : s.rowBad) : "";
          return (
            <li key={it.key} ref={(el) => void (rows.current[i] = el)} className={cx(s.orderRow, drag === i && s.dragging, pos)}>
              <span
                className={s.handle}
                aria-hidden
                onPointerDown={(e) => {
                  (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                  setDrag(i);
                }}
              >
                ⋮⋮
              </span>
              <code className={s.orderCode} dangerouslySetInnerHTML={{ __html: it.html || " " }} />
              <span className={s.rowBtns}>
                <button type="button" aria-label="Move up" onClick={() => move(i, i - 1)} disabled={i === 0}>
                  ↑
                </button>
                <button type="button" aria-label="Move down" onClick={() => move(i, i + 1)} disabled={i === list.length - 1}>
                  ↓
                </button>
                {distractors.length > 0 && (
                  <button
                    type="button"
                    aria-label="Not needed"
                    title="Not needed"
                    onClick={() => {
                      setTray((t) => [...t, it]);
                      setList((l) => l.filter((x) => x.key !== it.key));
                      setChecked(null);
                    }}
                  >
                    ×
                  </button>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      {tray.length > 0 && (
        <div className={s.tray}>
          <div className={s.miniLabel}>Not needed</div>
          {tray.map((it) => (
            <button
              key={it.key}
              type="button"
              className={s.trayItem}
              onClick={() => {
                setTray((t) => t.filter((x) => x.key !== it.key));
                setList((l) => [...l, it]);
                setChecked(null);
              }}
              title="Put back"
            >
              <code dangerouslySetInnerHTML={{ __html: it.html }} />
            </button>
          ))}
        </div>
      )}
      <div className={s.actions}>
        <button type="button" className="btn btn-primary" onClick={check}>
          Check
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => {
            setList(initial);
            setTray([]);
            setChecked(null);
          }}
        >
          Reset
        </button>
        {checked === false && <span className={s.inlineBad}>Some lines are out of place.</span>}
      </div>
      {checked && (
        <div className={cx(s.feedback, s.good)} aria-live="polite">
          <strong>Right order.</strong> {whyHtml && <span dangerouslySetInnerHTML={{ __html: whyHtml }} />}
        </div>
      )}
    </section>
  );
}
