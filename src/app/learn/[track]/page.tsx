import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog, getTrack } from "@/lib/content/catalog";
import { TrackPath } from "@/components/track/TrackPath";
import s from "@/components/track/track.module.css";

export function generateStaticParams() {
  const ids = getCatalog().tracks.map((t) => ({ track: t.id }));
  return ids.length ? ids : [{ track: "dsa" }];
}

export async function generateMetadata({ params }: { params: Promise<{ track: string }> }): Promise<Metadata> {
  const { track } = await params;
  const t = getTrack(track);
  return t ? { title: t.title, description: t.tagline } : {};
}

export default async function TrackPage({ params }: { params: Promise<{ track: string }> }) {
  const { track } = await params;
  const t = getTrack(track);
  if (!t) notFound();
  const { lessons } = getCatalog();
  return (
    <div className="container narrow">
      <header className={s.head}>
        <div className="eyebrow">Track</div>
        <h1>{t.title}</h1>
        <p className={s.tagline}>{t.tagline}</p>
        <div className={s.metaRow}>
          <span className="chip">{t.lessonCount} lessons</span>
          <span className="chip">~{Math.round(t.minutes / 60)} hours of lessons</span>
          <span className="chip">Target: {t.target}</span>
          {t.codeLangs.length > 0 && <span className="chip">{t.codeLangs.map((l) => ({ cpp: "C++", java: "Java", python: "Python" })[l] ?? l).join(" · ")}</span>}
        </div>
      </header>
      <details className={s.reality}>
        <summary>Reality check</summary>
        <ul>
          {t.reality.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>
      {t.status === "soon" ? (
        <div className="card" style={{ marginBottom: 64 }}>
          <div className="eyebrow">Coming soon</div>
          <p className="muted" style={{ marginTop: 8 }}>
            This track is being written right now and will appear here stage by stage. Meanwhile, the DSA and System Design tracks are ready — start there.
          </p>
          <ol style={{ marginTop: 16, paddingLeft: "1.2em", color: "var(--text-2)", display: "grid", gap: 6 }}>
            {t.stages.map((st) => (
              <li key={st.id}>
                <strong style={{ color: "var(--text)", fontWeight: 500 }}>{st.title}</strong> — {st.goal}
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <TrackPath stages={t.stages} lessons={lessons} />
      )}
    </div>
  );
}
