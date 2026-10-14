"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useProgress } from "@/lib/store/progress";
import { solvedCount, streak } from "@/lib/progress-utils";
import s from "./review.module.css";

export function Profile() {
  const p = useProgress();
  const { state, user } = p;
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const seg = (k: "codeLang" | "theme" | "mode", opts: [string, string][]) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {opts.map(([v, label]) => (
        <button key={v} className="chip" aria-pressed={state.prefs[k] === v} onClick={() => p.setPref(k, v as never)}>
          {label}
        </button>
      ))}
    </div>
  );
  const row = (label: string, el: React.ReactNode) => (
    <div style={{ display: "grid", gridTemplateColumns: "minmax(140px, 200px) 1fr", gap: 16, alignItems: "center", padding: "14px 0", borderTop: "1px solid var(--line-soft)" }}>
      <span className="muted">{label}</span>
      <div>{el}</div>
    </div>
  );
  return (
    <div className="container narrow page">
      <div className="eyebrow">Profile</div>
      <h1 className={s.h1}>{user ? user.name : "Settings"}</h1>
      <p className="muted">
        {user ? `Signed in as ${user.email}. Progress syncs to your account.` : "You're using teacher without an account — progress is saved in this browser."}{" "}
        {!user && <Link href="/sign-up">Create an account</Link>}
      </p>
      <div className={s.counts}>
        <span>
          <strong>{Object.values(state.lessons).filter((l) => l.done).length}</strong> lessons done
        </span>
        <span>
          <strong>{solvedCount(state.problems)}</strong> problems solved
        </span>
        <span>
          <strong>{mounted ? streak(state.activity) : 0}</strong> day streak
        </span>
      </div>
      <section style={{ marginTop: 16 }}>
        {row("Code language", seg("codeLang", [["cpp", "C++"], ["java", "Java"]]))}
        {row("Theme", seg("theme", [["dark", "Walnut (dark)"], ["paper", "Paper (light)"]]))}
        {row("Lesson mode", seg("mode", [["learn", "Learn — one step at a time"], ["read", "Read — everything at once"]]))}
        {row("Codeforces", state.cf.handle ? <span>{state.cf.handle} · {state.cf.rating ?? "unrated"} · <Link href="/practice">sync</Link></span> : <Link href="/practice">Connect on the practice page</Link>)}
        {row(
          "Your data",
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              className="btn btn-sm"
              onClick={() => {
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([p.exportData()], { type: "application/json" }));
                a.download = "teacher-progress.json";
                a.click();
              }}
            >
              Export JSON
            </button>
            <button className="btn btn-sm" onClick={() => file.current?.click()}>
              Import JSON
            </button>
            <input
              ref={file}
              type="file"
              accept="application/json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setMsg(p.importData(await f.text()) ? "Imported." : "That file doesn't look like a teacher export.");
              }}
            />
          </div>,
        )}
        {user && row("Account", <button className="btn btn-sm" onClick={async () => { await authClient.signOut(); location.href = "/"; }}>Sign out</button>)}
      </section>
      {msg && <p className="muted" style={{ marginTop: 12 }}>{msg}</p>}
    </div>
  );
}
