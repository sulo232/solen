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
# Override (you confirmed it IS still wanted):
#   echo "<reason>" > .claude/removed-edit-skip.flag   (30-min TTL)
#   (2026-07-11 estate-audit fix: a bare `touch` no longer skips , the flag must carry a
#   non-blank reason on its first line. This is the anti-revive twin of the anti-duplication
#   gate above and was similarly waved off a lot; raising the bypass cost from a silent touch
#   to a written reason is deliberate friction, not a bug.)
# Registered in .claude/settings.json under hooks.PreToolUse "Edit" + "Write".

set -uo pipefail

if [[ "${1:-}" == "--selftest" ]]; then
  # 2026-08-18 fix, measured: this gate loose-matched _design-system/REMOVED.md by bare keyword
  # and blocked 12 of 31 live route pages (/search /inspo /profile /account /coiffeur /termine
  # among them). Line 34 names the Inspo search focus-ring TREATMENT, line 104 a page TITLE,
  # line 44 a homepage-section COMPONENT, line 115 a superseded profile-tab HUB, none of which
  # removed the route, and a bare keyword hit could not tell a component/treatment/title apart
  # from the route itself. Fix: the "what" field must name the route as a delimited /segment
  # path sitting next to the word "page" or "route", not just share a keyword. This harness
  # proves both halves on a synthetic REMOVED.md + synthetic route files, never the real ones.
  TDIR="${TMPDIR:-/tmp}/pre-edit-removed-selftest-$$"
  mkdir -p "$TDIR/_design-system" "$TDIR/app/[locale]/widget" "$TDIR/app/[locale]/gadget"
  cat > "$TDIR/_design-system/REMOVED.md" <<'MD'
- widget widget-focus-ring | Widget focused-state treatment inside the /demo screen: the focus ring on the widget input. | Owner ditched the focus ring 2026-01-01, back button removed too. | widget/page.tsx unrelated
- gadget gadget-page | the standalone gadget page /gadget was deleted. | owner removed 2026-01-01, never rebuild | was app/[locale]/gadget/page.tsx
MD
  echo "export default function Widget() { return null }" > "$TDIR/app/[locale]/widget/page.tsx"
  echo "export default function Gadget() { return null }" > "$TDIR/app/[locale]/gadget/page.tsx"
  PASS=0; TOTAL=2

  PAYLOAD_WIDGET=$(printf '{"tool_name":"Edit","tool_input":{"file_path":"%s/app/[locale]/widget/page.tsx"}}' "$TDIR")
  echo "$PAYLOAD_WIDGET" | CLAUDE_PROJECT_DIR="$TDIR" bash "$0" >/dev/null 2>&1; RC1=$?
  if [[ "$RC1" == "0" ]]; then
    echo "  PASS  entry naming a component/treatment (not the route) must pass (exit=$RC1, expected=0)"; PASS=$((PASS+1))
  else
    echo "  FAIL  entry naming a component/treatment (not the route) must pass (exit=$RC1, expected=0)"
  fi

  PAYLOAD_GADGET=$(printf '{"tool_name":"Edit","tool_input":{"file_path":"%s/app/[locale]/gadget/page.tsx"}}' "$TDIR")
  echo "$PAYLOAD_GADGET" | CLAUDE_PROJECT_DIR="$TDIR" bash "$0" >/dev/null 2>&1; RC2=$?
  if [[ "$RC2" == "2" ]]; then
    echo "  PASS  entry naming the actual removed ROUTE must still block (exit=$RC2, expected=2)"; PASS=$((PASS+1))
  else
    echo "  FAIL  entry naming the actual removed ROUTE must still block (exit=$RC2, expected=2)"
  fi

  rm -rf "$TDIR"
  echo ""
  echo "$PASS/$TOTAL passed"
  [[ "$PASS" == "$TOTAL" ]] && exit 0 || exit 1
fi

INPUT=$(cat)
TOOL=$(echo "$INPUT" | jq -r '.tool_name // empty')
FILE=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

[[ -n "$FILE" ]] || exit 0
# Only EXISTING files (a brand-new file is pre-build-exists-check's job).
[[ -e "$FILE" ]] || exit 0
# (c) COMPONENT BRANCH, added 2026-08-14. Owner: "wheres that even gnna live tho[ugh], removed that
# section from new homepage ... u didnt even flag it thats a big problem make a gate for the core
# cause."
#
# THE CORE CAUSE, stated plainly: this gate only ever looked at ROUTE PAGES, so styling a SECTION
# that the current design has already dropped sailed straight through. That is what happened: a whole
# turn went into the home page's business block, deleting a placeholder and centring the text, while
# two plan files said that section is not on the mobile home at all. Nothing looked, so nothing said
# so, and the owner had to.
#
# The check is mechanical and cheap: when the edit targets a COMPONENT, grep the plan and design docs
# for that component's name on a line that also carries a removal or hide word. Any hit is surfaced
# and the edit stops until it is read. It does not judge; it makes me look at what was already
# written before I restyle something that may not belong on the screen any more.
case "$FILE" in
  *"/_components/"*.tsx|*"/components/"*.tsx|*"/components-legacy/"*.tsx)
    COMP=$(basename "$FILE" .tsx)
    case "$COMP" in index|page|layout|route) exit 0 ;; esac
    # The phrase has to be about the SECTION being off a screen, not about deleting something inside
    # it. The first draft matched any "remove"/"deleted" on the line and flagged SalonCard, whose
    # notes are full of removing a badge and a pill FROM the card. Those are edits to the component,
    # which is the ordinary work this gate must never interrupt.
    # A CONTRADICTION, not a keyword. Drafts two and three matched hide/remove words near the name
    # and flagged four ordinary components, because plan files are full of "remove the line above the
    # header" and "drop the SearchOverlay prop" , work ON a component, which is the normal work this
    # gate must never interrupt. Keyword matching cannot tell those apart and every widening made it
    # noisier.
    #
    # So it checks a FACT against a FACT instead. The doc phrase has to be the specific claim that
    # the section is off a screen ("hide X below md", "X is absent on mobile"), and the code has to
    # DISAGREE: the place that mounts it carries no responsive-hide class. Doc says gone, code says
    # rendered, and only that pair blocks. Today's case is exactly that shape: a plan says "hide
    # BusinessTeaser below md, all delivered", and page.tsx mounts it with nothing around it.
    DOC_HITS=$(grep -rniE "hide[^.]{0,20}\b${COMP}\b[^.]{0,20}below (md|the)|\b${COMP}\b[^.]{0,25}(hidden below|absent on mobile|not on (the )?mobile)" \
                 --include='*.md' "$PROJECT_DIR/_plans" "$PROJECT_DIR/_design-system" 2>/dev/null \
               | head -3 || true)
    if [[ -n "$DOC_HITS" ]]; then
      MOUNTS=$(grep -rn --include='*.tsx' -B 2 "<${COMP}[ /]" "$PROJECT_DIR/app" 2>/dev/null \
               | grep -v "/dev/" | grep -iE "hidden|max-md:|md:block|md:hidden" | head -2 || true)
      [[ -n "$MOUNTS" ]] && DOC_HITS=""   # the code already honours it; nothing to flag
    fi
    if [[ -n "$DOC_HITS" ]]; then
      {
        echo "SECTION-STILL-WANTED CHECK: you are restyling \`${COMP}\`, and the written record says it was hidden or removed somewhere."
        echo
        echo "$DOC_HITS"
        echo
        echo "The owner caught this by hand on 2026-08-14: a full turn went into the home page's business block while two plan files said that section is not on the mobile home at all. Styling something the design has already dropped is wasted work, and worse, it looks like the section is blessed."
        echo
        echo "READ those lines first. Then either confirm the section is still wanted and say so in the flag, or fix the fact that it is still mounted."
        echo "Override: echo \"<why this section is still live>\" > .claude/removed-edit-skip.flag  (30-min TTL, non-blank)"
      } >&2
      exit 2
    fi
    exit 0
    ;;
esac

# Only route PAGES (the resurrect-risk surface). Not route.ts/components/libs.
case "$FILE" in *"/page.tsx") ;; *) exit 0 ;; esac

# Acknowledged override (30-min TTL). Honored ONLY with a non-blank reason on its first line
# (2026-07-11 fix, this gate was one of the two most-waved-off skips in the ledger: 14 bare
# `touch`es) , `touch .claude/removed-edit-skip.flag` alone no longer skips.
FLAG="$PROJECT_DIR/.claude/removed-edit-skip.flag"
if [[ -f "$FLAG" ]]; then
  AGE=$(( $(date +%s) - $(stat -f %m "$FLAG" 2>/dev/null || stat -c %Y "$FLAG" 2>/dev/null || echo 0) ))
  REASON=$(head -n1 "$FLAG" 2>/dev/null | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
  [[ "$AGE" -lt 1800 && -n "$REASON" ]] && exit 0
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
# Each line's format is `keywords | what | why | record` (see the file's own header). The keyword FIELD
# (everything before the first "|") has NO leading slashes, e.g. line 10 is
# "- pakete packages package-manager | the entire packages feature ... | owner removed 2026-06-11 ...".
# (2026-07-26, second pass) A prior fix here required a literal "/" before SEG, which broke the PRIMARY
# mechanism: it turned "pakete" hits from 3 down to 0, a real hole, because the keyword field almost never
# has a slash. The actual bug was never the missing slash, it was matching the PROSE after the first "|"
# (that is where "saved"/"inspo" showed up as ordinary words, and where a nested child route's full path,
# e.g. /salon/[slug]/barber/[barberSlug], leaked a false hit for "salon"). So the match is now scoped to the
# keyword field ONLY, token by token (tokens are whitespace-separated): a token counts as a hit when it
# EQUALS the segment exactly ("pakete" for seg pakete), or when it is a path whose FINAL component equals
# the segment ("/profile/packages" for seg packages) , never a path PREFIX, and never anything past the
# first "|". Implemented in awk (not grep) because that per-token compare needs a proper split, not a
# regex; string equality also sidesteps escaping the bracketed dynamic segments ([slug], [barberSlug]) that
# show up as ordinary tokens elsewhere in the file.
HIT=""; HIT_STRONG=""
if [[ -f "$REMOVED" ]]; then
  HIT=$(awk -v seg="$SEG" '
    {
      n = split($0, parts, "|")
      first = parts[1]
      what = (n >= 2) ? parts[2] : ""
      nf = split(first, toks, /[ \t]+/)
      lseg = tolower(seg)
      hit = 0
      for (i = 1; i <= nf; i++) {
        tok = toks[i]
        if (tok == "") continue
        ltok = tolower(tok)
        if (ltok == lseg) { hit = 1; break }
        if (index(tok, "/") > 0) {
          k = split(tok, comps, "/")
          if (tolower(comps[k]) == lseg) { hit = 1; break }
        }
      }
      if (!hit) next
      # ROUTE CHECK (2026-08-18 fix, measured: this loose keyword match blocked 12 of 31 live
      # route pages, e.g. line 34 names the Inspo search focus-ring TREATMENT and line 104 a
      # page TITLE, neither is the route). The "what" field (2nd pipe column) must name the
      # route as a delimited /segment path next to the word "page" or "route", not just share
      # a keyword with a component/treatment/title that happens to render inside it.
      lwhat = tolower(what)
      routed = 0
      if (match(lwhat, "(^|[^a-z0-9_-])/" lseg "([^a-z0-9_-]|$)")) {
        slashpos = index(substr(lwhat, RSTART, RLENGTH), "/") + RSTART - 1
        wstart = (slashpos > 40) ? slashpos - 40 : 1
        wbefore = substr(lwhat, wstart, slashpos - wstart)
        wafter = substr(lwhat, slashpos, RLENGTH + 40)
        if ((wbefore ~ /page|route/) || (wafter ~ /page|route/)) routed = 1
      }
      if (routed) print NR ":" $0
    }
  ' "$REMOVED" 2>/dev/null | head -3 || true)
  HIT_STRONG=$(printf '%s\n' "$HIT" | grep -iE "remov|delet|kill|never rebuild|do NOT re-?(add|surface|build)" \
               | grep -viE "keep|kept|reviv|do NOT delete|un-?kill|restor|bring(ing)?[ -]back|brought[ -]back|reinstat|un-?delet|re-?enabl" || true)
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
  - If still wanted: echo \"<reason>\" > $PROJECT_DIR/.claude/removed-edit-skip.flag (30-min) and retry.
    (a bare touch no longer skips , the flag needs a non-blank reason on its first line)
  - If removed/superseded: do NOT edit it , delete the route + update REMOVED.md instead."
exit 2
