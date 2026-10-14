import { sqliteTable, text, integer, real, primaryKey, index } from "drizzle-orm/sqlite-core";

const ts = (name: string) => integer(name, { mode: "timestamp_ms" });

// ---------- Better Auth core tables ----------
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: ts("created_at").notNull().$defaultFn(() => new Date()),
  updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: ts("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: ts("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: ts("updated_at").notNull().$onUpdate(() => new Date()),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: ts("access_token_expires_at"),
    refreshTokenExpiresAt: ts("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: ts("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: ts("updated_at").notNull().$onUpdate(() => new Date()),
  },
  (t) => [index("account_user_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: ts("expires_at").notNull(),
    createdAt: ts("created_at").notNull().$defaultFn(() => new Date()),
    updatedAt: ts("updated_at").notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ---------- teacher tables (all keyed by user + item, last write wins by `at`) ----------
export const profile = sqliteTable("profile", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  prefs: text("prefs").notNull().default("{}"), // JSON ProgressState["prefs"]
  cfHandle: text("cf_handle"),
  cfRating: integer("cf_rating"),
  cfMaxRating: integer("cf_max_rating"),
  cfRank: text("cf_rank"),
  cfSyncedAt: integer("cf_synced_at"),
  at: integer("at").notNull().default(0),
});

const base = () => ({
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  key: text("key").notNull(),
  at: integer("at").notNull(),
});

export const lessonProgress = sqliteTable("lesson_progress", { ...base(), done: integer("done", { mode: "boolean" }).notNull() }, (t) => [primaryKey({ columns: [t.userId, t.key] })]);
export const problemProgress = sqliteTable(
  "problem_progress",
  { ...base(), status: text("status").notNull(), source: text("source").notNull().default("manual") },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);
export const quizResult = sqliteTable(
  "quiz_result",
  { ...base(), correct: integer("correct", { mode: "boolean" }).notNull(), attempts: integer("attempts").notNull().default(1) },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);
export const reviewCard = sqliteTable(
  "review_card",
  { ...base(), ease: real("ease").notNull(), interval: real("interval").notNull(), reps: integer("reps").notNull(), lapses: integer("lapses").notNull(), due: integer("due").notNull() },
  (t) => [primaryKey({ columns: [t.userId, t.key] })],
);
export const note = sqliteTable("note", { ...base(), body: text("body").notNull() }, (t) => [primaryKey({ columns: [t.userId, t.key] })]);
/** key = YYYY-MM-DD */
export const activity = sqliteTable("activity", { ...base(), count: integer("count").notNull() }, (t) => [primaryKey({ columns: [t.userId, t.key] })]);
