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
#
# 2026-08-18 fix, measured: a real staged DELETION blocked correctly, but emptying a
# page.tsx down to a stub removes the route in every way that matters and shows up
# as `git status M` (modified), never `D` (deleted), so the delete-only check never
# saw it. Fixed by also scanning staged MODIFICATIONS of the same route/component
# file patterns: one whose staged size drops under a small threshold, or whose
# staged content lost the `export default` its HEAD version had, is treated as a
# removal too and needs the same graveyard line.
#
# Self-test: --selftest (bash pre-commit-graveyard.sh --selftest).

set -uo pipefail

if [[ "${1:-}" == "--selftest" ]]; then
  TDIR="${TMPDIR:-/tmp}/pre-commit-graveyard-selftest-$$"
  mkdir -p "$TDIR/app/[locale]/widget" "$TDIR/_design-system"
  ( cd "$TDIR" \
      && git init -q \
      && git -c user.email=t@t.co -c user.name=t commit -q --allow-empty -m init \
  )
  echo "keywords | what | why | record" > "$TDIR/_design-system/REMOVED.md"
  cat > "$TDIR/app/[locale]/widget/page.tsx" <<'PAGE'
import { getWidgets } from "@/lib/widgets";

export default async function WidgetPage() {
  const widgets = await getWidgets();
  return (
    <div>
      <h1>Widgets</h1>
      <ul>
        {widgets.map((w) => (
          <li key={w.id}>{w.name}</li>
        ))}
      </ul>
    </div>
  );
}
PAGE
  ( cd "$TDIR" && git add -A \
      && git -c user.email=t@t.co -c user.name=t commit -q -m "add widget page" )

  PASS=0; TOTAL=3
  PAYLOAD='{"tool_name":"Bash","tool_input":{"command":"git commit -m gut"}}'

  # 1. a real staged DELETION with no graveyard line still blocks (unchanged behavior).
  rm -f "$TDIR/app/[locale]/widget/page.tsx"
  ( cd "$TDIR" && git add -A )
  echo "$PAYLOAD" | CLAUDE_PROJECT_DIR="$TDIR" bash "$0" >/dev/null 2>&1; RC1=$?
  if [[ "$RC1" == "2" ]]; then
    echo "  PASS  a real staged deletion with no graveyard line still blocks (exit=$RC1, expected=2)"; PASS=$((PASS+1))
  else
    echo "  FAIL  a real staged deletion with no graveyard line still blocks (exit=$RC1, expected=2)"
  fi
  ( cd "$TDIR" && git checkout -q HEAD -- "app/[locale]/widget/page.tsx" )

  # 2. gutting the page down to a stub (staged as M, not D) must now block too.
  cat > "$TDIR/app/[locale]/widget/page.tsx" <<'STUB'
export default function WidgetPage() { return null; }
STUB
  ( cd "$TDIR" && git add "app/[locale]/widget/page.tsx" )
  echo "$PAYLOAD" | CLAUDE_PROJECT_DIR="$TDIR" bash "$0" >/dev/null 2>&1; RC2=$?
  if [[ "$RC2" == "2" ]]; then
    echo "  PASS  a page gutted to a stub (M, not D) now blocks (exit=$RC2, expected=2)"; PASS=$((PASS+1))
  else
    echo "  FAIL  a page gutted to a stub (M, not D) now blocks (exit=$RC2, expected=2)"
  fi
  ( cd "$TDIR" && git checkout -q HEAD -- "app/[locale]/widget/page.tsx" )

  # 3. an ordinary content edit (still a real page, same size ballpark, default export intact)
  #    must still pass , this must never fire on normal work.
  cat > "$TDIR/app/[locale]/widget/page.tsx" <<'EDIT'
import { getWidgets } from "@/lib/widgets";

export default async function WidgetPage() {
  const widgets = await getWidgets();
  return (
    <div>
      <h1>All Widgets</h1>
      <ul>
        {widgets.map((w) => (
          <li key={w.id}>{w.name} ({w.count})</li>
        ))}
      </ul>
    </div>
  );
}
EDIT
  ( cd "$TDIR" && git add "app/[locale]/widget/page.tsx" )
  echo "$PAYLOAD" | CLAUDE_PROJECT_DIR="$TDIR" bash "$0" >/dev/null 2>&1; RC3=$?
  if [[ "$RC3" == "0" ]]; then
    echo "  PASS  an ordinary content edit (default export intact) still passes (exit=$RC3, expected=0)"; PASS=$((PASS+1))
  else
    echo "  FAIL  an ordinary content edit (default export intact) still passes (exit=$RC3, expected=0)"
  fi

  rm -rf "$TDIR"
  echo ""
  echo "$PASS/$TOTAL passed"
  [[ "$PASS" == "$TOTAL" ]] && exit 0 || exit 1
fi

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

ROUTE_PATTERN='^app/.*(page|route)\.tsx?$|^components-legacy/.*\.tsx$|^components/.*\.tsx$|^app/\[locale\]/_components/.*\.tsx$|.*/_components/.*\.tsx$'

# Staged DELETIONS of product surfaces (-M so renames don't count as deletions).
DELETED=$(git diff --cached --name-status -M 2>/dev/null | awk '$1=="D"{print $2}' \
  | grep -E "$ROUTE_PATTERN" || true)

# Staged MODIFICATIONS that GUT a route/component down to a stub also count as a removal:
# emptying app/**/page.tsx to a few lines shows as `M` in git status, never `D`, so the
# delete-only check above never sees it. A route/component file whose STAGED size drops
# under 300 bytes, or whose HEAD version carried `export default` and the staged version
# does not, is functionally deleted even though git calls it a modification.
GUTTED=""
MODIFIED=$(git diff --cached --name-status -M 2>/dev/null | awk '$1=="M"{print $2}' \
  | grep -E "$ROUTE_PATTERN" || true)
if [[ -n "$MODIFIED" ]]; then
  while IFS= read -r f; do
    [[ -z "$f" ]] && continue
    NEW_SIZE=$(git show ":$f" 2>/dev/null | wc -c | tr -d ' ')
    HAD_DEFAULT=$(git show "HEAD:$f" 2>/dev/null | grep -c "export default" || true)
    HAS_DEFAULT=$(git show ":$f" 2>/dev/null | grep -c "export default" || true)
    if [[ "${NEW_SIZE:-0}" -lt 300 ]] || { [[ "${HAD_DEFAULT:-0}" -gt 0 ]] && [[ "${HAS_DEFAULT:-0}" -eq 0 ]]; }; then
      GUTTED="${GUTTED}${f}
"
    fi
  done <<< "$MODIFIED"
fi

[[ -z "$DELETED" && -z "$GUTTED" ]] && exit 0

# Graveyard staged in the same commit → growth happened, allow.
git diff --cached --name-only 2>/dev/null | grep -q '_design-system/REMOVED.md' && exit 0

{
  echo "[pre-commit-graveyard] This commit removes product surfaces:"
  [[ -n "$DELETED" ]] && echo "$DELETED" | sed 's/^/  DELETED: /'
  [[ -n "$GUTTED" ]] && echo "$GUTTED" | sed '/^$/d; s/^/  GUTTED TO A STUB: /'
  echo "…but _design-system/REMOVED.md is not in the commit. If this deletion is an"
  echo "owner decision, add a graveyard line first:"
  echo "  npm run removed -- \"<keywords>\" \"<what>\" \"<why>\" \"<record>\"   && git add _design-system/REMOVED.md"
  echo "If it's purely mechanical (dead code, no decision):  touch .claude/graveyard-skip.flag"
} >&2
exit 2
