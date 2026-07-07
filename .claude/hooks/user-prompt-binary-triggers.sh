#!/usr/bin/env bash
# user-prompt-binary-triggers.sh — MECHANICAL enforcement of the binary-trigger rule.
# ============================================================================
#
# Why this exists (2026-06-10): the binary-trigger rule ("image attached →
# pixel-spec-auto fires FIRST", "selected-element XML → getBoundingClientRect
# fires FIRST") lived only in a memory one-liner + a CLAUDE.md section that
# was never actually written. After context compaction the agent eyeballed
# attached Fresha reference screenshots twice instead of measuring, shipped a
# misaligned reviews page, and the owner had to ask "why did the trigger not
# fire". A rule that depends on the model's attention dies with its context.
# This hook does not: it runs on EVERY user prompt and injects the trigger
# instruction as context whenever the input pattern-matches.
#
# Event: UserPromptSubmit. stdout (exit 0) is added to Claude's context.
# Keep output SHORT — it lands in the conversation every matching turn.

set -uo pipefail

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)
[[ -z "$PROMPT" ]] && exit 0

# NOTIFICATION GUARD (confirmed live 3x, 2026-07-06/07): background
# <task-notification> blocks and "[SYSTEM NOTIFICATION ...]" text are NOT
# owner messages, but land in "prompt" the same way. Skip silently so this
# hook never injects trigger context onto a background event.
if echo "$PROMPT" | grep -qE '^[[:space:]]*(<task-notification>|\[SYSTEM NOTIFICATION)' ; then
  exit 0
fi

P=$(echo "$PROMPT" | tr '[:upper:]' '[:lower:]')

TRIGGERS=()

# 1. Selected-element XML pasted (launch devtools picker) → measure, don't interpret.
if echo "$PROMPT" | grep -q '<launch-selected-element'; then
  TRIGGERS+=("SELECTED ELEMENT pasted → FIRST tool call: preview_eval getBoundingClientRect() + getComputedStyle on the element, its container, and siblings. Report the NUMBERS before any edit.")
fi

# 2. Reference image attached / pointed at → pixel-scan it, don't eyeball.
if echo "$P" | grep -qE '\[image|screenshot|screen shot|(^|[^a-z])ss( |$|[^a-z])|ss folder|img_[0-9]+|attached.*(pic|image|photo|ref)|(pic|image|photo|ref).*attached'; then
  TRIGGERS+=("REFERENCE IMAGE in play → FIRST tool call: python3 ~/.claude/skills/pixel-spec-auto/scripts/extract.py <image> <outdir>. If detection fails (borderless cards), PIL pixel-sample the measurements directly. Never implement from eyeballing.")
  # gemini-auto-fire (2026-07-07): record that a real reference is on the table this
  # session, so a later screenshot PostToolUse call can inject the "run gemini-visual
  # -check now" mandate instead of waiting for the Stop-time backstop.
  SID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null)
  if [[ -n "$SID" ]]; then
    mkdir -p "$HOME/.claude/state" 2>/dev/null
    touch "$HOME/.claude/state/visual-ref-${SID}.flag" 2>/dev/null
  fi
fi

# 3. Measurement-complaint vocabulary → the user SEES a concrete defect; measure it.
if echo "$P" | grep -qE 'overlap|clipp|misalign|unbalanc|different height|diff height|heights everywhere|not like th|nothing like|not 1:1|1:1|pixel|exact|compare bro|compare th|looks off|still wrong|still off'; then
  TRIGGERS+=("MEASUREMENT COMPLAINT → measure the live UI (preview_eval getBoundingClientRect) AND the reference (PIL sample) BEFORE editing. Numbers first, then one fix. No guess-and-apply.")
fi

# 4. Brand-named structural rebuild → capture the real thing, not memory.
if echo "$P" | grep -qE 'like (the )?fresha|fresha('"'"'s)? (screenshot|ss|ref|page|design)|wie fresha'; then
  TRIGGERS+=("FRESHA STRUCTURE reference → fire fresha-section-capture (or measure the provided screenshots with PIL/pixel-spec-auto) before rebuilding. STRUCTURE=Fresha, AESTHETIC=Uber/LOCKFILE.")
fi

# 5. Removal/rejection vocabulary → the graveyard must grow THIS TURN (owner 2026-06-12).
if echo "$P" | grep -qE 'remove (it|that|this|them|wm|completely)|delete (it|that|this|them)|get rid|never (rebuild|add|again)|stop adding|we don.?t need|kill (it|that|this)|entfern|wieso gibt es das noch'; then
  TRIGGERS+=("POSSIBLE OWNER REJECTION/DELETION → if this turn removes or rejects a feature/section/treatment, append a 🪦 line SAME TURN: npm run removed -- \"<keywords>\" \"<what>\" \"<why>\" \"<record>\" (_design-system/REMOVED.md). The anti-dup system decays if the graveyard isn't fed.")
fi

[[ ${#TRIGGERS[@]} -eq 0 ]] && exit 0

echo "⚡ BINARY TRIGGERS FIRED (mechanical — .claude/hooks/user-prompt-binary-triggers.sh; rule table: CLAUDE.md '⚡ Binary triggers'):"
for t in "${TRIGGERS[@]}"; do echo "• $t"; done
echo "Detection = fire as the FIRST tool call of this turn. Eyeballing a reference is the banned failure mode."
exit 0
