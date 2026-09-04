# 15 unmerged branches, measured 2026-09-04

Read-only audit. No branch, worktree, or ref was created, merged, deleted, or moved to produce this
report. Main tip: `1b1d1eab2` (2026-09-02).

**Contradiction to surface before the table.** Today's ask was "merge everything since there isn't
any crumbs left." Two things push back on that, plainly:
1. His own 2026-08-14 standing decision (`_plans/BRANCH_RECONCILIATION_2026-08-14.md`) is still the
   last dated word on this exact question: "main is the truth, lift features across one at a time,
   nothing old gets merged wholesale." Nothing since then reopened it by name.
2. The measurement itself does not support "no crumbs left": of the 4 previously-flagged genuinely
   missing security migrations, **all 4 are now confirmed live** in the database through some other
   path, and of the roughly 20 named features checked across the 11 old branches, the large majority
   already exist on main, often in a different, newer form (several by name in the design graveyard,
   killed on purpose). The old branches are mostly history now, not "crumbs waiting to be swept in."
   Merging any of them wholesale would mean going BACKWARDS on files main has since moved past, the
   same finding the 2026-08-14 audit made about the 40-branch pile.

The 4 newer branches are a different story: real, mostly clean, and worth a straight look today.

## Overview

| branch | type | ahead | conflicts | migrations not on main | last date | recommendation |
|---|---|---|---|---|---|---|
| `claude/email-29c154` | PLANS+MOCKUPS ONLY (assets) | 7 | 0 | 0 | 2026-08-26 | **MERGE NOW** — email art assets only, nothing to break |
| `claude/pdp-styling-updates-b2582b` | PRODUCT CODE | 63 | 19 (1 file) | 0 | 2026-08-23 | **MERGE NOW** — one file, both sides fixed the same bug the same way |
| `claude/offline-booking-device-266b10` | MIXED (real feature + 35 scratch files) | 150 | 9 (0 in product files) | 1 (already live) | 2026-08-28 | **LIFT FEATURE** — strip ~35 debug/tmp files first, then the terminal-booking route is safe to bring across |
| `claude/harness-everth-research-bfee1b` | MIXED, **LIVE SESSION RIGHT NOW** | 181 | 0 | 0 | 2026-09-04 15:47 (newest file 22 sec old at check time) | **DO NOT TOUCH** — someone is actively working in this worktree this minute |
| `claude/nice-hugle-c0b706` | PRODUCT CODE | 17 | 311 | 5 (all already live) | 2026-05-31 | ARCHIVE-DELETE — most of it superseded; 2 genuine gaps named below worth a fresh small build, not a merge of this branch |
| `claude/bold-hellman-b31513` | PRODUCT CODE | 32 | 171 | 1 (already live) | 2026-06-30 | ARCHIVE-DELETE — this IS the Aurora dashboard skin, and he already killed it by name 2026-08-25/26 |
| `claude/bold-jepsen-6019eb` | PRODUCT CODE | 45 | 123 | 0 | 2026-07-06 | ARCHIVE-DELETE — every checked fix already exists on main via a different path |
| `claude/cranky-bose-5621bf` | PRODUCT CODE | 77 | 273 | 6 (all already live) | 2026-07-08 | ARCHIVE-DELETE — its own biggest kill (dup `/behandlungen`) is cited on main's graveyard as independently reached |
| `claude/context-compact-architecture-5d1ace` | MIXED | 74 | 266 | 0 | 2026-07-10 | ARCHIVE-DELETE — its motion law already dated into LOCKFILE §16.5 the same day; check once whether the Sheet component itself matches before deleting |
| `claude/happy-jackson-514459` | MIXED | 114 | 205 | 1 (cannot tell) | 2026-07-10 | ARCHIVE-DELETE — booking-security fixes and the checkout removal both already on main |
| `claude/crazy-bose-57e405` | PRODUCT CODE | 170 | 980 | 7 (all already live) | 2026-06-28 | ARCHIVE-DELETE — oldest and largest; its distinguishing features are dead-by-owner-request or already superseded |
| `claude/clever-mirzakhani-1af8ef` | PRODUCT CODE | 200 | 479 | 21 (all already live) | 2026-07-06 | ARCHIVE-DELETE — security-hardening half and the interests-picker half both superseded |
| `claude/backend-analysis-improvements-77f02b` | MIXED | 154 | 387 | 23 (all already live) | 2026-07-16 | ARCHIVE-DELETE — the one migration the 2026-08-14 audit called security-critical is now confirmed live on main through a different route |
| `claude/sad-austin-a99451` | PRODUCT CODE | 80 | 1022 | 1 (cannot tell) | 2026-07-06 | ARCHIVE-DELETE — admin bug-hunt and design-polish sweep both superseded by main's own hardening |
| `claude/quirky-ellis-ef5559` | MIXED | 267 | 1140 | 15 (all already live) | 2026-07-24 | ARCHIVE-DELETE — all 4 previously "missing" security migrations now confirmed live; check once whether `npm run consistency` itself (not just its detector scripts) is worth a small lift |

Ahead/behind/conflict counts are freshly measured this session (`git rev-list --count`, `git merge-tree`
counting real `<<<<<<< .our` triads, not the false-zero the shell `grep` binary gives on this exact
output in this environment — same trap the 2026-09-02 harness-review branch report already flagged
and worked around with a Python scan; here it was worked around with a stricter grep pattern and
cross-checked by hand against the raw diff3 text). These numbers differ slightly from the numbers
named in the task brief (which came from an earlier pass) and from the 2026-09-02 report on the same
branches; the differences are 1-2 days of drift plus counting-method noise, not a disagreement worth
chasing further.

**A near-duplicate of this exact audit already exists, dated 2026-09-02**:
`_plans/BRANCH_DRIFT_2026-09-02.md` inside the `harness-everth-research-bfee1b` worktree (currently
live, see below). It covered 20 branches (5 have since been merged into main's current tip, and the
remaining 15 are exactly this list). It supplied the migration filename lists used below and its
conflict/overlap numbers cross-check closely against this session's fresh measurement. This report
adds what that one did not attempt: per-branch feature-by-feature "does main have this" checks
against live code, live DB-column checks (that report could only reach 23 of 81 migrations; this one
reached every migration that creates a table or column, roughly 45 of 81, by using
`_inventory/_db-columns.json`, refreshed 2026-08-14, which the 2026-09-02 pass either did not have or
did not use), and the 4-newer-branch risk review.

---

## claude/email-29c154

**What it is.** 7 commits, 2026-08-26. Pure asset drop: 18 email-art JPG/PNG files (confirmed/
cancelled/reminder art in all 4 languages, plus object/wordmark PNGs) under
`public/_email-assets/`, an HTML preview page, 4 harvest/render scripts, one `messages/en.json` key
addition, one line in `_plans/`. Classification: PLANS+MOCKUPS ONLY (nothing here is executable
product logic; it is static art the email templates would reference).

**Conflicts.** 0.

**Migrations not on main.** None.

**Risk review (this is one of the 4 newer/low-conflict branches).**
- Files changed: 29 total. `public/_email-assets/art/*` (18 image files, additions), 4 scripts under
  `scripts/`, `messages/en.json` (+1 key, 0 removed), 1 `_plans/` file.
- No deletions. No touches to `app/api/bookings/*`, `lib/validations.ts`, `middleware.ts`, or any
  migration.
- `messages/en.json`: 1 key added, 0 keys removed (checked by parsing and diffing the flattened key
  set against the merge-base, not just eyeballing the text diff).
- Semantic-clash check: of its 29 files, main also touched 2 after the branch point; neither is a
  risky file (both are unrelated doc/script touches, not overlapping content).

**Recommendation reason, plain English:** this is pictures and one translated line, nothing that can
break a booking, a payment, or a login. Safe to bring in today.

---

## claude/pdp-styling-updates-b2582b

**What it is.** 63 commits, 2026-08-23. PDP (salon detail page) styling work: `SalonHero`,
`SalonHeader`, `SalonImageGallery`, `SalonReviews`, `SalonVenuesNearby`, `SalonBundles`,
`SalonAppCta`, the salon team page, plus 9 `_plans/` files and _design-system doc touches (6).
Classification: PRODUCT CODE.

**Conflicts.** 19, all inside one file: `app/[locale]/salon/[slug]/team/page.tsx`.

**Migrations not on main.** None.

**Risk review.**
- 62 files changed, no deletions, no touches to `app/api/bookings/*`, `lib/validations.ts`, or
  `middleware.ts`.
- `messages/*.json` (all 4 locales): 0 keys removed.
- The one conflicting file: both main and this branch independently discovered and fixed the SAME
  bug — a stray `"use client"` directive on line 1 of a file that is a server component in every
  other respect (`async generateMetadata`, awaited `params`, `getTranslations`, `notFound()`), which
  made `next build` fail on that file. This branch's fix comment is dated 2026-08-16 and explains the
  cost in detail (four owner reports of dead buttons traced back to this). Main's fix landed
  separately, later. The two sides do not disagree about what the fix should be; they just wrote it
  on different lines, which is what produced the textual conflict. Trivially resolvable by keeping
  either side's removal of the bad directive and taking the newer/larger of the two file bodies.
- Semantic-clash check: of its 62 files, main also touched 28 after the branch point (expected, PDP
  is one of the most actively developed surfaces); none of the overlaps are in the risky-file list
  (no `bookings` API, `validations.ts`, or `middleware.ts` touches at all on this branch).

**Recommendation reason, plain English:** one file has a conflict, and both sides already agree on
what the right answer is. Nothing here touches money, auth, or booking logic.

---

## claude/offline-booking-device-266b10

**What it is.** 150 commits, 2026-08-28. Builds a "salon records its own booking" flow (phone/
counter bookings) and a merchant terminal preview (`/terminal`, referenced in `_plans/
MERCHANT_TERMINAL_2026-08-15.md`, Ring 12). By top-level area: app 31, `_design-system` 15, scripts
9, `_plans` 7, `public/_mockups` 4, `messages` 4, `components-legacy` 4, `.claude` 2, 1 migration, 1
`lib` file. It also carries a large "other" bucket (37 files) that is almost entirely scratch/debug
output: `.tmp-verify-motion.mjs`, `_scratch_query_statuses.mjs`, `_tmp_content_check.js`, roughly 25
files named `_verify_dv_*.mjs` / `_verify_terminal_*.mjs`, plus two archived duplicate files under
`_archive/`. Classification: MIXED — the actual feature is small and clean; the branch is cluttered
with debug scratch files that were never cleaned up.

**Conflicts.** 9, and none of them are in product code:
- `.claude/launch.json` (2 hunks) — personal dev-server tunnel config, not shipped.
- `.tmp-verify-motion.mjs` (2 hunks) — a scratch file, and it is DELETED on this branch anyway.
- `_design-system/_type-scale-report.md` (5 hunks) — a generated report file, not hand-authored
  content; this is the same file the 2026-08-14 "eighty-eight things" lift-across commit
  (`695ef2842`) independently brought to main from a similar July source, which is why both sides
  now have their own copy that textually diverges.

**Migrations not on main.** 1: `20260817120000_add_bookings_to_realtime_publication.sql`. Its own
comment states it was "already applied directly to the live project and verified via
`pg_publication_tables`" on 2026-08-17 — this migration file is a reproducibility record, not a
pending change. Verdict: **already live** (confirmed independently: the file's own note plus this
being exactly the kind of idempotent, guarded DDL the audit method can trust).

**Risk review.**
- 119 files changed. One deletion (`.tmp-verify-motion.mjs`, a scratch file, fine to lose).
- New route: `app/api/bookings/salon/route.ts` — a POST endpoint for a salon recording its own
  appointment. Its own header comment does the exists-check and explains why it is a SEPARATE route
  from the customer booking endpoint rather than a flag on it (the customer endpoint carries a
  5-per-hour rate limit, online-booking-enabled gate, and a duplicate check keyed on user_id, none of
  which apply to an operator recording a phone booking; folding this in would either throttle a busy
  salon's own tool or require punching exceptions through every customer guard). It also names and
  rejects two earlier abandoned attempts at the same feature on other stranded branches
  (`nice-hugle-c0b706`'s version writes no `bookings` row at all, making the appointment invisible to
  reminders/no-show/analytics; `crazy-bose-57e405`'s version bolts a flag onto the customer endpoint
  and predates several guards that endpoint now has). This is good evidence the author of this branch
  already did the "does this exist elsewhere" research this audit would otherwise recommend.
  Auth/ownership shape mirrors the existing `app/api/bookings/walk-in/route.ts` pattern.
- `lib/validations.ts`: 64 lines added, 0 removed (a new `salonBookingSchema`).
- `middleware.ts`: 23 lines added, guarded by `process.env.NODE_ENV !== "production"` and scoped to
  exactly `pathname === "/terminal"`. Cannot affect production; the route itself also calls
  `notFound()` in production as a second guard. Low risk, well-commented.
- `messages/*.json` (all 4 locales): 0 keys removed.
- Semantic-clash check: of its 119 files, main also touched 26 after the branch point, including
  `lib/validations.ts` and `middleware.ts` specifically — both merged with 0 textual conflicts, but
  since both sides changed these files independently they are worth a second pair of eyes rather than
  trusting the auto-merge blind.

**Recommendation reason, plain English:** the actual feature (a salon typing in a phone booking) is
small, well-reasoned, already checked against two abandoned attempts at the same thing, and its one
database change is already live. But the branch is dragging about 35 debug scratch files that should
never ship; clean those out first, then this is a same-day merge, not a rebuild.

---

## claude/harness-everth-research-bfee1b — LIVE SESSION, do not touch

**What it is.** As of the 2026-09-02 snapshot this branch carried 6 commits of harness-only content
(the branch-drift report this audit builds on). **As of right now it carries 181 commits**, and the
newest file in its worktree (`_tmp_hdr.mjs`) has an mtime **22 seconds** before this check ran —
`app/[locale]/_components/layout/Header.tsx`, several `app/[locale]/dev/mock/dashboard/*` pages, and
`_design-system/PROCESS.md` were all touched in the same few minutes. This is not stale work sitting
in a worktree; a session is actively editing files in it right now. Reading its own
`_plans/HARNESS_REVIEW_2026-09-02.md` (134 KB, growing) shows it is workstream #75, a dashboard
design-review conversation (Fresha-for-structure / Airbnb-for-look), still mid-argument with the
owner over shadows, card grouping, and the calendar/bookings screens.

**Conflicts.** 0 against main (its merge-base IS main's current tip, so there is no window for main
to have diverged).

**Migrations not on main.** None.

**Risk review.** By top-level area: app 38 (real dashboard pages: `all-salons`, `bookings`,
`clients`, `nail-admin`, `refunds`, plus `SearchTemplate.tsx`, `FilterSheet.tsx`, `TabPill.tsx`,
`CookieConsent.tsx`, `HideInBooking.tsx`, `auth/reset-password/page.tsx`,
`app/api/auth/password/check/route.ts`, and about a dozen `/dev/` mockup-only pages),
`_design-system` 16, `_plans` 13, `public` 10, `.claude` 6, `scripts` 4, `messages` 4. It touches an
auth-adjacent API route (`password/check`) and `auth/reset-password/page.tsx` — worth a closer look
once the session settles, not right now. No key removals in `messages/en.json` (12 keys added, 0
removed). Deletions: none found.

**Recommendation reason, plain English:** you cannot safely merge, archive, or delete a branch
someone is typing into this second. Come back to this one after the live session ends or hands off;
everything else in this report is unaffected by waiting.

---

## claude/nice-hugle-c0b706 (oldest of the 11, 2026-05-31)

**What it is.** 17 commits, but the highest conflict-density of any small branch (311 conflicts
across only 17 commits — a strong signal main diverged hard from this one specifically). A dashboard/
calendar rebuild: staff-column day-board calendar with drag (`DragOverlay`), weekly staff rota
planner + scheduling schema, staff accounts & permissions, a CRM built on a new `salon_clients`
table, and a sales/POS schema (`sales`, `sale_line_items`). 5 migrations, all already live.

**Top 5 features, checked against main:**

1. **Staff-column day-board calendar with drag-and-drop reschedule.** Main HAS a calendar
   (`app/[locale]/dashboard/calendar/page.tsx`, 1156 lines) with its own drag implementation, but
   using a different library (`@hello-pangea/dnd` vs this branch's `@dnd-kit` `DragOverlay`).
   **Main has a different version.**
2. **Staff accounts & permissions (`staff_invites`, `access_role`).** Main has its own staff-invite
   flow: `app/[locale]/dashboard/staff/page.tsx`, `app/api/staff/invite/route.ts`,
   `app/api/staff/accept-invite/route.ts`, all reading `access_role`. **Main has it now**, via a
   different build.
3. **CRM on a dedicated `salon_clients` table.** Main's client pages
   (`dashboard/clients`, `dashboard/nail-clients`, `dashboard/barber-clients`, with tags/notes API)
   derive clients from `bookings` and `public_profiles`, not from a `salon_clients` table. **Main has
   a different version** (booking-derived, not a standalone CRM table).
4. **Weekly staff rota planner (self-service scheduling UI).** Main has the underlying API surface
   (`app/api/staff/schedule/auto-apply/route.ts`, `app/api/staff/my-schedule/route.ts`,
   `app/api/staff/[id]/availability/route.ts`) but no dashboard page for a salon to plan the rota was
   found. **Main lacks it** — this is the strongest genuine gap on this branch.
5. **Sales / POS schema (`sales`, `sale_line_items`).** The tables exist live in the database (per
   the migration check) but no app code on main reads or writes `sale_line_items` — only the
   generated `lib/database.types.ts` mentions it. **Main lacks it** — a second genuine gap, and since
   the schema is already live, building the UI against it would not need a new migration.

**Recommendation reason, plain English:** most of what this branch built now exists on main in a
newer form, so merging the branch itself would mean going backwards on the calendar and staff pages.
Two real gaps remain (a rota-planning screen, a POS/sales screen) and both can be built fresh against
tables that are already live, without touching this branch's 311-conflict diff at all.

---

## claude/bold-hellman-b31513

**What it is.** 32 commits, 2026-06-30. This branch IS the "Aurora V2" dashboard skin (elevation
tokens, tinted fields, glows, category-tool elevation), built in 7 phases in one day, plus onboarding
profiling (OB-2: acquisition source / team size / goals questions) and an onboarding-wizard
collapse (OB-1). 1 migration, already live.

**Top 5 features, checked against main:**

1. **Aurora V2 dashboard skin.** `_design-system/REMOVED.md` names this branch by id and says so in
   the owner's own words: "Owner binned it 2026-08-25 during the unmerged-branch review: it competes
   with the dashboard look he already locked... and it predates his 2026-08-12 decision making
   Airbnb the source of truth." **Deliberately killed** — do not restore without him reopening it by
   name, per the graveyard rule.
2. **OB-2 onboarding profiling questions (acquisition source, team size, goals).** Main's
   `app/[locale]/onboarding/salon/page.tsx` already asks exactly these questions with matching
   option sets (`ACQUISITION_OPTIONS`, `TEAM_SIZE_OPTIONS`). **Main has it now.**
3. **OB-1 wizard collapse to one step.** Not independently re-checked beyond the fact that onboarding
   has clearly been rebuilt since (see #2); treating as **likely superseded**, tier expect not
   verified.
4. **OB-3 curated "next steps" home cards.** Not independently re-checked; same tier as #3.
5. **Design-system cleanup commits (caps sweep, coral-to-blue sweep, dead Lucide imports).** These
   are mechanical/one-time sweeps against a design system that has since moved on multiple times;
   **not a feature to lift**, just churn.

**Recommendation reason, plain English:** he already killed the one big thing this branch is, by
name, in writing, five weeks ago. Nothing else on it is worth a second look.

---

## claude/bold-jepsen-6019eb

**What it is.** 45 commits, 2026-07-06, all in one day. A huge backend-security-and-frontend batch
run (7 sequential batches, "T5 done, all 19 original atomic asks disposed"): SSRF defense, 4 CAS race
fixes (slot double-claim, express-rebook, gift-card redeem, pre-charge), auth-hardening on directory-
claim/reschedule/intake, 9 phantom-column silent-no-op repairs, voucher money-hole closures, plus
frontend F1-F4 (button press-feedback, loading/empty/error states, dashboard de-CAPS sentence case).
Phone OTP was explicitly parked ("unwired, needs a brute-force guard"). 0 migrations.

**Top 5 features, checked against main:**

1. **SSRF defense via a shared safe-fetch helper.** Main has `lib/security/ssrf-guard.ts`. **Main
   has it now** (different name, same concept).
2. **CAS slot-claim / TOCTOU guards.** Main's `app/api/bookings/route.ts`,
   `app/api/bookings/express-rebook/confirm/route.ts`, and
   `app/api/bookings/[id]/reschedule/route.ts` all reference TOCTOU/slot-claim guarding directly.
   **Main has it now.**
3. **Phone OTP flow (parked here as unsafe to ship).** Main has `app/api/auth/verify-phone/send/
   route.ts` and `.../check/route.ts` plus rate-limiting infra. **Main has it now** — the exact gap
   this branch flagged and declined to close has since been closed on main.
4. **Money-constant extraction (`MIN_DEPOSIT_CHF`, `MIN_CHARGE_RAPPEN` out of inline code).** Main
   has equivalent extracted constants in `lib/loyalty/perks.ts`, `lib/credits/redeem.ts`, and the
   Stripe payment-intent route. **Main has it now.**
5. **Button press-feedback (F1, visible confirmation on silent mutating actions).** Found in several
   main components already (`BookingConfirmation.tsx`, `CancelBookingSheet.tsx`,
   `TikTokPlayer.tsx`, `ReportButton.tsx`, `DetailPage.tsx`). **Main has it now.**

**Recommendation reason, plain English:** every one of the five things checked on this branch already
exists on main, built independently. There is nothing left here that main is missing.

---

## claude/cranky-bose-5621bf

**What it is.** 77 commits, "P3" bug-fix sweep (2026-07-07/08): roughly 38 fixes, mostly silent
no-ops (phantom columns, RLS gaps), a GDPR guest-erasure data-loss bug (erasure was wiping PII on
ACTIVE bookings), loyalty "System A -> System B" consolidation, off-peak filter wiring, true-UTC slot
storage for Zurich timezone correctness, and killing the duplicate `/behandlungen` page. 6
migrations, all already live (security-phase1 profile/gift-card guards, one-active-booking-per-slot,
purge-function lockdown, `auto_complete_enabled` column).

**Top 5 features, checked against main:**

1. **Kill `/behandlungen` as a duplicate of `[city]/[category]`.** `_design-system/REMOVED.md` line
   136 records this was killed on main 2026-08-23 by direct owner order — AND its own text says "one
   abandoned branch had reached the same conclusion in July and deleted it as a duplicate," which is
   this branch. **Main has it now**, independently, reaching the identical verdict.
2. **GDPR guest-erasure critical fix (was wiping PII on active bookings).** Main has a dedicated
   `lib/gdpr/` module (`purge-salon-storage.ts`, `purge-avatar-storage.ts`,
   `purge-client-photo-storage.ts`, `purge-review-photo-storage.ts`) plus
   `app/api/cron/process-deletions/route.ts`. **Main has a different, more built-out version.**
3. **Off-peak discount filter/wiring.** Main has `app/api/off-peak/route.ts`,
   `app/api/salons/[slug]/off-peak-today/route.ts`, `app/api/slots/route.ts`. **Main has it now.**
4. **Loyalty System A -> B consolidation.** Main has a substantially larger loyalty surface (9
   routes: award, cards, redeem, status, qr, stamp, plus a recompute cron), matching the memory note
   that a full "Solen Status" frequency-rank system shipped separately. **Main has a different,
   larger version.**
5. **True-UTC slot storage (Zurich wall-clock bug fix).** Main has Zurich-timezone-aware handling in
   multiple places (`lib/dashboard-advice.ts`, `lib/format.ts` explicitly documents using
   `Europe/Zurich` for hour formatting). **Main has it now**, though not independently traced to the
   exact same bug class.

**Recommendation reason, plain English:** its single most cited fix (killing the duplicate
treatments page) is literally referenced on main's own graveyard as independently rediscovered. The
rest is superseded by bigger, newer versions of the same fixes.

---

## claude/context-compact-architecture-5d1ace

**What it is.** 74 commits, 2026-07-10. Two threads in one branch: (a) a focus-ring law sweep (554
pre-pivot `focus:` classes converted to the global `focus-visible:` law across 79 files) plus Apple-
style gesture-release physics for the Sheet component (LOCKFILE §16.5: velocity-first release
decision, rubber-band, momentum bounce); (b) a design-governance audit that folded `CANON.md` into
`LOCKFILE.md` and wired `SENIOR_SCORECARD`/`WORK_TYPES` into the design-verifier. Classification:
MIXED (real component work plus heavy harness/doc work). 0 migrations.

**Top 5 features, checked against main:**

1. **Apple-motion Sheet 16.5 gesture-release physics.** Main's `_design-system/LOCKFILE.md` §16.5 is
   titled "Gesture-release physics (owner-approved 2026-07-10...)" — the exact same date as this
   branch's last commit. **Main has it** (the law text matches almost certainly because this branch,
   or work alongside it, is where it originated); worth one direct check of whether the Sheet
   component's actual implementation matches the law before assuming full capture, since a law
   landing on main does not by itself prove the component code did too.
2. **Global focus-visible sweep (554 classes, 79 files).** `app/globals.css` on main does define
   `focus-visible:` rules. **Main has it**, though whether all 79 files were swept the same way was
   not file-by-file verified here.
3. **CANON.md folded into LOCKFILE.md.** Main's `_design-system/LOCKFILE.md` is the file this whole
   audit and the project's CLAUDE.md cite throughout as the frozen source of truth — the fold this
   branch describes doing is consistent with the file main actually has today. **Main has it.**
4. **SENIOR_SCORECARD / WORK_TYPES wired into the design-verifier.** Both files are named directly in
   the project's CLAUDE.md as live ship-gates today. **Main has it.**
5. **Design-governance findings 1-12 (dead `Toast.tsx` deletion, stale doc corrections, MOTION.md
   self-claim fix).** Not independently re-checked; given items 1-4 all landed, treating as **likely
   captured**, tier expect not verified.

**Recommendation reason, plain English:** the law and the governance docs this branch produced are
already the law and docs main runs on today, dated the same day. There is a small chance the
underlying Sheet component code itself still differs from the law it wrote; that is the one thing
worth a five-minute look before deleting.

---

## claude/happy-jackson-514459

**What it is.** 114 commits, 2026-07-10. Booking-security hardening (same-slot double-book race,
SECDEF-revoke enforcement, 5 IDOR/ownership gaps in dashboard service-role routes, staff commission-
rate/permissions gating, voucher/referral/phone-OTP hardening) plus a "motion-screens" mockup
consistency loop (18 screens refined against real production components, e.g. re-pointing the map
card to the real `SalonResultCard`), plus removing the orphaned `/checkout` route. 1 migration
(`e2e_security_hardening`, policy/function-only, cannot verify from the snapshot).

**Top 5 features, checked against main:**

1. **Same-slot double-book race guard.** Covered by the same TOCTOU guards already confirmed on main
   under `bold-jepsen-6019eb` above (`app/api/bookings/route.ts` and siblings). **Main has it now.**
2. **Remove orphaned `/checkout` route.** Confirmed: no `app/checkout` (or locale-nested equivalent)
   exists on main. **Main has it now** — independently reached the same conclusion (this is also
   what `sad-austin-a99451`, below, separately flagged as a suspected-orphan page).
3. **IDOR/ownership gaps in dashboard service-role routes.** Not independently re-verified route by
   route; given the broader pattern (every other security claim checked across these 3 sibling
   branches already exists on main), treating as **likely captured**, tier expect not verified.
4. **"Motion-screens" 18-screen consistency loop (dev-only mockup pages built on real components).**
   No `motion-screens` path exists anywhere on main. **Main lacks it** — but these were dev-only
   demonstration pages, not shipped surfaces; the value was in the refinement process, and the
   components they refined against are presumably already current on main independent of this
   branch's demo pages.
5. **Demo-data gate.** No hook named for it under `.claude/hooks/`. **Main lacks it**, minor.

**Recommendation reason, plain English:** the security fixes are covered by the same independent
hardening found on the other two branches that share this branch's exact starting point (see Twins,
below). The dev-only mockup pages are not worth reviving as a branch merge.

---

## claude/crazy-bose-57e405 (largest and oldest of the 11 old branches)

**What it is.** 170 commits, 2026-06-28, largest footprint (416 app files, 132 legacy components).
An exhaustive multi-wave bug-fix campaign (security waves closing 9 critical + 65 high + 265 medium
findings, `getSession`->`getUser` migration across 234 routes, dashboard phantom-column repairs), the
nail-infill retention loop, a FROZEN salon lifecycle state, admin salon-review UI, coachmark rollout,
two-tier onboarding + publish-checklist spec, and the Aurora dashboard mockup work that `bold-hellman`
later built out in full (this branch's June 13-15 commits, "Aurora design language v2", "Aurora v3",
"apply Aurora Differentiation System to live sections", are the origin of the same dead feature). It
also explicitly reverted its own promo-discount and off-peak-cooldown work "per owner request" before
the branch ended, so those are not gaps at all — the owner already said no to them, on this branch,
in real time. 7 migrations, all already live.

**Top 5 features, checked against main:**

1. **Aurora dashboard skin (origin of the `bold-hellman` build-out).** Same graveyard entry as
   `bold-hellman-b31513` above. **Deliberately killed.**
2. **Nail infill retention loop.** Per project memory, this shipped but is gated behind a
   `nail_features` flag that is currently disabled; `lib/feature-flags.ts` does define the flag.
   **Main has it now**, dormant by design, not missing.
3. **Coachmark rollout (checkout/block/waitlist onboarding hints).** No `coachmark` reference found
   anywhere in `components-legacy/`, `app/`, or `lib/` on main. **Main lacks it.**
4. **Promo-discount + off-peak-cooldown features.** The branch's own last commit reverts these "per
   owner request." **Not a gap** — already declined once, on this branch, by the owner.
5. **FROZEN salon lifecycle banner (5th account state).** No `'FROZEN'` literal found in
   `lib/*.ts` or `app/api/salons/route.ts` on main. **Main lacks it** — genuinely unchecked elsewhere
   in this pass, worth a second look only if a 5th salon lifecycle state is something he still wants.

**Recommendation reason, plain English:** the single largest and oldest branch in the pile, and its
headline feature is dead by his own order, its second-biggest feature already shipped (dormant), and
its third already got a "no" from him on the branch itself. What's left (coachmarks, a FROZEN salon
state) is minor and easier to rebuild fresh than to extract from a 980-conflict branch.

---

## claude/clever-mirzakhani-1af8ef

**What it is.** 200 commits, 2026-07-06, second-largest footprint (234 app files, 75 legacy
components). Two threads: (a) "backend-harden faces 1-5," a security/perf sweep (auth/session/cookie
hardening, payment hardening, atomic slot-claim fixing the double-booking race, search
injection/PII over-select, cron fan-out caps, directory-OTP abuse); (b) a long personalization
exploration ("dna-interests" / "dna-picker-council"), which the branch's own commit log shows going
through **6 rejected picker rounds** before landing on a text-only editorial direction, still
unshipped when the branch stopped. 21 migrations, all already live (voucher/credit redemption
ledgers, GDPR deletion columns, referral double-mint backstop, staff-column locking, TWINT feature
flag).

**Top 5 features, checked against main:**

1. **Atomic slot-claim / double-booking race fix.** Same TOCTOU guards confirmed under
   `bold-jepsen-6019eb` and `happy-jackson-514459` above. **Main has it now** — a third branch
   independently reaching for the same fix.
2. **Auth/session/cookie hardening (backend-harden face 1).** Not independently re-verified line by
   line; given the pattern across every sibling branch's security claims, treating as **likely
   captured**, tier expect not verified.
3. **DNA/interests personalization picker.** Main's `OnboardingFlow.tsx`, `BeautyProfileForm.tsx`,
   and `ForYouSalonRows.tsx` all reference an interests-pill system already
   (matching the project memory that this shipped as "DNA point system" via `disc_*` + `prefs.
   interests`). **Main has a different, shipped version** — this branch's 6-round exploration never
   converged; main's did.
4. **Voucher/credit redemption ledgers + RPCs.** Both `voucher_redemptions` and `credit_redemptions`
   tables and their linked columns (`bookings.voucher_code`, `bookings.referral_code`) are confirmed
   live. **Main has it now** (as data; the RPC/policy layer itself was not independently re-verified).
5. **TWINT payment feature flag.** Per project memory, TWINT shipped and is held off pending Stripe
   review. **Main has it now** (gated, matching this branch's own flag-based approach).

**Recommendation reason, plain English:** its two headline threads both have a real, shipped
counterpart on main already — the security fix a third branch also independently found, and the
personalization work resolved on main after this branch's own 6 rejected attempts did not converge.

---

## claude/backend-analysis-improvements-77f02b

**What it is.** 154 commits, 2026-07-16. Two threads: (a) a long confirmation-screen visual
iteration (v3, v3.1, v3.2, v4, v4.1 — photo sizing, badge/disc treatment, date-picker rebuild cell-
for-cell from the real primitive, elevation fixes); (b) a large backend "estate audit" governance
pass (34 findings triaged, gate hardening, generate-slots workflow-dispatch bug fix). 23 migrations,
all checkable ones already live, including the one the 2026-08-14 audit flagged as the strongest
security reason to keep this branch alive.

**Top 5 features, checked against main:**

1. **`bookings.consumed_at` single-use quick-action token (2026-08-14 audit's #1 concern: a booking
   confirm/cancel email link that could be replayed with no guard).** Confirmed live in
   `_inventory/_db-columns.json`. **Main has it now** — the exact gap the last audit called the
   strongest reason not to delete this branch has since closed through a different route.
2. **Confirmation-screen redesign (v3-v4.1).** Main has its own iteration trail on the same screen:
   `app/[locale]/confirmation/page.tsx` plus dev preview pages `dev/checkout-confirm`, `dev/confirm-
   preview`, `dev/confirm-full`. **Main has a different, likely newer version** — not diffed pixel
   for pixel here, but the existence of main's own iteration history on the identical screen strongly
   suggests independent convergence, not a gap.
3. **`salon_of_month_winners` table + feature.** Confirmed live. **Main has it now.**
4. **`partner_leads` missing-migration repair.** Confirmed live (also cited by name in the 2026-08-14
   audit as something to keep as reference, since its numbers were marked invented). **Main has it.**
5. **Estate-audit / gate-hardening governance work (34 findings, gate tuning).** This is a one-time
   audit of a state of the harness from July; the harness has moved substantially since (per project
   memory: 287 hooks, most unwired then re-audited multiple times since). **Superseded by newer
   audits**, not a lift candidate.

**Recommendation reason, plain English:** the one thing this branch was worth keeping around for, a
security hole in a booking-confirmation email link, is now closed on main through a different fix.
Its other headline piece, a redesigned confirmation screen, has a competing lineage already live on
main.

---

## claude/sad-austin-a99451

**What it is.** 80 commits, 2026-07-06. An admin-surface "bug-hunt" audit (batches B through E:
audit-logging on mutation routes, rate-limiting, self-protection on user PATCH, CAS on disputes,
gating two unauthenticated admin GETs, flagging `/checkout` as a suspected orphan) plus a design-
polish loop (216 verified inconsistencies fixed, 94 motion gaps, selected-state and focus-ring
sweeps across 22+35 files, spinners converted to content-shaped skeletons). One onboarding fix
(browser-back stepping through the wizard) was built, found not to actually work, and reverted on
this same branch. 1 migration (`demo_data_flag`, policy-only, cannot verify from the snapshot).

**Top 5 features, checked against main:**

1. **Flag `/checkout` as an orphan (batch findings, not yet acted on when this branch stopped).**
   Main has already removed `/checkout` entirely. **Main has it now** — independently reached by two
   other branches too (`happy-jackson-514459` actually did the removal; see Twins below).
2. **Admin mutation-route audit logging + rate limiting.** Not independently re-verified route by
   route on main; treating as **likely captured**, tier expect not verified, given the broader
   pattern of every checked security item across these branches already existing on main.
3. **Unauthenticated admin GET gating (salon-of-month, badges auto_rule).** Not independently
   re-checked; same tier as #2.
4. **Design-polish sweep (216 inconsistencies, spinners -> skeletons).** Per project memory, a
   dedicated consistency system with its own detector scripts shipped later
   (`scripts/consistency-check.mjs`, `scripts/detect-type-scale-outliers.mjs`, present on main). This
   branch's manual 216-item sweep is very likely a subset of ground later covered systematically.
   **Main has a different, more durable version** (a checker instead of a one-time sweep).
5. **Browser-back onboarding wizard step (M9).** The branch's own commit reverts this: "the
   non-working M9 browser-back history hack (Next App Router owns history.state)." **Not a gap** —
   already tried and abandoned on this branch itself.

**Recommendation reason, plain English:** its most concrete finding (kill `/checkout`) is done on
main, arrived at independently by two other stranded branches as well. Its design-polish work is the
kind of one-time sweep the project has since replaced with an automated checker.

---

## claude/quirky-ellis-ef5559 (most conflicted branch measured)

**What it is.** 267 commits, 2026-07-24, the largest and most-conflicted branch (1140 conflict
markers, 335 app files). Three threads: (a) a "consistency" detector system (dupe-check, icon-check,
type-scale gate, selected-state divergence detector, a unified `npm run consistency` dashboard,
finished and owner-approved on this branch's own last day); (b) `_backend-system/LAW.md`, the frozen
backend-decisions doc (15 topics, ~60 rows) — **this specific commit (`46c319e67`) is common ancestry
already shared with main**, confirmed with `git merge-base --is-ancestor`, so it is not something to
"lift," it was already there before this branch diverged; (c) a long tail of individual backend-law
security fixes (a public Gemini-cost guard keyed on an attacker-suppliable value, a `sendEmail`
timeout so a Resend hang cannot kill a live booking, the server taking over express-rebook pricing to
close a CHF 185 hole, fabricated-amenities cleanup). 15 migrations, all 4 of the ones the 2026-08-14
audit called out by name as genuinely missing and security-relevant are now confirmed live.

**Top 5 features, checked against main:**

1. **CSP violation-reporting table + endpoint.** `csp_violation_reports` table confirmed live. **Main
   has it now.**
2. **Walk-in tracking-token hashing (was stored raw).** `barber_walkin_queue.tracking_token_hash`
   confirmed live. **Main has it now.**
3. **Admin-enforced salon payment mode.** `salons.payment_mode_admin` and
   `salons.payment_mode_enforced` both confirmed live. **Main has it now.**
4. **Express-rebook server-owns-price fix (closing a CHF 185 hole).** Main's
   `app/api/bookings/express-rebook/confirm/route.ts` already carries a comment: "the slot is
   authoritative on price (round 2 fix)." **Main has it now.**
5. **Unified `npm run consistency` dashboard.** No `consistency` script exists in main's
   `package.json`. But the underlying detector scripts DO exist on main
   (`scripts/consistency-check.mjs`, `scripts/detect-type-scale-outliers.mjs`,
   `scripts/hooks/type-scale-gate.mjs`) — traced to a 2026-08-14 commit (`695ef2842`, "Eighty-eight
   things that existed only on the July copy, brought across before it goes") that manually lifted
   reports and checks from a similar July source. **Main has a different, partial version** — the
   individual checkers were brought across, but the single `npm run consistency` command that ties
   them into one dashboard was not. This is the one genuine, small, well-scoped gap left on this
   branch.

**Recommendation reason, plain English:** this was the branch the last audit worried about most,
because it carried 3 of the 4 migrations judged genuinely missing and security-relevant. All 4 are
now confirmed live in the database through other work. What's left worth a look is small: wiring the
existing detector scripts main already has into one `npm run consistency` command, which is an
afternoon of glue code, not a branch merge.

---

## Twins and near-twins

**The clearest case: `bold-jepsen-6019eb`, `cranky-bose-5621bf`, and `happy-jackson-514459` share
the exact same merge-base commit** (`6b69512ad2d6bcbbb19fdac6b3b3e8596c7ce00a`), confirmed with
`git merge-base`. All three forked from the identical point on 2026-07-06 through 2026-07-10 and ran
overlapping backend-security-hardening passes independently: CAS/TOCTOU race fixes, IDOR/ownership
gating, phantom-column silent-no-op repairs, and (in two of the three) an onboarding/checkout
cleanup. Every checked item from all three now exists on main via yet a FOURTH, independent path.
This is the strongest live example of "the same work done multiple times" the owner asked about on
2026-08-14 — three sessions, one starting point, none aware of the other two.

**A sequential pair, not a parallel duplicate: `crazy-bose-57e405` (June 13-15, "Aurora design
language v2" / "Aurora v3") is the origin of the same Aurora dashboard concept that `bold-hellman-
b31513` (June 30, "Aurora V2 Phase 1-7") built out in full.** One branch's mockup became the next
branch's build; both are dead by the same 2026-08-25/26 owner decision recorded in
`_design-system/REMOVED.md`.

**File-overlap, not necessarily feature-duplication:** the 2026-09-02 harness report
(`_plans/BRANCH_DRIFT_2026-09-02.md`) measured raw file-name overlap between every pair of branches.
The top pairs by shared file count: `crazy-bose-57e405` <-> `quirky-ellis-ef5559` (246 files),
`clever-mirzakhani-1af8ef` <-> `crazy-bose-57e405` (203), `clever-mirzakhani-1af8ef` <->
`quirky-ellis-ef5559` (137), `cranky-bose-5621bf` <-> `crazy-bose-57e405` (135). That report's own
caveat still holds: touching the same file is not proof of solving the same problem two different
ways, and whether any of these pairs genuinely built the same thing differently was not checked
line-by-line by either audit. Five branches (`crazy-bose`, `clever-mirzakhani`, `quirky-ellis`,
`cranky-bose`, `backend-analysis-improvements`) all repeatedly touch the same core surface: homepage
components (`BentoBusiness.tsx`, `Nearby.tsx`, `Reviews.tsx`), the booking/admin API routes,
`_design-system/REMOVED.md`, `_plans/ACTIVE.md`, and `_tasks/INCOMPLETE_FEATURES.md` — five
independent sessions editing the same living documents without seeing each other's changes, which is
churn on shared files more than duplicate feature work.

**Not a twin, a false alarm caught and corrected:** the task brief that opened this audit stated the
4 newer branches "produce 0 conflict markers." That measurement was wrong for 3 of the 4 —
`offline-booking-device-266b10` (9), `pdp-styling-updates-b2582b` (19), and
`harness-everth-research-bfee1b` (1, itself a false positive traced to that branch's own report file
containing the literal text "`<<<<<<<`" as documentation prose, not a real conflict — corrected to 0
using a stricter `<<<<<<< \.our` pattern that eliminates prose false-positives). Only `email-29c154`
was genuinely 0. The likely cause: the same shell-`grep`-gives-false-zeros trap the 2026-09-02
harness report already flagged and worked around with a Python scan; this session hit the same trap
independently and worked around it with a different grep pattern, cross-checked by hand against the
raw diff3 text for every branch.
