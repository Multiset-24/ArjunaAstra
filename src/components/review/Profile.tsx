"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { oauthErrorMessage } from "@/lib/oauth-errors";
import { useProgress } from "@/lib/store/progress";
import { solvedCount, streak } from "@/lib/progress-utils";
import s from "./review.module.css";

export function Profile() {
  const p = useProgress();
  const { state, user } = p;
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [githubOn, setGithubOn] = useState(false);
  const [githubLinked, setGithubLinked] = useState<boolean | null>(null);
  const [linkBusy, setLinkBusy] = useState(false);
  const [msgIsError, setMsgIsError] = useState(false);
  useEffect(() => {
    setMounted(true);
    const message = oauthErrorMessage(new URLSearchParams(window.location.search).get("error"));
    if (message) {
      setMsgIsError(true);
      setMsg(message);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  }, []);
  useEffect(() => {
    if (!user) return;
    let cancel = false;
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg: { providers?: { github?: boolean } }) => {
        if (!cancel) setGithubOn(!!cfg.providers?.github);
      })
      .catch(() => {
        if (!cancel) setGithubOn(false);
      });
    authClient
      .listAccounts()
      .then((res) => {
        if (!cancel) setGithubLinked((res.data ?? []).some((a) => a.providerId === "github"));
      })
      .catch(() => {
        if (!cancel) setGithubLinked(false);
      });
    return () => {
      cancel = true;
    };
  }, [user]);
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
                if (f) {
                  const ok = p.importData(await f.text());
                  setMsgIsError(!ok);
                  setMsg(ok ? "Imported." : "That file doesn't look like a teacher export.");
                }
              }}
            />
          </div>,
        )}
        {user && githubOn && githubLinked !== null && row("GitHub", githubLinked ? <span>Connected</span> : (
          <span style={{ display: "grid", gap: 6, justifyItems: "start" }}>
            <button
              type="button"
              className="btn btn-sm"
              disabled={linkBusy}
              onClick={async () => {
                setLinkBusy(true);
                setMsg(null);
                const res = await authClient.linkSocial({ provider: "github", callbackURL: "/profile", errorCallbackURL: "/profile" });
                if (res.error) {
                  setLinkBusy(false);
                  setMsgIsError(true);
                  setMsg(res.error.message ?? "Could not connect GitHub.");
                }
              }}
            >
              {linkBusy ? "Connecting…" : "Connect GitHub"}
            </button>
            <span className="faint" style={{ fontSize: "var(--fs-xs)" }}>Uses the GitHub account with this same email.</span>
          </span>
        ))}
        {user && row("Account", <button className="btn btn-sm" onClick={async () => { await authClient.signOut(); location.href = "/"; }}>Sign out</button>)}
      </section>
      {msg && (
        <p className={msgIsError ? undefined : "muted"} style={{ marginTop: 12, color: msgIsError ? "var(--rose)" : undefined, fontSize: "var(--fs-sm)" }}>
          {msg}
        </p>
      )}
    </div>
  );
}
