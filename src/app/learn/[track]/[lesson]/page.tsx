import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalog, getLesson, getTrack } from "@/lib/content/catalog";
import { Markdown } from "@/components/md/Markdown";
import { LessonView } from "@/components/lesson/LessonView";

export function generateStaticParams() {
  const ids = Object.values(getCatalog().lessons).map((l) => ({ track: l.track, lesson: l.slug }));
  return ids.length ? ids : [{ track: "dsa", lesson: "start-here" }];
}

export async function generateMetadata({ params }: { params: Promise<{ track: string; lesson: string }> }): Promise<Metadata> {
  const { track, lesson } = await params;
  const l = getLesson(track, lesson);
  return l ? { title: l.title, description: l.summary } : {};
}

export default async function LessonPage({ params }: { params: Promise<{ track: string; lesson: string }> }) {
  const { track, lesson } = await params;
  const l = getLesson(track, lesson);
  const t = getTrack(track);
  if (!l || !t) notFound();
  const cat = getCatalog();
  const nav = t.stages.map((s) => ({
    id: s.id,
    title: s.title,
    lessons: s.lessons.map((id) => ({ id, title: cat.lessons[id]?.title ?? id })),
  }));
  const sections = l.sections.map((s) => ({ id: s.id, title: s.title, node: <Markdown hast={s.hast} /> }));
  const { sections: _s, cards, ...rest } = l;
  void _s;
  return (
    <LessonView
      lesson={{ ...rest, cardIds: cards.map((c) => c.id) }}
      track={{ id: t.id, title: t.title, nav }}
      stageTitle={t.stages.find((s) => s.id === l.stage)?.title ?? ""}
      prevTitle={l.prev ? cat.lessons[l.prev]?.title : undefined}
      nextTitle={l.next ? cat.lessons[l.next]?.title : undefined}
      sections={sections}
    />
  );
}
