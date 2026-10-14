import type { ReactNode } from "react";
import s from "./md.module.css";

const LABEL: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  warn: "Careful",
  key: "Key idea",
  truth: "Reality check",
};

export function Callout({ kind = "note", title, children }: { kind?: string; title?: string; children?: ReactNode }) {
  return (
    <aside className={`${s.callout} ${s[`k_${kind}`] ?? ""}`} role="note">
      <div className={s.calloutLabel}>{title || LABEL[kind] || kind}</div>
      <div className={s.calloutBody}>{children}</div>
    </aside>
  );
}

export function DetailsBlock({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <details className={s.details}>
      <summary>
        <span className={s.chev} aria-hidden>
          ›
        </span>
        {title || "Details"}
      </summary>
      <div className={s.detailsBody}>{children}</div>
    </details>
  );
}

export function HintBlock({ title, children }: { title?: string; children?: ReactNode }) {
  return (
    <details className={`${s.details} ${s.hint}`}>
      <summary>
        <span className={s.chev} aria-hidden>
          ›
        </span>
        Show {title?.toLowerCase().startsWith("hint") ? title.toLowerCase() : `hint${title ? `: ${title}` : ""}`}
      </summary>
      <div className={s.detailsBody}>{children}</div>
    </details>
  );
}
