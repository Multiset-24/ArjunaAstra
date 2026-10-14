import type { Metadata } from "next";
import { getAllProblems, getCatalog } from "@/lib/content/catalog";
import { Practice, type LessonGroup } from "@/components/practice/Practice";

export const metadata: Metadata = { title: "Practice", description: "Codeforces rating ladder, daily problems and every lesson's practice set." };

export default function PracticePage() {
  const cat = getCatalog();
  const all = getAllProblems();
  const groups: LessonGroup[] = [];
  for (const t of cat.tracks)
    for (const st of t.stages)
      for (const id of st.lessons) {
        const ps = Object.values(all).filter((p) => p.lessons[0] === id);
        if (ps.length) groups.push({ lessonId: id, title: cat.lessons[id]?.title ?? id, track: t.id, problems: ps.map(({ lessons: _l, ...p }) => (void _l, p)) });
      }
  return <Practice groups={groups} />;
}
