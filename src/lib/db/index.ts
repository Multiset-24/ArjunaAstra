import "server-only";
import fs from "node:fs";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { drizzle, type LibSQLDatabase } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * DATABASE_URL: "file:.data/teacher.db" (default in development) or a Turso URL
 * ("libsql://<db>.turso.io", with DATABASE_AUTH_TOKEN). In production without DATABASE_URL
 * the database is disabled and the app runs in guest mode (progress in the browser).
 */
export function resolveDbUrl(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.NODE_ENV !== "production") return "file:.data/teacher.db";
  return null;
}

const url = resolveDbUrl();
export const dbEnabled = !!url;

let client: Client | null = null;
let _db: LibSQLDatabase<typeof schema> | null = null;

export function getDb(): LibSQLDatabase<typeof schema> {
  if (!url) throw new Error("Database is not configured (set DATABASE_URL)");
  if (!_db) {
    if (url.startsWith("file:")) fs.mkdirSync(path.dirname(path.resolve(url.slice(5))), { recursive: true });
    client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export { schema };
