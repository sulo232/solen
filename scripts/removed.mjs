#!/usr/bin/env node
//
// Append a line to the 🪦 graveyard with zero friction.
//   npm run removed -- "<keywords>" "<what>" "<why>" "<record>"
// Example:
//   npm run removed -- "wait-time-on-pay walkin-pay-status" "status UI on /walk-in-pay" "single-tracker lock" "memory project_walkin_single_tracker"
//
import { appendFileSync, readFileSync } from "node:fs";

const [keywords, what, why, record] = process.argv.slice(2);
if (!keywords || !what || !why) {
  console.error('Usage: npm run removed -- "<keywords>" "<what>" "<why>" "[record]"');
  process.exit(2);
}
const PATH = new URL("../_design-system/REMOVED.md", import.meta.url).pathname;
const date = new Date().toISOString().slice(0, 10);
const line = `- ${keywords} | ${what} | ${why} (${date}) | ${record || "this file"}\n`;
if (readFileSync(PATH, "utf8").includes(`- ${keywords} |`)) {
  console.log("Already in the graveyard:", keywords);
  process.exit(0);
}
appendFileSync(PATH, line);
console.log("🪦 added:", line.trim());
