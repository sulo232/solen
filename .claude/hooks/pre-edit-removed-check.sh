#!/usr/bin/env bash
# pre-edit-removed-check.sh — ANTI-RESURRECT guard for EDITING existing route pages.
# ============================================================================
#
# Closes the gap pre-build-exists-check.sh explicitly leaves open ("editing an
# EXISTING file never fires"). The #1 recurring failure isn't only re-CREATING a
# removed thing , it's EDITING a zombie page that was de-linked/removed but whose
# file still lingers (and whose REMOVED.md entry may be stale). Example: /angebote
# was de-linked from nav (orphaned) yet REMOVED.md still said "keep (revived)", so
# editing it sailed through and the owner had to catch the resurrection by hand.
#
# Fires (BLOCK, exit 2) on Edit/Write to an EXISTING app/**/page.tsx when the route
# is EITHER:
#   (a) ORPHANED , nothing in app/components links to /<segment> (only direct URL or
#       a redirect stub), i.e. it was de-linked from the product, OR
#   (b) named in _design-system/REMOVED.md with removal verbs and NOT a clear keep.
# The block tells you to confirm with the owner it's still a LIVE surface first.
#
# Override (you confirmed it IS still wanted):  touch .claude/removed-edit-skip.flag  (30-min TTL)
# Registered in .claude/settings.json under hooks.PreToolUse "Edit" + "Write".

set -uo pipefail
INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

[[ -n "$FILE" ]] || exit 0
# Only EXISTING files (a brand-new file is pre-build-exists-check's job).
[[ -e "$FILE" ]] || exit 0
# Only route PAGES (the resurrect-risk surface). Not route.ts/components/libs.
case "$FILE" in *"/page.tsx") ;; *) exit 0 ;; esac

# Acknowledged override (30-min TTL).
FLAG="$PROJECT_DIR/.claude/removed-edit-skip.flag"
if [[ -f "$FLAG" ]]; then
  AGE=$(( $(date +%s) - $(stat -f %m "$FLAG" 2>/dev/null || stat -c %Y "$FLAG" 2>/dev/null || echo 0) ))
  [[ "$AGE" -lt 1800 ]] && exit 0
fi

# Route segment = the dir holding page.tsx. Skip dynamic ([..]) and locale roots.
SEG=$(basename "$(dirname "$FILE")")
case "$SEG" in \[*\]|"app"|"") exit 0 ;; esac

REMOVED="$PROJECT_DIR/_design-system/REMOVED.md"

# (a) ORPHANED , no real inbound link to /<segment> (exclude its own files + redirect stubs).
# Orphaned ALONE is unreliable (e.g. /checkout is reached via router.push, no static href) , it
# only counts toward a block IN COMBINATION with graveyard history, never on its own.
LINKS=$(grep -rn "/$SEG\b" "$PROJECT_DIR/app" "$PROJECT_DIR/components" "$PROJECT_DIR/components-legacy" \
          --include='*.tsx' --include='*.ts' 2>/dev/null \
        | grep -iE "href|router\.(push|replace)|<Link|to=\"|nav|menu|tabbar" \
        | grep -v "/$SEG/page.tsx" | grep -v "/$SEG/layout" | grep -v "redirect(" || true)
ORPHANED=false; [[ -z "$LINKS" ]] && ORPHANED=true

# (b) REMOVED.md graveyard history for this segment; HIT_STRONG = a removal verb and NOT a keep marker.
HIT=""; HIT_STRONG=""
if [[ -f "$REMOVED" ]]; then
  HIT=$(grep -in "[ /\"]$SEG\b" "$REMOVED" 2>/dev/null | head -3 || true)
  HIT_STRONG=$(printf '%s\n' "$HIT" | grep -iE "remov|delet|kill|never rebuild|do NOT re-?(add|surface|build)" \
               | grep -viE "keep|kept|reviv|do NOT delete" || true)
fi

# Decide: block on a DEFINITIVE removal, or on de-linked WITH graveyard history. Never orphaned-alone.
BLOCK=""; WHY=""
if [[ -n "$HIT_STRONG" ]]; then
  BLOCK=1; WHY="REMOVED.md records /$SEG as REMOVED (not a keep):
  $HIT_STRONG"
elif [[ "$ORPHANED" == true && -n "$HIT" ]]; then
  BLOCK=1; WHY="/$SEG is ORPHANED (no nav/Link/push in app|components points to it , only a direct URL or redirect) AND has graveyard history:
  $HIT"
fi
[[ -z "$BLOCK" ]] && exit 0

>&2 echo "ANTI-RESURRECT GATE: editing the route /$SEG (app/.../$SEG/page.tsx).
  $WHY

The #1 recurring failure here is reviving a surface the owner removed. Before editing:
  - CONFIRM with the owner it is still a LIVE, wanted surface (do not assume from the file existing).
  - If still wanted: touch $PROJECT_DIR/.claude/removed-edit-skip.flag (30-min) and retry.
  - If removed/superseded: do NOT edit it , delete the route + update REMOVED.md instead."
exit 2
