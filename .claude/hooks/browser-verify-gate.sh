#!/usr/bin/env bash
# browser-verify-gate.sh — Solen "actually drive a browser before you say done" gate
# ============================================================================
#
# Purpose: a STOP gate. It blocks the turn from ending when — in THIS turn — I
# edited rendered UI (*.tsx / *.jsx / *.css / *.scss under app|src|components)
# but never actually drove a browser to verify it works.
#
# Why this exists: the owner's standing complaint is "you claim it works without
# testing it." (2026-07-02, voice: "if I tell you to go test out everything in the
# website, actually go test it out, use the agent browser skill to click through
# stuff ... and check if it actually works before you conclude.") Honor-system
# rules (CLAUDE.md rule 7/9, verifier-loop) lose to task focus. This moves it to a
# runtime gate: the turn literally cannot end on a UI change until a real browser
# verification tool ran — the same pattern that fixed the exists-check.
#
# Fires BLOCK (exit 2) when ALL hold, evaluated over the CURRENT turn only
# (everything after the last human message in the transcript):
#   1. At least one Edit/Write/MultiEdit hit a rendered-UI file, AND
#   2. No browser-verification signal ran at/after that first UI edit, AND
#   3. No fresh override flag.
#
# A verification signal is ANY of:
#   • an mcp__claude-in-chrome__*  tool call (the agent browser)
#   • an mcp__Claude_Preview__*    tool call (preview_snapshot/click/screenshot/…)
#   • an mcp__playwright__*        tool call
#   • a Task call with subagent_type "design-verifier"
#   • a Bash curl/wget of localhost / 127.0.0.1 on ANY port  (or a `playwright` run)
#
# ESCAPE (loop-safety — a Stop gate can otherwise trap the turn):
#   touch .claude/browser-verify-skip.flag     # 30-min TTL
# Use it ONLY when verification is genuinely impossible right now (no browser
# connected, nothing runnable, backend-only refactor that renders nothing) AND
# tell the owner why. The block message says this, so the model self-releases
# instead of looping.
#
# Backend-only changes never fire: API routes are *.ts (not *.tsx); .md / _plans /
# _design-system / .claude / mockups are all excluded.
#
# Registered via .claude/settings.json under hooks.Stop.

set -uo pipefail

INPUT=$(cat)
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // empty' 2>/dev/null)
STOP_ACTIVE=$(echo "$INPUT" | jq -r '.stop_hook_active // false' 2>/dev/null)
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"

# No transcript → can't evaluate the turn. Fail open (never trap on missing data).
[[ -n "$TRANSCRIPT" && -f "$TRANSCRIPT" ]] || exit 0

# Fresh override flag (30-min TTL), parity with the repo's other gates.
FLAG="$PROJECT_DIR/.claude/browser-verify-skip.flag"
if [[ -f "$FLAG" ]]; then
  AGE=$(( $(date +%s) - $(stat -f %m "$FLAG" 2>/dev/null || stat -c %Y "$FLAG" 2>/dev/null || echo 0) ))
  [[ $AGE -le 1800 ]] && exit 0
fi

# Classify each transcript entry (bounded to the recent window) into one token:
#   PROMPT      = a genuine human message (turn boundary)
#   UIEDIT      = an assistant message containing an Edit/Write to a rendered-UI file
#   VERIFY      = an assistant message containing a browser-verification tool call
#   UIEDITVERIFY / - otherwise
TOKENS=$(tail -n 1200 "$TRANSCRIPT" | jq -R -r '
  (fromjson? ) as $e
  | if $e == null then "-"
    elif ($e.type=="user"
          and (($e.isMeta // false) | not)
          and (($e.message.content | type) == "string"
                or (($e.message.content | type) == "array"
                    and ((any($e.message.content[]?; .type=="tool_result")) | not))))
      then "PROMPT"
    elif ($e.type=="assistant" and (($e.message.content | type)=="array"))
      then
        ([ $e.message.content[] | select(.type=="tool_use")
           | (.name) as $n | (.input // {}) as $i
           | if (($n=="Edit" or $n=="Write" or $n=="MultiEdit")
                  and (($i.file_path // "") | test("\\.(tsx|jsx|css|scss)$"))
                  and (($i.file_path // "") | test("/(app|src|components)/"))
                  and ((($i.file_path // "") | test("_mockups|node_modules|\\.test\\.|\\.spec\\.|\\.stories\\.|/\\.claude/")) | not))
               then "E"
             elif (($n | startswith("mcp__claude-in-chrome__"))
                    or ($n | startswith("mcp__Claude_Preview__"))
                    or ($n | startswith("mcp__playwright__")))
               then "V"
             elif ($n=="Task" and (($i.subagent_type // "")=="design-verifier"))
               then "V"
             elif ($n=="Bash" and (($i.command // "")
                    | test("(curl|wget)[^\\n]*(localhost|127\\.0\\.0\\.1):[0-9]+|playwright")))
               then "V"
             else "" end
         ] | join("")) as $codes
        | (if ($codes | test("E")) then "UIEDIT" else "" end)
          + (if ($codes | test("V")) then "VERIFY" else "" end)
        | if . == "" then "-" else . end
    else "-" end
' 2>/dev/null)

# Decide over the last turn only: first UI edit after the last human message must
# be followed (at or after) by a verification signal.
VERDICT=$(printf '%s\n' "$TOKENS" | awk '
  { tok[NR]=$0; n=NR; if ($0 ~ /PROMPT/) lp=NR }
  END {
    fe=0; lv=0
    for (i=lp+1; i<=n; i++) {
      if (tok[i] ~ /UIEDIT/ && fe==0) fe=i
      if (tok[i] ~ /VERIFY/)          lv=i
    }
    if (fe>0 && (lv==0 || lv<fe)) print "BLOCK"; else print "OK"
  }')

[[ "$VERDICT" == "BLOCK" ]] || exit 0

# ── BLOCK ──
PREFIX=""
[[ "$STOP_ACTIVE" == "true" ]] && PREFIX="REPEAT BLOCK — you were already told this. "
cat <<EOF >&2
[browser-verify-gate] ${PREFIX}You changed rendered UI this turn (*.tsx/*.css under
app|src|components) but never actually drove a browser to verify it. "Looks right in the
code" is not verification (CLAUDE.md rule 7/9).

Before ending the turn, DO ONE of:

  1. VERIFY FOR REAL — make sure the dev server is up, then click through the changed
     screen and confirm it works:
       • preview tools:  preview_snapshot / preview_click / preview_screenshot / preview_inspect
       • or the agent browser (claude-in-chrome), or a playwright run
       • or a design-verifier subagent
     A single such call this turn clears the gate.

  2. CAN'T VERIFY RIGHT NOW (no browser connected, nothing runnable, or a backend-only
     change that renders nothing)? Release the gate AND tell the owner why in your reply:
       touch .claude/browser-verify-skip.flag        # 30-min TTL

Do not just repeat "done" — that will hit this gate again.
EOF
exit 2
