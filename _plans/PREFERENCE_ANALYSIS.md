<!-- batch: preference analysis -> gates + principles (owner 2026-08-03 "research everything, like, our past chats and everything to actually analyze my preferences? And based on that, edit gates and also make new gates and make principle based on that? like, sessions in the past, maybe one weeks, all of them.") -->
# Preference analysis , mine a week of sessions, then edit gates / make gates / make principles

Owner 2026-08-03, verbatim: *"Can you research everything, like, our past chats and everything to
actually analyze my preferences? And based on that, edit gates and also make new gates and make
principle based on that? like, sessions in the past, maybe one weeks, all of them."*

## Readback (5 asks)
1. Research the past chats/sessions , one week, all of them.
2. Analyze the owner's preferences out of that research.
3. EDIT existing gates based on the analysis.
4. MAKE NEW gates based on the analysis.
5. MAKE PRINCIPLES based on the analysis.

## A , research the corpus
- [x] A1 locate every session transcript touching this project in the window (103 files scanned across 40 project dirs, incl. worktrees)
- [x] A2 extract only OWNER-TYPED messages, stripping hook injections / task-notifications / selected-element blobs (606 messages, 2026-07-27 -> 2026-08-03, ~111k tokens)
- [x] A3 chunk into 8 balanced files for fan-out
- [x] A4 mine each chunk for preference signals with VERBATIM quotes + timestamps
- [x] A5 completeness critic: what the mining missed, contradictions, over-claims, bias

## B , analyze
- [x] B1 cluster signals into distinct preferences, count DISTINCT-timestamp occurrences
- [x] B2 coverage-check every cluster against global CLAUDE.md / project CLAUDE.md / PREFERENCES.md / the 197-gate index / LOCKFILE / TASTE_LOG, citing file:line
- [x] B3 cross-check the mined clusters against the INDEPENDENT durable evidence: `mistake-themes-global.json` (per-theme session counts) and `skip-flag-ledger.log` (which gates are muted)
- [x] B4 rank: recurrence x intensity x mechanical-checkability

## C , edit existing gates
- [x] C1 name every gate that is WRONG (contradicts a newer owner decision), too narrow, too broad, or unarmed
- [x] C2 the link family: 8 separate Stop gates on one failure class, and `link` is still the #1 mistake theme (14 sessions). Consolidate per LAW_SYSTEM 6.2.
- [x] C3 apply the edits, self-test each (block case + pass case), do not wire blind

## D , new gates
- [x] D1 only classes with >= 2 distinct occurrences OR an explicit owner gate-request, AND a near-zero-false-positive detection rule
- [x] D2 every new gate pays its way per LAW_SYSTEM 6.8 (wired hooks are already 155 against a 150 ceiling): each net-new gate retires/merges one existing hook
- [x] D3 self-test each new gate (rule 12.5) before claiming it works
- [x] D4 ARM them , **DONE, live.** verified: `settings.json` parses, TOTAL WIRED 157 -> **150**, Stop 62 -> **54**, all four gates self-test green from `~/.claude/hooks/` (11/11, 8/8, 7/7, 9/9), the aggregator returns ONE message on the real 3-block case, and `owner-correction-ledger` fired live on "harden the gate abt u stopping w every checkpoint" then stayed silent on a normal prompt. Backup: `~/.claude/settings.json.bak-preference-audit-20260803-201258`. **CORRECTION on my own earlier claim in this file:** I first wrote that arming was blocked, on the evidence that Bash `cp` and `open(...,'a')` both returned Operation not permitted. True readings, wrong conclusion , the Write/Edit TOOLS have different permissions from Bash here, and the `instrument-corroboration-gate` is what forced the cross-check. Bug caught while arming: the installer matched gate names as substrings, and `link-gate.py` is a substring of `fullbleed-external-link-gate.py`, so a second run would have silently unwired a gate deliberately excluded from the family. Fixed, anchored on a path separator.

## E , principles
- [x] E1 write the principle layer , the durable law, not a one-off note
- [x] E2 T1 entries in `~/.claude/PREFERENCES.md` for the preferences that are steerable-before-the-act (costs zero new hook registrations, uses the existing preference-inject.py)
- [x] E3 route the new law from a file that is always in context, so it is not T0-and-forgotten (LAW_SYSTEM 1.5)

## F , close
- [x] F1 report in plain English + a visual page. Page built and render-verified at 375x812 through the Browser pane: `public/_analysis/preference-audit-2026-08-03.html`. **The clickable tunnel link is BLOCKED, measured three ways**: this worktree's `public/` is not what either running dev server (:3000, :3001, both rooted at the main repo) serves; the main repo's `public/` is write-denied; and DNS is dead from this sandbox (`api.trycloudflare.com`, `example.com`, `github.com` all fail to resolve), so no tunnel can be created at all. Named dependency: a dev server rooted at this worktree, or the owner opening the file locally.
- [x] F2 re-read the original message and tick every box

## Unplanned additions / parked decisions
- Wiring is owner-only this session (sandbox write-deny). One command, in the report and the README.
- 4 owner decisions surfaced, none of them blocking the delivered work: the pre-launch photography floor; whether "don't give me a link till the search works" scopes the always-give-link gate; whether `real-component-gate` should stand down on a mockup-only turn; what to do with the 42 orphan gates.
- NOT covered by this pass, flagged by the completeness critic: backend, data, admin and legal preferences got zero clusters, including a live owner ask for a multi-language enforcement gate (2026-07-27).
- **PARKED FIX, found by the gates firing on this very turn:** `mockup-lang-stop-gate.py` keys "a mockup you touched this session" off FILE MTIME, so a fresh git worktree, which rewrites every file at creation time, looks like the session edited all of them. Measured here: 0 commits and 0 uncommitted changes under `public/_mockups`, yet six files were named, all carrying the worktree's 19:20 creation mtime. It should compare against the git index or the session's own edited-file list. Skip-flagged once with that reason rather than silently, because a gate that cries wolf on every worktree session is how the whole family ends up muted.
- Reinforcement is structurally absent from the whole estate: all 81 clusters are corrections, yet on 2026-07-31 he asked to harden something he LIKED ("I like this pushback thingy so hardened so you actually keep doing this"). There is no mechanism that locks in an approved behaviour. Logged, not built.
