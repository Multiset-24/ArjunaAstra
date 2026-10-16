import assert from "node:assert/strict";
import { test } from "node:test";
import { oauthErrorMessage } from "./oauth-errors";

test("known OAuth errors explain how an existing email account links", () => {
  const linked = oauthErrorMessage("account_not_linked");
  assert.ok(linked?.includes("password"));
  assert.ok(linked?.includes("profile"));
  assert.equal(oauthErrorMessage("email_does_not_match")?.includes("different email"), true);
});

test("unknown or empty OAuth errors stay quiet", () => {
  assert.equal(oauthErrorMessage(null), null);
  assert.equal(oauthErrorMessage(undefined), null);
  assert.equal(oauthErrorMessage(""), null);
  assert.equal(oauthErrorMessage("something_else"), null);
});
