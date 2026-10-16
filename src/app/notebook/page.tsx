import type { Metadata } from "next";
import { getCatalog } from "@/lib/content/catalog";
import { Notebook } from "@/components/review/Notebook";
import { noIndex } from "@/lib/site";

export const metadata: Metadata = { title: "Notebook", robots: noIndex };

export default function NotebookPage() {
  const cat = getCatalog();
  const order = cat.tracks.flatMap((t) => t.stages.flatMap((s) => s.lessons));
  const titles = Object.fromEntries(Object.values(cat.lessons).map((l) => [l.id, l.title]));
  return <Notebook order={order} titles={titles} />;
}
