import type { Metadata } from "next";
import { getAllCards, getCatalog } from "@/lib/content/catalog";
import { Review } from "@/components/review/Review";

export const metadata: Metadata = { title: "Review", description: "Spaced-repetition flashcards from the lessons you finished." };

export default function ReviewPage() {
  const cat = getCatalog();
  const titles = Object.fromEntries(Object.values(cat.lessons).map((l) => [l.id, l.title]));
  return <Review cards={getAllCards()} titles={titles} />;
}
