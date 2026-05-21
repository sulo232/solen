#!/usr/bin/env bash
# pre-component-edit-pixel-spec.sh — block component edits after a pixel-spec
# run UNTIL the annotated.png has been visually verified.
# ============================================================================
#
# Purpose: enforce the "tier-1 verification" gate in CLAUDE.md rule #6.
# When `pixel-spec-auto/scripts/extract.py` runs, it writes:
#   - <output-dir>/.review-needed     (review-flag file)
#   - /tmp/pixel-spec-current.json    (global pointer to the pending review)
#
# This hook checks if there's a pending review AND the agent is trying to
# Edit/Write a UI component file. If both true → BLOCK with a message telling
# the agent to verify the annotated.png first.
#
# To clear the gate:
#   rm <output-dir>/.review-needed
# (after reading the annotated.png + reporting to user that detection is correct)
#
# Override (when verification is genuinely not needed, e.g. user said skip):
#   touch .claude/pixel-spec-skip-review.flag
# (flag auto-expires in 30 minutes)
#
# Why this exists: the agent has a track record of running pixel-spec-auto
# then proceeding directly to component edits WITHOUT looking at the
# annotated.png. If the auto-scanner missed elements (text-only sections,
# heavily compressed JPEGs, etc.), the spec is unreliable and editing against
# it produces wrong code that the agent then claims is "exact." This hook
# moves the verification step to a place the agent literally cannot bypass.

set -uo pipefail

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Only Edit and Write are subject to this gate. Other tools (Read, Bash, Grep)
# are needed for verification itself.
if [[ "$TOOL_NAME" != "Edit" && "$TOOL_NAME" != "Write" ]]; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only block edits to UI component files. Other edits (docs, configs, hooks
# themselves) should not be blocked.
case "$FILE_PATH" in
  */app/*/_components/*|*/app/[locale]/*|*/components/*|*/components-legacy/*)
    : # UI component — subject to gate
    ;;
  *)
    exit 0 ;;
esac

# Check the global pointer file for a pending pixel-spec run
POINTER_FILE="/tmp/pixel-spec-current.json"
if [[ ! -f "$POINTER_FILE" ]]; then
  exit 0  # no recent pixel-spec — nothing to gate
fi

# Read the pointer
OUTPUT_DIR=$(jq -r '.output_dir // empty' "$POINTER_FILE" 2>/dev/null)
ANNOTATED_PNG=$(jq -r '.annotated_png // empty' "$POINTER_FILE" 2>/dev/null)
SPEC_MD=$(jq -r '.spec_md // empty' "$POINTER_FILE" 2>/dev/null)
TIMESTAMP=$(jq -r '.timestamp // empty' "$POINTER_FILE" 2>/dev/null)
SLUG=$(jq -r '.slug // empty' "$POINTER_FILE" 2>/dev/null)

# If pointer is stale (>1 hour old), auto-clear and pass
if [[ -n "$TIMESTAMP" ]]; then
  POINTER_AGE_SEC=$(( $(date +%s) - $(date -j -f "%Y-%m-%dT%H:%M:%S" "${TIMESTAMP%.*}" +%s 2>/dev/null || echo 0) ))
  if [[ "$POINTER_AGE_SEC" -gt 3600 ]]; then
    rm -f "$POINTER_FILE"
    exit 0
  fi
fi

# Check for the .review-needed flag in the output dir
REVIEW_FLAG="${OUTPUT_DIR}/.review-needed"
if [[ ! -f "$REVIEW_FLAG" ]]; then
  exit 0  # review already cleared — pass
fi

# Check for override flag (user explicit skip)
SKIP_FLAG="$CLAUDE_PROJECT_DIR/.claude/pixel-spec-skip-review.flag"
if [[ -f "$SKIP_FLAG" ]]; then
  SKIP_AGE_SEC=$(( $(date +%s) - $(stat -f%m "$SKIP_FLAG" 2>/dev/null || echo 0) ))
  if [[ "$SKIP_AGE_SEC" -lt 1800 ]]; then
    exit 0  # skip is fresh, pass
  fi
  rm -f "$SKIP_FLAG"  # stale skip, clean up
fi

# BLOCK — emit message to stderr (visible to agent)
cat >&2 <<EOF
[pre-component-edit-pixel-spec] BLOCKED — annotated.png NOT VERIFIED.

A pixel-spec-auto run completed but the annotated.png has not been visually
confirmed yet. You cannot edit UI components against an unverified spec —
that's exactly the failure mode this gate exists to prevent.

Pending spec:
  slug:           $SLUG
  annotated.png:  $ANNOTATED_PNG
  spec.md:        $SPEC_MD
  output_dir:     $OUTPUT_DIR
  timestamp:      $TIMESTAMP

To unblock:

  1. Read the annotated.png with the Read tool:
       Read("$ANNOTATED_PNG")

  2. State to the user what you see: do the highlighted boundaries
     (yellow card outline, green row hairlines, red button) correctly
     enclose the UI in the source image?

  3. If correct → \`rm "$REVIEW_FLAG"\` then retry the edit.

  4. If incorrect → escalate to \`screenshot-spec\` (manual annotation).
     The auto-scanner missed elements; don't implement against the bad spec.

Override (user explicit skip):
  touch "$SKIP_FLAG"
  (auto-expires in 30 minutes)
EOF

exit 1
