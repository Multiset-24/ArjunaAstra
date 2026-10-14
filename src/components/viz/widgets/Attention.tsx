"use client";
import { useId, useMemo, useState } from "react";
import s from "./shared.module.css";
import c from "./Attention.module.css";
import { buildAttention } from "./attentionModel";
import { str } from "./util";

export default function Attention({ input }: { input: Record<string, unknown> }) {
  const id = useId();
  const initial = str(input.sentence, "the cat sat on the mat");
  const [text, setText] = useState(initial);
  const att = useMemo(() => buildAttention(text), [text]);
  const n = att.tokens.length;
  const defaultRow = Math.max(0, att.kinds.indexOf("pronoun"));
  const [picked, setPicked] = useState<number | null>(null);
  const row = Math.min(picked ?? defaultRow, Math.max(0, n - 1));

  const order = n ? att.weights[row].map((w, j) => ({ w, j })).sort((a, b) => b.w - a.w) : [];

  return (
    <div className={s.root} role="group" aria-label="Self-attention heatmap">
      <div className={s.field}>
        <label className={s.label} htmlFor={`${id}-s`}>
          sentence
        </label>
        <input
          id={`${id}-s`}
          className={`${s.input} ${c.sentence}`}
          type="text"
          maxLength={60}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setPicked(null);
          }}
        />
        <span />
      </div>

      {n === 0 ? (
        <p className={s.status}>Type a few words to see the heatmap.</p>
      ) : (
        <>
          <div className={c.scroll}>
            <table className={c.table} style={{ ["--n" as string]: n }}>
              <caption className={s.sr}>Attention weights. Each row is a word that is looking; each column is a word it may look at. Rows sum to 100 percent.</caption>
              <thead>
                <tr>
                  <th scope="col" className={c.corner}>
                    <span className={s.sr}>looking word</span>
                  </th>
                  {att.tokens.map((t, j) => (
                    <th key={j} scope="col" className={`${c.colHead} ${j === 0 ? "" : ""}`}>
                      <span className={c.vert}>{t}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {att.tokens.map((t, i) => (
                  <tr key={i} className={i === row ? c.rowOn : undefined}>
                    <th scope="row" className={c.rowHead}>
                      <button type="button" className={c.rowBtn} aria-pressed={i === row} onClick={() => setPicked(i)} onPointerEnter={(e) => e.pointerType === "mouse" && setPicked(i)} onFocus={() => setPicked(i)}>
                        {t}
                      </button>
                    </th>
                    {att.weights[i].map((w, j) => (
                      <td
                        key={j}
                        className={`${c.cell} ${i === row && j === order[0]?.j ? c.best : ""}`}
                        style={{ background: `color-mix(in srgb, var(--accent) ${Math.round(w * 100)}%, var(--bg-elev))` }}
                        onClick={() => setPicked(i)}
                        onPointerEnter={(e) => e.pointerType === "mouse" && setPicked(i)}
                      >
                        <span className={s.sr}>
                          {t} to {att.tokens[j]}: {Math.round(w * 100)} percent
                        </span>
                        {i === row && <span aria-hidden="true" className={c.num}>{Math.round(w * 100)}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={s.readout} aria-live="polite">
            <span>
              When processing &quot;{att.tokens[row]}&quot;, attention goes to:
            </span>
            {order.slice(0, 4).map(({ w, j }) => (
              <span key={j} className={c.line}>
                <span className={c.who}>{att.tokens[j]}</span>
                <span className={c.track} aria-hidden="true">
                  <span className={c.fill} style={{ width: `${w * 100}%` }} />
                </span>
                <span>{(w * 100).toFixed(0)}%</span>
              </span>
            ))}
          </div>
        </>
      )}
      <p className={s.caption}>
        Toy model: the query and key vectors are hand-built (6 numbers per word), not learned. They are tuned so nearby words attend to each other and pronouns such as it, he and she look for nouns, preferring the
        sentence subject. Real models learn these vectors from huge amounts of text. Weights = softmax(Q K^T / sqrt(d)), d = 6; every row adds up to 100%. Tap or hover a row to inspect it.
      </p>
    </div>
  );
}
