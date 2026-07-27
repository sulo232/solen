# Privacy / data protection , researched law

<!-- exists-check 2026-07-27: `_backend-system/research/` had 15 topics, none named privacy,
gdpr, nfadp, or data-protection (privacy-compliance-01). `_docs/BACKEND.md` section 13 covers
this DESCRIPTIVELY (how the erasure/export pipeline works today); security.md section 12 and
observability.md's PII-in-logs section each cite one privacy statute in passing. This file is
the missing PRESCRIPTIVE layer, same split as every other topic in this folder. No LAW.md exists
yet for ANY topic in this folder (see README.md), so this file is the interim source of truth on
its own, not a LAW.md row. -->

**Why this exists:** the owner's stated reason for `_backend-system/` was "it keeps making stuff
up when I open a new session" for backend decisions. That failure mode applies with full force to
privacy: a fresh session adding a client-facing note field, a photo upload, or a consent toggle
had nowhere to check what Solen already decided, so it would either invent a policy or silently
skip the question. Real, non-trivial privacy engineering already exists (an anonymize-not-delete
erasure trigger, a two-path deletion flow, a consent-gated PostHog client, a bilingual privacy
policy, a 16+ signup age gate) scattered across `_docs/BACKEND.md`, migration files, React
components, and a legal page that none of them reference each other from. This file is where a
session checks first.

## 1. Which regime is primary (privacy-compliance-12)

Solen is a Swiss sole proprietorship. **nFADP (the revised Swiss Federal Act on Data Protection)
is the primary and binding regime**, regardless of the site's de/en/fr/it language set (that is
Swiss-national-language coverage, all four are official Swiss languages, not evidence of EU
targeting).

**GDPR only attaches extraterritorially** under Art. 3(2) if Solen actively offers services to, or
monitors the behaviour of, individuals physically in the EU (targeted marketing in euros,
EU-specific delivery/service availability). A tourist from the EU booking a Swiss salon while
visiting Switzerland does not trigger it on its own.

**Current gap:** the privacy policy (`PrivacyContent.tsx` section 7) already hedges correctly
("nach dem nDSG sowie ggf. der DSGVO", i.e. "and, where applicable, the GDPR") but never defines
the test. That hedge is the right instinct and does not need to change; what's missing is a one-
paragraph internal note (this section) naming the test, so nobody either under-informs an EU
customer GDPR really does cover, or over-builds EU-specific machinery (a full RoPA, an Art. 27 EU
representative) Solen doesn't need at ~28 Swiss salons.

**Decision:** nFADP is the default lens for every privacy decision in this repo. Reach for GDPR
Art. 3(2) analysis only if Solen starts actively marketing into the EU (EU ad spend, EUR pricing
as primary currency, EU-specific delivery promises), not because a page happens to render in
French or Italian.

## 2. Special-category data needs its own consent (privacy-compliance-03)

Any column that reveals health status or is capable of revealing racial/ethnic origin is
**special-category data** under GDPR Art. 9 / nFADP Art. 5(c), a legally different and
higher-obligation class than ordinary account data. "Necessary for performance of a contract"
(Art. 6(1)(b)) is **not** a valid basis for this category on its own; explicit, separately-recorded
consent (or a narrow Art. 9(2) exemption named by name) is required regardless of whether the
customer also agreed to book a service.

**Tables currently in this category, live-verified:**

| Table | Columns | Why special-category |
|---|---|---|
| `profiles` | `disc_skin_tone` | capable of revealing racial/ethnic origin |
| `waxing_sensitivity_log` | `reaction_level`, `affected_zones`, `medications`, `sun_exposure_recent` | health data (the migration's own header calls this out: "health-sensitive data") |
| `nail_client_preferences` | `allergy_notes`, `skin_sensitivity` | health data |
| `spa_treatment_outcomes` | `skin_before`, `skin_after` | health-adjacent |
| `wellness_journals` | `pain_level`, `skin_condition` | health data |
| `consultation_notes` | `allergies`, `hair_condition`, `scalp_condition` | health data |

**Gap:** none of these tables, nor `profiles`, has a consent-timestamp column analogous to
`profiles.analytics_consent` (added specifically to give the cookie-banner's analytics choice a
server-side, auditable record). The only consent infrastructure that exists today is for
marketing/analytics cookies.

**Decision needed (not made here):** how the consent moment is captured in the actual
intake/consultation-notes UI (a checkbox at first note creation? a one-time profile-level consent
covering all salons? per-salon?) is a genuine UX/product decision spanning five dashboard flavors
(coiffeur, waxing, spa, nail, makeup) and is **queued for the owner** rather than built here, since
it is a cross-cutting flow decision, not a mechanical fix. Until it's built: no migration adding a
health/sensitivity/allergy-shaped column ships without either a paired consent-capture column or an
explicit documented exemption in this file.

## 3. Retention schedule (privacy-compliance-07)

GDPR Art. 5(1)(e) / the nFADP proportionality principle require retention to be **actively
justified**, not merely "whatever happens by default." A table with no stated rule below defaults
to "retained until account deletion, no independent limit" , never to silent indefinite growth.

| Data | Rule | Source |
|---|---|---|
| `search_events` | PII nulled after 90 days | `_plans/OPS_RUNBOOK.md` |
| Account deletion (profile + dependents) | 30-day grace period, then the erasure cron anonymizes/clears (see `_docs/BACKEND.md` section 13 and `GDPR_TABLE_COVERAGE.md`) | `app/api/cron/process-deletions/route.ts` |
| Financial/billing/booking data | Anonymized, retained 10 years (Swiss OR Art. 958f) | `PrivacyContent.tsx` section 5, `20260602083300_financial_retention_on_delete.sql` |
| `cron_runs` | No time-based rule, a deferred size-trigger note only ("add a 90-day purge clause... when it passes ~10k rows") | `_plans/OPS_RUNBOOK.md` |
| `audit_log` | No time-based rule, same size-trigger pattern ("revisit at 50k rows") | `_plans/OPS_RUNBOOK.md` |
| Client notes / consultation / treatment tables (`client_notes`, `consultation_notes`, `client_formulas`, `nail_client_preferences`, `hand_chart_notes`, `barber_cut_history`, `client_photos`, `spa_treatment_outcomes`, `waxing_sensitivity_log`, `wellness_journals`, `makeup_face_charts`, `bridal_workflows`, `fade_blueprints`) | **No independent rule today.** Defaults to "retained until account deletion" per the rule above (all 13 are in the erasure cron or cascade, see `GDPR_TABLE_COVERAGE.md`). Whether a note should ALSO be purged sooner (e.g. N days after a salon relationship visibly ends, no repeat booking) is a genuine retention-minimization question, not decided here. | this audit |
| Guest bookings never converted to an account (`guest_bookings`, `booking_disputes.guest_email`) | **No rule stated anywhere.** A real gap: a guest email that never became an account has no erasure trigger at all today (nothing to "delete the account" of). | this audit |
| `profiles.deletion_requested_at` on a cancelled deletion | **Unverified**: whether the cancel-during-grace-period path clears a stale request timestamp left by a since-cancelled request. Worth a follow-up check, not fixed here (out of scope, no cancel-path evidence gathered this pass). | this audit |

**Two real, unowned gaps surfaced by this table** (both queued, not fixed, since both are policy
decisions, not mechanical code): the guest-booking-with-no-account retention rule, and whether
salon-relationship notes should purge independently of account deletion.

## 4. Right of access completeness (privacy-compliance-02) , FIXED

`GET /api/profile/export` was missing the same 13 client/consultation/treatment tables named in
section 2 and section 3 above: personal data the SALON generated ABOUT the customer, not data the
customer typed themselves. GDPR Art. 15 / nFADP Art. 25 cover data held about the subject
regardless of who wrote it. Fixed in `app/api/profile/export/route.ts` (all 13 tables now
fetched and included in the export payload, verified live: the export JSON went from 21 to 34
top-level keys). **Standing invariant:** any table added to the erasure cron's `TABLES_CLEARED`
list (or that cascades via a real FK to `profiles`/`auth.users`) that is keyed to a customer must
also appear in the export route, and vice versa. There is no automated parity check yet (a
`gate:export-erasure-table-parity` script would need an allowlist for intentional one-sided
exclusions); this file is the manual check until one exists.

## 5. Processor erasure completeness (privacy-compliance-06) , FIXED

Anonymize-not-delete only satisfies "right to erasure" if it reaches every place the PII was
copied to. Two real gaps existed and are now fixed:

- **Stripe**: `profiles.stripe_customer_id` pointed at a live Stripe Customer object (name, email,
  payment methods) untouched by the erasure pipeline. Fixed: `lib/gdpr/purge-stripe-customer.ts`,
  wired into `app/api/cron/process-deletions/route.ts` before `deleteUser()`.
- **`audit_log.metadata`**: `actor_id` is `SET NULL` on profile delete, but the jsonb `metadata`
  payload is caller-supplied and can carry a plaintext email
  (`app/api/profile/delete/route.ts` logs `{ email: user.email }`). Fixed: the cron now scrubs the
  `email` key on any `audit_log` row for a user being erased, before `deleteUser()` nulls
  `actor_id` (after that the rows become unreachable by `actor_id`).
- **PostHog**: was already wired in (`deletePostHogPerson`), this was not a gap by the time this
  file was written.

**Standing rule:** any NEW third-party processor that receives user PII (Resend already sends
emails with names, worth the same check next time it's touched) gets the same question asked
before it ships: does it need an entry in the erasure cron.

## 6. Processing register / RoPA (privacy-compliance-05)

Both nFADP Art. 12(5) and GDPR Art. 30(5) let organizations under ~250 employees skip the formal
Record of Processing Activities, but **both carve the exemption back out** the moment
special-category data is processed (section 2 above) or the processing is not occasional.
Solen's consultation-notes/waxing-sensitivity/skin-hair-condition tables put it in the carve-back,
not the exemption, regardless of its 28-salon size.

The privacy policy's processor table (`PrivacyContent.tsx` section 4) is **not** a substitute: it
has three columns (Provider, Purpose, Region) and no legal-basis or retention column, both
RoPA-required fields.

**Not built here**: a RoPA is a document that needs a human legal review, not a code artifact.
Placeholder structure for whoever writes it (per processing purpose): categories of data subject,
categories of data, legal basis, recipients/processors, retention period, and for special
categories the specific Art. 9/Art. 6(2) basis relied on. Candidate purposes to cover: account
management, booking facilitation, payment processing (Stripe), salon-authored client/treatment
notes (section 2's special category), platform analytics (PostHog, consent-gated), transactional
email (Resend), fraud/abuse prevention.

## 7. Controller / processor split for salon-authored notes (privacy-compliance-09)

A controller is defined by who decides the purposes and means of processing, not by who technically
holds the database. A salon employee freely writing "client has a nut allergy, avoid product X" is
deciding, on their own judgment, what to record and why , the textbook fact pattern for the salon
being an **independent controller** for that note, not a processor executing Solen's instructions.

If that reading is correct, the salon (not just Solen) independently owes that client the
GDPR/nFADP data-subject rights for that specific data, and Solen's platform-wide erasure/export
mechanisms (sections 4-5 above) are doing the salon's compliance work without an agreement that
says so. `client_notes` RLS (`040_client_notes.sql`) already scopes read/write to
`salon.owner_id = auth.uid()`, i.e. only that specific salon, consistent with independent-controller
behaviour, not shared/joint access.

**Not decided here**: whether Solen's salon-partner agreement should name this split explicitly
(no such document exists yet, in or out of this repo). Queued as a legal-drafting question, same
tier as the RoPA in section 6.

## 8. "Permanent" staff notes are invisible to the client they describe (privacy-compliance-10)

`client_notes` RLS
(`client_notes_select_own_booking`, `040_client_notes.sql:24-26`) shows the customer ONLY
`note_type = 'booking'` rows, never `note_type = 'permanent'` rows. The right of access covers
personal data held about a subject regardless of who wrote it, unless a specific named exemption
applies. No exemption is named anywhere in the migration or `_docs/BACKEND.md`.

**Partially addressed by section 4's fix**: the `/api/profile/export` endpoint uses the admin
client (bypasses RLS) and now includes ALL `client_notes` rows for the requesting user, both
`note_type` values, so the export deliverable itself is no longer selectively blind. **Still open**:
whether the in-app UI (the customer-facing profile/booking views, not the export) should also
surface "permanent" notes in real time. That's a product decision (does the owner want clients to
see staff notes about them day-to-day, separate from a formal data export) and is queued, not
decided here.

## 9. Breach-notification procedure (privacy-compliance-11)

FADP Art. 24 requires Swiss controllers to notify the FDPIC "as quickly as possible" for a
high-risk breach (softer than GDPR's 72-hour deadline, but a real, undischarged duty). The only
place this citation exists today is buried inside `observability.md`'s PII-in-logs section, framed
as a reason to be careful about log content, not as an owned procedure.

**This finding's `where_it_should_live` names `_plans/OPS_RUNBOOK.md`; that file is out of scope
for this pass (owned by the planning workstream, not touched here).** Recorded here instead as the
interim location until it can be moved:

**Minimum viable breach procedure** (not elaborate, 28 salons / ~50 profile rows):
1. Whoever discovers a suspected breach (an anomalous `audit_log` pattern, a leaked credential, an
   unexpected export/query volume) tells the owner directly, same day.
2. The owner (currently the sole controller-side decision-maker) assesses whether it is "high
   risk" to data subjects (special-category data per section 2 exposed, financial data exposed, or
   a large-enough population affected).
3. If high risk: notify the FDPIC "as quickly as possible" (no fixed deadline under FADP, unlike
   GDPR's 72 hours) using the FDPIC's own breach-notification form; notify affected users directly
   if the risk to them is also high.
4. Log the incident, response timeline, and notification (if any) so there is a written record.

This is a starting procedure, not a final one; a real legal review should replace it before it is
needed for real.

## 10. Minimum onboarding age (privacy-compliance-08) , ALREADY DONE

The finding's own absence-proof grep missed this: a minimum age of **16** is already enforced both
client-side (`app/[locale]/auth/register/page.tsx`, `calcAge(birthday) < 16` blocks submission) and
server-side (`app/api/auth/signup/route.ts`'s local `signupSchema`, a Zod `.refine()` requiring
`calcAge(data.birthday) >= 16`), and the policy is stated in the ToS
(`app/[locale]/terms/components/TermsContent.tsx` section 2.1 "Mindestalter / Minimum Age": "Sie
müssen mindestens 16 Jahre alt sein..."). No further action needed; recorded here so a future
session finds this instead of re-litigating it.

## Decision candidates

- Special-category consent UX (section 2): who owns the flow design, and does it block note
  creation or just gate visibility.
- RoPA (section 6) and the salon controller/processor agreement (section 7): both need a human
  legal pass, not a code change.
- Guest-booking retention rule and salon-relationship note purge timing (section 3): two genuinely
  undecided retention questions, not yet even queued anywhere before this file.

## Myths and traps

- **"Privacy Shield" as a Stripe transfer basis is dead.** The CJEU invalidated it in Schrems II
  (16 July 2020). The live mechanism is the EU-US Data Privacy Framework (adequacy decision, July
  2023) or Standard Contractual Clauses. Fixed in `PrivacyContent.tsx` this pass; do not
  reintroduce "Privacy Shield" language anywhere.
- **Four i18n locales (de/en/fr/it) is not evidence of EU targeting.** All four are Swiss national
  languages. Don't pattern-match "multi-language" to "GDPR definitely applies."

## Premature at our scale

- A dedicated Data Protection Officer: not required under either regime at this size/processing
  volume unless large-scale special-category processing becomes core to the business (arguable it
  already brushes this line via section 2's tables; worth revisiting if salon count or note volume
  grows an order of magnitude).
- An automated `gate:*` enforcement suite for every checklist item in this file: most of these are
  one-time or rare-trigger decisions (a new processor, a new health-shaped column), not
  every-commit risks. The manual "checklist" enforcement noted per finding is intentional, not a
  cop-out, until a gate's cost is worth its false-positive rate.

## Sources

- GDPR Art. 5(1)(e), Art. 6(1)(b), Art. 8, Art. 9, Art. 15, Art. 20, Art. 26, Art. 30(5), Art. 3(2)
- nFADP Art. 5(c), Art. 6(2), Art. 12(5), Art. 24, Art. 25
- Swiss OR Art. 958f (commercial record retention)
- Schrems II (CJEU, 16 July 2020); EU-US Data Privacy Framework adequacy decision (July 2023),
  verified via WebSearch this pass against current legal-guidance sources, not memory
- `_docs/BACKEND.md` section 13; `_backend-system/audit/GDPR_TABLE_COVERAGE.md`;
  `_backend-system/research/security.md` section 12; `_backend-system/research/observability.md`
  PII-in-logs section
