/** Applies drizzle/ migrations. Safe to run repeatedly. `npm run db:migrate` (also runs before `npm run dev`). */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const url = process.env.DATABASE_URL ?? (process.env.NODE_ENV === "production" ? "" : "file:.data/teacher.db");
(async () => {
  if (!url) {
    console.log("db: DATABASE_URL not set — skipping migrations (guest mode).");
    return;
  }
  if (url.startsWith("file:")) fs.mkdirSync(path.dirname(path.resolve(url.slice(5))), { recursive: true });
  const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
  await migrate(drizzle(client), { migrationsFolder: path.join(__dirname, "..", "drizzle") });
  console.log(`db: migrations applied (${url.startsWith("file:") ? url : url.replace(/\/\/.*@/, "//***@")})`);
  client.close();
})().catch((e) => {
  console.error("db: migration failed:", e.message);
  process.exit(1);
});
