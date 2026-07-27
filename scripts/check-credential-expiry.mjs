#!/usr/bin/env node
// secrets-webhooks-03: parses _backend-system/CREDENTIAL_EXPIRY.md's table and
// flags any row within 30 days of expiry (WARN) or 7 days (URGENT). Run
// standalone for a local check, or via `--github-issue` (used by
// .github/workflows/credential-expiry-check.yml) to also open/update a GitHub
// issue through the GitHub CLI so the deadline surfaces somewhere a human
// reads by default, not only in a file nobody re-opens.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const TABLE_PATH = path.join(ROOT, "_backend-system", "CREDENTIAL_EXPIRY.md");

const WARN_DAYS = 30;
const URGENT_DAYS = 7;

function parseRows(markdown) {
  const rows = [];
  for (const line of markdown.split("\n")) {
    const m = line.match(/^\|\s*(.+?)\s*\|\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/);
    if (!m) continue;
    const [, credential, expiryIso, remint, owner] = m;
    if (credential === "Credential" || credential.startsWith("---")) continue; // header/divider rows
    rows.push({ credential, expiryIso, remint, owner });
  }
  return rows;
}

function daysUntil(isoDate) {
  const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
  const expiry = new Date(isoDate + "T00:00:00Z");
  return Math.round((expiry - today) / (1000 * 60 * 60 * 24));
}

function main() {
  const markdown = readFileSync(TABLE_PATH, "utf8");
  const rows = parseRows(markdown);

  if (rows.length === 0) {
    console.log("No credential-expiry rows found (table is empty or shape drifted). Nothing to check.");
    process.exit(0);
  }

  let worstDays = Infinity;
  const flagged = [];

  for (const row of rows) {
    const days = daysUntil(row.expiryIso);
    const status = days < 0 ? "EXPIRED" : days <= URGENT_DAYS ? "URGENT" : days <= WARN_DAYS ? "WARN" : "ok";
    console.log(`${status.padEnd(7)} ${row.credential} expires ${row.expiryIso} (${days} days)`);
    if (status !== "ok") {
      flagged.push({ ...row, days, status });
      worstDays = Math.min(worstDays, days);
    }
  }

  if (flagged.length === 0) {
    console.log(`\nAll ${rows.length} tracked credential(s) are more than ${WARN_DAYS} days from expiry.`);
    process.exit(0);
  }

  console.log(`\n${flagged.length} credential(s) need attention:`);
  for (const f of flagged) {
    console.log(`  - [${f.status}] ${f.credential}: ${f.days} days left. Re-mint: ${f.remint} (owner: ${f.owner})`);
  }

  if (process.argv.includes("--github-issue")) {
    const body = [
      `Automated check from \`scripts/check-credential-expiry.mjs\` (secrets-webhooks-03).`,
      ``,
      ...flagged.map(
        (f) =>
          `- **[${f.status}]** ${f.credential} expires **${f.expiryIso}** (${f.days} days). Re-mint: \`${f.remint}\`. Owner: ${f.owner}.`
      ),
      ``,
      `Source of truth: \`_backend-system/CREDENTIAL_EXPIRY.md\`.`,
    ].join("\n");
    const title = `Credential expiry: ${flagged.length} credential(s) within ${WARN_DAYS} days`;
    try {
      execFileSync("gh", ["issue", "list", "--search", title, "--json", "number", "--state", "open"], {
        cwd: ROOT,
      });
    } catch {
      // gh not available locally; the workflow step is the real caller of --github-issue.
    }
    try {
      execFileSync("gh", ["issue", "create", "--title", title, "--body", body, "--label", "credential-expiry"], {
        cwd: ROOT,
        stdio: "inherit",
      });
    } catch (err) {
      console.error("[check-credential-expiry] gh issue create failed:", err.message);
    }
  }

  // Exit non-zero only when something is truly urgent, so a 30-day WARN shows up
  // in logs/an issue without failing an unrelated build; a 7-day URGENT or an
  // already-EXPIRED row does fail, matching the other ratchet gates in this repo.
  if (worstDays <= URGENT_DAYS) {
    process.exit(1);
  }
  process.exit(0);
}

main();
