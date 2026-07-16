#!/usr/bin/env bash
# pre-commit-graveyard.sh — the graveyard must GROW with deletions (owner 2026-06-12).
# ============================================================================
# Blocks `git commit` when the STAGED changes DELETE a product surface
# (app page/route, component) but _design-system/REMOVED.md is not part of
# the same commit. Deleting a feature without a graveyard line is how the
# anti-duplication system decays — a future session can't know the deletion
# was deliberate and will eventually rebuild it.
#
# Skip (deletion is mechanical, e.g. a rename or dead-code cleanup with no
# owner decision behind it):  touch .claude/graveyard-skip.flag   (30-min TTL)

set -uo pipefail
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
CMD=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
[[ "$TOOL" == "Bash" ]] || exit 0
echo "$CMD" | grep -qE '(^|[;&|[:space:]])git[[:space:]]+(-[^[:space:]]+[[:space:]]+)*commit([[:space:]]|$)' || exit 0

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$PROJECT_DIR" 2>/dev/null || exit 0

FLAG="$PROJECT_DIR/.claude/graveyard-skip.flag"
if [[ -f "$FLAG" ]]; then
  AGE=$(( $(date +%s) - $(stat -f %m "$FLAG" 2>/dev/null || stat -c %Y "$FLAG" 2>/dev/null || echo 0) ))
  [[ $AGE -le 1800 ]] && exit 0
fi

# Staged DELETIONS of product surfaces (-M so renames don't count as deletions).
DELETED=$(git diff --cached --name-status -M 2>/dev/null | awk '$1=="D"{print $2}' \
  | grep -E '^app/.*(page|route)\.tsx?$|^components-legacy/.*\.tsx$|^components/.*\.tsx$|^app/\[locale\]/_components/.*\.tsx$|.*/_components/.*\.tsx$' || true)
[[ -z "$DELETED" ]] && exit 0

# Graveyard staged in the same commit → growth happened, allow.
git diff --cached --name-only 2>/dev/null | grep -q '_design-system/REMOVED.md' && exit 0

cat <<EOM >&2
[pre-commit-graveyard] This commit DELETES product surfaces:
$(echo "$DELETED" | sed 's/^/  /')
…but _design-system/REMOVED.md is not in the commit. If this deletion is an
owner decision, add a graveyard line first:
  npm run removed -- "<keywords>" "<what>" "<why>" "<record>"   && git add _design-system/REMOVED.md
If it's purely mechanical (dead code, no decision):  touch .claude/graveyard-skip.flag
EOM
exit 2
