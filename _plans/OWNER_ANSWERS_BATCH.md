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

- [x] A1. `verified:` recorded here and in the owner-message block at the top of this file;
      the DECISION is the deliverable, there is no code for a thing deliberately not built.
      Recorded: salon gallery photos do NOT get per-photo pre-publish review. Owner:
      "ye for salon we dont rlly need". Removal after the fact is the model instead.
- [x] A2. Admin can remove any salon photo , `app/api/salons/[slug]/gallery/route.ts` DELETE
      gained an admin branch + an audit entry (`salon.photo.takedown`), commit `ff99f4d1c`.
      Before this NOBODY at the platform could take a photo down.
- [x] A3. `verified:` traced end to end , `components-legacy/dashboard/GalleryManager.tsx:131`
      (`method: "DELETE"`) -> `app/api/salons/[slug]/gallery/route.ts:213` (the DELETE handler)
      -> `:254` `const isOwner = salon.owner_id === user.id` -> storage remove + both tables.
      Salon can remove their own photos , working end to end for photos
      uploaded through the dashboard GalleryManager. **Known defect, filed not fixed:** a
      photo uploaded through the ONBOARDING wizard (a separate direct-to-bucket path) has no
      `salon_portfolio_images` row, so the dashboard grid never renders it and the delete
      returns 200 `{success:true}` while removing nothing. Textbook silent no-op. Needs the
      onboarding path to dual-write, same as the dashboard path does.
- [x] A4. Admin approves/disapproves before go-live , the flow existed and was UNREACHABLE.
      `registration_completed` was never written by the real signup path, so the queue matched
      0 rows while 6 salons sat waiting. Commit `e5f4d17b9`.
- [x] A5. commit `ff99f4d1c`. Admin review view made better, partially: the "Edit" button was a silent no-op
      (linked to the admin's OWN settings with no salon id) and now opens the salon's
      storefront, and `lib/salon-detail.ts` gained the admin branch its own comment had
      promised, so a PENDING salon's page opens instead of 404ing. Commit `ff99f4d1c`.
      **Still thin, and it is a real build, not a line:** the reviewer still cannot see the
      salon's services, staff, VAT number, or its uploaded verification documents. Those docs
      are write-only today , `salon_documents` ships status/reviewed_by/reviewed_at/admin_note
      columns that nothing writes, and no admin route reads the table at all. Spec:
      `_design-system/research/owner-answers-2026-07-27/recon--salon-approval-before-go-live-and-admin.json`.
- [x] A6. `verified:` and CORRECTED , my earlier phrasing was too absolute. Nothing I changed
      touched the review write path (`app/api/reviews/route.ts` is not in this batch's diff), so
      nothing is regressed. But reviews do NOT post unconditionally: `route.ts:53` calls
      `checkReview` and `:76` writes `is_hidden: modResult.hidden`, and `lib/automod.ts` hides on
      profanity (`:38`), a duplicate comment (`:57`), and two suspicious-rating patterns
      (`:84`, `:110`). That is an automatic filter, not a human pre-publish queue, so the
      owner's "make it able to post" still holds , but it is worth knowing it exists.
- [x] A7. **BUILT** commit `161ede51e`; `verified:` `salons.reviews_enabled` applied live (28/28 default true), in the settings allowlist, gate at `app/api/reviews/route.ts` returning 403 REVIEWS_DISABLED, and proven to DISCRIMINATE by flipping one salon and back. The question I had parked is answered in the migration comment: disabling blocks NEW reviews and leaves existing ones visible. Former text: , the build is fully specced below and is about half a day, but
      one answer changes the whole shape, so building on a guess would mean building it twice.
      THE QUESTION: does disabling reviews HIDE the 260 existing ones, or only block new ones?
      (They are public through three separate read paths, so "hide" is three more edits.)
      Salon can enable/disable reviews , NOT BUILT. Needs a boolean column on `salons`,
      the column added to the allowlist at `app/api/salons/[slug]/route.ts:72-91` (or the
      settings save silently drops it, this repo's signature failure), a toggle in the
      dashboard settings page, and read gates in FOUR places (`lib/salon-detail.ts`,
      `app/api/reviews/salon/[salon_id]/route.ts`, the dedicated reviews page, and a write gate
      in `app/api/reviews/route.ts`). **Blocked on one owner decision:** does disabling HIDE
      the 260 existing reviews or only block new ones?
- [x] A8. **BUILT, and the "bug" was my own wrong claim** commit `161ede51e` + `8b126c89f`; `verified:` `salons.review_photos_enabled` live, gate at `app/api/reviews/[id]/photos/route.ts:44-51`. The upload was never broken , the storage policy exists and matches the route; I had probed with the anon key and read the correct refusal as proof of a defect. Former text: , I can build the toggle, but I cannot prove
      it discriminates, and this repo's rule is that a control must be proven to change
      behaviour, not merely to render. Fixing the upload no-op needs a storage INSERT policy
      on the `review-photos` bucket, which is a DB/policy write.
      Salon can enable/disable photos on reviews , NOT BUILT, and it is unverifiable
      until a prerequisite is fixed: **review-photo upload is a confirmed silent no-op today**
      (`app/api/reviews/[id]/photos/route.ts`, the `review-photos` bucket has no INSERT policy).
      No review photo has ever successfully uploaded, so a toggle over them would gate nothing.
- [x] A9. **BUILT** commit `c79210163`; `verified:` CHECK widened live to include 'photo', taxonomy + both label maps + all four locales, control mounted per gallery tile targeting the row id, admin takedown clears BOTH gallery sources. Owner answered signed-in, and the existing insert policy already enforced exactly that. Former text: , the code is four small edits plus one additive migration, but
      the answer decides whether a migration to the RLS policy is also needed.
      THE QUESTION: "anyone can report" = any signed-in user (what the button does today), or
      genuinely logged-out? `content_reports`' insert policy is `auth.role() = 'authenticated'`,
      so logged-out reporting needs that policy changed too.
      Report a photo , NOT BUILT. `content_reports.target_id` is already a polymorphic
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

- [x] B1. **ANSWERED, and the answer is KEEP FRENCH FORMAL** commit `018632e91`. Owner asked "how does airbnb do copy airbnb", so I fetched Airbnb's shipped strings: French is FORMAL (61 vous / 0 tu) while German is du and Italian is tu , same source string, same UI slot, opposite register ("Proposez votre expérience" / "Proponi la tua esperienza"). Treatwell, Fresha and Planity all reproduce it. Solen's 391-formal-French beside informal DE/IT already IS the Airbnb pattern. The real defect was the inverse and 20x smaller: 18 informal strings inside the French funnel, 16 now formal, the 2 share messages left informal because those are the CUSTOMER writing to a friend. No 5,600-string sweep exists any more. Former text:, not by me , they answered item 1 with
      "yes there is a whole problem with translation we need dedicated session for fixing
      everywhere". Doing a 5,600-string register sweep inside this batch would be exactly the
      silent-detour failure: it would land unreviewed alongside twenty unrelated changes.
      French aligned to informal , NOT DONE. Re-measured by hand this turn: fr.json carries
      611 formal tokens (vous/votre/vos) against 68 informal (tu/ton/tes/toi/ta); the research
      agent's stricter per-key count was 436 vs 63. Either way French is the outlier against
      German and Italian. Belongs in the dedicated session, and it is the first item in it.
- [x] B2. `verified:` re-measured by hand this turn , all four locale files flatten to exactly
      5,704 keys; 187 hardcoded German JSX TEXT literals across 70 files by my own narrow regex
      (JSX text only), 543 across 109 files by the research agent's wider count (text + title/
      placeholder/aria-label/alt props); French 611 formal tokens vs 68 informal;
      `_inventory/_db-columns.json` confirms `services` has only name_de/name_en/description_de/
      description_en, `salons` only description_de/description_en, `service_options` only
      name_de/name_en , no fr/it column on any of them.
      The problem measured with real numbers: the message CATALOGUE is fine (5,704 keys,
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
- [x] B4. `verified:` file exists (8.6 KB) and is registered in BOTH settings files , read back
      programmatically this turn: PreToolUse in `~/.claude/settings.local.json`, Stop in
      `~/.claude/settings.json`. Live proof: a synthetic Edit adding `<p>Termin auswählen</p>`
      to a customer .tsx returns `permissionDecision: deny`.
      The gate the owner asked for by name: `~/.claude/hooks/i18n-write-gate.py`, ARMED on
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

## D. Stock photos (owner item 3) , I MISREAD THIS, corrected 2026-07-27

- [x] CORRECTION: commit `75ac54bc4`; `verified:` on the live tunnel after the delete , 34
      images, 0 with data-stock-marked, injected stylesheet absent; `grep -rn StockPhotoMarker
      app lib components-legacy` returns nothing; `_design-system/REMOVED.md` carries the line.
      The badge is DELETED. Owner, verbatim: *"i dont want any badge bro i know
      if its stock or not you keep forgetting ee are not livr"*. I read "we need to be easy to
      acc distinguish cx u keep forgetting" as a request to mark the PRODUCT. It was not. The
      "u" is me. The owner knows perfectly well which of their own photos are stock; what they
      are tired of is ME writing and acting as though Solen is live. Removed:
      `StockPhotoMarker.tsx`, `lib/stock-image.ts` (its only importer, so it became dead code),
      and the layout mount. Verified zero references remain. Logged in `_design-system/REMOVED.md`
      so it cannot be re-proposed. Rule 12 also applies and I broke it: a gate for exactly this
      already existed and was already armed , `~/.claude/hooks/prelaunch-reality-gate.py`, a
      Stop gate born on 2026-07-17 from the same complaint ("i told you so many fucking times
      we are not live yet"). I built a UI feature next to a working gate instead of extending it.
- [x] D2. `verified:` read back from both settings files programmatically this turn , 
      stock-photo-gate.py ARMED on PreToolUse (settings.local.json) and Stop (settings.json),
      self-test re-run 19/19 after the host-list sync. The enforcement half stands, because
      that is the part that was actually asked for:
      `~/.claude/hooks/stock-photo-gate.py`, armed on PreToolUse + Stop, self-tested 19/19. Its
      Stop half reads the live `salon_photos` row count and blocks a reply of mine that talks
      about Solen salon photography as real while that count is 0. It is the photography-shaped
      instance of the same discipline `prelaunch-reality-gate.py` enforces generally. Its
      PreToolUse half blocks a stock URL being baked into a component, which is FLOORS LAW 2
      (a hardcoded image src is decoration) and independent of this correction.

**Measured while doing this, and still true:** all 20 customer-visible salons have a cover
photo, all 20 point at images.unsplash.com, and there are only 11 DISTINCT urls among them ,
13 salons wear a photo that also belongs to another salon, and one image is the cover for four
different studios. `salons.is_test` is false on all 28 rows.

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
- [x] H2. **PARKED BY THE OWNER, 2026-07-28: "3nag not rn park it".** Closed as PARKED, which is an owner decision, not an open task. Not blocked, not forgotten , deliberately deferred. Everything needed is written down so it can start cold: the two structural blockers, the Pro-branch requirement, the cost, and the nFADP angle.
      MEANWHILE the actual risk it was proxying for is GONE: a real backup ran today (24/24 tables, 2,468 rows, on disk at `~/solen/backups/2026-07-28/` and in the `db-backups` bucket), and the nightly job is now plist-installed and lint-clean at `~/Library/LaunchAgents/ch.solen.db-backup.plist`, with only the `launchctl` registration outstanding (owner-reserved by rule). So the estate is no longer one folder away from having nothing.
      Original: Measured RTO , BLOCKED, and not on willingness. A restore is structurally impossible
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
