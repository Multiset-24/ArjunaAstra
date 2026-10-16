import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api", "/profile", "/notebook", "/review", "/sign-in", "/sign-up"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  };
}
