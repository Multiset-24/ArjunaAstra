import type { Metadata } from "next";

const FALLBACK_SITE = "https://teacherv0.netlify.app";

/** Absolute origin for canonical URLs, Open Graph, robots, and the sitemap. */
export function siteUrl(): URL {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    try {
      return new URL(raw);
    } catch {
      // Ignore a malformed build-time value and keep the public site.
    }
  }
  return new URL(FALLBACK_SITE);
}

export function canonical(path: string): NonNullable<Metadata["alternates"]> {
  return { canonical: path };
}

/** Account pages: not for search indexes. */
export const noIndex: NonNullable<Metadata["robots"]> = { index: false, follow: false };
