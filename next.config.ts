import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // libSQL ships a native binary; keep it out of the server bundle.
  serverExternalPackages: ["@libsql/client", "libsql"],
  poweredByHeader: false,
  // Files read at runtime by route handlers.
  outputFileTracingIncludes: {
    "/api/cf/*": ["./data/codeforces/problemset.json", "./.content/problems.json"],
  },
};

export default nextConfig;
