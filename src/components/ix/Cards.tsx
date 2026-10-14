"use client";
import { useState } from "react";
import type { CardsPayload } from "@/lib/content/blocks";
import { cx } from "@/lib/utils";
import s from "./ix.module.css";

export function Cards({ cards }: CardsPayload) {
  const [flipped, setFlipped] = useState<Record<string, boolean>>({});
  return (
    <section className={s.box} aria-label="Flashcards">
      <div className={s.label}>Flashcards</div>
      <div className={s.sub}>Answer in your head, then flip. These join your review deck when you finish the lesson.</div>
      <div className={s.cardGrid}>
        {cards.map((c) => {
          const f = !!flipped[c.id];
          return (
            <button
              key={c.id}
              type="button"
              className={cx(s.card, f && s.cardFlipped)}
              aria-pressed={f}
              onClick={() => setFlipped((x) => ({ ...x, [c.id]: !f }))}
            >
              <span className={s.cardSide}>{f ? "Answer" : "Question"}</span>
              <span className={s.cardText} dangerouslySetInnerHTML={{ __html: f ? c.aHtml : c.qHtml }} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
