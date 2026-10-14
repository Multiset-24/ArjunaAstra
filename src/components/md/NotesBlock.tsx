"use client";
import { useRef, useState, type ReactNode } from "react";
import s from "./md.module.css";

/** Copy-ready notes: the summary a learner writes into their own notebook. */
export function NotesBlock({ title, children }: { title?: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const el = ref.current;
    if (!el) return;
    const items = [...el.querySelectorAll("li")].map((li) => `- ${li.textContent?.trim()}`);
    const text = items.length ? items.join("\n") : el.innerText;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };
  return (
    <section className={s.notes} aria-label="Notes">
      <header className={s.notesHead}>
        <span className={s.notesLabel}>{title || "Notes for your notebook"}</span>
        <button type="button" className={s.copy} onClick={copy}>
          {copied ? "Copied" : "Copy notes"}
        </button>
      </header>
      <div ref={ref} className={s.notesBody}>
        {children}
      </div>
    </section>
  );
}
