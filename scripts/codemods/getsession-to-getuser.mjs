#!/usr/bin/env node
// Codemod: supabase.auth.getSession() -> supabase.auth.getUser()
//
// getSession() reads the client-supplied cookie without verifying the JWT
// signature (an attacker can forge any user.id). getUser() verifies the JWT
// against the Supabase Auth server and fails CLOSED. This script rewrites
// the dominant "resolve identity" idiom across app/api + lib. Files whose
// shape does not match the handled idioms are left untouched and reported
// as SKIPPED for manual fixing.
//
// Usage: node scripts/codemods/getsession-to-getuser.mjs

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const REPO_ROOT = new URL("../../", import.meta.url).pathname;

// Hand-handled elsewhere, must not be touched by this codemod.
const EXCLUDE = new Set([
  "lib/supabase.ts",
  "lib/auth/require.ts",
  "app/api/bookings/guest-lookup/route.ts",
  "lib/bookings/guest-access.ts",
  "lib/bookings/authorize.ts",
]);

function getCandidateFiles() {
  const out = execSync('grep -rl "auth.getSession()" app/api lib', {
    cwd: REPO_ROOT,
    encoding: "utf8",
  });
  return out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((f) => !EXCLUDE.has(f));
}

// Matches the dominant idiom, single-line or multi-line (\s* spans newlines):
//   const { data: { session } } = await <client>.auth.getSession();
// optionally immediately followed by the redundant:
//   const user = session?.user ?? null;
const ASSIGN_RE =
  /const\s*\{\s*data:\s*\{\s*session\s*\}\s*,?\s*\}\s*=\s*await\s+(\w+)\.auth\.getSession\(\);(\s*const\s+user\s*=\s*session\?\.\s*user\s*(?:\?\?\s*null)?\s*;)?/g;

// Conservative disqualifiers: if any of these appear, the file's shape does
// not match the handled idiom (aliased error destructure, or reliance on
// token/session fields getUser() cannot supply), so it is skipped entirely.
const DISQUALIFIERS = [
  { re: /data:\s*\{\s*session\s*\}\s*,\s*error:/, reason: "aliased error destructure (e.g. `error: authError`) alongside session" },
  { re: /session\.access_token/, reason: "reads session.access_token" },
  { re: /session\?\.\s*access_token/, reason: "reads session?.access_token" },
  { re: /session\.refresh_token/, reason: "reads session.refresh_token" },
  { re: /session\.expires_at/, reason: "reads session.expires_at" },
  { re: /session\.token_type/, reason: "reads session.token_type" },
  { re: /session\.provider_token/, reason: "reads session.provider_token" },
  { re: /data:\s*\{\s*session\s*:\s*null\s*\}/, reason: "fallback object shape (ternary getSession(), e.g. cookie-presence guard)" },
];

function transform(content) {
  const matches = [...content.matchAll(ASSIGN_RE)];
  if (matches.length === 0) return null;

  let out = content.replace(ASSIGN_RE, (_full, client) => {
    return `const { data: { user } } = await ${client}.auth.getUser();`;
  });

  // Reference rewrites, most specific first, applied whole-file (safe here:
  // every remaining `session` occurrence in a candidate file was verified to
  // originate from the getSession() call just replaced above, not a foreign
  // or aliased variable).
  out = out
    .replace(/session\?\.\s*user\?\.\s*/g, "user?.")
    .replace(/session\?\.\s*user\b/g, "user")
    .replace(/session\.user\./g, "user.")
    .replace(/session\.user\b/g, "user")
    .replace(/!session\b(?![.?_a-zA-Z0-9])/g, "!user")
    .replace(/\bsession\b(?=\s*&&)/g, "user")
    .replace(/(?<=&&\s*)\bsession\b(?![.?_a-zA-Z0-9])/g, "user")
    .replace(/(?<=\|\|\s*)\bsession\b(?![.?_a-zA-Z0-9])/g, "user");

  return out;
}

function main() {
  const files = getCandidateFiles();
  const transformed = [];
  const skipped = [];
  const warnings = [];

  for (const rel of files) {
    const abs = REPO_ROOT + rel;
    const content = readFileSync(abs, "utf8");

    const disqualified = DISQUALIFIERS.find((d) => d.re.test(content));
    if (disqualified) {
      skipped.push({ file: rel, reason: disqualified.reason });
      continue;
    }

    const out = transform(content);
    if (out === null) {
      skipped.push({ file: rel, reason: "no matching getSession() assignment pattern found (custom destructure / ternary / other shape)" });
      continue;
    }

    if (out.includes("auth.getSession()")) {
      warnings.push(`${rel}: still contains auth.getSession() after transform, review manually`);
    }
    if (/\bsession\b(?![.?_a-zA-Z0-9])/.test(out.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, ""))) {
      warnings.push(`${rel}: still references a bare 'session' identifier outside comments after transform, review manually`);
    }

    writeFileSync(abs, out, "utf8");
    transformed.push(rel);
  }

  console.log(`\nTRANSFORMED (${transformed.length}):`);
  transformed.forEach((f) => console.log(`  ${f}`));

  console.log(`\nSKIPPED (${skipped.length}):`);
  skipped.forEach(({ file, reason }) => console.log(`  ${file} - ${reason}`));

  if (warnings.length) {
    console.log(`\nWARNINGS (${warnings.length}):`);
    warnings.forEach((w) => console.log(`  ${w}`));
  }
}

main();
