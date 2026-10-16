"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { oauthErrorMessage } from "@/lib/oauth-errors";
import s from "./auth.module.css";

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const [cfg, setCfg] = useState<{ authEnabled: boolean; providers: { github: boolean; google: boolean } } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const message = oauthErrorMessage(new URLSearchParams(window.location.search).get("error"));
    if (message) {
      setError(message);
      const url = new URL(window.location.href);
      url.searchParams.delete("error");
      url.searchParams.delete("error_description");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    fetch("/api/config")
      .then((r) => r.json())
      .then(setCfg)
      .catch(() => setCfg({ authEnabled: false, providers: { github: false, google: false } }));
  }, []);

  const startSocial = async (provider: "github" | "google") => {
    setBusy(true);
    setError(null);
    const res = await authClient.signIn.social({
      provider,
      callbackURL: "/",
      errorCallbackURL: "/sign-in",
    });
    if (res.error) {
      setBusy(false);
      setError(res.error.message ?? "Could not start sign-in.");
    }
  };

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
                <button type="button" className="btn" disabled={busy} onClick={() => startSocial("github")}>
                  Continue with GitHub
                </button>
              )}
              {cfg.providers.google && (
                <button type="button" className="btn" disabled={busy} onClick={() => startSocial("google")}>
                  Continue with Google
                </button>
              )}
              {cfg.providers.github && (
                <p className="faint" style={{ fontSize: "var(--fs-xs)", margin: 0 }}>
                  Already registered with email? Sign in, then connect GitHub from your profile. The addresses have to match.
                </p>
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
