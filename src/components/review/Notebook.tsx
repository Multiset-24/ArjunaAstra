"use client";
import Link from "next/link";
import { useProgress } from "@/lib/store/progress";
import { MyNotes } from "@/components/lesson/MyNotes";
import { TRACK_LABEL } from "@/lib/utils";
import s from "./review.module.css";

export function Notebook({ order, titles }: { order: string[]; titles: Record<string, string> }) {
  const { state, ready } = useProgress();
  const ids = order.filter((id) => state.notes[id]?.text?.trim());
  const download = () => {
    const md = ["# My teacher notebook", "", ...ids.flatMap((id) => [`## ${titles[id] ?? id}`, `_${TRACK_LABEL[id.split("/")[0]] ?? ""}_`, "", state.notes[id].text.trim(), ""])].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    a.download = "teacher-notebook.md";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="container narrow page">
      <div className="eyebrow">Notebook</div>
      <h1 className={s.h1}>Your notes, in your words</h1>
      <p className="muted">Writing is how it sticks. Notes you write beside a lesson collect here.</p>
      <div style={{ display: "flex", gap: 10, margin: "20px 0 28px" }}>
        <button className="btn" onClick={download} disabled={!ids.length}>
          Download as Markdown
        </button>
      </div>
      {!ready ? null : ids.length ? (
        <div style={{ display: "grid", gap: 28 }}>
          {ids.map((id) => (
            <section key={id}>
              <h2 style={{ fontSize: "1.25rem", marginBottom: 8 }}>
                <Link href={`/learn/${id}`} style={{ color: "var(--text)" }}>
                  {titles[id] ?? id}
                </Link>
              </h2>
              <MyNotes lessonId={id} />
            </section>
          ))}
        </div>
      ) : (
        <div className={s.empty}>
          <h2>No notes yet.</h2>
          <p className="muted">Open any lesson and use “My notes” in the right column.</p>
          <Link className="btn" href="/learn">
            Choose a lesson
          </Link>
        </div>
      )}
    </div>
  );
}
