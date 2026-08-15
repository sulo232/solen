# Hook-estate audit findings (8 chunks, 2026-07-10, LAW_SYSTEM box 0c)

Format: hook | severity | problem | fix sketch | line
Triage key (added during 0c-3a): [FIX] apply now, [SKIP] rejected + why, [PARK] later.

## Chunk 1 (always-recommend .. delegate-media-read)
CLEAN: audit-status.py

always-recommend-gate.py | misfire-risk | PUNT list bare "needs your"/"for your review" blocks ordinary completion messages | require punt phrase to co-occur with a question mark / options list | 64-65
apology-spiral-gate.py | bug | regex requires "i" before sorry/apolog*; bare sentence-initial "Sorry, ..." never counted | add alternation for bare \bsorry\b / \bapologies\b | 25-39
approved-surface-guard.py | misfire-risk | BIG_EDIT 500 chars per-call only; sequential small edits rewrite page untripped | track cumulative bytes per file per session | 26,46
approved-surface-guard.py | bug | slug regex only /dev/<slug>/page.tsx; sibling Section.tsx/components/* unprotected | broaden to any file under /dev/<slug>/ | 37
checkbox-evidence-gate.py | misfire-risk | EVIDENCE accepts any hex string or bare "verified:" token, no validation | cross-check sha against git log / file:line against file | 105-109
checkpoint-merge-main.py | bug | unconditional git add -A stages untracked secrets (.env.local) | tracked-only staging | 65
checkpoint-merge-main.py | improvement | full-repo tsc --noEmit up to 180s on every Stop | skip when no ts/tsx changed | 113
coder-git-guard.py | misfire-risk | literal-word regex; git aliases (co=checkout, undo=reset --hard) bypass | expand aliases before matching | 91-97
concise-response-gate.py | misfire-risk | any line starting "|" excluded from word count; fake table evades | only strip real table rows (>=2 cells) | 44
copy-lint-gate.py | misfire-risk | check_caps skips is_comment() unlike siblings; comment mentioning "uppercase" blocks edit | add same is_comment skip | 132-145
council-trigger.py | bug | "council already ran" = substring hit on dispatch prompt text; mentioning "reviewer" skips real review | require completed council-* Task result | 143-147
defer-bulk-gate.py | misfire-risk | bare "the bulk" matches ordinary sentences; GENUINE list too narrow | co-occurrence with defer verb; loosen GENUINE | 65-73
delegate-media-read-gate.py | bug | MEDIA_EXT missing .svg/.webm/.avif | add them | 20-21

## Chunk 2 (design-verify .. invariants-nudge)
CLEAN: devils-advocate.py
design-verify-gate.py | bug | GIT_UI commit-path match lacks IS_MOCKUP exclusion; committing only /dev/ or /_mockups/ still demands verifier | route through is_real_ui() | 38-40,128-129
drift-ledger-inject.py | token-waste | no per-session dedup; matched blocks re-inject FULL on every keyword repeat | add per-session per-block dedup state | 31-64
exists-guard.py | bug | len>=4 then len>=5 re-filter drops all 4-letter tokens (Card, Chip, Menu, Icon) | harmonize to >=4 | 62-63
exists-guard.py | misfire-risk | escape hatch = bare "exists-check" substring anywhere | require naming a real repo path | 41-42
fable-skill-trigger.py | bug | `hä\\b` compiles to literal backslash-b; German alternative never matches | single backslash | 47
fable-skill-trigger.py | misfire-risk | EXECUTION fires on ANY prompt >350 chars regardless of content | require keyword alongside length | 116
finish-autonomously-gate.py | misfire-risk | CHECKPOINT regex matches "I want to also fix the typo" | anchor on trailing ? or shall/should framing | 224
finish-autonomously-gate.py | misfire-risk | EARLY bare "do you want"/"should i" lacks _pick/_await exemption (only TEEUP has it); genuine mockup fork gets blocked | apply same exemption to early_hit | 264-270
finish-autonomously-gate.py | bug | final fallback hardcodes /Users/sulo/Documents/solen; dirty check can hit WRONG tree | fail-open when env+cwd empty | 318-319
finish-autonomously-gate.py | dead-code | .autonomous-armed-<sid> flag only deleted on RESET phrase; accumulates forever | mtime TTL | 39-60
gemini-auto-fire.py | token-waste | MANDATE re-injected on EVERY screenshot call, no session marker | one-shot marker | 150-160
gemini-check-gate.py | bug | GATED ("/dev/") substring matches lib/dev/, scripts/dev/ beyond documented scope | anchor to app + dev | 23,87
harden-when-flagged.py | misfire-risk | bare "(you|u) keep" matches "you keep the current layout" | require recurrence-shaped word after | 24
harden-when-flagged.py | token-waste | no session dedup; full mandate re-injects every matching prompt | one-shot marker | 33-56
input-error-consistency-gate.sh | bug | per-line detection misses prettier multi-line JSX | sliding window | 34-40
input-error-consistency-gate.sh | bug | skip flag has NO TTL; one touch disables permanently | add mtime TTL | 13
input-error-consistency-gate.sh | misfire-risk | body not blanket-wrapped; runtime error = raw traceback | wrap whole body | 14-52
instrument-corroboration-gate.py | bug | ANY edit-tool call corroborates an unwritable-path claim | require claimed path in tool_input | 85,98-100
invariants-nudge.py | bug | write_last_run fires BEFORE the check runs; failures consume the 24h throttle | move after subprocess.run | 64-72

## Chunk 5 (no-overstep .. post-compact-reverify)
CLEAN: no-push-mention-gate.py, plan-active-sessionstart.py, plan-archive.sh, post-compact-reverify.py
no-overstep-launch-gate.py | bug | matcher "Workflow" only; Agent-tool launches never evaluated | widen to Agent|Workflow | settings.json:337
no-overstep-launch-gate.py | misfire-risk | subject extraction only literal name:'...' syntax | read tool_input.description too | 82-83
no-overstep-launch-gate.py | bug | hardcoded /Users/sulo/Documents/solen fallback can read wrong project's ACTIVE.md | allow() when env+cwd missing | 92
no-overstep-launch-gate.py | misfire-risk | ACTIVE.md parsed by fixed column index | parse by header name | 110-111
no-select-star-sensitive.py | misfire-risk | only ' and " quotes; backtick template literals bypass | add backtick to char class | 24-25
no-select-star-sensitive.py | misfire-risk | nested join select-star (salons(*)) has no .from() so never flagged | scan select body for table(* patterns | 62-69
no-unauth-money-route.py | bug | createServerSupabaseClient counts as AUTH_SIGNAL; neuters the check (every route needs a client) | drop it or require co-occurring .auth.getUser( | 30-35
no-unauth-money-route.py | misfire-risk | unanchored "/webhook","/cron" substrings exempt e.g. webhook-settings routes | segment-boundary regex | 55
no-unauth-money-route.py | bug | Write-only; an Edit stripping auth from an existing route uncovered | add Edit + diff check | 48
orchestration-gate.py | misfire-risk | TRIVIAL_LINES=3 per-call; splitting a big edit into 3-line Edits reopens loophole | cumulative per-session counter | 88
owner-punt-gate.py | bug | "refund the/those" in PUNT tells agent to self-execute a money transfer | move refunds to owner-approval class | 147-148
owner-punt-gate.py | misfire-risk | APPROVAL bare "yes" substring anywhere reads as full approval | require standalone/initial yes | 76-77
owner-punt-gate.py | misfire-risk | DBPUNT arm lacks SELF_DONE carve-out | reuse SELF_DONE guard | 114-133
plan-first-stamp.py | bug | single GLOBAL stamp file shared across concurrent sessions; interleaved false denials/passes | key by session_id | 20 (consumed plan-first-gate.py:105-109)
plan-active-prompt.py | token-waste | per-session state files never cleaned (12+ accumulated) | prune by age (note: sweep may now cover; verify) | 87,154-160

## Chunk 7 (sim-shot .. worktree-collision)
sim-shot.sh | misfire-risk | openurl never exit-checked; failed nav still screenshots stale screen | check $? | 21
skill-autopilot.py | bug | hits truncated to top-2 BEFORE filtering already-fired; new 3rd category dropped | filter then truncate | 144-147,159
skip-flag-ledger.py | misfire-risk | only literal `touch ...flag`; echo/printf/Write bypass ledger | catch redirections + Write-tool | 25
ss-folder-resolver.py | improvement | newest_candidates has no extension filter; stray files shadow screenshots | filter image extensions | 66-84
stat-source-gate.py | misfire-risk | META override matched on WHOLE message; common words suppress the stat check | window around STAT hit | 101-105
structure-liberty-injector.py | misfire-risk | bare "structural"/"what is this" fires heavy directive on unrelated questions | narrow, require design context | 18
subagent-uiwork-reminder.py | bug | EDIT_TOOL and UI_FILE matched independently across blob; Read .tsx + Write non-UI triggers | correlate within same tool_use | 17-18,35
system-health-check.py | bug | stale-flag glob misses ~/.claude/state/*.flag | add STATE_DIR to glob | 219-231
unfinished-batch-gate.py | bug | readback coverage = raw substring; "design" in "redesign" marks dropped ask covered | \b word-boundary match | 256-261
unfinished-batch-gate.py | misfire-risk | new (?:\band\b.*){2,} flags coherent single tasks with two "and"s | require enumeration tell alongside | 142
verify-before-done-gate.py | misfire-risk | ANY preview_* call or any "curl" counts as evidence | restrict to rendering tools + route-matched curl | 151-157
verify-tooling-preflight.py | misfire-risk | pgrep cloudflared system-wide; other worktree's tunnel reads alive | scope to project port/URL | 91-98
workstreams-index-guard.py | misfire-risk | marker-substring anywhere passes; stray comment defeats clobber guard | marker at line 1 + row-count survival | 36-38
worktree-collision-guard.py | bug | excluded paths still hit unconditional append_ledger; ledger crowds out real collisions | exit 0 when excluded | 62-67,230-267

## Chunk 3 (lessons-ledger .. mockup-variations)
CLEAN: mockup-gate.py
lessons-ledger-inject.py | misfire-risk | MultiEdit never invokes (matcher Edit|Write) | add MultiEdit + join edits[].new_string | matcher
link-gate.py | bug | components-legacy/ edits bypass (only "/components/" tested) | add components-legacy | 66
link-gate.py | misfire-risk | mobile arm accepts bare links, no markdown-wrap requirement | reuse md_tunnel regex | 78
loop-default.py | token-waste | ~180-word DIRECTIVE re-emitted on every SessionStart (incl. compaction) | per-session dedup | 29-35
mcp-prod-write-guard.py | bug | "WHERE true OR x" not matched (terminator list lacks OR) | flag true/1=1 disjunct + OR | 52-56
mcp-prod-write-guard.py | bug | GRANT..TO service_role, anon (anon second) never matches | scan full grantee list | 46
memory-maintenance-nudge.py | misfire-risk | single global cooldown suppresses other projects for 7 days | per-mem_dir cooldown | 23-39
mockup-content-gate.py | bug | MultiEdit branch is dead code; matcher lacks MultiEdit | register MultiEdit | 279-280
mockup-content-gate.py | bug | Kund word-bounded never matches Kunde/Kunden | Kunde suffix wildcard | 162
mockup-first-gate.py | misfire-risk | blanket solen-mobile exemption; src/hooks + src/lib checked by NO gate | narrow to mockup-gate's actual scope | 39
mockup-first-gate.py | improvement | motion.div const-assignment form evades | add motion-dot-word alternative | 26-32
mockup-grounding-gate.sh | bug | PROJ fallback misses stdin-cwd chain; false blocks in worktrees | mirror link-gate chain | 12
mockup-grounding-gate.sh | misfire-risk | trailing "--" captured into path token | strip trailing dashes | 23-24
mockup-parity-gate.py | bug | generic branch misses committed-via-Bash files | extend GIT_SEARCH-style scan | 141-149
mockup-parity-gate.py | misfire-risk | 4-char token overlap links unrelated surfaces | fuller slug match | 60-77
mockup-realsize-gate.py | bug | MultiEdit sees empty body; silent bypass | join edits new_strings | 34-37
mockup-realsize-gate.py | misfire-risk | feed_sig literal strings; rephrased copy evades | structural signature | 47
mockup-variations.py | misfire-risk | generic words fire on non-UI talk | require UI anchor word | 19-27
mockup-variations.py | dead-code-risk | notification_guard import outside try; missing _lib = hard crash | wrap import | 17

## Chunk 4 (mockup-visual .. no-opus)
CLEAN: multi-ask-decompose.py
mockup-visual-gate.py | misfire-risk | VISUAL tokens matched anywhere (import paths trip it) | scope to className/style strings | 32-38
mockup-visual-gate.py | dead-code | HASH_COMMENT no-op for tsx-only scope | drop | 44,61
money-update-cas-warn.py | bug | MultiEdit registered but edits[] never read; CAS reminder never fires | loop edits[] | 42-45
money-update-cas-warn.py | bug | ES6 shorthand .update({ status }) never matches (requires colon) | add comma/brace-terminated branch | 19
motion-recipe-gate.py | bug | exit fade wrongly held to ENTER recipe | drop exit from OBJ | 60
motion-recipe-gate.py | misfire-risk | motion-ok escape matched blob-wide | scope near flagged match | 56
no-ai-assets.py | bug | fl-ux model regex unanchored; ordinary "npm run dev" commands denied (CONFIRMED LIVE 2026-07-10: it blocked this very audit file's Bash append) | anchor with word boundaries | 30
no-ai-assets.py | misfire-risk | bare Spanish/identifier word for image matches Google model name | require API-shaped context | 27
no-black-selected-gate.py(global) | misfire-risk | EXCLUDE unbounded substrings (continue, prepayment...) | word boundaries + button-role context | 52-55
no-defer-excuse-gate.py | bug | SKIP flag has NO TTL; one touch disables forever | 300s mtime check | 97
no-focus-ring-gate.py | bug | MultiEdit registered but explicitly excluded in code | handle edits[] | 55
no-focus-ring-gate.py | misfire-risk | ring color whitelist misses ring-emerald-400 etc | generic ring catch-all | 26
no-gemini-key-in-url.py | bug | MultiEdit blind (same class) | iterate edits[] | 43-46
no-invented-ui-gate.py | misfire-risk | Not-a-salon-card bare keyword bypass | require adjacency | 37,66
no-invented-ui-gate.py | misfire-risk | Write-only; Edit/MultiEdit uncovered | register + scan new_string | matcher
no-loop-narration-nudge.py | token-waste | no notification_guard; injects on task-notification turns | import + short-circuit | 44-48
no-loop-narration-nudge.py | token-waste | SHORT_TEXT repeats every turn forever | cap at N repeats | 67
no-opus-subagent-gate.py | bug | skip flag consumed by ANY Agent call before the target one | consume only at deny point | 52-60

## Chunk 6 (postgrest-warn .. sim-auto)
CLEAN: reality-check-gate.py
postgrest-filter-injection-warn.py | bug | MultiEdit edits[] never read | append join of edits | 41
postgrest-filter-injection-warn.py | misfire-risk | string-concat filter form never warned | widen regex | 16
pre-compact-context-snapshot.py | token-waste | live_context_section uncapped | truncate ~40 lines | 86
pre-edit-gesture-expand-gate.py | misfire-risk | named-handler form bypasses inline-only regex | match handler ident + grep body | 21
pre-edit-measure-first-gate.py | misfire-risk | bare touch of flag satisfies gate 20min | skill scripts touch flag as side effect | 47
pre-edit-reinvent-data-gate.py | misfire-risk | mock/test data with 3 cities blocked | require array/object literal context | 107
prompt-suppressor-gate.py | bug | main() unwrapped; TypeError crashes instead of fail-open | wrap try/except | 136
prompt-suppressor-gate.py | misfire-risk | ~/.claude/CLAUDE.md auto-allowed (master rules file, self-grant class) | exclude CLAUDE.md | 129
reference-check-gate.sh | misfire-risk | any existing path satisfies proof | require pixel-refs/audits dirs | 25
rejection-streak-escalator.py | misfire-risk | bare still/again inflate streak | co-occur with complaint word | 29
repeat-mistake-detector.py | misfire-risk | self-test/py_compile substring = proof | require hook basename in invocation | 122
session-marker-sweep.py | bug | per-session mistake-themes-sid.txt never swept (prefix excluded for global) | add txt-only pattern keeping global json | 27
sim-auto.py | token-waste | no debounce; N edits = N sleeps+captures | 10s TTL flag | 31
sim-auto.py | misfire-risk | MultiEdit never triggers capture | add to tuple | 19

## Chunk 8 (project hooks)
api-route-discriminate-reminder.py | token-waste | .apiroute-* markers never deleted | sweep-prune | 33-38
browser-verify-gate.sh | bug | components-legacy/ never classifies UIEDIT | add to alternation | 79
browser-verify-gate.sh | misfire-risk | tail 1200 misses turn boundary in huge turns | widen/fallback | 64,101-110
mockup-english-gate.py | misfire-risk | GERMAN list misses domain nouns (Termin, Buchung, Preis...) | extend | 16-21
no-black-selected-gate.py(global) | bug | blocks the LOCKED booking date/slot blue exception | add date/slot/calendar/time EXCLUDE | 29,48
no-black-selected-gate.py(project) | misfire-risk | INK_TERNARY same-line only; prettier multiline bypasses | look across 1-2 newlines | 116-120
no-black-selected-gate.py | token-waste | global AND project copies both registered; divergent duplicates | fold + deregister one | n/a
pre-build-exists-check.sh | bug | no pattern for new components tsx (the top dup risk) | add component case | 46-54
pre-build-exists-check.sh | misfire-risk | RAN check = last 150 lines, no turn boundary | bound to last PROMPT | 83-86
pre-commit-graveyard.sh | bug | loose commit regex matches read-only git commands mentioning commit | anchor to the commit subcommand | 18
pre-commit-graveyard.sh | misfire-risk | plain components tsx deletions skip graveyard | add pattern | 31
pre-component-edit-pixel-spec.sh | bug | app/[locale] case pattern is an unescaped glob char-class; never matches | escape brackets | 46
pre-component-edit-pixel-spec.sh | misfire-risk | not registered under MultiEdit | register | settings
pre-component-edit-pixel-spec.sh | bug | empty TIMESTAMP skips expiry; orphaned flag blocks all UI edits forever | treat empty as expired | 67-73
pre-edit-drift-gate.sh | bug | MultiEdit branch dead; not registered | register | settings
pre-edit-psychology-gate.py | misfire-risk | two-digit floor misses single-digit fabricated counts + narrow nouns | widen digits + domain nouns | 139
pre-edit-removed-check.sh | bug | un-killed/restored phrasing still blocks revived routes | extend exclusion regex | 60-61
pre-edit-removed-check.sh | misfire-risk | not registered under MultiEdit | register | settings
user-prompt-binary-triggers.sh | token-waste | visual-ref flags never deleted | sweep-prune | 45-49
worklog.py | bug | start-mode overwrites headfile on compact/resume; pre-compaction commits escape the log guard | only write if absent for sid | 52-57

## Post-wave punch items (for the review round)
- FIXED 2026-07-10 late: repeat-mistake-detector pervasive arm self-tripped when a reply QUOTED its own trigger phrase while explaining the gate. Guard added: backtick spans + short quoted spans stripped before PERVASIVE matching (same class as the finish-gate's documented-phrase fix). Self-tested 3/3: quoted + backticked explanations silent, real unpersisted announcement still blocks.
- FIXED 2026-07-10 late: checkbox-evidence-gate stale-window recurrence (fired 3x on a line already amended with verified: on disk). Supersession check added: a flagged tick whose current on-disk box carries EVIDENCE (24-char normalized prefix match) is skipped. Self-tested: superseded line suppressed, evidence-less line still blocks (in-transcript).
- verify-before-done-gate.py: the group-A tightening (rendering tools + route-matched curl only) now FALSE-POSITIVES on hook/infra work , a Bash `python3 <hook>.py` pipe self-test IS verification for hook edits but no longer counts (CONFIRMED LIVE: blocked a turn whose transcript contained 4 passing pipe tests). Fix: count a Bash invocation of an edited file's basename as evidence (mirror repeat-mistake-detector's harden_proof pattern).

## Triage (0c-3a, 2026-07-10)
UPDATE (post-close continuation, owner "continue everything"): 5 of the parked items were BUILT
after all , council-trigger correlation, subagent-uiwork correlation, approved-surface cumulative
+ siblings, skip-flag-ledger redirections, mockup-visual scoping (lookbehind variant). All
fire+pass tested. Still parked: checkbox-evidence sha-validation, coder-git aliases,
mockup-parity/realsize heuristics, gesture/measure skill-side items, finish-autonomously
regex loosening (owner call), checkpoint tsc caching.
PARKED with reasons:
- checkbox-evidence "verified: yes" gaming: real sha/line cross-checking is heavy; known anti-superficial limit, revisit on recurrence
- coder-git-guard aliases: unlikely in this env, low value
- council-trigger substring guard: needs completed-Task correlation, moderate rework
- approved-surface cumulative-bytes + sibling files: moderate rework, low-churn surface
- mockup-parity token overlap + realsize feed_sig: heuristic tuning needs real cases
- pre-edit-gesture named-handler + pre-edit-measure flag-touch: need skill-side changes
- skip-flag-ledger redirection catch: touch-only is the dominant real pattern
- subagent-uiwork correlation: moderate rework
- finish-autonomously CHECKPOINT/EARLY loosening: OWNER CALL , gate is deliberately strict; loosening risks real early-stops
- checkpoint-merge tsc caching: perf only
- mockup-visual className scoping: moderate; skip valve exists meanwhile
Everything else: FIX , assigned to coder groups A-D (dispatch in-transcript).
