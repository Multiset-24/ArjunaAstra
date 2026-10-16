/** Public dev fallback. Never used to sign sessions in a production server. */
export const DEV_AUTH_SECRET = "teacher-dev-secret-change-me-teacher-dev-secret";

export class MissingAuthSecretError extends Error {
  constructor() {
    super("BETTER_AUTH_SECRET is required in production.");
    this.name = "MissingAuthSecretError";
  }
}

/**
 * Signing secret for Better Auth.
 *
 * Read when the auth instance is created, not when this module is imported.
 * `next build` runs with NODE_ENV=production and sets NEXT_PHASE to
 * `phase-production-build`. On Netlify, BETTER_AUTH_SECRET can be present only
 * in the function runtime, so throwing while pages are prerendered would fail
 * the deploy even when live requests have the secret. The build process and
 * the server are separate: a build-time fallback is not the secret that signs
 * production sessions.
 */
export function resolveAuthSecret(env: NodeJS.ProcessEnv = process.env): string {
  const secret = env.BETTER_AUTH_SECRET?.trim();
  if (secret) return secret;
  const building = env.NEXT_PHASE === "phase-production-build";
  if (env.NODE_ENV === "production" && !building) throw new MissingAuthSecretError();
  return DEV_AUTH_SECRET;
}
