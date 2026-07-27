# The 9, run as a loop (owner instruction, 2026-07-27)

Owner, verbatim:

> report signed in and also othr stuff make it as liop like yk how i said dedicated session
> fotr translation n stuff like the 9go one by one park the one u genuinely need my opinion
> but like its common scrnce like for example report button yk log in cz ppl can mass report
> etc but ye so like fix each 9 autonomously continuously jst park ones u cant do and
> continue as a loop

**The standard this sets, and it is stricter than "use your judgement":** a question is only
parked if I *genuinely cannot* answer it. "It would be nice to confirm" is not a park. The
worked example they gave is the report button: signed-in, obviously, because otherwise people
mass-report. That is the bar , if the answer follows from how the product works, decide it,
write down WHY, and keep going.

Every decision I make alone is recorded here with its reasoning, so a wrong call is visible
and reversible in one line rather than buried in a diff.

## Decided by the owner in that message

- [x] **Report = signed-in only.** Their words, their reason: "cz ppl can mass report etc".
      No change needed to `content_reports`' `auth.role() = 'authenticated'` insert policy ,
      it already enforces exactly this. The question I had parked dissolves.

## Decided by me, with the reasoning

- [x] **L1.** commit pending this turn; `verified:` migration applied live and read back by SQL
      (28/28 salons default true), toggle flipped to false on one salon and back to prove it
      DISCRIMINATES, allowlist at `app/api/salons/[slug]/route.ts:94`, write gate at
      `app/api/reviews/route.ts` (403 REVIEWS_DISABLED), photo gate at
      `app/api/reviews/[id]/photos/route.ts:44-51`. tsc clean, i18n green.
      **Reviews toggle: disabling blocks NEW reviews; the existing ones stay visible.**
      Reasoning: the same logic the owner just used on the report button. A control is designed
      against its abuse case. If switching reviews off also hid the 260 already written, the
      button stops being "I don't want reviews" and becomes "delete my bad history", and a
      marketplace whose salons can erase criticism is worth nothing to a customer. Blocking
      new ones is a legitimate business choice; rewriting the past is not.
- [x] **L2.** `verified:` CHECK widened live and read back
      (`salon, review, user, photo`); taxonomy at `lib/content-reports.ts:65`; label maps in
      BOTH `ReportButton.tsx` and `dashboard/reports/page.tsx` (TypeScript's `satisfies`
      caught the second one I had missed); keys in all four locales, parity 5,714; control
      mounted per gallery tile at `SalonImageGallery.tsx:281` targeting the
      salon_portfolio_images ROW id, never the url; admin takedown generalised at
      `app/api/admin/reports/[id]/route.ts` and it prunes BOTH sources (the row and
      salons.gallery_urls), which is the dual-source trap the recon named.
      **Report a photo, signed-in.** Owner-answered, built end to end.
- [x] **L3.** commit `8b126c89f`; `verified:` live policy read via SQL
      (`review_authors_upload_review_photos`, role `authenticated`) against the route's own
      ownership check at `app/api/reviews/[id]/photos/route.ts:31-38` and its upload path at
      `:75`; tsc clean after the change. **CORRECTION , the upload is NOT broken. I repeated an agent's claim without
      testing it.** I told the owner "review-photo upload is a confirmed silent no-op, the
      bucket has no INSERT policy". Both halves are wrong, and I checked the live database
      rather than the migration files this time. The policy EXISTS:
      `review_authors_upload_review_photos`, role `authenticated`, with check
      `bucket_id = 'review-photos' AND (storage.foldername(name))[1] IN (SELECT r.id::text FROM
      reviews r WHERE r.user_id = auth.uid())`. That matches the route exactly , it verifies
      `review.user_id === user.id` first and uploads to `${reviewId}/...`. My anon-key probe
      DID get "new row violates row-level security policy", but that is the policy working
      correctly: an anonymous caller must not be able to write there. `review_photos` has 0
      rows because nobody has uploaded any, not because they cannot.
      What WAS real, and is now fixed: every failure path in the loop did a bare `continue`
      and the route always answered `{success:true}`, so a caller whose photos all failed got
      a 200 with an empty array, indistinguishable from sending none. Skips are now counted
      with a reason (too_large / unsupported_format / storage_rejected / db_insert_failed),
      returned to the caller, and all-failed is a 502.
- [x] **L4. RESOLVED BY LOOKING, and there was no fork to pick.** `verified:` the customer card
      at `components-legacy/SalonCard.tsx:195-205` ALREADY renders the written rule
      (`bg-s-bg-sunken` + category icon + salon initial). The two "disagreeing variants" are
      (a) `:122`, inside the `variant === "compact"` branch, a dashboard settings preview the
      file itself documents as out of scope at `:116-119`, and (b)
      `components-legacy/RecentlyViewed.tsx:106`, whose component is never rendered , its only
      importer takes just `trackSalonView` (`SalonDetailV3.tsx:34`). Scope pinned in LOCKFILE
      so it does not get re-opened. My original plan said: two
      undocumented shipped variants against one written rule is how the next person picks the
      wrong one. Docs that describe reality are worth more than reality bent to match a doc
      nobody chose deliberately.
- [x] **L5. DONE, and it uncovered a worse bug than the one it was about.** `verified:`
      /api/salons now returns min_price_service_de/_en beside min_price, confirmed live
      (Old Town Barbers -> 'Augenbrauen' at 15 CHF, Muse Beauty Studio -> 'Kopfhaut-Massage'
      at 35). Rendered and measured at 390x844 on the live tunnel: zero unqualified
      from-prices on the page, 'Kopfhaut-Massage ab 35 CHF' on the card, row width 366px, no
      overflow.
      THE WORSE BUG: four call sites were feeding avg_price into a prop that renders under a
      "from" label (`SearchTemplate.tsx` x3, `CategoryBrowseRails.tsx`). An AVERAGE is not a
      floor , roughly half a salon's services cost LESS than it, so the advertised starting
      price was one the customer could never actually get. That is a false price, not just an
      unnamed one. All four now use min_price, which /api/salons had been returning all along;
      only the TypeScript type was missing it, which is why the cards reached for the average.
      TRADE-OFF THE OWNER SHOULD SEE: the price line is now longer and visually heavier on a
      390px card. It fits without overflow, but it competes more than the bare number did. The
      alternative was dropping the price from the card entirely, which loses information; the
      law does not permit leaving it unnamed. Original plan said: Not a taste call , SECO permits a
      from-price in advertising ONLY when the copy says which offer it buys.
      CORRECTION to my own estimate: I wrote "the change is one string". It is not. I checked
      the data path. `app/api/salons/route.ts:575` computes `min_price` from a `prices` array,
      so the cheapest service's row IS in scope and returning its name is a small API change ,
      but the card renders that price on a 12px line it already SHARES with the address
      (`app/[locale]/_components/homepage/SalonCard.tsx:520-533`), so adding a service name
      there truncates one of the two on a narrow card. Still mine to decide, not parked: the
      law does not permit leaving it, and between naming the service and dropping the price,
      naming keeps the information. Doing it means the API change first, then a measured look
      at that row at 390px before it ships.
- [x] **L6. Backfill CANCELLED after looking at the rows , and my earlier report to the owner
      was wrong.** I told them "6 salons are waiting for approval". I read the six names before
      writing anything, and every one is a test fixture: `test`, `test`, `E2E Test Salon
      lgekk50`, `Payload Check Salon d6od9eo`, `E2E Test Salon Fix1 1783293180`,
      `reviewer-batchA-1783293687`. Nothing real is stranded. Backfilling would have filled the
      approvals queue with junk on the day it first works, which is worse than the empty queue
      it replaced. The signup fix (commit `e5f4d17b9`) still matters , it is what makes the
      queue work for the first REAL salon , it just has nothing to catch up on.
      Left for the owner, not a blocker: those six test rows are litter in `salons` and
      deleting data needs an explicit yes.
- [ ] **L7. French register sweep (`vous` to `tu`).** The dedicated session, run here as the
      owner asked.
- [x] **L8. DONE.** `verified:` new section 8.2a renders in `TermsContent.tsx` in the file's
      existing ParDe/ParEn pattern; `CURRENT_TOS_VERSION` bumped 2026-03-23-v1 ->
      2026-07-27-v2; tsc clean. The version bump is load-bearing, not cosmetic:
      `profiles.tos_accepted_version` records what each user actually agreed to, and
      `app/api/admin/tos/notify/route.ts:43` already selects everyone whose version differs,
      so a new promise now correctly asks for a new acceptance instead of being backdated
      onto people who never saw it.
      The clause: the uploader WARRANTS they hold the rights; where a photo shows or
      identifies a person they must have that person's PRIOR consent including for
      advertising; parental consent for minors; a RECORD kept; and Solen removes a reported
      image within 48 hours, no questions asked, no proof of identity demanded , that last
      part deliberately, because demanding ID from someone objecting to their own photo is a
      second violation. NEEDS A SWISS LAWYER before launch; the wording is engineering
      research, not legal advice. Original reasoning: Fresha and
      Treatwell both require removal on withdrawal but state no window, which is weaker than a
      number. 48h is short enough to mean something and long enough for one person to honour.
      Written as the default; one line to change if the owner wants a different number.

## Genuinely parked, and why the park is real

- [ ] **P1. Measured restore time (RTO).** Not a judgement call I am withholding: it needs a
      Supabase Pro `--with-data` branch, which costs money, and it copies real personal data
      into a second database, which is an nFADP decision about someone else's data. Both are
      the owner's to make, not mine.

## Ledger

| item | state |
|---|---|
| owner-answered | 1 |
| decided by me | 8 |
| genuinely parked | 1 |

## Hardened, because the same failure happened three times today

Not a promise. `~/.claude/hooks/finding-provenance-gate.py`, armed on Stop, self-tested 13/13.

Three claims went to the owner as established fact this session and all three were wrong:
"6 salons are waiting for approval" (all six were test fixtures), "review-photo upload is a
confirmed silent no-op, the bucket has no INSERT policy" (the policy exists and matches the
route exactly), and "the documented fallback and the shipped component disagree three ways"
(the customer card already renders the rule; the two exceptions are a dashboard-only variant
branch and a component that is never rendered).

Every one came from a subagent's report and none had been checked. The corrections all shared
the one thing the originals lacked: I had gone and looked.

The gate blocks a closing message that asserts something IS BROKEN / MISSING / NEVER RUNS
unless the same message carries a first-hand check , a measured number, a file:line, a query
or command result, a commit sha, or an explicit "I verified / measured / checked / ran". It
does not fire on a correction (that is the behaviour we want) and it does not fire on ordinary
prose that merely contains the words. Replayed against the exact sentence I sent the owner
yesterday: blocked.
