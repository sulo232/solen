// tests/lib/unsubscribe-token.test.ts
//
// lib/unsubscribe-token.ts mints and verifies the HMAC appended to outreach emails'
// unsubscribe links. It was rewritten off Node's "crypto" onto Web Crypto (crypto.subtle) so
// it could run in the Edge runtime, and that rewrite introduced a real regression:
// unsubscribeToken() threw instead of returning its documented "never verifies" placeholder
// when no secret is configured, because crypto.subtle.importKey rejects an empty HMAC key
// where Node's createHmac did not. The file's own comments make several testable promises
// (byte-identical to the old Node HMAC, fails closed with no secret, unsubscribeToken never
// throws), nothing tested any of them, and that is exactly how the regression shipped
// invisibly. Every one of those promises is pinned here so a refactor cannot quietly break it
// again.

import { describe, it, expect, afterEach } from "vitest";
import { createHmac } from "node:crypto";
import { unsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

const HEX_64 = /^[0-9a-f]{64}$/;

// getSecret() inside the lib file reads process.env.UNSUBSCRIBE_SECRET /
// SUPABASE_SERVICE_ROLE_KEY at CALL time (inside the function body), not at module load, so
// toggling process.env between tests in this one file is enough, no vi.resetModules() needed.
// Confirmed rather than assumed: the "with a secret" and "no secret" describe blocks below
// share the same imported module instance and both observe the env change they each make.
const realUnsubscribeSecret = process.env.UNSUBSCRIBE_SECRET;
const realServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function clearSecrets() {
  delete process.env.UNSUBSCRIBE_SECRET;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
}

afterEach(() => {
  if (realUnsubscribeSecret === undefined) delete process.env.UNSUBSCRIBE_SECRET;
  else process.env.UNSUBSCRIBE_SECRET = realUnsubscribeSecret;
  if (realServiceRoleKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = realServiceRoleKey;
});

describe("unsubscribeToken: with a secret configured", () => {
  it("returns a 64-char lowercase hex string", async () => {
    clearSecrets();
    process.env.UNSUBSCRIBE_SECRET = "test-secret-abc123";
    const token = await unsubscribeToken("salon@example.ch");
    expect(token).toMatch(HEX_64);
  });

  // The single most important test in the file: unsubscribe links already sent to salons must
  // keep working, so the new Web Crypto path must produce the exact bytes the old
  // Node createHmac path produced for the same key and message.
  it("is byte-identical to Node's createHmac output, the compatibility guarantee for already-sent links", async () => {
    clearSecrets();
    process.env.UNSUBSCRIBE_SECRET = "test-secret-abc123";
    const email = "salon@example.ch";
    const token = await unsubscribeToken(email);
    const expected = createHmac("sha256", "test-secret-abc123")
      .update(email.trim().toLowerCase())
      .digest("hex");
    expect(token).toBe(expected);
  });

  it("normalizes email whitespace and case: leading/trailing spaces and mixed case hash the same", async () => {
    clearSecrets();
    process.env.UNSUBSCRIBE_SECRET = "test-secret-abc123";
    const a = await unsubscribeToken("  Salon@Example.CH  ");
    const b = await unsubscribeToken("salon@example.ch");
    expect(a).toBe(b);
  });

  it("handles a unicode email address and round-trips through verifyUnsubscribeToken", async () => {
    clearSecrets();
    process.env.UNSUBSCRIBE_SECRET = "test-secret-abc123";
    const email = "coiffeur-müller@zürich.ch";
    const token = await unsubscribeToken(email);
    expect(token).toMatch(HEX_64);
    await expect(verifyUnsubscribeToken(email, token)).resolves.toBe(true);
  });
});

describe("unsubscribeToken: THE REGRESSION, no secret configured at all", () => {
  // This is the exact case that threw before the fix: crypto.subtle.importKey rejects a
  // zero-length HMAC key, and getSecret() falling back to `?? ""` fed it one. Must RESOLVE,
  // not reject, per the file's own "callers building a link don't crash" comment.
  it("resolves with a 64-char hex string instead of throwing", async () => {
    clearSecrets();
    await expect(unsubscribeToken("salon@example.ch")).resolves.toMatch(HEX_64);
  });
});

describe("verifyUnsubscribeToken: fail closed", () => {
  it("returns false with no secret configured, even for the exact token unsubscribeToken just minted", async () => {
    clearSecrets();
    const token = await unsubscribeToken("salon@example.ch");
    await expect(verifyUnsubscribeToken("salon@example.ch", token)).resolves.toBe(false);
  });
});

describe("verifyUnsubscribeToken: with a secret configured", () => {
  it("verifies a correctly minted token", async () => {
    clearSecrets();
    process.env.UNSUBSCRIBE_SECRET = "test-secret-abc123";
    const email = "salon@example.ch";
    const token = await unsubscribeToken(email);
    await expect(verifyUnsubscribeToken(email, token)).resolves.toBe(true);
  });

  it("rejects a tampered token (one flipped character)", async () => {
    clearSecrets();
    process.env.UNSUBSCRIBE_SECRET = "test-secret-abc123";
    const email = "salon@example.ch";
    const token = await unsubscribeToken(email);
    const flippedChar = token[0] === "a" ? "b" : "a";
    const flipped = flippedChar + token.slice(1);
    await expect(verifyUnsubscribeToken(email, flipped)).resolves.toBe(false);
  });

  it("rejects a truncated token", async () => {
    clearSecrets();
    process.env.UNSUBSCRIBE_SECRET = "test-secret-abc123";
    const email = "salon@example.ch";
    const token = await unsubscribeToken(email);
    await expect(verifyUnsubscribeToken(email, token.slice(0, -1))).resolves.toBe(false);
  });

  it("rejects an over-long token", async () => {
    clearSecrets();
    process.env.UNSUBSCRIBE_SECRET = "test-secret-abc123";
    const email = "salon@example.ch";
    const token = await unsubscribeToken(email);
    await expect(verifyUnsubscribeToken(email, token + "0")).resolves.toBe(false);
  });

  it("rejects an empty string", async () => {
    clearSecrets();
    process.env.UNSUBSCRIBE_SECRET = "test-secret-abc123";
    await expect(verifyUnsubscribeToken("salon@example.ch", "")).resolves.toBe(false);
  });

  it("rejects a token minted for a different email", async () => {
    clearSecrets();
    process.env.UNSUBSCRIBE_SECRET = "test-secret-abc123";
    const tokenForA = await unsubscribeToken("a@example.ch");
    await expect(verifyUnsubscribeToken("b@example.ch", tokenForA)).resolves.toBe(false);
  });
});
