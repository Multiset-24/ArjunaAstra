import type { Metadata } from "next";
import { Profile } from "@/components/review/Profile";
export const metadata: Metadata = { title: "Profile & settings" };
export default function Page() {
  return <Profile />;
}
