import type { Metadata } from "next";
import { AuthForm } from "@/components/review/AuthForm";
export const metadata: Metadata = { title: "Create account" };
export default function Page() {
  return <AuthForm mode="sign-up" />;
}
