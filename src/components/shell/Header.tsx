"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useProgress } from "@/lib/store/progress";
import { Enso } from "./Enso";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { openPalette } from "./CommandPalette";
import s from "./shell.module.css";

const LINKS = [
  { href: "/learn", label: "Learn" },
  { href: "/practice", label: "Practice" },
  { href: "/review", label: "Review" },
  { href: "/notebook", label: "Notebook" },
];

export function Header() {
  const path = usePathname();
  const { state, ready } = useProgress();
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => setNow(Date.now()), [state.cards]);
  useEffect(() => setOpen(false), [path]);
  const due = ready && now ? Object.values(state.cards).filter((c) => c.due <= now).length : 0;

  const nav = LINKS.map((l) => (
    <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? "page" : undefined}>
      {l.label}
      {l.href === "/review" && due > 0 && <span className={s.badge}>{due}</span>}
    </Link>
  ));

  return (
    <header className={s.header}>
      <div className={s.inner}>
        <Link href="/" className={s.brand} aria-label="teacher — home">
          <Enso size={26} />
          <span className={s.word}>teacher</span>
        </Link>
        <nav className={s.nav} aria-label="Main">
          {nav}
        </nav>
        <div className={s.right}>
          <button type="button" className={s.search} onClick={openPalette} aria-label="Search lessons">
            <span className={s.searchText}>Search lessons</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <kbd>/</kbd>
          </button>
          <ThemeToggle className={s.icon} />
          <UserMenu />
          <button type="button" className={`${s.icon} ${s.burger}`} aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>
      {open && <nav className={s.mobileNav} aria-label="Mobile">{nav}</nav>}
    </header>
  );
}
