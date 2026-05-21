#!/usr/bin/env bash
# pre-page-commit-check.sh — enforce FULL-PAGE LOOP §11 before homepage commits
# =============================================================================
#
# Purpose: Per Agent 3 of the 5-agent root-cause audit (2026-05-03), the
# FULL-PAGE LOOP §11 in `_tasks/SOLEN_LIVE_TRUTH.md` had a 10% compliance
# rate (1 of 10 homepage commits ran it). Documentation alone doesn't
# enforce. This hook makes the loop a runtime gate at git-commit time.
#
# Triggers BLOCK when:
#   1. tool_name == "Bash"
#   2. tool_input.command matches /^\s*git commit/  (any commit invocation)
#   3. staged files include any of:
#        - components/home/**
#        - components/HomePage.tsx
#        - app/[locale]/page.tsx
#        - components/SalonCard.tsx (homepage cards)
#        - components/ui/FeaturedSalonCarousel.tsx (homepage carousel)
#   4. AND `.claude/last-page-loop.json` is missing OR older than the newest
#      staged-file mtime (i.e. the agent edited homepage files after the
#      last loop run, so the loop output is stale)
#
# Override:
#   touch .claude/page-loop-skip.flag   (one-shot, deleted after first commit)
#
# How to clear the gate properly (run the loop):
#   1. curl http://localhost:3000/de + grep raw i18n keys
#   2. screenshots top + middle + bottom + compare to ref
#   3. section-list live vs reference
#   4. dispatch design-verifier with page-level scope
#   5. when all 4 pass, write `.claude/last-page-loop.json` with current
#      timestamp (the verifier subagent should write this on PASS)

set -uo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [[ "$TOOL_NAME" != "Bash" ]]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Match `git commit` (with any flags). Skip `git status`, `git log`, etc.
if ! echo "$COMMAND" | grep -qE '^\s*git\s+commit(\s|$)'; then
  exit 0
fi

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# One-shot override (auto-deleted after this commit completes elsewhere)
SKIP_FLAG="$PROJECT_DIR/.claude/page-loop-skip.flag"
if [[ -f "$SKIP_FLAG" ]]; then
  rm -f "$SKIP_FLAG"
  exit 0
fi

# Get staged files (those that will be committed)
cd "$PROJECT_DIR" 2>/dev/null || exit 0
STAGED=$(git diff --cached --name-only 2>/dev/null)

if [[ -z "$STAGED" ]]; then
  exit 0
fi

# Detect homepage-affecting staged files
HOMEPAGE_TOUCHED=""
while IFS= read -r f; do
  case "$f" in
    components/home/*|\
    components/HomePage.tsx|\
    app/\[locale\]/page.tsx|\
    components/SalonCard.tsx|\
    components/ui/FeaturedSalonCarousel.tsx|\
    components/BrowseByCitySection.tsx|\
    components/TestimonialCarousel.tsx|\
    components/layout/Header.tsx|\
    components/layout/Footer.tsx)
      HOMEPAGE_TOUCHED+=$'\n  '"$f"
      ;;
  esac
done <<< "$STAGED"

if [[ -z "$HOMEPAGE_TOUCHED" ]]; then
  exit 0
fi

# Check loop-receipt freshness
RECEIPT="$PROJECT_DIR/.claude/last-page-loop.json"

if [[ ! -f "$RECEIPT" ]]; then
  cat >&2 <<EOF
[pre-page-commit-check] BLOCKED — FULL-PAGE LOOP §11 has never run.

Staged homepage-affecting files:$HOMEPAGE_TOUCHED

Per _tasks/SOLEN_LIVE_TRUTH.md §11, before committing changes that touch
homepage surfaces, run the 7-step FULL-PAGE LOOP:
  1. curl /de + grep raw i18n keys (whole doc, target: 0)
  2. Screenshots top/middle/bottom + compare to solen-coral.html slices
  3. Section list live vs reference (counts, names, order)
  4. Per-section verifier + page-level verifier dispatch
  5. Lesson-propagation grep across all components/home/*
  6. Cross-section visual checks (rhythm, redundancy, banned patterns)
  7. git diff main..HEAD components/ public/solen-coral.html review

When all 7 pass, the verifier subagent must write
\`.claude/last-page-loop.json\` with timestamp + scope summary.

Override (only if user has explicitly approved skip):
  touch .claude/page-loop-skip.flag
  (auto-deleted after one commit)

This gate exists because L8/LIVE_TRUTH §11 had 10% compliance rate; moved
to runtime per Agent 3 of the 2026-05-03 5-agent root-cause audit.
EOF
  exit 2
fi

# Receipt exists — check freshness against staged files
RECEIPT_MTIME=$(stat -f %m "$RECEIPT" 2>/dev/null || stat -c %Y "$RECEIPT" 2>/dev/null || echo 0)
NEWEST_STAGED_MTIME=0

while IFS= read -r f; do
  if [[ -n "$f" && -f "$PROJECT_DIR/$f" ]]; then
    M=$(stat -f %m "$PROJECT_DIR/$f" 2>/dev/null || stat -c %Y "$PROJECT_DIR/$f" 2>/dev/null || echo 0)
    if [[ $M -gt $NEWEST_STAGED_MTIME ]]; then
      NEWEST_STAGED_MTIME=$M
    fi
  fi
done <<< "$STAGED"

if [[ $RECEIPT_MTIME -lt $NEWEST_STAGED_MTIME ]]; then
  RECEIPT_AGE=$(( $(date +%s) - RECEIPT_MTIME ))
  cat >&2 <<EOF
[pre-page-commit-check] BLOCKED — FULL-PAGE LOOP §11 receipt is STALE.

Receipt timestamp: $(date -r "$RECEIPT" 2>/dev/null || date -d "@$RECEIPT_MTIME" 2>/dev/null) (${RECEIPT_AGE}s ago)
Newest staged file mtime: $(date -r "$NEWEST_STAGED_MTIME" 2>/dev/null || date -d "@$NEWEST_STAGED_MTIME" 2>/dev/null)

Staged homepage-affecting files have been edited AFTER the last loop ran.
Re-run the loop, then commit. See LIVE_TRUTH §11 for the 7 steps.

Override:
  touch .claude/page-loop-skip.flag
EOF
  exit 2
fi

# Receipt is fresh — allow the commit
exit 0
