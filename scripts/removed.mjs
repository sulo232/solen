#!/usr/bin/env node
//
// Append a line to the 🪦 graveyard with zero friction.
//   npm run removed -- "<keywords>" "<what>" "<why>" "<record>" "[--route-outcome=a|b|c|n-a]"
// Example:
//   npm run removed -- "wait-time-on-pay walkin-pay-status" "status UI on /walk-in-pay" "single-tracker lock" "memory project_walkin_single_tracker"
//   npm run removed -- "pakete packages" "the packages feature" "owner kill" "memory x" --route-outcome=c
//
// ia-navigation-08 (2026-07-27): a ROUTE deletion (as opposed to a component/UI-only removal)
// must name which of Rule 50's (_rules/STRUCTURAL_RULES.md) three redirect outcomes it chose:
//   a = permanentRedirect() to a new location the concept moved to
//   b = plain redirect() to a still-relevant nearby page
//   c = deleted outright, no landing spot, falls to the locked 404
//   n/a = this removal was never a route (a component, a UI element, a feature flag) , exempt
// Optional (not required for non-route removals) so existing call sites and component-only
// deletions do not break; a route deletion with no --route-outcome is legal but incomplete,
// same as leaving `why` accidentally vague, flag it in review rather than hard-blocking here.
import { appendFileSync, readFileSync } from "node:fs";

const rawArgs = process.argv.slice(2);
const outcomeArg = rawArgs.find((a) => a.startsWith("--route-outcome="));
const [keywords, what, why, record] = rawArgs.filter((a) => !a.startsWith("--route-outcome="));
if (!keywords || !what || !why) {
  console.error('Usage: npm run removed -- "<keywords>" "<what>" "<why>" "[record]" "[--route-outcome=a|b|c|n-a]"');
  process.exit(2);
}
const VALID_OUTCOMES = new Set(["a", "b", "c", "n-a"]);
let routeOutcome = outcomeArg ? outcomeArg.split("=")[1] : null;
if (routeOutcome && !VALID_OUTCOMES.has(routeOutcome)) {
  console.error(`--route-outcome must be one of a|b|c|n-a (Rule 50), got: ${routeOutcome}`);
  process.exit(2);
}
const OUTCOME_LABEL = { a: "permanentRedirect", b: "redirect", c: "deleted/404", "n-a": "not a route" };
const outcomeSuffix = routeOutcome ? ` [redirect-outcome: ${OUTCOME_LABEL[routeOutcome]}]` : "";
const PATH = new URL("../_design-system/REMOVED.md", import.meta.url).pathname;
const date = new Date().toISOString().slice(0, 10);
const line = `- ${keywords} | ${what} | ${why} (${date})${outcomeSuffix} | ${record || "this file"}\n`;
if (readFileSync(PATH, "utf8").includes(`- ${keywords} |`)) {
  console.log("Already in the graveyard:", keywords);
  process.exit(0);
}
if (!routeOutcome) {
  console.warn("NOTE (ia-navigation-08 / Rule 50): no --route-outcome given. Fine for a component/UI-only removal; if this deleted a ROUTE, re-run with --route-outcome=a|b|c naming the redirect outcome chosen.");
}
appendFileSync(PATH, line);
console.log("🪦 added:", line.trim());
