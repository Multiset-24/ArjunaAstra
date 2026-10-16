/** Friendly copy for Better Auth OAuth redirect errors (`?error=`). */
const MESSAGES: Record<string, string> = {
  account_not_linked:
    "An account with this email already exists. Sign in with your password, then connect GitHub on your profile. That keeps your progress on one account, and it only works when the GitHub email matches.",
  email_does_not_match: "That GitHub account uses a different email, so it was not linked. Use the GitHub account for this same address, or keep signing in with your password.",
  account_already_linked_to_different_user: "That GitHub account is already linked to a different user.",
  unable_to_link_account: "GitHub could not be linked. Use a verified GitHub email that matches this account, then try again.",
  email_not_found: "GitHub did not share an email address. Add a verified email on GitHub and try again.",
  email_not_verified: "That GitHub email is not verified yet. Verify it on GitHub, then try again.",
};

export function oauthErrorMessage(code: string | null | undefined): string | null {
  if (!code) return null;
  return MESSAGES[code] ?? null;
}
