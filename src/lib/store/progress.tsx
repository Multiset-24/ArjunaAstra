"use client";
/**
 * Progress store: works signed-out (localStorage) and signed-in (localStorage cache + server sync).
 * Every mutation is applied locally first, then queued as a sync event (last write wins by `at`).
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { authClient } from "@/lib/auth-client";
import { newCard, schedule } from "@/lib/srs";
import type { SyncEvent } from "@/lib/progress-events";
import { today } from "@/lib/utils";
import { EMPTY_STATE, type ProgressApi, type ProgressState, type SessionUser, type SrsState } from "./types";

const KEY = "teacher:v1";
const THEME_KEY = "teacher:theme";

type Stored = ProgressState & { prefsAt?: number; v: 1 };
type CardWithAt = SrsState & { at?: number };

function load(): Stored {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && s.v === 1) return { ...EMPTY_STATE, ...s, prefs: { ...EMPTY_STATE.prefs, ...s.prefs }, cf: s.cf ?? {} };
    }
  } catch {}
  let theme: "dark" | "paper" = "dark";
  try {
    if (localStorage.getItem(THEME_KEY) === "paper") theme = "paper";
  } catch {}
  return { ...EMPTY_STATE, prefs: { ...EMPTY_STATE.prefs, theme }, v: 1 };
}

function save(s: Stored) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

function applyTheme(theme: string) {
  try {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
  } catch {}
}

const newer = (a?: { at: number }, b?: { at: number }) => (a?.at ?? -1) >= (b?.at ?? -1);

/** Merge server state into local; returns merged state and the events the server is missing. */
function merge(local: Stored, server: ProgressState & { prefsAt?: number }): { merged: Stored; upload: SyncEvent[] } {
  const upload: SyncEvent[] = [];
  const m: Stored = { ...local };
  const mergeMap = <V extends { at: number }>(l: Record<string, V>, r: Record<string, V>, toEvent: (k: string, v: V) => SyncEvent) => {
    const out: Record<string, V> = { ...r };
    for (const [k, v] of Object.entries(l)) {
      if (!r[k] || newer(v, r[k])) {
        out[k] = v;
        if (!r[k] || v.at > r[k].at) upload.push(toEvent(k, v));
      }
    }
    return out;
  };
  m.lessons = mergeMap(local.lessons, server.lessons ?? {}, (key, v) => ({ t: "lesson", key, done: v.done, at: v.at }));
  m.problems = mergeMap(local.problems, (server.problems ?? {}) as ProgressState["problems"], (key, v) => ({ t: "problem", key, status: v.status, source: v.source, at: v.at }));
  for (const [k, v] of Object.entries(m.problems)) if ((v.status as string) === "none") delete m.problems[k];
  m.quiz = mergeMap(local.quiz, server.quiz ?? {}, (key, v) => ({ t: "quiz", key, correct: v.correct, attempts: v.attempts, at: v.at }));
  m.notes = mergeMap(local.notes, server.notes ?? {}, (key, v) => ({ t: "note", key, body: v.text, at: v.at }));
  const lc = local.cards as Record<string, CardWithAt>;
  const rc = (server.cards ?? {}) as Record<string, CardWithAt>;
  const cards: Record<string, CardWithAt> = { ...rc };
  for (const [k, v] of Object.entries(lc)) {
    if (!rc[k] || (v.at ?? 0) > (rc[k].at ?? 0)) {
      cards[k] = v;
      upload.push({ t: "card", key: k, ease: v.ease, interval: v.interval, reps: v.reps, lapses: v.lapses, due: v.due, at: v.at ?? Date.now() });
    }
  }
  m.cards = cards;
  const act = { ...(server.activity ?? {}) };
  for (const [d, c] of Object.entries(local.activity)) {
    if ((act[d] ?? 0) < c) {
      act[d] = c;
      upload.push({ t: "activity", key: d, count: c, at: Date.now() });
    }
  }
  m.activity = act;
  if ((server.prefsAt ?? 0) > (local.prefsAt ?? 0) && server.prefs && Object.keys(server.prefs).length) {
    m.prefs = { ...local.prefs, ...server.prefs };
    m.prefsAt = server.prefsAt;
  } else if (local.prefsAt) {
    upload.push({ t: "prefs", prefs: local.prefs as unknown as Record<string, string>, at: local.prefsAt });
  }
  if (server.cf?.handle && !(local.cf.syncedAt && local.cf.syncedAt > (server.cf.syncedAt ?? 0))) m.cf = server.cf;
  return { merged: m, upload };
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Stored>(() => ({ ...EMPTY_STATE, v: 1 }));
  const [ready, setReady] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [authEnabled, setAuthEnabled] = useState(false);
  const stateRef = useRef(state);
  const queue = useRef<SyncEvent[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const backoff = useRef(1000);
  const userRef = useRef<SessionUser | null>(null);
  const mergedFor = useRef<string | null>(null);

  const session = authClient.useSession();
  const user: SessionUser | null = authEnabled && session.data?.user ? { id: session.data.user.id, name: session.data.user.name, email: session.data.user.email, image: session.data.user.image } : null;
  userRef.current = user;

  // load local state
  useEffect(() => {
    const s = load();
    stateRef.current = s;
    setState(s);
    applyTheme(s.prefs.theme);
    setReady(true);
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((c) => setAuthEnabled(!!c?.authEnabled))
      .catch(() => setAuthEnabled(false));
  }, []);

  const flush = useCallback(async (keepalive = false) => {
    if (!userRef.current || !queue.current.length) return;
    const batch = queue.current.splice(0, 500);
    try {
      setSyncing(true);
      const res = await fetch("/api/me/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ events: batch }), keepalive });
      if (!res.ok && res.status !== 400) throw new Error(String(res.status));
      backoff.current = 1000;
      if (queue.current.length) setTimeout(() => flush(), 50);
    } catch {
      queue.current.unshift(...batch);
      backoff.current = Math.min(backoff.current * 2, 60_000);
      timer.current = setTimeout(() => flush(), backoff.current);
    } finally {
      setSyncing(false);
    }
  }, []);

  const enqueue = useCallback(
    (events: SyncEvent[]) => {
      if (!userRef.current || !events.length) return;
      queue.current.push(...events);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => flush(), 800);
    },
    [flush],
  );

  useEffect(() => {
    const onHide = () => flush(true);
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [flush]);

  // merge with server once per signed-in user
  useEffect(() => {
    if (!ready || !user || mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    (async () => {
      try {
        setSyncing(true);
        const res = await fetch("/api/me/state");
        if (!res.ok) return;
        const { state: server } = await res.json();
        const { merged, upload } = merge(stateRef.current, server);
        stateRef.current = merged;
        setState(merged);
        save(merged);
        applyTheme(merged.prefs.theme);
        enqueue(upload);
      } catch {
      } finally {
        setSyncing(false);
      }
    })();
  }, [ready, user, enqueue]);

  const update = useCallback((f: (s: Stored) => Stored, events: SyncEvent[] = []) => {
    const next = f(stateRef.current);
    stateRef.current = next;
    setState(next);
    save(next);
    enqueue(events);
  }, [enqueue]);

  const bump = (s: Stored, events: SyncEvent[]): Stored => {
    const d = today();
    const count = (s.activity[d] ?? 0) + 1;
    events.push({ t: "activity", key: d, count, at: Date.now() });
    return { ...s, activity: { ...s.activity, [d]: count } };
  };

  const api = useMemo<ProgressApi>(() => {
    return {
      state,
      ready,
      user,
      syncing,
      setLessonDone(lessonId, done) {
        const at = Date.now();
        const ev: SyncEvent[] = [{ t: "lesson", key: lessonId, done, at }];
        update((s) => {
          let n = { ...s, lessons: { ...s.lessons, [lessonId]: { done, at } } };
          if (done && !s.lessons[lessonId]?.done) n = bump(n, ev);
          return n;
        }, ev);
      },
      setSection(lessonId, index) {
        update((s) => (index > (s.sections[lessonId] ?? -1) ? { ...s, sections: { ...s.sections, [lessonId]: index } } : s));
      },
      setProblem(key, status) {
        const at = Date.now();
        const ev: SyncEvent[] = [{ t: "problem", key, status: status ?? "none", source: "manual", at }];
        update((s) => {
          const problems = { ...s.problems };
          const wasSolved = problems[key]?.status === "solved";
          if (status) problems[key] = { status, at, source: "manual" };
          else delete problems[key];
          let n = { ...s, problems };
          if (status === "solved" && !wasSolved) n = bump(n, ev);
          return n;
        }, ev);
      },
      recordQuiz(blockId, correct) {
        const at = Date.now();
        update(
          (s) => ({ ...s, quiz: { ...s.quiz, [blockId]: { correct, attempts: (s.quiz[blockId]?.attempts ?? 0) + 1, at } } }),
          [{ t: "quiz", key: blockId, correct, attempts: (stateRef.current.quiz[blockId]?.attempts ?? 0) + 1, at }],
        );
      },
      enrollCards(ids) {
        const now = Date.now();
        const ev: SyncEvent[] = [];
        update((s) => {
          const cards = { ...s.cards } as Record<string, CardWithAt>;
          for (const id of ids)
            if (!cards[id]) {
              const c = { ...newCard(now), at: now };
              cards[id] = c;
              ev.push({ t: "card", key: id, ease: c.ease, interval: c.interval, reps: c.reps, lapses: c.lapses, due: c.due, at: now });
            }
          return { ...s, cards };
        }, ev);
      },
      gradeCard(cardId, grade) {
        const now = Date.now();
        const ev: SyncEvent[] = [];
        update((s) => {
          const prev = (s.cards[cardId] as CardWithAt) ?? newCard(now);
          const c = { ...schedule(prev, grade, now), at: now };
          ev.push({ t: "card", key: cardId, ease: c.ease, interval: c.interval, reps: c.reps, lapses: c.lapses, due: c.due, at: now });
          return bump({ ...s, cards: { ...s.cards, [cardId]: c } }, ev);
        }, ev);
      },
      saveNote(lessonId, text) {
        const at = Date.now();
        update((s) => ({ ...s, notes: { ...s.notes, [lessonId]: { text, at } } }), [{ t: "note", key: lessonId, body: text, at }]);
      },
      setPref(key, value) {
        const at = Date.now();
        if (key === "theme") applyTheme(String(value));
        const prefs = { ...stateRef.current.prefs, [key]: value };
        update((s) => ({ ...s, prefs, prefsAt: at }), [{ t: "prefs", prefs: prefs as unknown as Record<string, string>, at }]);
      },
      async syncCodeforces(handle) {
        try {
          const res = await fetch("/api/cf/sync", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ handle }) });
          const data = await res.json();
          if (!res.ok) return { ok: false, message: data.error ?? "Sync failed." };
          const now = Date.now();
          update((s) => {
            const problems = { ...s.problems };
            for (const k of data.solved as string[]) if (problems[k]?.status !== "solved") problems[k] = { status: "solved", at: now, source: "cf" };
            for (const k of data.tried as string[]) if (!problems[k]) problems[k] = { status: "tried", at: now, source: "cf" };
            return { ...s, problems, cf: { handle: data.handle, rating: data.rating, maxRating: data.maxRating, rank: data.rank, syncedAt: now } };
          });
          return { ok: true, message: `Synced ${data.solved.length} solved problems for ${data.handle}.`, solved: data.solved.length };
        } catch {
          return { ok: false, message: "Couldn't reach the server. Check your connection." };
        }
      },
      exportData() {
        return JSON.stringify(stateRef.current, null, 2);
      },
      importData(json) {
        try {
          const s = JSON.parse(json);
          if (!s || typeof s !== "object" || !s.lessons) return false;
          const next: Stored = { ...EMPTY_STATE, ...s, prefs: { ...EMPTY_STATE.prefs, ...s.prefs }, v: 1 };
          const { upload } = merge(next, { ...EMPTY_STATE });
          update(() => next, upload);
          return true;
        } catch {
          return false;
        }
      },
      resetLocal() {
        try {
          localStorage.removeItem(KEY);
        } catch {}
        update(() => ({ ...EMPTY_STATE, v: 1 }));
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, ready, user?.id, syncing, update]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useProgress must be used inside <ProgressProvider>");
  return v;
}
