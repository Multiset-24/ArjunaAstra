import type { Metadata } from "next";
import { getCatalog } from "@/lib/content/catalog";
import { TrackRows } from "@/components/home/TrackRows";
import { canonical } from "@/lib/site";

export const metadata: Metadata = { title: "Learn", alternates: canonical("/learn") };

export default function LearnPage() {
  const cat = getCatalog();
  return (
    <div className="container narrow page">
      <div className="eyebrow">Learn</div>
      <h1 style={{ fontSize: "2.4rem", fontWeight: 300, margin: "8px 0 12px" }}>Choose a path</h1>
      <p className="muted" style={{ marginBottom: 28 }}>
        Each track starts from zero. Go in order the first time; later, use search (<kbd>/</kbd>) to jump to what you need.
      </p>
      <TrackRows
        tracks={cat.tracks.map((t) => ({ id: t.id, title: t.title, tagline: t.tagline, target: t.target, minutes: t.minutes, soon: t.status === "soon", lessonIds: t.stages.flatMap((s) => s.lessons) }))}
      />
    </div>
  );
}
