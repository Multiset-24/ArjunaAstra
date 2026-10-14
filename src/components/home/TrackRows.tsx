"use client";
import Link from "next/link";
import { useProgress } from "@/lib/store/progress";
import { EnsoRing } from "@/components/shell/Enso";
import s from "./home.module.css";

export interface TrackLite {
  id: string;
  title: string;
  tagline: string;
  target: string;
  lessonIds: string[];
  minutes: number;
  first?: string;
  soon?: boolean;
}

export function TrackRows({ tracks }: { tracks: TrackLite[] }) {
  const { state } = useProgress();
  return (
    <ol className={s.tracks}>
      {tracks.map((t, i) => {
        const done = t.lessonIds.filter((id) => state.lessons[id]?.done).length;
        const pct = t.lessonIds.length ? done / t.lessonIds.length : 0;
        return (
          <li key={t.id}>
            <Link href={`/learn/${t.id}`} className={s.track}>
              <span className={s.trackNo}>{String(i + 1).padStart(2, "0")}</span>
              <span className={s.trackMain}>
                <span className={s.trackTitle}>{t.title}</span>
                <span className={s.trackTag}>{t.tagline}</span>
                <span className={s.trackMeta}>
                  {t.soon ? `Being written now · ${t.target}` : `${t.lessonIds.length} lessons · ~${Math.round(t.minutes / 60)} h of lessons · ${t.target}`}
                </span>
              </span>
              <span className={s.trackRing}>
                <EnsoRing value={pct} size={46} label={`${done} of ${t.lessonIds.length} lessons done`} />
                <span className={s.trackPct}>{t.soon ? "Coming soon" : done ? `${done}/${t.lessonIds.length}` : "Start"}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
