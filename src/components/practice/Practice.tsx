"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ProblemRef } from "@/lib/content/types";
import type { CfRow, Ladder } from "@/lib/cf/types";
import { useProgress } from "@/lib/store/progress";
import { solvedCount } from "@/lib/progress-utils";
import { cx, hashString, ratingTitle, seededShuffle, today, TRACK_LABEL } from "@/lib/utils";
import { PracticeList } from "@/components/lesson/PracticeList";
import s from "./practice.module.css";

export interface LessonGroup {
  lessonId: string;
  title: string;
  track: string;
  problems: ProblemRef[];
}

const RUNGS = Array.from({ length: 17 }, (_, i) => 800 + i * 100);
const key = (p: CfRow) => `cf:${p[0]}${p[1]}`;
const url = (p: CfRow) => `https://codeforces.com/problemset/problem/${p[0]}/${p[1]}`;

export function Practice({ groups }: { groups: LessonGroup[] }) {
  const p = useProgress();
  const { state } = p;
  const [ladder, setLadder] = useState<Ladder | null>(null);
  const [failed, setFailed] = useState(false);
  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const rating = state.cf.rating;
  const defaultRung = rating ? Math.min(2400, Math.max(800, Math.round((rating + 100) / 100) * 100)) : 800;
  const [rung, setRung] = useState<number | null>(null);
  const [tag, setTag] = useState<string | null>(null);
  const [hideSolved, setHideSolved] = useState(false);
  const [openTrack, setOpenTrack] = useState<string | null>("dsa");

  useEffect(() => {
    fetch("/api/cf/ladder")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setLadder)
      .catch(() => setFailed(true));
  }, []);
  useEffect(() => {
    if (state.cf.handle) setHandle(state.cf.handle);
  }, [state.cf.handle]);

  const current = rung ?? defaultRung;
  const solved = (k: string) => state.problems[k]?.status === "solved";

  const daily = useMemo(() => {
    if (!ladder) return [];
    const base = rating ? Math.round(rating / 100) * 100 : current;
    const picks: CfRow[] = [];
    [100, 200, 300].forEach((d, i) => {
      const r = Math.min(3500, base + (rating ? d : i * 100));
      const pool = ladder.rungs.find((x) => x.rating === Math.min(2400, r))?.problems.filter((q) => !solved(key(q))) ?? [];
      const pick = seededShuffle(pool, `${today()}-${i}-${hashString(state.cf.handle ?? "")}`)[0];
      if (pick && !picks.includes(pick)) picks.push(pick);
    });
    return picks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ladder, rating, current, state.problems]);

  const rows = useMemo(() => {
    const list = ladder?.rungs.find((r) => r.rating === current)?.problems ?? [];
    return list.filter((q) => (!tag || q[5].includes(tag)) && (!hideSolved || !solved(key(q))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ladder, current, tag, hideSolved, state.problems]);

  const rungSolved = (r: number) => ladder?.rungs.find((x) => x.rating === r)?.problems.filter((q) => solved(key(q))).length ?? 0;

  const sync = async () => {
    setBusy(true);
    setMsg(null);
    const r = await p.syncCodeforces(handle.trim());
    setMsg({ ok: r.ok, text: r.message });
    setBusy(false);
  };

  const tracks = [...new Set(groups.map((g) => g.track))];

  return (
    <div className="container page">
      <div className="eyebrow">Practice</div>
      <h1 className={s.h1}>Solve a lot. Mostly a little above your level.</h1>
      <p className="muted" style={{ maxWidth: "44em" }}>
        Rating grows from volume and honest effort: pick problems about 100–300 above your current rating, give each one real time, and upsolve what you miss in contests.
        This page keeps the list; Codeforces is where the work happens.
      </p>

      <div className={s.grid}>
        <section className={s.panel} aria-label="Codeforces account">
          <div className="eyebrow">Codeforces</div>
          {state.cf.handle ? (
            <div className={s.cfStats}>
              <div>
                <div className={s.big}>{state.cf.rating ?? "—"}</div>
                <div className="faint">{state.cf.handle} · {ratingTitle(state.cf.rating)}</div>
              </div>
              <div>
                <div className={s.big}>{solvedCount(state.problems)}</div>
                <div className="faint">solved (tracked here)</div>
              </div>
              {rating ? (
                <div>
                  <div className={s.big}>
                    {Math.round(rating / 100) * 100 + 100}–{Math.round(rating / 100) * 100 + 300}
                  </div>
                  <div className="faint">your practice zone</div>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="muted" style={{ margin: "8px 0 12px", fontSize: "var(--fs-sm)" }}>
              Connect your handle to mark solved problems automatically and get problems in your zone. No password needed — only public data.
            </p>
          )}
          <form
            className={s.handleRow}
            onSubmit={(e) => {
              e.preventDefault();
              if (handle.trim()) sync();
            }}
          >
            <input className="input" placeholder="Codeforces handle" value={handle} onChange={(e) => setHandle(e.target.value)} aria-label="Codeforces handle" autoCapitalize="off" />
            <button className="btn btn-primary" disabled={busy || !handle.trim()}>
              {busy ? "Syncing…" : state.cf.handle ? "Sync again" : "Connect"}
            </button>
          </form>
          {msg && <p className={cx(s.msg, msg.ok ? s.ok : s.err)}>{msg.text}</p>}
        </section>

        <section className={s.panel} aria-label="Today's three">
          <div className="eyebrow">Today’s three</div>
          <p className="faint" style={{ fontSize: "var(--fs-sm)", margin: "6px 0 10px" }}>
            {rating ? "Picked from your zone. Same three all day." : "Connect a handle for personalised picks; until then they follow the rung you select below."}
          </p>
          {daily.length ? (
            <ol className={s.daily}>
              {daily.map((q) => (
                <li key={key(q)} className={cx(solved(key(q)) && s.dailyDone)}>
                  <a href={url(q)} target="_blank" rel="noreferrer">
                    {q[2]}
                  </a>
                  <span className="mono faint">{q[3]}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="faint">{failed ? "Could not load the ladder." : "Loading…"}</p>
          )}
        </section>
      </div>

      <section className={s.ladder} aria-label="Rating ladder">
        <div className={s.ladderHead}>
          <h2>Rating ladder</h2>
          {ladder && (
            <span className="faint" style={{ fontSize: "var(--fs-xs)" }}>
              {ladder.source === "live" ? "Live from Codeforces" : "Snapshot"} · {ladder.fetchedAt.slice(0, 10)} · most-solved problems per rating
            </span>
          )}
        </div>
        <div className={s.rungs} role="tablist" aria-label="Rating">
          {RUNGS.map((r) => {
            const total = ladder?.rungs.find((x) => x.rating === r)?.problems.length ?? 0;
            const sv = rungSolved(r);
            return (
              <button key={r} role="tab" aria-selected={r === current} className={cx(s.rung, r === current && s.rungOn)} onClick={() => setRung(r)}>
                <span>{r}</span>
                <span className={s.rungBar}>
                  <span style={{ width: total ? `${(sv / total) * 100}%` : 0 }} />
                </span>
              </button>
            );
          })}
        </div>
        {ladder && (
          <div className={s.filters}>
            <button className="chip" aria-pressed={!tag} onClick={() => setTag(null)}>
              all
            </button>
            {ladder.tags.slice(0, 16).map((t) => (
              <button key={t} className="chip" aria-pressed={tag === t} onClick={() => setTag(tag === t ? null : t)}>
                {t}
              </button>
            ))}
            <label className={s.hide}>
              <input type="checkbox" checked={hideSolved} onChange={(e) => setHideSolved(e.target.checked)} /> hide solved
            </label>
          </div>
        )}
        <ul className={s.rows}>
          {rows.map((q) => {
            const k = key(q);
            const done = solved(k);
            return (
              <li key={k} className={cx(s.row, done && s.rowDone)}>
                <input type="checkbox" checked={done} onChange={(e) => p.setProblem(k, e.target.checked ? "solved" : null)} aria-label={`Mark ${q[2]} solved`} />
                <span className="mono faint" style={{ width: 60 }}>
                  {q[0]}
                  {q[1]}
                </span>
                <a href={url(q)} target="_blank" rel="noreferrer" className={s.rowName}>
                  {q[2]}
                </a>
                <span className={s.tags}>{q[5].filter((t) => !t.startsWith("*")).slice(0, 3).join(" · ")}</span>
                <span className="mono faint">{(q[4] / 1000).toFixed(q[4] >= 10000 ? 0 : 1)}k solved</span>
              </li>
            );
          })}
          {ladder && !rows.length && <li className="faint" style={{ padding: 16 }}>Nothing left with this filter. Nice.</li>}
        </ul>
      </section>

      <section className={s.fromLessons} aria-label="Lesson problems">
        <h2>From the lessons</h2>
        <p className="faint" style={{ fontSize: "var(--fs-sm)", marginBottom: 16 }}>
          Every practice set, in lesson order. Learn the idea first — <Link href="/learn/dsa">open the track</Link> — then come back here.
        </p>
        {tracks.map((t) => (
          <details key={t} open={openTrack === t} className={s.trackGroup} onToggle={(e) => (e.currentTarget as HTMLDetailsElement).open && setOpenTrack(t)}>
            <summary>
              {TRACK_LABEL[t] ?? t}
              <span className="faint mono">
                {groups.filter((g) => g.track === t).reduce((a, g) => a + g.problems.filter((q) => solved(q.key)).length, 0)}/
                {groups.filter((g) => g.track === t).reduce((a, g) => a + g.problems.length, 0)}
              </span>
            </summary>
            {groups
              .filter((g) => g.track === t)
              .map((g) => (
                <div key={g.lessonId} className={s.lessonGroup}>
                  <PracticeList problems={g.problems} title={g.title} />
                  <Link href={`/learn/${g.lessonId}`} className={s.lessonLink}>
                    Open lesson →
                  </Link>
                </div>
              ))}
          </details>
        ))}
      </section>
    </div>
  );
}
