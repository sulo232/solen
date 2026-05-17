#!/usr/bin/env bash
# pre-done-claim-check.sh — Solen "done claim needs Playwright evidence" guard
# ============================================================================
#
# Purpose: enforce CLAUDE.md global rules 7 + 8 + 9 (verifier-loop protocol) at
# the action layer. Blocks the agent from stopping its turn when it has made a
# "done / fixed / shipped / working / rendering" claim in its response WITHOUT
# corresponding Playwright tool use in the same turn.
#
# Why this exists: the agent's track record across this codebase shows it
# repeatedly claims completion based on `tsc clean` / `curl 200 OK` /
# `log-grep returns 0 errors`. Rule 8 of the global CLAUDE.md explicitly
# states those signals are NECESSARY-BUT-NEVER-SUFFICIENT — the verifier-PASS
# (screenshot + sub-agent or live render description) is the close condition.
# Documentation alone hasn't changed the behavior; this hook moves the gate
# to runtime where the agent literally cannot stop without addressing it.
#
# Triggers BLOCK (exit 2) when ALL of these hold for the current turn:
#   1. The last assistant text contains done-class language
#      (it's done / it's fixed / it's shipped / it's working / it's rendering /
#       renders correctly / fully verified / ready for review / all sections
#       present / no errors / shipped and verified — see DONE_PATTERNS below)
#   2. AT LEAST ONE Edit or Write tool call happened in the recent transcript
#      AND that file path is a UI-affecting file (.tsx / .css / .html /
#      components-legacy/*)
#   3. NO Playwright browser tool was used in the recent transcript
#      (browser_navigate / browser_take_screenshot / browser_evaluate /
#       browser_snapshot)
#
# When all three hold → block stop + inject reminder telling the agent to
# either (a) verify in Playwright now and re-claim, or (b) retract the claim.
#
# Override (when the agent has a legitimate non-UI "done" claim, e.g.
# documentation-only edits, or when the user explicitly waives verification):
#   touch .claude/done-claim-override.flag
# Hook respects flag for 5 minutes after creation, then auto-expires.
#
# Conservative by design (low false-positive rate):
#   - DONE_PATTERNS are specific phrases, not just the word "done" alone
#   - UI-edit detection requires the recent transcript to contain an actual
#     Edit/Write to a UI file extension, not just .md or .json
#   - Override flag is deliberately short-lived so a single approval doesn't
#     open a permanent door
#
# Registered via .claude/settings.json under hooks.Stop matcher.

set -uo pipefail

INPUT=$(cat)
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# No transcript = nothing to verify against; let stop proceed.
if [[ -z "$TRANSCRIPT_PATH" || ! -f "$TRANSCRIPT_PATH" ]]; then
  exit 0
fi

# ── Override flag (parity with pre-sweep-check.sh pattern) ─────────────────
FLAG="$PROJECT_DIR/.claude/done-claim-override.flag"
if [[ -f "$FLAG" ]]; then
  FLAG_AGE=$(( $(date +%s) - $(stat -f %m "$FLAG" 2>/dev/null || stat -c %Y "$FLAG" 2>/dev/null || echo 0) ))
  if [[ $FLAG_AGE -le 300 ]]; then
    exit 0
  fi
fi

# ── Read the last ~80 transcript events (covers the current turn comfortably) ─
RECENT=$(tail -n 80 "$TRANSCRIPT_PATH")

# ── 1. Detect done-class language in the most recent assistant text ────────
# Specific phrases only — avoid false positives like "I haven't done that"
# or "would be done" by anchoring on "it's / now / ready / fully / no errors".
DONE_PATTERNS='(it'"'"'s (done|shipped|fixed|working|rendering|verified|live)|is now (rendering|working|fixed|verified|live|in place)|shipped (it|and verified|cleanly)|ready (for|to)( your)? (review|sign[- ]?off|verify)|renders correctly|fully verified|(zero|no) (errors|issues|gaps)|all sections (rendering|present|visible|locked)|the page is (rendering|working|live)|locked and verified|✅ verified|page is now visible|page should now render|render(ed|s) clean)'

# Extract last assistant message text only (skip tool_use/tool_result events)
LAST_ASSISTANT_TEXT=$(echo "$RECENT" | jq -rc 'select(.type == "assistant") | .message.content[]? | select(.type == "text") | .text' 2>/dev/null | tail -3 | tr '\n' ' ')

HAS_DONE_CLAIM=$(echo "$LAST_ASSISTANT_TEXT" | grep -iEc "$DONE_PATTERNS" || true)

if [[ "${HAS_DONE_CLAIM:-0}" == "0" ]]; then
  # No done-class claim → no enforcement needed.
  exit 0
fi

# ── 2. Did a UI-affecting Edit/Write happen recently? ──────────────────────
# Stops the hook from firing on pure docs/Q&A turns. Only Edit/Write to
# .tsx / .ts / .jsx / .js / .css / .scss / .html OR any components-legacy/
# path counts as UI-affecting.
UI_EDIT_PATHS=$(echo "$RECENT" | jq -rc 'select(.type == "assistant") | .message.content[]? | select(.type == "tool_use" and (.name == "Edit" or .name == "Write")) | .input.file_path // empty' 2>/dev/null)

HAS_UI_EDIT=$(echo "$UI_EDIT_PATHS" | grep -cE '\.(tsx|ts|jsx|js|css|scss|html)$|/components-legacy/' || true)

if [[ "${HAS_UI_EDIT:-0}" == "0" ]]; then
  # No UI files touched this turn → done-claim probably refers to docs/config.
  exit 0
fi

# ── 3. Was Playwright actually used in this turn? ──────────────────────────
PLAYWRIGHT_USED=$(echo "$RECENT" | jq -rc 'select(.type == "assistant") | .message.content[]? | select(.type == "tool_use") | .name' 2>/dev/null | grep -cE '^mcp__playwright__browser_(navigate|take_screenshot|screenshot|evaluate|snapshot|console_messages)$' || true)

if [[ "${PLAYWRIGHT_USED:-0}" -gt "0" ]]; then
  # Verifier evidence is present in the transcript → claim is allowed.
  exit 0
fi

# ── BLOCK ──────────────────────────────────────────────────────────────────
# All three conditions held: done-claim + UI edit + no Playwright.
# Send a system reminder back to the agent via stderr (claude-code routes
# Stop-hook stderr at exit code 2 back to the agent as instruction).
cat <<EOF >&2
[pre-done-claim-check] You made a "done / fixed / shipped / working / rendering" claim in this turn AND edited a UI file (.tsx / .css / etc.) AND did NOT use Playwright (mcp__playwright__browser_*) in this turn.

Per CLAUDE.md global rules 7 + 8 + 9: visual / behavioral completion claims need browser evidence, not tsc-clean / curl-200 / log-grep alone. The verifier-PASS is the close condition.

You have two options — pick one and continue this turn:

  (a) VERIFY NOW. Call mcp__playwright__browser_navigate to the relevant URL, mcp__playwright__browser_take_screenshot, and then describe in 1-2 lines what is literally visible in the screenshot. Re-state the done-claim only after that.

  (b) RETRACT. Restate your last paragraph without done-language — e.g. "I edited X but have not yet verified it renders correctly. Want me to open it in Playwright now?"

Override (for legitimate docs-only / non-UI completion claims this heuristic misjudged):
  touch .claude/done-claim-override.flag   # 5-minute TTL
EOF

# Exit code 2 blocks the Stop and sends stderr to the agent.
exit 2
