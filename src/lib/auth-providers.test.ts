import assert from "node:assert/strict";
import { test } from "node:test";
import { githubAccountLinking, readSocialProviders, socialProviderConfig } from "./auth-providers";

test("GitHub stays off unless both credentials are set", () => {
  assert.equal(readSocialProviders({}).github, false);
  assert.equal(readSocialProviders({ GITHUB_CLIENT_ID: "id" }).github, false);
  assert.equal(readSocialProviders({ GITHUB_CLIENT_SECRET: "secret" }).github, false);
  assert.equal(readSocialProviders({ GITHUB_CLIENT_ID: "  ", GITHUB_CLIENT_SECRET: "secret" }).github, false);
  assert.equal(readSocialProviders({ GITHUB_CLIENT_ID: "id", GITHUB_CLIENT_SECRET: "  " }).github, false);
  assert.equal(readSocialProviders({ GITHUB_CLIENT_ID: "id", GITHUB_CLIENT_SECRET: "secret" }).github, true);
});

test("a missing GitHub secret does not register a provider", () => {
  assert.deepEqual(socialProviderConfig({ GITHUB_CLIENT_ID: "id" }), {});
  assert.deepEqual(socialProviderConfig({ GITHUB_CLIENT_ID: "", GITHUB_CLIENT_SECRET: "" }), {});
  assert.deepEqual(socialProviderConfig({ GITHUB_CLIENT_ID: " id ", GITHUB_CLIENT_SECRET: " secret " }), {
    github: { clientId: "id", clientSecret: "secret" },
  });
});

test("Google credentials are independent of GitHub", () => {
  const flags = readSocialProviders({ GOOGLE_CLIENT_ID: "g", GOOGLE_CLIENT_SECRET: "s" });
  assert.equal(flags.github, false);
  assert.equal(flags.google, true);
  assert.deepEqual(socialProviderConfig({ GOOGLE_CLIENT_ID: "g", GOOGLE_CLIENT_SECRET: "s" }), {
    google: { clientId: "g", clientSecret: "s" },
  });
});

test("existing email users link GitHub explicitly, without skipping local verification", () => {
  assert.equal(githubAccountLinking.enabled, true);
  assert.deepEqual(githubAccountLinking.trustedProviders, ["github"]);
  assert.equal("requireLocalEmailVerified" in githubAccountLinking, false);
});
