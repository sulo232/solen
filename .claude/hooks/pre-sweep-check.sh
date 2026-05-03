#!/usr/bin/env bash
# pre-sweep-check.sh — Solen design-token sweep guard
# ====================================================
#
# Purpose: enforce L8 Guardrail A (`_tasks/SOLEN_BUILD_LEARNINGS.md` line ~560)
# at the action layer. Blocks `Edit` calls that look like brand-token sweeps
# without the agent first having grep'd the design source-of-truth.
#
# Triggers BLOCK when ALL of these hold:
#   1. tool_name == "Edit"
#   2. tool_input.replace_all == true
#   3. tool_input.old_string contains a hex literal `#XXXXXX` (6 hex chars)
#   4. that hex appears in `public/solen-coral.html` OR `_tasks/SOLEN_DESIGN.md`
#   5. file_path is NOT a docs/config file the agent SHOULD edit freely
#
# Override (when the user has explicitly approved the sweep):
#   touch .claude/sweep-approved.flag
# Hook respects flag for 10 minutes after creation, then auto-expires.
#
# Why this exists: the agent's track record (CLAUDE.md "surgical edits" rule
# was violated 5+ times in one session — Q64 90 files, Phase 7 typography 278
# files, etc.) shows that documentation alone doesn't enforce. This hook moves
# the gate to the runtime where the agent literally cannot bypass it.

set -uo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only Edit calls are subject to sweep-check (Write is for new files / full
# rewrites which the agent normally proposes; not the failure surface).
if [[ "$TOOL_NAME" != "Edit" ]]; then
  exit 0
fi

REPLACE_ALL=$(echo "$INPUT" | jq -r '.tool_input.replace_all // false')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
OLD_STRING=$(echo "$INPUT" | jq -r '.tool_input.old_string // empty')

# Single-target Edit (replace_all=false) is fine — that's a surgical edit, not a sweep.
if [[ "$REPLACE_ALL" != "true" ]]; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# Files where mass changes ARE the intended workflow — token contracts, design docs,
# Claude Code settings. Only THIS project's .claude/ is skipped (not the parent's
# worktree-host .claude/ which would falsely match user code via path prefix).
if [[ "$FILE_PATH" == "$PROJECT_DIR/.claude/"* ]]; then exit 0; fi
case "$FILE_PATH" in
  */tailwind.config.js)        exit 0 ;;
  */app/globals.css)            exit 0 ;;
  */_tasks/*)                   exit 0 ;;
  */_rules/*)                   exit 0 ;;
  */_audits/*)                  exit 0 ;;
  */_docs/*)                    exit 0 ;;
  */_specs/*)                   exit 0 ;;
  */_plans/*)                   exit 0 ;;
  */_visual-qa/*)               exit 0 ;;
  */CLAUDE.md)                  exit 0 ;;
  */messages/*.json)            exit 0 ;;
esac

# User-explicit override flag (touch .claude/sweep-approved.flag).
# Auto-expires after 10 minutes so a single approval doesn't open a permanent door.
FLAG="$PROJECT_DIR/.claude/sweep-approved.flag"
if [[ -f "$FLAG" ]]; then
  FLAG_AGE=$(( $(date +%s) - $(stat -f %m "$FLAG" 2>/dev/null || stat -c %Y "$FLAG" 2>/dev/null || echo 0) ))
  if [[ $FLAG_AGE -le 600 ]]; then
    exit 0
  fi
fi

# Extract every hex literal in the value being removed. Six-char form only;
# three-char shorthand isn't part of the Solen palette.
HEXES=$(echo "$OLD_STRING" | grep -oE '#[0-9A-Fa-f]{6}' | sort -u)

if [[ -z "$HEXES" ]]; then
  exit 0
fi

REFERENCE="$PROJECT_DIR/public/solen-coral.html"
DESIGN_DOC="$PROJECT_DIR/_tasks/SOLEN_DESIGN.md"

# For each hex in the removed value, check if it exists in either source-of-truth.
# If yes, the sweep would obliterate a value the design system has locked.
LOCKED_HITS=""
for HEX in $HEXES; do
  REF_COUNT=0
  DOC_COUNT=0
  # `grep -c` exits 1 when no matches, which under `||` would append a stray "0"
  # producing a multi-line value that breaks `-gt`. Use grep + wc -l which always
  # exits 0 and outputs a clean integer.
  if [[ -f "$REFERENCE" ]]; then
    REF_COUNT=$(grep -i -F "$HEX" "$REFERENCE" 2>/dev/null | wc -l | tr -d ' ')
  fi
  if [[ -f "$DESIGN_DOC" ]]; then
    DOC_COUNT=$(grep -i -F "$HEX" "$DESIGN_DOC" 2>/dev/null | wc -l | tr -d ' ')
  fi
  if [[ "$REF_COUNT" -gt 0 || "$DOC_COUNT" -gt 0 ]]; then
    LOCKED_HITS+=$'\n  - '"${HEX}"" → public/solen-coral.html: ${REF_COUNT}× | _tasks/SOLEN_DESIGN.md: ${DOC_COUNT}×"
  fi
done

if [[ -z "$LOCKED_HITS" ]]; then
  exit 0
fi

# BLOCK. Surface the reason via stderr (Claude Code feeds this back to the agent).
cat >&2 <<EOF
[pre-sweep-check] BLOCKED — Edit (replace_all=true) on $FILE_PATH would remove hex value(s) that are LOCKED in the design source-of-truth:
$LOCKED_HITS

L8 Guardrail A: do NOT mechanically sweep a value that exists in public/solen-coral.html or _tasks/SOLEN_DESIGN.md without first confirming with the user that the sweep is intentional (e.g. a brand pivot like Q64 GREEN PIVOT).

To proceed:
  1. Verify the value is truly drift (not locked) — grep public/solen-coral.html and _tasks/SOLEN_DESIGN.md to read the context where it appears.
  2. If the user has explicitly authorized this sweep (e.g. "yes flip every coral hex to green"), have them or you run:
       touch $FLAG
     (override expires in 10 minutes)
  3. Then retry the Edit.

This is the Solen design-token sweep guard. It exists because L8 self-diagnosed three failure patterns and documentation alone didn't change behavior. See _tasks/SOLEN_BUILD_LEARNINGS.md L8 for context.
EOF

exit 2
