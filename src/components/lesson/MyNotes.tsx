"use client";
import { useEffect, useRef, useState } from "react";
import { useProgress } from "@/lib/store/progress";
import s from "./lesson.module.css";

export function MyNotes({ lessonId, onClose }: { lessonId: string; onClose?: () => void }) {
  const { state, saveNote, ready, user } = useProgress();
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(true);
  const loaded = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!ready || loaded.current === lessonId) return;
    loaded.current = lessonId;
    setText(state.notes[lessonId]?.text ?? "");
  }, [ready, lessonId, state.notes]);

  const onChange = (v: string) => {
    setText(v);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveNote(lessonId, v);
      setSaved(true);
    }, 700);
  };

  return (
    <div className={s.myNotes}>
      <div className={s.myNotesHead}>
        <span className="eyebrow">My notes</span>
        <span className="faint" style={{ fontSize: "var(--fs-xs)" }}>
          {saved ? (user ? "Saved to account" : "Saved in this browser") : "Saving…"}
        </span>
        {onClose && (
          <button type="button" className={s.closeNotes} onClick={onClose} aria-label="Close notes">
            ×
          </button>
        )}
      </div>
      <textarea
        className={s.noteArea}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write it in your own words. What is the idea? When does it apply? What tripped you up?"
        aria-label="My notes for this lesson"
      />
    </div>
  );
}
