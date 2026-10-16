import type { Metadata } from "next";
import Link from "next/link";
import { getCatalog } from "@/lib/content/catalog";
import { canonical } from "@/lib/site";

export const metadata: Metadata = { alternates: canonical("/") };
import { Enso } from "@/components/shell/Enso";
import { TrackRows, type TrackLite } from "@/components/home/TrackRows";
import { Today } from "@/components/home/Today";
import s from "@/components/home/home.module.css";

export default function Home() {
  const cat = getCatalog();
  const tracks: TrackLite[] = cat.tracks.map((t) => ({
    id: t.id,
    title: t.title,
    tagline: t.tagline,
    target: t.target,
    minutes: t.minutes, soon: t.status === "soon",
    lessonIds: t.stages.flatMap((st) => st.lessons),
  }));
  const order = tracks.flatMap((t) => t.lessonIds);
  const titles = Object.fromEntries(Object.values(cat.lessons).map((l) => [l.id, l.title]));
  const first = order[0];

  return (
    <div className="container">
      <section className={s.hero}>
        <div>
          <div className="eyebrow">A quiet place to learn</div>
          <h1>Learn slowly. Think clearly. Solve a lot.</h1>
          <p>
            From your first loop to Codeforces Candidate Master — plus system design, low-level design and AI engineering. Short lessons you interact with, real problems to
            practise, and honest guidance about what it takes.
          </p>
          <div className={s.heroActions}>
            {first && (
              <Link href={`/learn/${first}`} className="btn btn-primary">
                Start with the basics
              </Link>
            )}
            <Link href="/practice" className="btn">
              Open the practice ladder
            </Link>
          </div>
        </div>
        <Enso size={180} className={s.heroEnso} />
      </section>

      <Today order={order} titles={titles} />

      <div className={s.sectionHead}>
        <h2>Tracks</h2>
        <span className="faint" style={{ fontSize: "var(--fs-sm)" }}>
          {Object.keys(cat.lessons).length} lessons
        </span>
      </div>
      {tracks.length ? <TrackRows tracks={tracks} /> : <p className="muted">Lessons are being prepared. Run <code>npm run content</code>.</p>}

      <section className={s.honest} aria-label="How teacher works">
        <div>
          <h3>Practice beats reading</h3>
          <p>A lesson takes twenty minutes. The skill comes from the hundreds of problems after it. Every lesson ends with real problems from Codeforces, LeetCode and CSES.</p>
        </div>
        <div>
          <h3>Interact, don’t skim</h3>
          <p>Predict outputs, order code, step through algorithms and answer quick checks. Mistakes here are cheap — that is the point.</p>
        </div>
        <div>
          <h3>Write your own notes</h3>
          <p>Each lesson ends with copy-ready notes and flashcards. Your notebook and review deck travel with your account.</p>
        </div>
      </section>
      <div style={{ height: 72 }} />
    </div>
  );
}
