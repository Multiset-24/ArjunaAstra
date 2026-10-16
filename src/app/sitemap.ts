import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/content/catalog";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const cat = getCatalog();
  const paths = [
    "/",
    "/learn",
    "/practice",
    "/about",
    ...cat.tracks.map((t) => `/learn/${t.id}`),
    ...Object.values(cat.lessons).map((l) => `/learn/${l.track}/${l.slug}`),
  ];
  const parsed = cat.generatedAt ? new Date(cat.generatedAt) : undefined;
  const lastModified = parsed && !Number.isNaN(parsed.getTime()) ? parsed : undefined;
  return paths.map((path) => ({ url: new URL(path, origin).href, lastModified }));
}
