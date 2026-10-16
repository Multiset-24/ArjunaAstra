import type { Metadata } from "next";
import { AuthForm } from "@/components/review/AuthForm";
import { noIndex } from "@/lib/site";
export const metadata: Metadata = { title: "Sign in", robots: noIndex };
export default function Page() {
  return <AuthForm mode="sign-in" />;
}
