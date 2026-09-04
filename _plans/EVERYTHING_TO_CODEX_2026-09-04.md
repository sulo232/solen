# Everything, as a loop, then move it all to Codex (owner 2026-09-04)

Owner, verbatim: "Research, like, every single corner, back end, front end, gaps, bugs, all of it
security too. All of it, like, keep fixing it except for design make mockup. And if you need
directions, ask me always anytime ... I want you to do it as a loop, but also, like, ask me a little
question in between them ... utilize the subregions [subagents] a lot ... merge everything since
there isn't any crumbs left because ... the final achievement ... I wanna transfer everything that
I'm doing right now on Cloud Code to Codex."

Mid-turn add: "And on design, like, security, everything, like, all of it, mainly design. Like, what
is missing? Like, what formula, what principle, what is actually missing? because it's so ass."

## Readback (his asks, one line each)

1. Research every corner: backend, frontend, gaps, bugs, security.
2. Fix everything found, except design. Design gets a mockup, never a direct change.
3. Run as a loop; ask him small questions in between, any time directions are needed.
4. Use many subagents.
5. Review everything.
6. Merge every branch so nothing is stranded.
7. End goal: move the whole Claude Code setup to Codex.
8. Design, mainly: what principle or formula is missing, measured, because it looks bad.

## Boxes (atomic)

### 1. Research every corner
- [x] 1a. Security audit of the API estate (365 routes), with prior audits as the dedup baseline. DONE 16:20: every prior HIGH/CRITICAL re-checked and confirmed fixed in code. 3 open, all MEDIUM or lower: 6 of 30 cron routes compare the secret with a plain `!==` (timing leak); the CSP report endpoint exists but the header never points at it; dev-only login redirect lacks the `//` guard. Coder dispatched on all three. Live database read the same hour: 152 tables, 152 with RLS on, 324 policies, 1 permissive write policy and it is service-role only, 20 tables with RLS and zero policies (locked, service-role only). Supabase's own security advisor: 5 SECURITY DEFINER functions callable by users, each read and each checks auth.uid() (clean); 3 extensions in the public schema (low); leaked-password protection off at the Supabase auth level (the app's own sign-up breach check exists per memory; the Supabase toggle is a paid-plan setting).
- [ ] 1b. Consolidated list of STILL-OPEN items from the 12 prior audit/plan files, each verified against current code
- [ ] 1c. Backend silent no-op hunt: phantom columns, dead filters, consent flags nobody reads
- [ ] 1d. Frontend gaps: dead links, orphaned routes, decorative (rendered-but-unwired) features, i18n parity
- [ ] 1e. DB drift: migration files vs live snapshot; the four security migrations from 2026-08-14
- [ ] 1f. Design: measured taste walk on the real phone screens (home, search, PDP, booking, profile, dashboard)

### 2. Fix (non-design) and mock (design)
- [ ] 2a. Fix every STILL-OPEN non-design item, coder + reviewer loop, one commit per verified chunk
- [ ] 2b. Design findings become mockups (one section each, real page copy, English), never direct edits

### 3. Loop + small questions
- [ ] 3a. Register this batch here and in ACTIVE.md
- [ ] 3b. After each wave, one short question to him only if the next wave depends on it; otherwise park and continue

### 4. Subagents
- [ ] 4a. Waves of 4 readers/coders/reviewers, never one lone helper on a splittable job

### 5. Review everything
- [ ] 5a. Council pass over every fix batch before commit

### 6. Merge every branch
- [ ] 6a. Classify the 15 unmerged branches (type, conflicts, migrations, live-session check)
- [ ] 6b. Merge the 4 newer zero-conflict branches (email, offline-booking, pdp-styling, harness-everth) after his word on the live one
- [ ] 6c. The 11 old branches: his 2026-08-14 call was "lift features, never merge wholesale". Ask whether "merge everything" overrides it; if not, lift the named features and delete the rest with recovery shas recorded

### 7. Codex migration
- [ ] 7a. Live research: what Codex supports today (hooks, skills, plugins, agents, memory, MCP, AGENTS.md)
- [ ] 7b. Mapping table: every Claude Code piece we use -> Codex equivalent or "lost"
- [ ] 7c. Migration plan, ordered, with what each step drops
- [ ] 7d. Build the Codex-side files (AGENTS.md, config.toml, skills, prompts) once he picks the shape

### 8. Design: what is missing
- [ ] 8a. Screenshots of the real screens at phone size
- [ ] 8b. Measured diagnosis per screen (sizes, weights, spacing, contrast, balance, colour provenance)
- [ ] 8c. Airbnb live mobile capture of the matching screens, measured the same way
- [ ] 8d. The missing principle(s), named, with the number that proves each
- [ ] 8e. Mockup of the fix on one section, stacked variants, English

## Parked decisions (for him, in his words)

(filled as they arise)

## Log

- 2026-09-04 16:35: design drift MEASURED by the repo's own detectors, then vs now (08-14 to 09-04): off-scale font sizes 422 -> 460 (+38; 291 of the 460 are on real screens, 169 in throwaway dev/mockup pages), hand-rolled copies of registry components 76 -> 84 (+8), selected-state divergences 100 today. 29 files gained off-scale sizes since 08-14: 25 are dev/mockup pages from July that arrived on main through the 09-02 branch merge (a merge bypasses the edit-time gate), 4 are real screens (ContinueCard, AccountHub, SalonLocation, salon team page). i18n parity: OK, 5955 keys in all four languages.
- 2026-09-04 16:10: dev server for this copy on :3461 (launch.json entry added). Two servers broke in a row on parallel first loads (vendor-chunks race, known since 06-13); fixed by restart + serial warm, memory updated. Repo floors check on the real render: home FAILS 4 of 6 floors (imagery 28.6% < 33%, biggest text 18px < 28px, bold share 37% > 30%, anchor ratio 1.5x < 1.8x); search fails 3 of 6; salon page passes 6 of 6. tsc: 0 errors today. Codex research landed: Codex has the same hook events by name, the same skill format, a native /import from Claude Code; agents need TOML rewrite; workflows have no equivalent; output style becomes model_instructions_file.

- 2026-09-04 15:45: ground measured. 15 branches unmerged; 4 newer ones merge with 0 conflicts; harness-everth-research had a save at 15:32 today (likely a live session). Codex on this Mac = the ChatGPT app's bundled codex-cli 0.145.0-alpha.18, model gpt-5.6-terra, AGENTS.md empty, memories on. Wave 1 of 4 readers out: security, open items, branches, Codex research.
