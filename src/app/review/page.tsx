import type { Metadata } from "next";
import { getAllCards, getCatalog } from "@/lib/content/catalog";
import { Review } from "@/components/review/Review";
import { noIndex } from "@/lib/site";

export const metadata: Metadata = { title: "Review", description: "Spaced-repetition flashcards from the lessons you finished.", robots: noIndex };

export default function ReviewPage() {
  const cat = getCatalog();
  const cards = getAllCards();
  const titles: Record<string, string> = {};
  for (const card of cards) {
    if (titles[card.lessonId]) continue;
    titles[card.lessonId] = cat.lessons[card.lessonId]?.title ?? card.lessonId;
  }
  return <Review cards={cards} titles={titles} />;
}
