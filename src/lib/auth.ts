import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { dbEnabled, getDb, schema } from "./db";

export const authEnabled = dbEnabled;

const providers = {
  github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
};
export const authProviders = providers;

let secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  if (process.env.NODE_ENV === "production" && authEnabled) console.warn("[teacher] BETTER_AUTH_SECRET is not set — set it in production.");
  secret = "teacher-dev-secret-change-me-teacher-dev-secret";
}

function create() {
  return betterAuth({
    secret,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(getDb(), {
      provider: "sqlite",
      schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
    }),
    emailAndPassword: { enabled: true, minPasswordLength: 8, autoSignIn: true },
    socialProviders: {
      ...(providers.github ? { github: { clientId: process.env.GITHUB_CLIENT_ID!, clientSecret: process.env.GITHUB_CLIENT_SECRET! } } : {}),
      ...(providers.google ? { google: { clientId: process.env.GOOGLE_CLIENT_ID!, clientSecret: process.env.GOOGLE_CLIENT_SECRET! } } : {}),
    },
    telemetry: { enabled: false },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof create>;
let _auth: Auth | null = null;
/** Lazily created so builds without a database still work. */
export function getAuth(): Auth {
  if (!authEnabled) throw new Error("auth disabled");
  return (_auth ??= create());
}

export async function getSessionUser(headers: Headers) {
  if (!authEnabled) return null;
  try {
    const s = await getAuth().api.getSession({ headers });
    return s?.user ?? null;
  } catch {
    return null;
  }
}
