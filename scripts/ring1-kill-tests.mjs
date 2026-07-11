#!/usr/bin/env node
// Ring 1a kill test: rate-limit fail-mode split (lib/ratelimit.ts).
//
// Each scenario below needs a DIFFERENT CONTEXT / NODE_ENV / UPSTASH_* combo, and
// lib/ratelimit.ts caches its env read at module load, so each scenario runs
// scripts/ring1-kill-test-scenario.ts in its own child process via tsx, with only
// that scenario's env vars set. This exercises the real applyRateLimit /
// checkRateLimit / limiter exports, not a copy of their logic.
//
// Usage: node scripts/ring1-kill-tests.mjs

import { spawnSync } from "node:child_process";

// Every scenario needs a valid-shaped SUPABASE_SERVICE_ROLE_KEY (the one truly
// required var in lib/env.ts) or getServerEnv() throws before the test logic runs.
const BASE_ENV = {
  PATH: process.env.PATH,
  SUPABASE_SERVICE_ROLE_KEY: "kill-test-fake-service-role-key-00000000",
};

const SCENARIOS = [
  {
    name: "prod-unset-auth",
    label: "prod + Upstash unset + abuse-prone limiter (auth) -> BLOCKED",
    env: { CONTEXT: "production", NODE_ENV: "production" },
  },
  {
    name: "prod-unset-general",
    label: "prod + Upstash unset + non-abuse-prone limiter (general) -> ALLOWED",
    env: { CONTEXT: "production", NODE_ENV: "production" },
  },
  {
    name: "dev-unset-auth",
    label: "dev + Upstash unset + abuse-prone limiter (auth) -> ALLOWED (unchanged)",
    env: { CONTEXT: "dev", NODE_ENV: "development" },
  },
  {
    name: "prod-set-passthrough",
    label: "prod + Upstash configured -> real limiter path, byte-identical to today",
    env: {
      CONTEXT: "production",
      NODE_ENV: "production",
      UPSTASH_REDIS_REST_URL: "https://fake-kill-test.upstash.io",
      UPSTASH_REDIS_REST_TOKEN: "fake-kill-test-token",
    },
  },
  {
    name: "prod-unset-referral-validate",
    label: "prod + Upstash unset + referral-validate limiter (enumeration oracle) -> BLOCKED",
    env: { CONTEXT: "production", NODE_ENV: "production" },
  },
  {
    name: "prod-unset-resend-access",
    label: "prod + Upstash unset + resend-access limiter (brute-force/email-bombing) -> BLOCKED",
    env: { CONTEXT: "production", NODE_ENV: "production" },
  },
];

console.log("Ring 1a kill test: lib/ratelimit.ts fail-mode split\n");

let allPass = true;
const rows = [];

for (const scenario of SCENARIOS) {
  const result = spawnSync(
    "npx",
    ["tsx", "scripts/ring1-kill-test-scenario.ts", scenario.name],
    {
      env: { ...BASE_ENV, ...scenario.env },
      encoding: "utf8",
      cwd: process.cwd(),
    }
  );

  if (result.status !== 0 && !result.stdout?.trim()) {
    allPass = false;
    rows.push({ scenario: scenario.name, label: scenario.label, pass: false, details: { error: result.stderr } });
    continue;
  }

  const lastLine = result.stdout.trim().split("\n").filter(Boolean).pop();
  let parsed;
  try {
    parsed = JSON.parse(lastLine);
  } catch {
    allPass = false;
    rows.push({ scenario: scenario.name, label: scenario.label, pass: false, details: { error: "unparseable output", stdout: result.stdout, stderr: result.stderr } });
    continue;
  }

  if (!parsed.pass) allPass = false;
  rows.push({ scenario: scenario.name, label: scenario.label, pass: parsed.pass, details: parsed.details });
}

for (const row of rows) {
  const mark = row.pass ? "PASS" : "FAIL";
  console.log(`[${mark}] ${row.scenario}`);
  console.log(`       ${row.label}`);
  console.log(`       ${JSON.stringify(row.details)}`);
}

console.log("");
console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
process.exit(allPass ? 0 : 1);
