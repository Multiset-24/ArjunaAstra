import type { Metadata } from "next";
import Link from "next/link";
import { Enso } from "@/components/shell/Enso";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="container narrow page" style={{ textAlign: "center", paddingTop: 96 }}>
      <div style={{ display: "flex", justifyContent: "center", color: "var(--text-3)" }}>
        <Enso size={72} />
      </div>
      <h1 style={{ fontSize: "2rem", marginTop: 24 }}>Nothing here</h1>
      <p className="muted" style={{ marginTop: 12 }}>The page you were looking for has moved or never existed.</p>
      <p style={{ marginTop: 24 }}>
        <Link href="/learn" className="btn">
          Back to lessons
        </Link>
      </p>
    </div>
  );
}
