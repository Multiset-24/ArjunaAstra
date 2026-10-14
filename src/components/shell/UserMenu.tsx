"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useProgress } from "@/lib/store/progress";
import s from "./shell.module.css";

export function UserMenu() {
  const { user, syncing } = useProgress();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  if (!user)
    return (
      <Link href="/sign-in" className="btn btn-ghost btn-sm">
        Sign in
      </Link>
    );
  return (
    <div className={s.menu} ref={ref}>
      <button type="button" className={s.icon} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} aria-label="Account">
        <span className={s.avatar}>{(user.name || user.email).slice(0, 1).toUpperCase()}</span>
      </button>
      {open && (
        <div className={s.pop} role="menu">
          <div className={s.popHead}>
            <div>{user.name}</div>
            <div>{syncing ? "Syncing…" : user.email}</div>
          </div>
          <Link href="/profile" role="menuitem">
            Profile & settings
          </Link>
          <Link href="/notebook" role="menuitem">
            Notebook
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              await authClient.signOut();
              location.href = "/";
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
