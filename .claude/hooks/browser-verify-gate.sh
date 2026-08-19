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
#   • an mcp__Claude_Browser__*    tool call (the in-app browser: navigate / computer /
#     read_page / javascript_tool — added 2026-07-16 after the gate REPEAT-BLOCKED a turn
#     that HAD driven the browser: the tool server was renamed and this list still named
#     only the retired mcp__Claude_Preview__ prefix, so real verification scored zero.
#     The health check had already flagged this exact phantom string.)
#   • an mcp__Claude_Preview__*    tool call (retired prefix, kept so old transcripts score)
#   • an mcp__playwright__*        tool call
#   • a Bash curl/wget of localhost / 127.0.0.1 on ANY port  (or a `playwright` run)
#   • ANY subagent dispatched this turn (Agent tool call, ANY subagent_type — including
#     "design-verifier", which carries NO special trust) whose OWN transcript shows it did
#     one of the above itself (2026-08-19 fix: measured 36 of 234 real blocks, 15.4%, fired
#     on a turn whose subagent HAD driven a browser — the gate read only the parent
#     transcript and never looked at subagents/<id>.jsonl, so real verification that happened
#     one level down was invisible to it. See SUBAGENT VERIFICATION LOOKUP below.)
#     CORRECTED 2026-08-19, second pass: the first pass fixed the tool name for the
#     design-verifier case (the old detector checked for a "Task" tool that does not exist in
#     this build — 0 of 4,225 real transcripts, so that branch was dead by construction) but
#     changed it into an UNCONDITIONAL pass on the literal string "design-verifier" in
#     subagent_type, with zero inspection of what that subagent actually did. An Agent
#     dispatch with subagent_type:"design-verifier" and a fabricated "PASS" tool_result, and
#     NO browser/curl signal anywhere in its own transcript (or no transcript captured at
#     all), cleared the gate. Confirmed via hook-probe against constructed transcripts shaped
#     like real ones (parent .jsonl + subagents/agent-<id>.jsonl + .meta.json). There is now
#     no special case for design-verifier: it is checked by the EXACT SAME subagent-transcript
#     lookup as every other subagent_type. Dispatching one does not by itself clear the gate;
#     it must actually have driven a browser or hit localhost, same bar as any subagent.
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

# ── --selftest (added 2026-08-19, stress-test pass) ─────────────────────────────────────────
# Drives this file end to end as a real subprocess against built fixture transcripts (there is
# no pure function to unit-test; the verdict lives in the shell body). Builds a scratch session
# directory shaped exactly like a real one (`<uuid>.jsonl` parent transcript + a sibling
# `<uuid>/subagents/agent-<id>.jsonl` + `.meta.json`, the layout measured off real transcripts
# under ~/.claude/projects), runs every case, prints PASS/FAIL, exits 1 on any failure.
if [[ "${1:-}" == "--selftest" ]]; then
  ST_DIR=$(mktemp -d "${TMPDIR:-/tmp}/bvg-selftest.XXXXXX")
  trap 'rm -rf "$ST_DIR"' EXIT

  python3 - "$ST_DIR" <<'PYEOF'
import json, os, sys

BASE = sys.argv[1]

def row(**kw):
    return json.dumps(kw)

def user_prompt(text):
    return row(type="user", isMeta=False, message={"role": "user", "content": text},
               timestamp="2026-08-19T10:00:00.000Z")

def asst(tool_uses):
    content = [{"type": "tool_use", "id": t["id"], "name": t["name"], "input": t["input"]}
               for t in tool_uses]
    return row(type="assistant", message={"role": "assistant", "content": content},
               timestamp="2026-08-19T10:00:01.000Z")

def tool_result(tid, text="ok"):
    return row(type="user", isMeta=False,
               message={"role": "user", "content": [
                   {"type": "tool_result", "tool_use_id": tid, "content": text}]},
               timestamp="2026-08-19T10:00:02.000Z")

UI_EDIT = {"id": "toolu_EDIT01", "name": "Edit",
           "input": {"file_path": "/Users/sulo/Documents/solen/app/[locale]/page.tsx",
                      "old_string": "p-3", "new_string": "p-4"}}
API_EDIT = {"id": "toolu_API01", "name": "Edit",
            "input": {"file_path": "/Users/sulo/Documents/solen/app/api/health/route.ts",
                       "old_string": "a", "new_string": "b"}}

def write(name, rows):
    open(os.path.join(BASE, name + ".jsonl"), "w").write("\n".join(rows) + "\n")

def write_subagent(parent_name, agent_id, tool_use_id, rows):
    d = os.path.join(BASE, parent_name, "subagents")
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, "agent-%s.jsonl" % agent_id), "w").write("\n".join(rows) + "\n")
    open(os.path.join(d, "agent-%s.meta.json" % agent_id), "w").write(json.dumps(
        {"agentType": "general-purpose", "description": "sub", "toolUseId": tool_use_id,
         "spawnDepth": 1, "parentAgentId": None}))

# 1 CONTROL-BLOCK: a UI edit, nothing after it
write("t1_control_block", [
    user_prompt("make the salon card padding tighter"),
    asst([UI_EDIT]), tool_result("toolu_EDIT01"),
])

# 2 CONTROL-PASS: a UI edit, then a real browser nav (known-answer round trip)
write("t2_control_pass", [
    user_prompt("make the salon card padding tighter"),
    asst([UI_EDIT]), tool_result("toolu_EDIT01"),
    asst([{"id": "toolu_NAV01", "name": "mcp__Claude_Browser__navigate",
           "input": {"url": "http://localhost:3000/de"}}]),
    tool_result("toolu_NAV01"),
])

# 3 REPRODUCED DEFECT A (now fixed): Agent dispatch, subagent_type design-verifier, whose
# OWN transcript shows it genuinely drove a browser. The FIRST 2026-08-19 fix pass checked
# for a "Task" tool, which does not exist in this build, so it never actually cleared
# anything (dead code, 0 of 4,225 real transcripts). The SECOND pass, this one, closes the
# follow-on defect the first pass introduced (case 8/9 below): a design-verifier dispatch
# alone, with no real verification in its own transcript, must NOT clear the gate. This case
# is the legitimate positive: a real design-verifier subagent that actually verified.
write("t3_defect_a_design_verifier", [
    user_prompt("make the salon card padding tighter"),
    asst([UI_EDIT]), tool_result("toolu_EDIT01"),
    asst([{"id": "toolu_DV01", "name": "Agent",
           "input": {"description": "verify padding", "subagent_type": "design-verifier",
                      "prompt": "verify the padding change on /de"}}]),
    tool_result("toolu_DV01", "PASS: padding matches spec"),
])
write_subagent("t3_defect_a_design_verifier", "aDV01", "toolu_DV01", [
    user_prompt("verify the padding change on /de"),
    asst([{"id": "toolu_SUBNAV02", "name": "mcp__Claude_Browser__navigate",
           "input": {"url": "http://localhost:3000/de"}}]),
    tool_result("toolu_SUBNAV02"),
])

# 4 REPRODUCED DEFECT B (now fixed): Agent dispatch of an ORDINARY subagent (not named
# design-verifier) whose OWN transcript shows it really drove a browser. The gate used to
# read only the parent transcript, so this real verification was invisible to it.
write("t4_defect_b_subagent_verified", [
    user_prompt("make the salon card padding tighter, verify it works"),
    asst([UI_EDIT]), tool_result("toolu_EDIT01"),
    asst([{"id": "toolu_GEN01", "name": "Agent",
           "input": {"description": "apply and verify", "subagent_type": "general-purpose",
                      "prompt": "apply the padding fix and verify it renders"}}]),
    tool_result("toolu_GEN01", "Verified on localhost:3000/de, looks right."),
])
write_subagent("t4_defect_b_subagent_verified", "aVERIFIED01", "toolu_GEN01", [
    user_prompt("apply the padding fix and verify it renders"),
    asst([{"id": "toolu_SUBNAV01", "name": "mcp__Claude_Browser__navigate",
           "input": {"url": "http://localhost:3000/de"}}]),
    tool_result("toolu_SUBNAV01"),
])

# 5 SAFETY: an Agent IS dispatched, but its own transcript shows no browser/curl call at
# all. The fix must not blanket-pass on the mere presence of a subagent dispatch.
write("t5_safety_subagent_did_not_verify", [
    user_prompt("make the salon card padding tighter, verify it works"),
    asst([UI_EDIT]), tool_result("toolu_EDIT01"),
    asst([{"id": "toolu_GEN02", "name": "Agent",
           "input": {"description": "changelog", "subagent_type": "general-purpose",
                      "prompt": "write a one-line changelog entry"}}]),
    tool_result("toolu_GEN02", "Changelog: tightened salon card padding."),
])
write_subagent("t5_safety_subagent_did_not_verify", "aNOVERIFY01", "toolu_GEN02", [
    user_prompt("write a one-line changelog entry"),
    asst([{"id": "toolu_SUBREAD01", "name": "Read",
           "input": {"file_path": "/Users/sulo/Documents/solen/app/[locale]/page.tsx"}}]),
    tool_result("toolu_SUBREAD01", "...file contents..."),
])

# 6 SAFETY: no UI edit this turn at all (a backend-only route change) -> never fires
write("t6_safety_no_ui_edit", [
    user_prompt("add a health check to the cron endpoint"),
    asst([API_EDIT]), tool_result("toolu_API01"),
])

# 7 SAFETY: an Agent dispatched for something unrelated to THIS turn's edit, with a
# subagent transcript that itself contains an UNRELATED Edit but no verification -> BLOCK
write("t7_safety_unrelated_subagent_work", [
    user_prompt("make the salon card padding tighter"),
    asst([UI_EDIT]), tool_result("toolu_EDIT01"),
    asst([{"id": "toolu_GEN03", "name": "Agent",
           "input": {"description": "unrelated research", "subagent_type": "general-purpose",
                      "prompt": "research SMS pricing, no UI work"}}]),
    tool_result("toolu_GEN03", "SMS pricing summary attached."),
])
write_subagent("t7_safety_unrelated_subagent_work", "aUNRELATED01", "toolu_GEN03", [
    user_prompt("research SMS pricing, no UI work"),
    asst([{"id": "toolu_SUBWEB01", "name": "WebSearch", "input": {"query": "seven.io pricing"}}]),
    tool_result("toolu_SUBWEB01", "..."),
])

# 8 REPRODUCED DEFECT (grader's attack payload 1, 2026-08-19 second pass): Agent dispatch,
# subagent_type "design-verifier", tool_result claims "PASS", but the subagent's OWN
# transcript contains no browser/curl signal at all (just a Read). The first fix pass
# unconditionally trusted the subagent_type string alone; this must now BLOCK, exactly like
# case 5 does for an ordinary subagent that didn't verify.
write("t8_defect_fake_design_verifier_no_evidence", [
    user_prompt("make the salon card padding tighter"),
    asst([UI_EDIT]), tool_result("toolu_EDIT01"),
    asst([{"id": "toolu_DVFAKE01", "name": "Agent",
           "input": {"description": "verify padding", "subagent_type": "design-verifier",
                      "prompt": "verify the padding change on /de"}}]),
    tool_result("toolu_DVFAKE01", "PASS: padding matches spec"),
])
write_subagent("t8_defect_fake_design_verifier_no_evidence", "aFAKE01", "toolu_DVFAKE01", [
    user_prompt("verify the padding change on /de"),
    asst([{"id": "toolu_SUBREAD02", "name": "Read",
           "input": {"file_path": "/Users/sulo/Documents/solen/app/[locale]/page.tsx"}}]),
    tool_result("toolu_SUBREAD02", "...file contents..."),
])

# 9 REPRODUCED DEFECT (grader's attack payload 1b, 2026-08-19 second pass): same fake
# design-verifier dispatch, but no subagents/ entry was ever captured for it (as if the
# subagent never ran or its transcript was lost). Must also BLOCK: the subagent_type string
# alone, real or fake evidence file or none, must never be sufficient on its own.
write("t9_defect_fake_design_verifier_no_transcript", [
    user_prompt("make the salon card padding tighter"),
    asst([UI_EDIT]), tool_result("toolu_EDIT01"),
    asst([{"id": "toolu_DVFAKE02", "name": "Agent",
           "input": {"description": "verify padding", "subagent_type": "design-verifier",
                      "prompt": "verify the padding change on /de"}}]),
    tool_result("toolu_DVFAKE02", "PASS: padding matches spec"),
])

print("built")
PYEOF

  pass_() { echo "  PASS  $1"; }
  fail_() { echo "  FAIL  $1   expected $2 got $3"; }

  st_ok=0; st_bad=0
  run_case() {
    local desc="$1" file="$2" expect="$3"
    local payload got rc
    payload=$(python3 -c "import json,sys;print(json.dumps({'session_id':'st','transcript_path':sys.argv[1],'stop_hook_active':False,'hook_event_name':'Stop'}))" "$file")
    set +e
    echo "$payload" | CLAUDE_PROJECT_DIR="$ST_DIR/flagdir" bash "$0" >/dev/null 2>&1
    rc=$?
    set -e
    got="OK"; [[ $rc -eq 2 ]] && got="BLOCK"
    if [[ "$got" == "$expect" ]]; then
      pass_ "$desc"; st_ok=$((st_ok+1))
    else
      fail_ "$desc" "$expect" "$got"; st_bad=$((st_bad+1))
    fi
  }

  run_case "1 CONTROL: UI edit alone -> BLOCK" \
    "$ST_DIR/t1_control_block.jsonl" "BLOCK"
  run_case "2 CONTROL: UI edit + real browser nav -> OK (known-answer round trip)" \
    "$ST_DIR/t2_control_pass.jsonl" "OK"
  run_case "3 REPRODUCED DEFECT A (now fixed): design-verifier that actually verified -> OK" \
    "$ST_DIR/t3_defect_a_design_verifier.jsonl" "OK"
  run_case "4 REPRODUCED DEFECT B (now fixed): ordinary subagent verified in its own transcript -> OK" \
    "$ST_DIR/t4_defect_b_subagent_verified.jsonl" "OK"
  run_case "5 SAFETY: Agent dispatched but subagent never verified -> still BLOCK" \
    "$ST_DIR/t5_safety_subagent_did_not_verify.jsonl" "BLOCK"
  run_case "6 SAFETY: no UI edit this turn at all -> OK, gate never fires" \
    "$ST_DIR/t6_safety_no_ui_edit.jsonl" "OK"
  run_case "7 SAFETY: subagent did unrelated work, no verification -> still BLOCK" \
    "$ST_DIR/t7_safety_unrelated_subagent_work.jsonl" "BLOCK"
  run_case "8 REPRODUCED DEFECT (second pass, now fixed): fake design-verifier PASS, subagent transcript has no verify signal -> still BLOCK" \
    "$ST_DIR/t8_defect_fake_design_verifier_no_evidence.jsonl" "BLOCK"
  run_case "9 REPRODUCED DEFECT (second pass, now fixed): fake design-verifier PASS, no subagent transcript captured at all -> still BLOCK" \
    "$ST_DIR/t9_defect_fake_design_verifier_no_transcript.jsonl" "BLOCK"

  echo ""
  echo "$st_ok/$((st_ok + st_bad)) passed"
  [[ $st_bad -eq 0 ]] && exit 0 || exit 1
fi

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
                  and (($i.file_path // "") | test("/(app|src|components|components-legacy)/"))
                  and ((($i.file_path // "") | test("_mockups|node_modules|\\.test\\.|\\.spec\\.|\\.stories\\.|/\\.claude/")) | not))
               then "E"
             elif (($n | startswith("mcp__claude-in-chrome__"))
                    or ($n | startswith("mcp__Claude_Browser__"))
                    or ($n | startswith("mcp__Claude_Preview__"))
                    or ($n | startswith("mcp__playwright__")))
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

# ── SUBAGENT VERIFICATION LOOKUP (2026-08-19 fix) ──────────────────────────────────────────
# The parent transcript only ever shows an "Agent" tool_use + its returned text; a subagent
# that genuinely drove a browser did so in its OWN transcript, which this gate never opened.
# Session layout (measured on real transcripts, not assumed): a subagent dispatched from
# tool_use id `toolu_X` inside parent transcript `<dir>/<uuid>.jsonl` writes its own transcript
# to `<dir>/<uuid>/subagents/agent-<agentId>.jsonl`, with a sibling `agent-<agentId>.meta.json`
# whose `.toolUseId` field equals `toolu_X` — that field is the only correlation available: the
# filename's <agentId> has no fixed relationship to the tool_use id. One line per input line,
# aligned 1:1 with TOKENS: the Agent tool_use id(s), if any, an assistant line dispatched.
AGENTIDS=$(tail -n 1200 "$TRANSCRIPT" | jq -R -r '
  (fromjson?) as $e
  | if ($e != null and $e.type=="assistant" and (($e.message.content | type)=="array"))
    then ([$e.message.content[]? | select(.type=="tool_use" and .name=="Agent") | .id]
          | join(","))
    else "" end
' 2>/dev/null)

SUBAGENTS_DIR="$(dirname "$TRANSCRIPT")/$(basename "$TRANSCRIPT" .jsonl)/subagents"

# a subagent transcript "verifies" by the identical signal list as the parent (browser tool
# call, or a localhost curl/wget/playwright run) — deliberately NOT recursing into a
# subagent's own further Agent dispatches (unmeasured depth; the incident demonstrated one
# level, a direct subagent driving a browser itself, not a grandchild doing it).
subagent_has_verify() {
  [[ -f "$1" ]] || return 1
  tail -n 1200 "$1" | jq -R -r '
    (fromjson?) as $e
    | if ($e != null and $e.type=="assistant" and (($e.message.content | type)=="array"))
      then ([$e.message.content[]? | select(.type=="tool_use")
             | (.name) as $n | (.input // {}) as $i
             | if (($n | startswith("mcp__claude-in-chrome__"))
                    or ($n | startswith("mcp__Claude_Browser__"))
                    or ($n | startswith("mcp__Claude_Preview__"))
                    or ($n | startswith("mcp__playwright__")))
                 then "V"
               elif ($n=="Bash" and (($i.command // "")
                      | test("(curl|wget)[^\\n]*(localhost|127\\.0\\.0\\.1):[0-9]+|playwright")))
                 then "V"
               else "" end] | join(""))
      else "" end
  ' 2>/dev/null | grep -q "V"
}

if [[ -d "$SUBAGENTS_DIR" ]]; then
  TOKARR=(); while IFS= read -r _l; do TOKARR+=("$_l"); done <<< "$TOKENS"
  AIDARR=(); while IFS= read -r _l; do AIDARR+=("$_l"); done <<< "$AGENTIDS"
  for _i in "${!AIDARR[@]}"; do
    _ids="${AIDARR[$_i]}"
    [[ -z "$_ids" ]] && continue
    IFS=',' read -ra _IDLIST <<< "$_ids"
    for _tid in "${_IDLIST[@]}"; do
      [[ -z "$_tid" ]] && continue
      _sub_jsonl=""
      for _meta in "$SUBAGENTS_DIR"/*.meta.json; do
        [[ -f "$_meta" ]] || continue
        if jq -e --arg id "$_tid" '.toolUseId == $id' "$_meta" >/dev/null 2>&1; then
          _sub_jsonl="${_meta%.meta.json}.jsonl"
          break
        fi
      done
      if [[ -n "$_sub_jsonl" ]] && subagent_has_verify "$_sub_jsonl"; then
        case "${TOKARR[$_i]}" in
          -)       TOKARR[$_i]="VERIFY" ;;
          UIEDIT)  TOKARR[$_i]="UIEDITVERIFY" ;;
        esac
        break
      fi
    done
  done
  TOKENS=$(printf '%s\n' "${TOKARR[@]}")
fi

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
       • preview_start to bring the page up, then mcp__Claude_Browser__navigate,
         read_page, computer (click / screenshot), read_console_messages
       • or the agent browser (claude-in-chrome), or a playwright run
       • or a design-verifier subagent that ITSELF drives a browser or hits localhost
         (dispatching one is not enough by itself; its own transcript is checked the same
         as any subagent's, so it has to actually verify, not just report "PASS")
     A single such call this turn clears the gate.
     (Tool names corrected 2026-08-18: this text named preview_snapshot, preview_click,
     preview_screenshot and preview_inspect, and NONE of those exist in this build. The
     gate's own detection above already looks for the real mcp__Claude_Browser__* names,
     so only the instructions were wrong, which is worse: it refused the turn and then
     told you to call four tools that are not there.)

  2. CAN'T VERIFY RIGHT NOW (no browser connected, nothing runnable, or a backend-only
     change that renders nothing)? Release the gate AND tell the owner why in your reply:
       touch .claude/browser-verify-skip.flag        # 30-min TTL

Do not just repeat "done" — that will hit this gate again.
EOF
exit 2
