// Mint the Apple "client secret" JWT for Supabase's Apple sign-in provider (web).
// Dependency-free (node crypto only). Secret is valid 6 months (Apple's max), then re-run.
//
// Usage:
//   node scripts/mint-apple-secret.mjs <path-to.p8> <TEAM_ID> <SERVICES_ID> <KEY_ID>
// Example:
//   node scripts/mint-apple-secret.mjs ~/Downloads/AuthKey_ABC123DEFG.p8 9X8Y7Z6W5V ch.solen.web ABC123DEFG
//
// Paste the output into Supabase dashboard > Authentication > Providers > Apple > Secret Key.
import { readFileSync } from "fs";
import { createPrivateKey, sign } from "crypto";

const [, , p8Path, teamId, servicesId, keyId] = process.argv;
if (!p8Path || !teamId || !servicesId || !keyId) {
  console.error("Usage: node scripts/mint-apple-secret.mjs <path-to.p8> <TEAM_ID> <SERVICES_ID> <KEY_ID>");
  process.exit(1);
}

const b64url = (buf) => Buffer.from(buf).toString("base64url");
const now = Math.floor(Date.now() / 1000);

const header = b64url(JSON.stringify({ alg: "ES256", kid: keyId, typ: "JWT" }));
const payload = b64url(JSON.stringify({
  iss: teamId,
  iat: now,
  exp: now + 60 * 60 * 24 * 180, // 6 months, Apple's maximum
  aud: "https://appleid.apple.com",
  sub: servicesId,
}));

const key = createPrivateKey(readFileSync(p8Path, "utf8"));
// ES256 JWT signatures are raw r||s (ieee-p1363), not DER.
const sig = sign("sha256", Buffer.from(`${header}.${payload}`), { key, dsaEncoding: "ieee-p1363" });

console.log(`${header}.${payload}.${b64url(sig)}`);
console.error("\n[mint-apple-secret] Valid until " + new Date((now + 60 * 60 * 24 * 180) * 1000).toISOString().slice(0, 10) + " , re-run before then and update Supabase.");
