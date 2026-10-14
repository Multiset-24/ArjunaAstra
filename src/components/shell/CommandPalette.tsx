"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { SearchEntry } from "@/lib/content/types";
import { useProgress } from "@/lib/store/progress";
import { TRACK_LABEL } from "@/lib/utils";
import s from "./shell.module.css";

export function openPalette() {
  window.dispatchEvent(new Event("teacher:palette"));
}

interface Item {
  id: string;
  title: string;
  meta: string;
  href?: string;
  run?: () => void;
  score: number;
}

function score(e: SearchEntry, q: string): number {
  const t = e.title.toLowerCase();
  let sc = 0;
  for (const w of q.split(/\s+/).filter(Boolean)) {
    if (t.startsWith(w)) sc += 10;
    else if (t.includes(w)) sc += 6;
    else if (e.tags.some((x) => x.toLowerCase().includes(w))) sc += 4;
    else if (e.headings.some((h) => h.toLowerCase().includes(w))) sc += 3;
    else if (e.summary.toLowerCase().includes(w)) sc += 2;
    else if (TRACK_LABEL[e.track]?.toLowerCase().includes(w)) sc += 1;
    else return 0;
  }
  return sc;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);
  const router = useRouter();
  const { state, setPref } = useProgress();
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement)?.tagName) || (e.target as HTMLElement)?.isContentEditable;
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("teacher:palette", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("teacher:palette", onOpen);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSel(0);
    setTimeout(() => input.current?.focus(), 10);
    if (!entries)
      fetch("/api/search")
        .then((r) => r.json())
        .then(setEntries)
        .catch(() => setEntries([]));
  }, [open, entries]);

  const items = useMemo<Item[]>(() => {
    const actions: Item[] = [
      { id: "a-theme", title: state.prefs.theme === "paper" ? "Switch to walnut theme" : "Switch to paper theme", meta: "Action", run: () => setPref("theme", state.prefs.theme === "paper" ? "dark" : "paper"), score: 1 },
      { id: "a-practice", title: "Practice ladder", meta: "Go to", href: "/practice", score: 1 },
      { id: "a-review", title: "Review flashcards", meta: "Go to", href: "/review", score: 1 },
      { id: "a-notebook", title: "My notebook", meta: "Go to", href: "/notebook", score: 1 },
    ];
    const query = q.trim().toLowerCase();
    if (!query) return actions;
    const lessons = (entries ?? [])
      .map((e) => ({ id: e.id, title: e.title, meta: `${TRACK_LABEL[e.track] ?? e.track} · ${e.summary}`, href: `/learn/${e.id}`, score: score(e, query) }))
      .filter((i) => i.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
    return [...lessons, ...actions.filter((a) => a.title.toLowerCase().includes(query))];
  }, [q, entries, state.prefs.theme, setPref]);

  if (!open) return null;
  const go = (i: Item) => {
    setOpen(false);
    if (i.run) i.run();
    else if (i.href) router.push(i.href);
  };
  return (
    <div className={s.backdrop} onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className={s.palette} role="dialog" aria-modal="true" aria-label="Search">
        <input
          ref={input}
          className={s.pInput}
          placeholder="Search lessons, topics, techniques…"
          value={q}
          role="combobox"
          aria-expanded="true"
          aria-controls="palette-results"
          onChange={(e) => {
            setQ(e.target.value);
            setSel(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            else if (e.key === "ArrowDown") {
              e.preventDefault();
              setSel((x) => Math.min(items.length - 1, x + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setSel((x) => Math.max(0, x - 1));
            } else if (e.key === "Enter" && items[sel]) go(items[sel]);
          }}
        />
        {items.length ? (
          <ul className={s.results} id="palette-results" role="listbox">
            {items.map((it, i) => (
              <li key={it.id} role="option" aria-selected={i === sel} className={s.result} onMouseEnter={() => setSel(i)} onClick={() => go(it)}>
                <span className={s.rTitle}>{it.title}</span>
                <span className={s.rMeta}>{it.meta}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className={s.empty}>{entries ? "Nothing matches. Try a technique, like “two pointers”." : "Loading…"}</div>
        )}
        <div className={s.pFoot}>
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> move
          </span>
          <span>
            <kbd>Enter</kbd> open
          </span>
          <span>
            <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
