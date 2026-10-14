import type { Metadata } from "next";
import { AuthForm } from "@/components/review/AuthForm";
export const metadata: Metadata = { title: "Sign in" };
export default function Page() {
  return <AuthForm mode="sign-in" />;
}
