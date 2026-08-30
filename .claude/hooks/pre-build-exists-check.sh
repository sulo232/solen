#!/usr/bin/env bash
# pre-build-exists-check.sh — Solen "check what exists before building new" guard
# ============================================================================
#
# Purpose: blocks creation of a NEW route / API endpoint / migration until
# `npm run exists` has been run in the current turn.
#
# Why this exists: the #1 recurring failure in this repo is rebuilding something
# that ALREADY EXISTS — agents re-mocked already-shipped walk-in screens and
# re-created the existing `tips` table, because no source-of-truth was consulted.
# The project had SIX hand-written "read before building" docs and they were all
# ignored (honor-system instructions lose to task focus). This moves the gate to
# runtime, where the Write literally cannot proceed without the check — the same
# pattern that took the page-loop from ~10% compliance to enforced.
#
# Fires BLOCK (exit 2) when ALL hold for the current Write:
#   1. The target is a NEW (not-yet-on-disk) file on a duplicate-prone surface:
#        app/**/page.tsx | app/**/route.ts | supabase/migrations/*.sql | lib/**/*.ts(x)
#   2. `npm run exists` / scripts/exists.mjs did NOT run in this turn's transcript
#   3. No fresh override flag
#
# Editing an EXISTING file never fires (the on-disk check) — only brand-new
# surfaces, which is exactly where the rebuild risk lives.
#
# Override (you've already confirmed it's genuinely new):
#   echo "<reason>" > .claude/exists-skip.flag        # 30-minute TTL
#   (2026-07-11 estate-audit fix: a bare `touch` no longer skips , the flag must carry a
#   non-blank reason on its first line. This is the project's #1 anti-duplication gate and
#   it was the second-most waved-off skip flag in the ledger; raising the bypass cost from a
#   silent touch to a written reason is deliberate friction, not a bug.)
#
# Registered via .claude/settings.json under hooks.PreToolUse "Write" matcher.

set -uo pipefail

# 2026-08-19 stress-test pass: drives THIS script as a real subprocess (same stdin-JSON wire
# format the harness uses, with a real transcript JSONL file), not the underlying logic in
# isolation. Verified live: a new route.ts BLOCKs with no `npm run exists` in the transcript
# and ALLOWs once it's there, an EXISTING file never gates regardless, an out-of-scope
# extension (.test.ts) never gates, and a new mockup BLOCKs without an `Exists-check:` line
# and ALLOWs with one (given exists also ran). DOCUMENTED RESIDUAL, deliberately left as a
# known gap and not fixed this pass: `false && npm run exists "x"` satisfies the transcript
# string-match (the literal text "npm run exists" is present right after a `&&`) even though
# bash's short-circuit evaluation means the right-hand side never actually executes. This
# requires deliberately adversarial command construction, not something an agent organically
# writes while doing the check for real, and no real incident of it firing was found this
# pass (GATE_LAW step 1: no incident, no gate). Closing it would mean parsing shell
# conditional structure or cross-referencing the matching tool_result, real complexity for a
# theoretical case; left open rather than guessed shut.
if [[ "${1:-}" == "--selftest" ]]; then
  SELF="${BASH_SOURCE[0]}"
  export CLAUDE_PROJECT_DIR="$(cd "$(dirname "$SELF")/../.." && pwd)"
  # A bare `mktemp -d` resolves against the OS default tmp root, which is not always writable
  # under this harness's sandbox (a known trap: "a .sh check needs a writable TMPDIR set
  # before you judge it"). Honor $TMPDIR when set, same as every other scratch file in this
  # pass, so the self-test doesn't fail on a sandbox permission wall that has nothing to do
  # with the gate's own logic.
  SELFTEST_DIR="$(mktemp -d "${TMPDIR:-/tmp}/exists-selftest.XXXXXX")"
  trap 'rm -rf "$SELFTEST_DIR"' EXIT
  PASS=0; FAIL=0

  # Two real transcript fixtures: one where `npm run exists` never appears, one where it does
  # as a genuine standalone Bash call (the shape the harness actually produces).
  NO_EXISTS_TR="$SELFTEST_DIR/no_exists.jsonl"
  WITH_EXISTS_TR="$SELFTEST_DIR/with_exists.jsonl"
  printf '%s\n' '{"type":"user","message":{"role":"user","content":[{"type":"text","text":"build the new endpoint"}]}}' > "$NO_EXISTS_TR"
  printf '%s\n' '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"ls app/api"}}]}}' >> "$NO_EXISTS_TR"
  printf '%s\n' '{"type":"user","message":{"role":"user","content":[{"type":"text","text":"build the new endpoint"}]}}' > "$WITH_EXISTS_TR"
  printf '%s\n' '{"type":"assistant","message":{"content":[{"type":"tool_use","name":"Bash","input":{"command":"npm run exists \"probe thing\""}}]}}' >> "$WITH_EXISTS_TR"

  run_case() {
    local label="$1" expect="$2" json="$3"
    local out rc got
    out=$(printf '%s' "$json" | "$SELF" 2>&1)
    rc=$?
    got="allow"; [[ $rc -eq 2 ]] && got="deny"
    if [[ "$got" == "$expect" ]]; then
      echo "[PASS] $label: expected $expect, got $got"
      PASS=$((PASS+1))
    else
      echo "[FAIL] $label: expected $expect, got $got"
      echo "       output: $out"
      FAIL=$((FAIL+1))
    fi
  }

  BASE="/Users/sulo/Documents/solen"
  run_case "BAD1 (new route.ts, no exists run)" "deny" \
    "$(jq -nc --arg fp "$BASE/app/api/probe-newthing/route.ts" --arg tp "$NO_EXISTS_TR" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"export async function GET(){}"}, transcript_path:$tp}')"
  run_case "GOOD1 (new route.ts, exists WAS run)" "allow" \
    "$(jq -nc --arg fp "$BASE/app/api/probe-newthing2/route.ts" --arg tp "$WITH_EXISTS_TR" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"export async function GET(){}"}, transcript_path:$tp}')"
  run_case "GOOD2 (existing file, no exists run)" "allow" \
    "$(jq -nc --arg fp "$BASE/app/api/profile/avatar/route.ts" --arg tp "$NO_EXISTS_TR" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"x"}, transcript_path:$tp}')"
  run_case "GOOD3 (out-of-scope extension, .test.ts)" "allow" \
    "$(jq -nc --arg fp "$BASE/app/api/probe-newthing3/route.test.ts" --arg tp "$NO_EXISTS_TR" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"export const x = 1;"}, transcript_path:$tp}')"
  run_case "BAD2 (new mockup, no Exists-check line)" "deny" \
    "$(jq -nc --arg fp "$BASE/public/_mockups/probe-mockup.html" --arg tp "$WITH_EXISTS_TR" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"<html><body>hi</body></html>"}, transcript_path:$tp}')"
  run_case "GOOD4 (new mockup, WITH Exists-check line + exists ran)" "allow" \
    "$(jq -nc --arg fp "$BASE/public/_mockups/probe-mockup2.html" --arg tp "$WITH_EXISTS_TR" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"<!-- Exists-check: /probe already has X; REMOVED: none. NEW: only Y. -->\n<html></html>"}, transcript_path:$tp}')"
  echo ""
  if [[ $FAIL -gt 0 ]]; then
    echo "$FAIL/$((PASS+FAIL)) cases FAILED."
    exit 1
  fi
  echo "All $PASS cases PASSED."
  exit 0
fi

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Guard Write only.
[[ "$TOOL" == "Write" ]] || exit 0
[[ -n "$FILE" ]] || exit 0

# 1. Editing an existing file is not a rebuild risk → never gate.
[[ -e "$FILE" ]] && exit 0

# Is the NEW file a duplicate-prone surface?
case "$FILE" in
  */app/*/page.tsx|*/app/*/page.jsx) SURFACE="route (page)";;
  */app/*/route.ts|*/app/*/route.js) SURFACE="API endpoint";;
  */supabase/migrations/*.sql)       SURFACE="DB migration";;
  */lib/*.ts|*/lib/*.tsx)            SURFACE="lib module";;
  # component surfaces , the app's PRIMARY component tree is app/**/_components/** (underscore,
  # route-group-excluded); the old globs matched only top-level `components/` + `components-legacy/`
  # and MISSED `_components` entirely, so a duplicate like SalonServicesSheet (a parallel
  # service-selection UI next to the booking ServicesStaffStep) was never gated. Case-glob `*`
  # spans `/`, so these match at ANY nesting depth. (owner 2026-07-19, the store "Alle ansehen" dup.)
  */_components/*.tsx|*/_components/*.jsx) SURFACE="component";;
  */components/*.tsx|*/components/*.jsx)   SURFACE="component";;
  */components-legacy/*.tsx|*/components-legacy/*.jsx) SURFACE="component";;
  */public/solen-*.html)             SURFACE="design mockup";;
  */public/_mockups/*.html)          SURFACE="design mockup";;
  *) exit 0;;
esac

# 2. Override flag (30-min TTL), parity with the other hooks. Honored ONLY with a non-blank
# reason on its first line (2026-07-11 fix, this gate was the 2nd-most waved-off skip in the
# ledger: 25 bare `touch`es) , `touch .claude/exists-skip.flag` alone no longer skips.
FLAG="$PROJECT_DIR/.claude/exists-skip.flag"
if [[ -f "$FLAG" ]]; then
  AGE=$(( $(date +%s) - $(stat -f %m "$FLAG" 2>/dev/null || stat -c %Y "$FLAG" 2>/dev/null || echo 0) ))
  REASON=$(head -n1 "$FLAG" 2>/dev/null | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
  [[ $AGE -le 1800 && -n "$REASON" ]] && exit 0
fi

# 2b. Mockups must carry an explicit Exists-check: line in their note (council
# anti-duplication design 2026-06-12) — names what already exists on the target
# surface and why this proposal is not it. No marker → block regardless of step 3.
if [[ "$SURFACE" == "design mockup" ]]; then
  CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty')
  if [[ -n "$CONTENT" && "$CONTENT" != *"Exists-check:"* ]]; then
    cat <<EOM >&2
[pre-build-exists-check] New mockup without an "Exists-check:" line:
  $FILE
Every mockup note must name (a) what the TARGET route/surface already renders
(npm run exists <term> + read the live page) and (b) any 🪦 REMOVED.md hits.
Add a line like:  Exists-check: /fuer-salons already has categories grid +
comparison chart + badges (page.tsx:124/245/279); REMOVED: none. NEW: only X.
EOM
    exit 2
  fi
fi

# 3. Did `npm run exists` run in this turn? (scan recent transcript Bash commands)
if [[ -n "$TRANSCRIPT" && -f "$TRANSCRIPT" ]]; then
  RAN=$(tail -n 150 "$TRANSCRIPT" \
    | jq -rc 'select(.type=="assistant") | .message.content[]? | select(.type=="tool_use" and .name=="Bash") | .input.command // empty' 2>/dev/null \
    | grep -cE '(^|[;&|])[[:space:]]*npm[[:space:]]+run[[:space:]]+exists|[[:space:]/]exists\.mjs' || true)
  [[ "${RAN:-0}" -gt 0 ]] && exit 0
fi

# ── BLOCK ──
KW=$(basename "$(dirname "$FILE")")
[[ "$KW" == "migrations" ]] && KW="<feature>"
[[ "$SURFACE" == "design mockup" ]] && KW="<the-component-youre-mocking>"
cat <<EOF >&2
[pre-build-exists-check] You're about to CREATE a new $SURFACE:
  $FILE

The #1 recurring failure in this repo is rebuilding something that ALREADY EXISTS
(re-mocked shipped walk-in screens; re-created the existing \`tips\` table). Check first.

Run this (read-only, ~5s) before creating it:
  npm run exists $KW

  • A hit → REUSE or EXTEND what's there instead of creating this file.
  • Empty → it's genuinely new; re-run this Write and it will pass.
  • DESIGN / mockups: also read _design-system/COMPONENT_REGISTRY.md — never hand-fake a
    component that already exists (the fake-calendar miss: DateTimePicker already did grid + blue).

Override (only if you've ALREADY confirmed it's new): echo "<reason>" > .claude/exists-skip.flag
  (a bare touch no longer skips , the flag needs a non-blank reason on its first line)
EOF
exit 2
