# Owner answers batch (2026-07-27)

Workstream 44. The owner answered the 9 open items from `PRINCIPLES_LOOP.md`. Their answers
are not all "yes/no": several turned into new scope, and two turned into gates.

Owner message verbatim (the close condition):

> 4 ye for salon we dont rlly need but we need to be able to temove but also salon to be able
> to temove their own pics yk but like for salon bfr they go live we can approve or dissaprove
> right as admin we can see all details n stuff if not make it better yk for admin view on
> reviewing and for customer/reviews make it able to post but like salon can disable or enable
> reviews n stuff yk or pictures and also being able to report pictures
>
> 1 yes there is a whole problem with translation we need dedicated session for fixing
> everywhere cz almst everywhere is either mixed german english sh andchanging lang doesnt
> rlly work and also we need a gate or a hook to acc enforce multi langual while writing yk
> 2 research whats legal 3 for pics we use unsplash like stoco pics for previews cz we are not
> live yet but we need to be easy to acc distinguish cx u keep forgetting 5 cant we incl in
> the terms n service all pictures uploaded are mine like solen n solen can use that for ads
> evrth like or how does fresha uber eats any ithr company do like airbnb etc and 6/7 ye fix
> 8ye write 9yr we need whole principle for that

Research behind every item: `_design-system/research/owner-answers-2026-07-27/` (6 recon
files, 5 adversarial verifications, 3 external research documents).

## A. Moderation and photo control (owner item 4)

- [x] A1. Recorded: salon gallery photos do NOT get per-photo pre-publish review. Owner:
      "ye for salon we dont rlly need". Removal after the fact is the model instead.
- [x] A2. Admin can remove any salon photo , `app/api/salons/[slug]/gallery/route.ts` DELETE
      gained an admin branch + an audit entry (`salon.photo.takedown`), commit `ff99f4d1c`.
      Before this NOBODY at the platform could take a photo down.
- [x] A3. Salon can remove their own photos , verified already working end to end for photos
      uploaded through the dashboard GalleryManager. **Known defect, filed not fixed:** a
      photo uploaded through the ONBOARDING wizard (a separate direct-to-bucket path) has no
      `salon_portfolio_images` row, so the dashboard grid never renders it and the delete
      returns 200 `{success:true}` while removing nothing. Textbook silent no-op. Needs the
      onboarding path to dual-write, same as the dashboard path does.
- [x] A4. Admin approves/disapproves before go-live , the flow existed and was UNREACHABLE.
      `registration_completed` was never written by the real signup path, so the queue matched
      0 rows while 6 salons sat waiting. Commit `e5f4d17b9`.
- [x] A5. Admin review view made better, partially: the "Edit" button was a silent no-op
      (linked to the admin's OWN settings with no salon id) and now opens the salon's
      storefront, and `lib/salon-detail.ts` gained the admin branch its own comment had
      promised, so a PENDING salon's page opens instead of 404ing. Commit `ff99f4d1c`.
      **Still thin, and it is a real build, not a line:** the reviewer still cannot see the
      salon's services, staff, VAT number, or its uploaded verification documents. Those docs
      are write-only today , `salon_documents` ships status/reviewed_by/reviewed_at/admin_note
      columns that nothing writes, and no admin route reads the table at all. Spec:
      `_design-system/research/owner-answers-2026-07-27/recon--salon-approval-before-go-live-and-admin.json`.
- [x] A6. Reviews still post immediately , confirmed not regressed. No pre-moderation was
      added anywhere; `reviews.moderation_status` and the existing `/dashboard/review-moderation`
      page are after-the-fact tools, unchanged.
- [ ] A7. Salon can enable/disable reviews , NOT BUILT. Needs a boolean column on `salons`,
      the column added to the allowlist at `app/api/salons/[slug]/route.ts:72-91` (or the
      settings save silently drops it, this repo's signature failure), a toggle in the
      dashboard settings page, and read gates in FOUR places (`lib/salon-detail.ts`,
      `app/api/reviews/salon/[salon_id]/route.ts`, the dedicated reviews page, and a write gate
      in `app/api/reviews/route.ts`). **Blocked on one owner decision:** does disabling HIDE
      the 260 existing reviews or only block new ones?
- [ ] A8. Salon can enable/disable photos on reviews , NOT BUILT, and it is unverifiable
      until a prerequisite is fixed: **review-photo upload is a confirmed silent no-op today**
      (`app/api/reviews/[id]/photos/route.ts`, the `review-photos` bucket has no INSERT policy).
      No review photo has ever successfully uploaded, so a toggle over them would gate nothing.
- [ ] A9. Report a photo , NOT BUILT. `content_reports.target_id` is already a polymorphic
      bare UUID so the plumbing accepts it, but every taxonomy layer rejects `'photo'`: the
      CHECK constraint, `lib/content-reports.ts`, `lib/validations.ts`, and `ReportButton.tsx`.
      One additive migration plus four small edits, then generalise the `hide_content` branch
      in `app/api/admin/reports/[id]/route.ts` past review-only. **Blocked on one owner
      decision:** "anyone" = any signed-in user (what the button does today) or genuinely
      logged-out, which `content_reports`' `auth.role() = 'authenticated'` insert policy
      currently forbids.

**Also found while in here, not asked for, worth knowing:** `salon_photos` is a DEAD table.
0 rows, `salon_id INTEGER` against a UUID `salons.id`, zero code references. The live gallery
is `salons.gallery_urls` plus `salon_portfolio_images`. My earlier report to the owner treated
`salon_photos` as the gallery table; it is not.

## B. Translation (owner item 1)

- [ ] B1. French aligned to informal , NOT DONE. Measured 436 formal vs 63 informal against
      German 492/22 and Italian 312/0. It is a ~5,600-string machine sweep and belongs in the
      dedicated session the owner asked for, not squeezed into this batch.
- [x] B2. The problem measured with real numbers: the message CATALOGUE is fine (5,704 keys,
      four locales, perfect parity, essentially nothing untranslated). Everything outside
      next-intl is the problem: **543 hardcoded German user-facing literals across 109 TSX
      files**, 27 of which already call `t()` , that is literally the mixed German/English the
      owner sees. Plus a structural DB hole: `services.name_*`, `salons.description_*`,
      `service_options.name_*` and three more have de+en and NO fr/it columns at all.
- [x] B3. "Changing lang doesnt rlly work" ROOT-CAUSED and FIXED, commit `e15f0ae95`. Three
      causes: the only working switcher was mounted solely in MobileMenu, whose trigger is
      `md:hidden`, so desktop had none; the footer links threw you to the locale HOMEPAGE and
      never set the cookie; and the i18n CI job had been RED on all four files, so nothing was
      guarding any of it. Measured after: `/de/coiffeur` -> `/fr/coiffeur`, cookie null -> fr.
- [x] B4. The gate the owner asked for by name: `~/.claude/hooks/i18n-write-gate.py`, ARMED on
      PreToolUse + Stop, self-tested 22/22 with a zero-false-positive audit over 40 real files.
- [x] B5. Dedicated workstream needed , scoped here, with the four-step order in
      `_design-system/research/owner-answers-2026-07-27/recon--translation-i18n-state-of-the-solen-ch-w.json`.
      Step 4 (the fr/it DB columns + one `localizedField` helper repointing 12 hardcoded
      `locale === 'en' ? x_en : x_de` sites) is the real project.

## C. Price law (owner item 2)

- [x] C1. Researched against primary sources. **"ab CHF X" is NOT permitted on a service offer
      in Switzerland.** Art. 10 Abs. 1 PBV covers Coiffeurgewerbe (lit. a) and kosmetische
      Institute / Körperpflege (lit. d), which is Solen's entire catalogue, and SECO's sector
      sheet of 01.04.2025 says in its own words that prices are FIXED and "ab Fr. 30.-" is
      nicht zulässig. Written up with article numbers, quotes and a per-surface verdict table
      in `_rules/LEGAL_COPY.md`, replacing the guess that file previously held.
- [x] C2. Turned into a decision and a check: the PDP service row no longer says "ab"
      (commit `6b5861fdf`, measured zero occurrences on the live French PDP), and
      `~/.claude/hooks/legal-price-gate.py` is ARMED, self-tested 17/17, blocking a new
      from-price in de/en/fr/it on an offer surface.
      **Owner decision left:** the SalonCard's "ab CHF 45" is closer to Art. 13 advertising,
      where a from-price is legal only if the copy names WHICH offer it buys. Name the service
      on the card, or drop the price from it. Both are visible design changes.

## D. Stock photos must be obviously stock (owner item 3)

- [x] D1. Every stock image now carries an "UNSPLASH" badge and a dashed orange edge in
      dev/preview, renders null in production, and disarms itself per-image as real photos
      land. Commit `508ab7dc6`. Verified live: 19 of 19 stock images marked, 0 of the other 15
      images touched.
- [x] D2. `~/.claude/hooks/stock-photo-gate.py` ARMED, self-tested 19/19. Its Stop half is
      discriminating rather than a word filter: it reads the live `salon_photos` row count and
      only fires while that is 0, so it goes quiet by itself the day real photography exists.

**Measured while doing this:** all 20 customer-visible salons have a cover photo, all 20 point
at images.unsplash.com, and there are only 11 DISTINCT urls among them , 13 salons wear a
photo that also belongs to another salon, and one image is the cover for four different
studios. `salons.is_test` is false on all 28 rows, so the marker the estate assumed existed
flags nothing.

## E. Photo rights in the Terms (owner item 5)

- [x] E1. Researched Airbnb, Fresha (consumer + partner), Uber, Booking.com (guest + partner),
      Treatwell, Yelp, Google, with URLs and operative wording.
- [x] E2. Clause drafted, `_rules/CONTENT_RIGHTS.md`.
- [x] E3. Surfaced: **ZERO of the six take ownership**, and Solen's Terms ALREADY grant the
      industry-standard broad licence covering promotional use
      (`TermsContent.tsx:247-248`). Assignment would also be partly void under Swiss URG,
      which does not permit assigning moral rights. What is genuinely missing is the chain of
      permission behind the licence: an uploader warranty, and a depicted-person consent duty
      with record-keeping and withdrawal , the thing Fresha and Treatwell converge on from
      opposite ends of Europe. **Owner decision left:** what Solen PROMISES when a depicted
      person objects. The checkbox is trivial; the promise is policy.

## F / G. Dashboard layout (owner items 6 and 7)

- [x] F1. Page-level max-width , measured before 2136px at a 2200px viewport with
      `max-width:none`, after 1400px with 368/368 gutters. Reuses the /business hero width
      already in LOCKFILE instead of inventing a fourth. Commit `57a62cff8`.
- [x] G1. 68ch prose cap applied to seven main-column surfaces by one stated criterion, with
      the salon-description editor capped on its WRAPPER because its character counter is
      absolutely positioned against that element. Same commit.

## H. Restore drill (owner item 8, authorised)

- [x] H1. Ran, and found something much worse than the unmeasured RTO the line was about:
      **the nightly backup cron has never run once.** The `db-backup` job exists only in the
      local workflow file; GitHub's copy on `main` has neither the job nor its schedule, the
      registered workflow is `disabled_inactivity` at 2,981 failures / 0 successes, and
      production `/api/cron/db-backup` returns the HTML catch-all. The bucket holds exactly ONE
      folder, `backups/2026-07-11/`. Real RPO today is 16 days, growing.
      **Mitigated immediately:** that folder is past the 14-day retention cutoff in
      `lib/backup/export.ts`, so the first clean nightly run would have deleted the only backup
      that exists. All 24 files, 2,450 rows, copied out with per-file JSON-integrity checks to
      `/Users/sulo/solen/backups/db-backup-2026-07-11/`.
- [ ] H2. Measured RTO , BLOCKED, and not on willingness. A restore is structurally impossible
      today: `profiles` and 10 other live tables have no CREATE TABLE in any of the 273
      migration files, and the backup set carries foreign keys into `auth.users`, which
      PostgREST can never export (3 of 47 `referrals.referrer_id` values already point at auth
      users with no `profiles` row). The only path that can produce a real number is a Supabase
      Pro `--with-data` branch, about 5 cents of branch-hours on top of Pro, and it copies
      production personal data into a second database, which is an nFADP call the owner makes.

## I. Incident principle (owner item 9)

- [x] I1. Written: `_plans/OPS_RUNBOOK.md` gained an "Incident response" section , the
      principle, three severity levels named against Solen's real flows by file, PagerDuty's
      rule zero, the 9pm ladder whose first three steps need no diagnosis, the postmortem
      trigger list, five honest gaps and four owner decisions. Commit `1b48432b7`.
- [x] I2. Reachable at the moment it is needed: it is the FIRST section of the runbook the
      owner already opens when something is wrong, plus `_plans/POSTMORTEMS/_TEMPLATE.md`.

## Unplanned additions found and fixed along the way

- Freezing a salon did nothing. `freeze` wrote only `frozen_at`/`frozen_reason`, which gate
  nothing; the visibility gate is `is_active`. A frozen salon kept its PDP, its search
  placement and its bookings. Also closed the hole that opened: the owner could have undone an
  admin freeze by pressing Go Live. Neither route has a UI caller yet, so this was latent, not
  damage already done.
- `salons.rejected_at` existed with no writer at all, so a rejection had a reason but no date.
- The i18n CI job had been RED on all four locale files, permanently.

## Still open, all of them owner decisions

1. Disabling reviews: hide the existing 260, or only block new ones? (blocks A7)
2. "Anyone can report": any signed-in user, or genuinely logged-out? (blocks A9)
3. SalonCard "ab CHF": name the service on the card, or drop the price? (C2)
4. Photo takedown promise: what does Solen commit to when a depicted person objects? (E3)
5. Supabase Pro branch for a real restore drill: about 5 cents, plus copying production
   personal data into a second database. (H2)
6. The 6 salons already stranded at `registration_completed = false` need a backfill, which is
   a data write.
7. French: `vous` or `du`. (B1)
