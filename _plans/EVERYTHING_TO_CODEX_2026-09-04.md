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
- [x] 1b. Consolidated list of STILL-OPEN items from the 12 prior audit/plan files, each verified against current code. DONE 17:40 (OPEN_ITEMS.md in the session scratchpad, 71 of 71 items re-checked): 34 still open (3 security, 5 data, 7 customer-visible, 1 dashboard, 13 dead or decorative, 5 stale plan claims), 11 need him, 24 already fixed, 2 could not be checked from here. One prior "fixed" claim was wrong: the receipt link on the refund and extra-charge screens still goes to a page that does not exist.
- [ ] 1c. Backend silent no-op hunt: phantom columns, dead filters, consent flags nobody reads
- [ ] 1d. Frontend gaps: dead links, orphaned routes, decorative (rendered-but-unwired) features, i18n parity
- [x] 1e. DB drift: migration files vs live snapshot; the four security migrations from 2026-08-14. DONE 17:40: the 8 stranded security migrations are on main (commit 064fe4fad is an ancestor) and every migration on the 11 old branches that creates a table or column is already live (branch report). One stale doc claim found on the way: CLAUDE.md says columns come from `_inventory/_db-snapshot.json`, but that file holds only table names, rows and RLS; the columns are in `_inventory/_db-columns.json` (both coders used it correctly).
- [ ] 1f. Design: measured taste walk on the real phone screens (home, search, PDP, booking, profile, dashboard)

### 2. Fix (non-design) and mock (design)
- [ ] 2a. Fix every STILL-OPEN non-design item, coder + reviewer loop, one commit per verified chunk. IN PROGRESS 19:10: 9 fixes committed after a PASS review (payment mode agreement, card-hold release, hidden salon page, calendar timezone + refresh, sitemap, profile hub counts, nightly score monitoring, receipt link, plus the security trio). In review: service-photo delete, cron monitoring for two more nightly jobs. Building: walk-in wait-screen first name, dead dashboard fetch. Left after that: NEW-1 (dispute email link hardcodes German), the phantom-column and dead-link reports when they land.
- [ ] 2b. Design findings become mockups (one section each, real page copy, English), never direct edits

### 3. Loop + small questions
- [x] 3a. Register this batch here and in ACTIVE.md (row 113, committed fb517392f)
- [ ] 3b. After each wave, one short question to him only if the next wave depends on it; otherwise park and continue

### 4. Subagents
- [x] 4a. Waves of 4 readers/coders/reviewers, never one lone helper on a splittable job. DONE in practice: 4 readers in wave 1, then coders in waves of 3 to 4 with a separate reviewer per fix (SEC-1, SEC-2, SEC-3, calendar, DI-4, DI-5, CV-1, CV-2, sitemap), plus the Codex staging builder, the phantom-column hunter, the dead-link checker and the live design walk. Never fewer than 4 running from 17:30 on.

### 5. Review everything
- [ ] 5a. Council pass over every fix batch before commit

### 6. Merge every branch
- [x] 6a. Classify the 15 unmerged branches (type, conflicts, migrations, live-session check). DONE 16:45, report in the session scratchpad (BRANCHES.md, 640 lines). Verdicts: email = merge now (done, 7fdf4db58); pdp-styling = merge now (19 clashes in one file, both sides fixed the same bug); offline-booking = lift the feature after stripping about 35 scratch files; harness-everth = a live session is typing in it this minute, do not touch; the 11 old branches = everything checkable on them is already on main or was killed by name, every one of their 81 migrations that creates a table or column is already live.
- [ ] 6b. Merge the 4 newer zero-conflict branches (email, offline-booking, pdp-styling, harness-everth) after his word on the live one
- [ ] 6c. The 11 old branches: his 2026-08-14 call was "lift features, never merge wholesale". Ask whether "merge everything" overrides it; if not, lift the named features and delete the rest with recovery shas recorded

### 7. Codex migration
- [x] 7a. Live research: what Codex supports today. DONE 16:00 from the official manual fetched live (CODEX_RESEARCH.md in the scratchpad): hooks with the same event names and the same block mechanics, skills in the identical SKILL.md format, plugins, custom agents (TOML), memories, MCP, worktrees, `codex exec`, and a native `/import` that reads a Claude Code setup.
- [x] 7b. Mapping table: every Claude Code piece -> Codex equivalent. DONE: full = rules file, hooks, skills, MCP, worktrees, permission bypass; partial = agents (rewrite to TOML, coarser tool limits), output style (becomes the whole system instruction file), memories (Codex generates its own; /import carries ours across, fidelity unverified); none = the 3 workflow scripts (re-express as delegation or the Codex SDK).
- [x] 7c. Migration plan, ordered. DONE: 10 steps in the same file; the honest first step is running `/import` inside the Codex app (a slash command in its own screen, so it has to be typed there, not run from here) and diffing what it produced against a hand port.
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

- 2026-09-04 18:45: fixes landed so far, each coder-built and graded PASS by a separate reviewer: the booking screen and the booking API agree on the payment mode (622826785); a cancelled prepaid booking releases its card hold at once (same commit); a test or unlisted salon's page and its search-engine tags are hidden (70b8027b7); the dashboard calendar buckets days in Swiss time and refreshes after a delete (1fe6a4d1e). In review now: the service-photo delete that actually deletes, the nightly score job reporting into cron monitoring, the saved-salons count no longer showing 0 on an error, the sitemap hiding the same salons the page hides. Round 2 in build: the receipt link (round 1 sent guests to the report form under a "receipt" label; reviewer refused it, now the link is simply not shown to guests, the same call the 2026-06-14 audit made). The design walk measured 0 of 6 screens on its first pass because my merge left conflict markers in the tree while its server ran; my mistake, the server is restarted and warmed and the walk is running live now.
- 2026-09-04 18:05: THE LIVE SITE IS THE MAY VERSION. GitHub's copy of main stopped on 2026-05-21 (its own API says so); 3,509 saves on this Mac since then never left it, and Netlify builds from GitHub. Three independent live probes agree: the health route answers `runtime: edge` (May's code) where today's says `nodejs`; the CSP report-only header in netlify.toml since 07-27 is absent from live responses; the Popular looks title from 08-16 is absent from the live German home page, while the recently-viewed row from 05-08 is present. The scheduled jobs on GitHub failed every run on 07-20 (May's workflow lacked the checkout step that the July version added) and GitHub then switched the workflow off for inactivity. So NONE of this summer's fixes, the German Salon sweep, or the security work is on solen.ch. His to do: publish main (the code cannot leave this Mac by itself), set the cron secret on Netlify, and switch the GitHub workflow back on (`gh workflow enable cron-jobs.yml`). Pre-launch, so no customer is affected yet.
- 2026-09-04 17:50: salon-page styling branch merged (4410ad507): 15 clashing files resolved by one rule each, 5955 keys in sync in four languages, tsc 0. The two edit-time design gates that the reports called live are now actually registered (9c9924f1f). Wave A coders out on the 3 security items + the refund-fee setting; the refund-fee one came back as a premise correction (the settings table has no such value; comment fixed, nothing bolted on).
- 2026-09-04 16:35: design drift MEASURED by the repo's own detectors, then vs now (08-14 to 09-04): off-scale font sizes 422 -> 460 (+38; 291 of the 460 are on real screens, 169 in throwaway dev/mockup pages), hand-rolled copies of registry components 76 -> 84 (+8), selected-state divergences 100 today. 29 files gained off-scale sizes since 08-14: 25 are dev/mockup pages from July that arrived on main through the 09-02 branch merge (a merge bypasses the edit-time gate), 4 are real screens (ContinueCard, AccountHub, SalonLocation, salon team page). i18n parity: OK, 5955 keys in all four languages.
- 2026-09-04 16:10: dev server for this copy on :3461 (launch.json entry added). Two servers broke in a row on parallel first loads (vendor-chunks race, known since 06-13); fixed by restart + serial warm, memory updated. Repo floors check on the real render: home FAILS 4 of 6 floors (imagery 28.6% < 33%, biggest text 18px < 28px, bold share 37% > 30%, anchor ratio 1.5x < 1.8x); search fails 3 of 6; salon page passes 6 of 6. tsc: 0 errors today. Codex research landed: Codex has the same hook events by name, the same skill format, a native /import from Claude Code; agents need TOML rewrite; workflows have no equivalent; output style becomes model_instructions_file.

- 2026-09-04 15:45: ground measured. 15 branches unmerged; 4 newer ones merge with 0 conflicts; harness-everth-research had a save at 15:32 today (likely a live session). Codex on this Mac = the ChatGPT app's bundled codex-cli 0.145.0-alpha.18, model gpt-5.6-terra, AGENTS.md empty, memories on. Wave 1 of 4 readers out: security, open items, branches, Codex research.
