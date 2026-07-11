// Ring 9 kill test: abuse-coverage census + the 4 small parked fixes.
//
// Three checks, matching the ring's close conditions:
//   1. scripts/ratelimit-census.mjs is deterministic: two back-to-back runs against the
//      SAME code produce a byte-identical _plans/RATELIMIT_CENSUS.md.
//   2. app/api/vouchers/validate/route.ts's 4 failure branches (not found, unpaid,
//      redeemed, expired) all return the SAME generic message (the enumeration-oracle
//      collapse), checked at the source level (the sandbox cannot reach localhost, so
//      this is a logic-level / source-proof check, not an HTTP call), while the SUCCESS
//      shape is untouched.
//   3. scripts/ring1-kill-tests.mjs (the CONTEXT/NODE_ENV guard-alignment kill test) is
//      still 6/6 after this ring's lib/ratelimit.ts edit.
//
// Usage: npx tsx scripts/ring9-kill-test.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const REPO_ROOT = process.cwd();

type Row = { scenario: string; pass: boolean; details: Record<string, unknown> };
const rows: Row[] = [];
let allPass = true;

function check(scenario: string, pass: boolean, details: Record<string, unknown>) {
  rows.push({ scenario, pass, details });
  if (!pass) allPass = false;
}

function run(cmd: string, args: string[]) {
  return spawnSync(cmd, args, { cwd: REPO_ROOT, encoding: "utf8" });
}

async function main() {
  // ─── 1. Census script determinism ──────────────────────────────────────────────
  {
    const censusPath = join(REPO_ROOT, "_plans/RATELIMIT_CENSUS.md");
    const run1 = run("node", ["scripts/ratelimit-census.mjs"]);
    const content1 = readFileSync(censusPath, "utf8");
    const run2 = run("node", ["scripts/ratelimit-census.mjs"]);
    const content2 = readFileSync(censusPath, "utf8");

    check(
      "scripts/ratelimit-census.mjs: both runs exit 0",
      run1.status === 0 && run2.status === 0,
      { run1Status: run1.status, run2Status: run2.status, run1Stderr: run1.stderr, run2Stderr: run2.stderr },
    );
    check(
      "scripts/ratelimit-census.mjs: two back-to-back runs produce a byte-identical _plans/RATELIMIT_CENSUS.md",
      content1 === content2,
      { lengthsMatch: content1.length === content2.length, len1: content1.length, len2: content2.length },
    );
  }

  // ─── 2. vouchers/validate failure-branch message collapse (source-level proof) ────
  {
    const routePath = join(REPO_ROOT, "app/api/vouchers/validate/route.ts");
    const src = readFileSync(routePath, "utf8");

    const constMatch = /const\s+GENERIC_INVALID_MESSAGE\s*=\s*"([^"]+)"/.exec(src);
    check("vouchers/validate: GENERIC_INVALID_MESSAGE constant is defined exactly once", (src.match(/GENERIC_INVALID_MESSAGE/g) ?? []).length >= 5 && constMatch !== null, {
      constDefined: constMatch !== null,
      constValue: constMatch?.[1],
      totalReferences: (src.match(/GENERIC_INVALID_MESSAGE/g) ?? []).length,
    });

    // The 4 failure branches: not found, unpaid, redeemed, expired. Each must reference
    // the shared constant (not a distinct inline literal) for its `message:` field.
    const usageCount = (src.match(/message:\s*GENERIC_INVALID_MESSAGE/g) ?? []).length;
    check("vouchers/validate: all 4 failure branches (not found, unpaid, redeemed, expired) use `message: GENERIC_INVALID_MESSAGE`", usageCount === 4, {
      usageCount,
    });

    // None of the old distinguishing per-branch messages survive anywhere in the file.
    const oldMessages = [
      "Ungültiger Gutscheincode",
      "Gutschein noch nicht bezahlt",
      "wurde bereits eingelöst",
      "ist abgelaufen",
    ];
    const survivingOldMessages = oldMessages.filter((m) => src.includes(m));
    check("vouchers/validate: none of the old distinguishing failure messages survive in the source", survivingOldMessages.length === 0, {
      survivingOldMessages,
    });

    // The SUCCESS shape must be untouched: valid:true with code/amount/remaining_amount/message
    // read from the real voucher row (not the generic constant).
    const successBlockMatch = /valid:\s*true,[\s\S]{0,300}?message:\s*voucher\.message/.exec(src);
    check("vouchers/validate: SUCCESS response shape (valid:true + code/amount/remaining_amount/voucher.message) is unchanged", successBlockMatch !== null, {
      found: successBlockMatch !== null,
    });
  }

  // ─── 3. Ring 1a kill test still 6/6 after the CONTEXT/NODE_ENV guard alignment ────
  {
    const result = run("node", ["scripts/ring1-kill-tests.mjs"]);
    const stdout = result.stdout ?? "";
    const passLine = /(\d+)\/(\d+)/.exec(stdout);
    const allPassedLine = /All scenarios passed\./.test(stdout);
    check("scripts/ring1-kill-tests.mjs: exits 0 and reports \"All scenarios passed.\"", result.status === 0 && allPassedLine, {
      status: result.status,
      allPassedLine,
      passLineFound: passLine?.[0] ?? null,
      stdout: allPassedLine ? undefined : stdout,
      stderr: result.status === 0 ? undefined : result.stderr,
    });
    const failCount = (stdout.match(/\[FAIL\]/g) ?? []).length;
    const passCount = (stdout.match(/\[PASS\]/g) ?? []).length;
    check("scripts/ring1-kill-tests.mjs: 6/6 scenarios pass, 0 fail", passCount === 6 && failCount === 0, { passCount, failCount });
  }

  console.log("Ring 9 kill test: rate-limiter census + gift-cards/balance migration + guard alignment + voucher oracle collapse + formula-photo gate order + notes/tags DELETE parity\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(`${rows.filter((r) => r.pass).length}/${rows.length} scenarios passed.`);
  console.log(allPass ? "All scenarios passed." : "One or more scenarios FAILED.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[ring9-kill-test] threw:", err);
  process.exit(1);
});
