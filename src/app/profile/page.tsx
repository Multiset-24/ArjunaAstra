import type { Metadata } from "next";
import { Profile } from "@/components/review/Profile";
import { noIndex } from "@/lib/site";
export const metadata: Metadata = { title: "Profile & settings", robots: noIndex };
export default function Page() {
  return <Profile />;
}
