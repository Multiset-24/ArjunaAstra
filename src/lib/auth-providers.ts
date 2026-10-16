/**
 * Social sign-in flags and GitHub account-linking policy.
 * Pure data so tests can cover it without starting Better Auth or a database.
 */

export type SocialEnv = Record<string, string | undefined>;

export interface SocialProviderFlags {
  github: boolean;
  google: boolean;
}

function present(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** True only when both the client id and the secret are non-empty. */
export function readSocialProviders(env: SocialEnv): SocialProviderFlags {
  return {
    github: !!(present(env.GITHUB_CLIENT_ID) && present(env.GITHUB_CLIENT_SECRET)),
    google: !!(present(env.GOOGLE_CLIENT_ID) && present(env.GOOGLE_CLIENT_SECRET)),
  };
}

export interface SocialClientConfig {
  clientId: string;
  clientSecret: string;
}

/**
 * Provider entries to pass to Better Auth. Missing or blank credentials are
 * omitted entirely so the server does not register a half-configured provider.
 */
export function socialProviderConfig(env: SocialEnv): {
  github?: SocialClientConfig;
  google?: SocialClientConfig;
} {
  const githubId = present(env.GITHUB_CLIENT_ID);
  const githubSecret = present(env.GITHUB_CLIENT_SECRET);
  const googleId = present(env.GOOGLE_CLIENT_ID);
  const googleSecret = present(env.GOOGLE_CLIENT_SECRET);
  return {
    ...(githubId && githubSecret ? { github: { clientId: githubId, clientSecret: githubSecret } } : {}),
    ...(googleId && googleSecret ? { google: { clientId: googleId, clientSecret: googleSecret } } : {}),
  };
}

/**
 * GitHub linking for people who already have an email account.
 *
 * Implicit linking stays enabled, and `requireLocalEmailVerified` is left at
 * the library default (`true`). Password sign-up does not verify email, so
 * "Continue with GitHub" will not attach itself to an existing password row.
 * That blocks the pre-registration takeover Better Auth warns about, and the
 * option that disables the check is deprecated.
 *
 * A signed-in user connects GitHub from their profile instead. GitHub is a
 * trusted provider, so that explicit link succeeds when the emails match
 * even though the local row was never marked verified. A different GitHub
 * email is rejected.
 */
export const githubAccountLinking = {
  enabled: true,
  trustedProviders: ["github"],
};
