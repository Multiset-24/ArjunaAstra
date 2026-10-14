"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import s from "./auth.module.css";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [cfg, setCfg] = useState<{ authEnabled: boolean; providers: { github: boolean; google: boolean } } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg({ authEnabled: false, providers: { github: false, google: false } }));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res =
      mode === "sign-up"
        ? await authClient.signUp.email({ name: name.trim() || email.split("@")[0], email, password })
        : await authClient.signIn.email({ email, password });
    setBusy(false);
    if (res.error) setError(res.error.message ?? "Something went wrong.");
    else location.href = "/";
  };

  const up = mode === "sign-up";
  return (
    <div className={s.wrap}>
      <h1 className={s.title}>{up ? "Create your account" : "Welcome back"}</h1>
      <p className="muted" style={{ marginBottom: 24 }}>
        {up ? "Sync progress, notes and flashcards across devices." : "Sign in to sync your progress."} Everything also works without an account.
      </p>
      {cfg && !cfg.authEnabled ? (
        <div className={s.notice}>Accounts are not enabled on this deployment — your progress is saved in this browser.</div>
      ) : (
        <>
          <form onSubmit={submit} className={s.form}>
            {up && (
              <div className="field">
                <label htmlFor="name">Name</label>
                <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </div>
            )}
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
            <div className="field">
              <label htmlFor="pw">Password</label>
              <input
                id="pw"
                className="input"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={up ? "new-password" : "current-password"}
              />
              {up && <span className="faint" style={{ fontSize: "var(--fs-xs)" }}>At least 8 characters.</span>}
            </div>
            {error && <p className={s.error}>{error}</p>}
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Please wait…" : up ? "Create account" : "Sign in"}
            </button>
          </form>
          {cfg && (cfg.providers.github || cfg.providers.google) && (
            <div className={s.social}>
              {cfg.providers.github && (
                <button className="btn" onClick={() => authClient.signIn.social({ provider: "github", callbackURL: "/" })}>
                  Continue with GitHub
                </button>
              )}
              {cfg.providers.google && (
                <button className="btn" onClick={() => authClient.signIn.social({ provider: "google", callbackURL: "/" })}>
                  Continue with Google
                </button>
              )}
            </div>
          )}
          <p className="faint" style={{ marginTop: 20, fontSize: "var(--fs-sm)" }}>
            {up ? (
              <>
                Already have an account? <Link href="/sign-in">Sign in</Link>
              </>
            ) : (
              <>
                New here? <Link href="/sign-up">Create an account</Link>
              </>
            )}
          </p>
        </>
      )}
    </div>
  );
}
