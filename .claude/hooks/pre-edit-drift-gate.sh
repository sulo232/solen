#!/usr/bin/env bash
# pre-edit-drift-gate.sh : Solen design-system drift GATE (V3-D441, 2026-06-07)
# ============================================================================
#
# Purpose: BLOCKS an Edit/Write that introduces NET-NEW design-system drift
# (raw hex, retired tokens, arbitrary color values, non-canonical durations,
# dead clicks, emoji, category branches) into a design-surface file.
#
# Why this exists: the drift CHECKER (skills/solen-drift-check) is a logger:
# it writes a report and exits 0, so violations cost nothing and get ignored.
# The #1 recurring failure is the agent re-introducing drift it was told to
# avoid (raw hex instead of a token, retired coral tokens, dead clicks). This
# moves the rule to runtime: the Edit literally cannot land with NEW drift,
# the same pattern that took the "check what exists" rule to enforced.
#
# Scope is deliberately narrow to stay false-positive-free:
#   - Only design-surface files: app|components|components-legacy *.tsx / *.css.
#     Skips mockups (public/), generated, config, .d.ts, _audits, node_modules.
#   - Only NET-NEW HARD drift (A1-A6 / B1-B5). Strict scope already carries ~1k
#     legacy findings; the gate compares the incoming diff against the OLD
#     content and blocks only when you ADD a violation. Pre-existing drift in
#     the same file never blocks an unrelated edit.
#   - INFO rules (A7-A14, typographic/elevation nuance) never gate, logged only.
#
# Escape hatches (a false positive must never trap you):
#   - Per line:  add `drift-ok: <reason>` on the offending line.
#   - This turn: touch .claude/drift-gate-skip.flag        # 30-minute TTL
#   - Session:   export SOLEN_DRIFT_GATE=0
#
# FAIL-OPEN: any error (no jq, no checker, stale checker, bad JSON) -> allow.
# A gate bug must never brick editing.
#
# Registered via .claude/settings.json under hooks.PreToolUse "Edit" + "Write".

set -uo pipefail

# 2026-08-19 stress-test pass: drives THIS script as a real subprocess (same stdin-JSON wire
# format the harness uses), not the underlying check.py functions in isolation, so the
# self-test cannot drift from what actually runs at PreToolUse. Verified live that day: a new
# raw hex (A1) correctly BLOCKs on both Write and Edit, a tokenized edit / an out-of-scope path
# (lib/**) / a mockup path (public/**) / a non-edit tool (Bash) / the per-line `drift-ok:`
# escape hatch all correctly ALLOW, and net-new counting does not re-fire when a pre-existing
# violation's surrounding text is edited without adding a new one. No reproducible defect found
# in this pass -- the earlier "could not be driven" note was jq/check.py tooling on the
# tester's side (both are present and gate-stdin-capable in this worktree), not a gate bug.
if [[ "${1:-}" == "--selftest" ]]; then
  SELF="${BASH_SOURCE[0]}"
  # Self-test must not depend on the caller having exported CLAUDE_PROJECT_DIR (the real
  # harness always does, but a bare `bash pre-edit-drift-gate.sh --selftest` from a shell
  # would otherwise silently fall back to `$(pwd)` in the recursive $SELF calls below and
  # look for check.py in the wrong place). Derive it from the script's own path instead:
  # this file lives at <PROJECT_DIR>/.claude/hooks/pre-edit-drift-gate.sh.
  export CLAUDE_PROJECT_DIR="$(cd "$(dirname "$SELF")/../.." && pwd)"
  PASS=0; FAIL=0
  run_case() {
    local label="$1" expect="$2" json="$3"
    local out rc
    out=$(printf '%s' "$json" | "$SELF" 2>&1)
    rc=$?
    local got="allow"; [[ $rc -eq 2 ]] && got="deny"
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
  run_case "BAD (new raw hex, Write)" "deny" \
    "$(jq -nc --arg fp "$BASE/app/probe-drift/page.tsx" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"export default function Page(){ return <div style={{color:\"#FF00AA\"}}>hi</div>; }"}}')"
  run_case "GOOD (tokenized, Write)" "allow" \
    "$(jq -nc --arg fp "$BASE/app/probe-nodrift/page.tsx" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"export default function Page(){ return <div className=\"text-s-ink bg-s-bg-sunken\">hi</div>; }"}}')"
  run_case "BAD (new raw hex, Edit)" "deny" \
    "$(jq -nc --arg fp "$BASE/app/probe-edit-drift/page.tsx" \
      '{tool_name:"Edit", tool_input:{file_path:$fp, old_string:"className=\"text-s-ink\"", new_string:"style={{color:\"#123ABC\"}}"}}')"
  run_case "GOOD (pre-existing violation, text moved not added)" "allow" \
    "$(jq -nc --arg fp "$BASE/app/probe-edit-drift2/page.tsx" \
      '{tool_name:"Edit", tool_input:{file_path:$fp, old_string:"const x = \"#123ABC\"; // old comment", new_string:"const x = \"#123ABC\"; // renamed comment"}}')"
  run_case "GOOD (out-of-scope path, lib/)" "allow" \
    "$(jq -nc --arg fp "$BASE/lib/probe.ts" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"const x = \"#FF00AA\";"}}')"
  run_case "GOOD (mockup path excluded, public/)" "allow" \
    "$(jq -nc --arg fp "$BASE/public/_mockups/probe/page.tsx" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"export default function Page(){ return <div style={{color:\"#FF00AA\"}}>hi</div>; }"}}')"
  run_case "GOOD (drift-ok escape hatch)" "allow" \
    "$(jq -nc --arg fp "$BASE/app/probe-driftok/page.tsx" \
      '{tool_name:"Write", tool_input:{file_path:$fp, content:"export default function Page(){ return <div style={{color:\"#FF00AA\"}}>hi</div>; } // drift-ok: brand exception"}}')"
  run_case "GOOD (non Edit/Write/MultiEdit tool)" "allow" \
    "$(jq -nc '{tool_name:"Bash", tool_input:{command:"echo hi"}}')"
  echo ""
  if [[ $FAIL -gt 0 ]]; then
    echo "$FAIL/$((PASS+FAIL)) cases FAILED."
    exit 1
  fi
  echo "All $PASS cases PASSED."
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
CHECK="$PROJECT_DIR/.claude/skills/solen-drift-check/scripts/check.py"

# ── Global bypasses ──
[[ "${SOLEN_DRIFT_GATE:-1}" == "0" ]] && exit 0
FLAG="$PROJECT_DIR/.claude/drift-gate-skip.flag"
if [[ -f "$FLAG" ]]; then
  AGE=$(( $(date +%s) - $(stat -f %m "$FLAG" 2>/dev/null || stat -c %Y "$FLAG" 2>/dev/null || echo 0) ))
  [[ $AGE -le 1800 ]] && exit 0
fi

# ── Fail-open prerequisites ──
command -v jq >/dev/null 2>&1 || exit 0
[[ -f "$CHECK" ]] || exit 0
# Stale checker without gate support (skills/ is gitignored -> can lag in some
# worktrees): self-disable rather than crash on an unknown flag.
grep -q "gate-stdin" "$CHECK" 2>/dev/null || exit 0

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
[[ -n "$FILE" ]] || exit 0

# ── Scope: only design-surface files ──
case "$FILE" in
  *app/*.tsx|*app/*.css|*components/*.tsx|*components-legacy/*.tsx) : ;;
  *) exit 0 ;;
esac
# Never gate mockups / generated / config / type decls.
case "$FILE" in
  *public/*|*_audits/*|*node_modules/*|*.config.*|*.d.ts) exit 0 ;;
esac

# ── Build {file_path,new,old} for the gate, by tool ──
case "$TOOL" in
  Edit)
    GATE_JSON=$(echo "$INPUT" | jq -c '{file_path: .tool_input.file_path, new: (.tool_input.new_string // ""), old: (.tool_input.old_string // "")}')
    ;;
  Write)
    OLD=""
    [[ -f "$FILE" ]] && OLD=$(cat "$FILE")
    GATE_JSON=$(echo "$INPUT" | jq -c --arg old "$OLD" '{file_path: .tool_input.file_path, new: (.tool_input.content // ""), old: $old}')
    ;;
  MultiEdit)
    GATE_JSON=$(echo "$INPUT" | jq -c '{file_path: .tool_input.file_path, new: ([.tool_input.edits[].new_string] | join("\n")), old: ([.tool_input.edits[].old_string] | join("\n"))}')
    ;;
  *) exit 0 ;;
esac
[[ -n "$GATE_JSON" ]] || exit 0

# ── Run the gate. check.py exits 2 to BLOCK (stderr explains + offers escape). ──
printf '%s' "$GATE_JSON" | python3 "$CHECK" --gate-stdin
exit $?
