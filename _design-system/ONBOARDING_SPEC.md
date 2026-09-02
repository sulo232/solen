# Onboarding + Publish-Checklist SPEC (two-tier)

Source: throttled 9-Opus deep-think + 3 critics + synthesis, grounded in live DB (2026-06-13). Companion to DASHBOARD_REBUILD_BRIEF.md + DASHBOARD_REBUILD_DECISIONS.md. Owner model: minimal FORCED onboarding (Tier A) -> dashboard -> Stripe-style PUBLISH CHECKLIST (Tier B) -> Submit for review -> PATH B admin approval -> listed.

## TIER A , NECESSARY ONBOARDING (forced, gates dashboard entry)

═══════════════════════════════════════════════════════════════
TIER A — NECESSARY ONBOARDING (the FORCED path; finish-first, then dashboard unlocks)
═══════════════════════════════════════════════════════════════

PRINCIPLE (first principles): Tier A is the SHORTEST forced path that makes (1) a salon ROW exist, (2) the category dashboard renderable (not empty/broken), (3) the owner able to operate internally (take a manual booking, see their home). The curated/strict bar is NOT enforced here — it bites at SUBMIT-FOR-REVIEW (Tier B). Forcing Stripe KYB / photos / full team before the dashboard even opens is the #1 abandonment risk for a Swiss salon owner evaluating the product, and none of it is needed to render the operate-home. So Tier A = exactly 4 forced steps + 1 skippable seed.

RECONCILING THE LOCKED "finish everything first, THEN dashboard unlocks" WITH THE TWO-TIER MODEL:
"Finish everything" refers to the Tier-A forced steps unlocking the dashboard, NOT the publish checklist. The publish checklist is completed INSIDE the unlocked dashboard, before Submit-for-review. These two gates MUST be visually distinct so an owner is never blocked from their own dashboard by Stripe. (Resolves the brief-vs-DECISIONS framing tension 3 critics flagged: keep finish-first for the ROW-creating gate items only; demote Team / Schedule / category-capacity / Stripe / photos to post-unlock.)

────────────── STEP 1 — IDENTITY & LOCATION (all forced) ──────────────
Goal: the salon row. Without categories there is no dashboard shape; without lat/lng the DB insert literally cannot run (both NOT NULL).
• name (min 2) — prefill from auth user_metadata.salon_name, else empty
• categories[] (multi-select, min 1) — none preselected (force a deliberate pick). categories[0] = PRIMARY, drives accent + the adaptive Step 4. Exactly 4 options: coiffeur / barbershop / nails / spa (label "Spa / Massage")
• city — none; live cities = ONLY basel/zuerich/bern (3 rows), identical to today's hardcode. FIX: read the cities table (drops the hardcode, future-proof) but it surfaces no new choice until rows are seeded
• address via AddressAutocomplete (CH-restricted) — captures latitude + longitude (REQUIRED) + postal_code + (google_place_id, see open decision). FIX: extract postal_code from place.address_components (NOT captured today); re-geocode on every later address edit; if no geocode (key missing / manual entry), BLOCK submit with a map-pin fallback rather than silently writing the 47.5596/7.5886 Basel-center default
• phone — empty, REQUIRED. CRITICAL BUG: the input is in BasicsData state and is submitted (page.tsx:502) but NO field renders, so it always submits "". ADD the input
• TOS accepted (checkbox) — unchecked, REQUIRED. FIX: server schema is z.literal(true).optional() — make required server-side. Writes profiles.tos_accepted_version + tos_accepted_at
• owner email — prefilled from session, read-only. Used for welcome email + profile; there is NO salons email column (don't promise one)

────────────── STEP 2 — OPENING HOURS (forced) ──────────────
Goal: the operate-home in/out-of-hours lane + slot generation + "open now" have something to switch on.
• opening_hours (JSONB, SHORT-day keys mon..sun, the existing HoursEditor — REUSE, do not rebuild) — DEFAULT Mon-Fri 09:00-18:00, Sat 09:00-16:00, Sun closed (verbatim from OpeningHoursStep.tsx). Category-neutral. Per-day open/closed toggle already in the editor; hasAnyOpen guard already blocks all-closed
• timezone — set silently to Europe/Zurich at create, never shown (Swiss-only)

────────────── STEP 3 — FIRST SERVICE (≥1 active, forced) ──────────────
Goal: something bookable; the category home metric (infill-due / colour-cycle) needs a service to compute against. AI-suggest + templates make this near-zero-typing.
• name_de — AI-suggested via /api/services/suggest (category-shaped by categories[0]); template tap also fills it
• category — auto-defaults to categories[0]; select scoped to the salon's own categories[] (the only real per-service category decision, and only for multi-cat salons)
• duration_minutes — default 60 (category: barber 30, nails 45-60, spa 60-90, coiffeur 45-60)
• price (CHF) — empty, owner must set (category hint: barber ~40, coiffeur ~85, nails ~40-55, spa ~90-110)
• is_active — true on create (the >=1 active service IS the gate). name_en auto-filled = name_de server-side
Allow adding several before continuing; one active service satisfies the step.

────────────── STEP 4 — CATEGORY-ADAPTIVE SEED (forced-but-SKIPPABLE) ──────────────
Goal: seed ONE sensible capacity default per category so slot generation + parallel booking work and the category home isn't empty. Shown, one tap to accept, skippable. NOT a hard gate. Keyed by categories[0] (multi-cat: one config block per selected category, each independently skippable).
• coiffeur — no capacity entity; offer "start using consultation notes" affordance (UI only, no column). Nothing forced
• barbershop — barber_chairs.chair_count (default 1) + buffer_minutes (default 5)
• nails — nail_stations.station_count (default 4) + has_uv_lamps (true) + uv_lamp_count (4) + sterilization_buffer_minutes (10)
• spa — auto-create 1 room {name:"Behandlungsraum 1", room_type:"treatment", capacity:1, prep_buffer:15, cooldown_buffer:10} so slots can generate
If skipped: the category home renders <EmptyState> + a "finish setup" CTA, NEVER a broken/blank screen (today nail-clients renders null — must guard).

THAT IS THE ENTIRE FORCED SET (4 steps, ~6 input fields + hours + 1 service). After Tier A: the salon row exists with is_active=false, the dashboard unlocks in a "not yet submitted" state, and the owner is greeted by the Tier-B Publish Checklist.

WHY THIS IS THE RIGHT CUT (first principles): the only thing that GATES a salon EXISTING is the row + a bookable service + hours (Tier A). The only thing that GATES PUBLIC VISIBILITY is the curated bar (Tier B). Putting the curated bar at entry would (a) abandon owners at the hardest step (Stripe redirect / KYB) before they see value, and (b) leave the admin approval queue empty — exactly the live bug today.

## TIER B , PUBLISH CHECKLIST (Stripe-style, gates listing)

═══════════════════════════════════════════════════════════════
TIER B — PUBLISH CHECKLIST (Stripe-style, in the unlocked dashboard) → Submit for review → PATH B admin approval → listed
═══════════════════════════════════════════════════════════════

PLACEMENT: dashboard HOME, ABOVE the category hero, BELOW the universal status strip — ONLY while not-yet-LIVE. The single most important card on the home until listed. Replaces the broken SetupBanner.tsx. Once LIVE it collapses to a thin one-line "Live" confirmation, then auto-dismisses.

PANEL ANATOMY (top→bottom): (1) HEADER CARD = "Publish checklist" label + Hide control; a state-driven headline ("Almost ready to publish" / "Submitted for review" / "Changes requested"); a one-line subhead ("2 of 5 steps left. Finish them, then submit for review."); a thin progress bar with SUCCESS-GREEN #16A34A fill on a bg-sunken track (green = completion meter; NOT blue — blue is hyperlink-only per LOCKFILE; NOT the current bg-s-coral which is off-LOCKFILE drift) + a mono "4 / 5 done · 80%" caption. (2) ITEM ROWS. (3) OPTIONAL items in a dimmed sub-group. (4) the SUBMIT-FOR-REVIEW commit button (the ONE ink CTA on the screen).

PER-ROW ANATOMY (Stripe-style): LEFT = 22px status disc. MIDDLE = title (14/500) + a 12px subtitle showing the CONCRETE current value, never a generic restatement ("3 active services", "Verification in progress at Stripe", "Cover photo or 1 gallery image"). RIGHT = a status word/pill, then a chevron-right (INK, navigation affordance) OR an inline "Add →" link (small clickable bit → may be s-accent blue). The WHOLE row is the click target → deep-links to the exact editor (reuse SetupWizard goTo / ?step= anchor). No dead rows.

THE 5 PER-ROW STATES (each with its visual):
1. TODO — disc = dashed hairline ring, empty; subtitle = what's needed; right = "Add →" (blue); row border = #E4E4E7
2. IN-PROGRESS — disc = pale-info bg + loader; right = pale-blue "In progress" chip; row border = 2px info (the LOCKFILE "featured" 2px exception). Used for Stripe (account created, charges_enabled still false — read GET /api/stripe/connect/status) + panel-level PENDING_REVIEW
3. DONE — disc = solid green #16A34A + white check (normal green, NOT deep #15803D); right = muted "Done"; subtitle shows the saved value
4. ATTENTION (per-item changes-requested) — disc = pale-red + alert icon; right = red "Fix" pill; subtitle = the admin note mapped to this item if rejection_reason references it, else "Needs attention"; red hairline
5. OPTIONAL/LATER — dimmed (~0.7 opacity), dashed circle, "Optional" pill, right = muted "Later". NEVER block the gate

────────── REQUIRED ITEMS (block Submit; the curated bar) ──────────
B1. Profile & location — name + about_text_de (CANONICAL; fallback description_de; stop double-writing) + phone. REQUIRED. Without about_text the PDP "Über uns" section + nav tab vanish (SalonAbout returns null)
B2. Opening hours — opening_hours has ≥1 non-null day (pre-satisfied from Tier-A Step 2; shows checked). REQUIRED
B3. Services — ≥1 services.is_active=true (pre-satisfied; shows checked). REQUIRED. Counts ACTIVE only
B4. Photos — cover_photo_url OR ≥1 gallery_urls image. REQUIRED. WIDEN today's cover-only go-live check to "cover OR gallery". Curated-bar uplift: nudge ≥3 total hero photos so the PDP renders the Fresha 1-large+2-small grid (0 = grey monogram, 1 = lone full-width, 3+ = complete-looking)
B5. Payments (Stripe) — stripe_account_id non-null AND charges_enabled true (gate on REAL Stripe readiness, not the loose has_stripe). Tri-state item: Not connected → Pending Stripe → Verified. account.updated webhook flips accepts_online_payment. FIX: on Stripe redirect return, re-poll GET /api/stripe/connect/status and resume at B5

PROGRESS % = required-done / required-total (optional EXCLUDED from denominator, so 100% = submittable).

────────── CATEGORY-ADAPTIVE CHECKLIST ITEMS (deferrable; pre-seed the category home; not hard gates) ──────────
Each shows per-item status + an arrow into the category dashboard tab, with the category accent (coiffeur teal #14B8A6, barber azure #4A8BE9, nails pink #EC4899, spa green #16A34A).
• COIFFEUR — ≥1 colour service has reminder_cycle_days via 28/42/56-day chips (ColourCycleConfig). Pre-seeds coiffeur home #1 hero (colour-cycle-overdue). Plus "start using consultation notes" (wire AllergyAlert — passed null today)
• BARBER — confirm chair_count + buffer_minutes; Walk-in setup: walkin_enabled [OFF] + walkin_mode (pay_at_counter | pay_first, those two literals ONLY) + walkin_paused. BLOCKER FIX: these 3 keys are NOT in the salons PATCH whitelist (confirmed: zero walkin keys in the L122 allowlist) → add them, else walk-in is raw-DB-only and the barber product is unreachable self-serve
• NAILS — station_count + has_uv_lamps + uv_lamp_count + sterilization_buffer_minutes (nail_stations; StationManager already reads nail_stations correctly — the "nail_station_config mismatch" note is STALE); infill cadence via reminder_cycle_days (free numeric). Pre-seeds nail home #1 hero (infills-due). Retail = presence of ≥1 nail_retail_products row (no boolean column)
• SPA — treatment rooms (name, room_type treatment|sauna|pool|steam, capacity, prep/cooldown, equipment[]) via RoomManager; enable/seed spa_consultation intake template (wire ContraindicationAlert — passed null today). Treatment OUTCOMES tab MUST be hidden (spa_treatment_outcomes table missing → 500s)

────────── OPTIONAL / LATER (Optional rows or Settings; never block Submit) ──────────
Team invites (solo skip), staff schedule auto-apply, deposit/no-show/cancellation policy, VAT, payment_mode beyond default, KYB document upload (salon_documents — label clearly Optional for launch, don't gate, don't upload into a void), amenities editor, social links, booking_confirmation_mode, auto_assign_method, daily_limit, vacation, off-peak, SMS reminders (mark "coming soon" — no provider wired).

────────── THE SUBMIT-FOR-REVIEW GATE (PATH B) ──────────
Button states: (i) DISABLED while any required item TODO/ATTENTION → opacity-50, cursor-not-allowed, label "Submit for review · N steps left". (ii) ENABLED when all required done → ink fill (the one commit CTA). (iii) On click → optimistic → re-validate SERVER-side + re-poll Stripe (it can regress between load and submit) → POST /api/salon/go-live writing registration_completed=true (NOT is_active). SuccessMark/confetti fires HERE (the real submitted moment). (iv) During request → spinner, disabled.

────────── PANEL-LEVEL LIFECYCLE STATES (build — currently no owner UI) ──────────
DRAFT/READY → full checklist. PENDING_REVIEW → calm info card "Submitted for review" + a REAL agreed review window (NO fabricated countdown) + read-only summary + "Edit listing" (editing while pending allowed, does NOT auto-resubmit). LIVE (is_active=true) → "You're live" + "View your page →" (suppress if is_test=true), auto-dismiss + localStorage flag. CHANGES_REQUESTED (is_active=false AND rejection_reason set AND approved_at null) → pale-red card showing VERBATIM rejection_reason (stored today, shown NOWHERE — the gap), re-expand checklist, Submit relabels "Resubmit for review". FROZEN (frozen_at set, post-live) → heavy red "Your salon is paused" + frozen_reason verbatim + "Contact support" (freeze cancels+refunds bookings — confirmed — heavier than rejection; persists even after a prior LIVE dismiss).

Source of truth = DB columns (registration_completed / is_active / approved_at / rejection_reason / frozen_at) read live via setup-progress + go-live + Stripe-status. No cached snapshot (avoids the schema-drift trap). Only client-persisted bit = the post-LIVE "dismissed" flag.

## FULL FIELD INVENTORY

FULL FIELD INVENTORY — [TIER] field · default · category-varies?

══ STEP 1 IDENTITY & LOCATION ══
[A] name · prefill user_metadata.salon_name else "" · no
[A] categories[] (multi, min1) · [] none preselected; categories[0]=primary · YES (the one category-driving field)
[A] city (→city_id) · none; live = basel/zuerich/bern only · no
[A] address (AddressAutocomplete) · none · no
[A] latitude / longitude · from geocode (NOT NULL; never silently 47.5596/7.5886) · no
[A] postal_code · auto-extract from place.address_components (BUG: not captured today) · no
[A] phone · "" REQUIRED (BUG: no input rendered, always submits "") · no
[A] tos_accepted · false, required (BUG: server .optional()) · no
[A] owner email · session email, read-only (no salons column) · no
[Optional] quartier · drop hardcoded "grossbasel"; derive or null (column IS nullable now) · no
[Open] google_place_id · captured but NO column (commented out of insert) — add or drop · no

══ STEP 2 OPENING HOURS ══
[A] opening_hours (JSONB mon..sun) · Mon-Fri 09-18 / Sat 09-16 / Sun closed · no
[A] timezone · Europe/Zurich, silent · no
[Optional] vacation_start/end · none (Settings) · no
[Optional] one break/day (break_start/break_end) · none · no
[Optional] booking horizon · NEW COLUMN (today hardcoded 60d) · YES (coiffeur/nails 60, barber 30, spa 90)
[Optional] min lead time · NEW COLUMN (today only reschedule 24h) · YES (barber 0, spa 24h, default 2h)
[Optional] slot granularity · NEW COLUMN + regen (today baked 30) · YES (barber 15, nails/coiffeur 30, spa 60)
[Optional] between-appt buffer · NEW salon-level col (only barber_chairs.buffer exists) · YES (spa 15, else 0)

══ STEP 3 FIRST SERVICE ══
[A] name_de · AI-suggest by categories[0] · YES (suggestion shape)
[A] category · categories[0] · YES
[A] duration_minutes · 60 · YES (barber 30/nails 45/spa 60-90)
[A] price · empty · YES
[A] is_active · true · no
[B] description_de · null · no
[B] ≥1 photo (photo_urls[]) · [] (only persists on EDIT — needs service id) · no
[B] buffer/processing/finishing_minutes · 0/0/0 · YES (spa/coiffeur use processing)
[B] suitable_for (age) / suitable_gender · {adult} / {male,female,non_binary} · no
[B] staff-who-perform (staff_services) · none · no
[Optional] name_en/description_en · null (name_en falls back to name_de) · no
[Optional] subcategory, daily_limit_per_staff · null/null · no
[Optional] service_options (variants) / service_addons · tables exist, NO editor · no
[Edge] FR/IT name+description = IMPOSSIBLE (no columns; type declares them — drift) · no

══ STEP 4 CATEGORY-ADAPTIVE (capacity) ══
[A-skippable] barber_chairs.chair_count · 1 · barber only
[A-skippable] barber_chairs.buffer_minutes · 5 · barber only
[A-skippable] nail_stations.station_count · 4 · nails only
[A-skippable] nail_stations.has_uv_lamps / uv_lamp_count / sterilization_buffer · true/4/10 · nails only
[A-skippable] spa_treatment_rooms (1 room) · capacity1/prep15/cooldown10 · spa only
[B] coiffeur reminder_cycle_days · null (chips 28/42/56) · coiffeur only
[B] nails infill reminder_cycle_days · null (free numeric) · nails only
[B] spa intake template enable · off · spa only
[B] barber walkin_enabled/walkin_mode/walkin_paused · false/pay_at_counter/false (NOT in PATCH whitelist — FIX) · barber only
[Optional] nail retail (nail_retail_products presence) / nail_dynamic_pricing_rules · none · nails only

══ TIER B PROFILE & PHOTOS ══
[B] cover_photo_url · null · no
[B] gallery_urls[] · [] (≥2 more → Fresha grid) · no (content varies, not field)
[B] about_text_de (canonical) · null · no
[Optional] about_text_en/fr/it · null (auto-translate) · no
[Optional] instagram_url / website_url · null (rendered on PDP) · no
[Optional] tiktok_url · null (collected, SalonContact NEVER renders — render or drop) · no
[Optional] facebook_url · null (column exists, rendered NOWHERE — drop or wire) · no
[Optional] per-salon logo · NO column, no render site (net-new) · no
[Optional] is_top_pick/is_featured · admin/editorial, not owner · no

══ TIER B PAYMENTS & POLICY ══
[B-required] stripe_account_id + charges_enabled · not_connected · no
[Optional] payment_mode (at_salon|deposit|prepay) · at_salon (PaymentsStep BUG: renders prepay-only) · YES (barber→at_salon, spa→deposit lean)
[Optional] deposit_percent (clamp min5/max100) · 20 · no
[Optional] booking_confirmation_mode · instant · YES (spa/coiffeur→manual_approval lean)
[Optional] cancellation_fee_type/value · free/0 · no
[Optional] free_cancel_hours (THE canonical window) · 24 · no
[Optional] no_show_fee_type/value · null/0 · YES (barber/spa emphasis)
[Optional] no_show_deposit_amount · 20 · no
[Optional] vat_registered/vat_number · false/null (vat_rate 8.1 read-only) · no
[DROP] cancellation_hours, cancellation_window_hours, late_cancel_fee_percent · dead/duplicate, no clean writer · no

══ TIER B TEAM & SCHEDULE ══
[Optional] staff invite (email + name) · none (solo skip; BUG: completion needs is_active=true — never blocks) · no
[Optional] per-staff permissions · all on (BUG: object-vs-array shape mismatch → schedule-edit 403s; standardize first) · no
[Optional] commission_rate · 0 · no
[Optional] staff_services price_override/tier_label · none (POST doesn't write them yet) · YES (barber/coiffeur tiers)
[Optional] auto_assign_method · manual · no (only >1 staff)
[Optional] schedule auto-apply · BUG: long-vs-short day-key → 0 rows; 0-staff → 0 rows (guard both) · no

══ TIER B COMMS & AMENITIES ══
[B] 9 amenity flags (pet/kid/wheelchair/transport/lgbtq/woman/family/student/wifi) · ALL false · no. PRIMARY BUILD ITEM: columns + PDP render + search facet all EXIST but ZERO write path (not in PATCH whitelist — confirmed). Add 9 keys + one editor. Never pre-check (a false amenity is a fabricated claim)
[Optional] sms_reminder_24h/1h · true (NO provider wired — "coming soon", don't present live) · no
[Optional] house_rules · NO column (net-new free text) · no
[Optional] email/review-request/marketing opt-in · NO columns (crons run globally) · no
[Optional/never] client_comms_language · NO column; emails localize to CUSTOMER profiles.locale (correct) · no

══ KYB ══
[Optional] salon_documents (trade_license/professional_cert/hygiene_cert/id_proof/address_proof) · none, gates nothing today · no

══ MULTI-LOCATION ══
[Optional/Open] parent_salon_id / group_id · exist, NO onboarding flow · no

## THE GATES

═══ THE GATES (3 distinct; the double-gate resolved) ═══

GATE 1 — ENTER DASHBOARD (Tier A finish-first):
Condition = salon row created (Tier A complete: identity+location, hours, ≥1 active service; Step 4 seed skippable). On completion the salon exists with is_active=false, registration_completed=false. Dashboard unlocks in a "not yet submitted" state. This is what "finish everything first, THEN dashboard unlocks" means — the ROW-creating gate, NOT the curated bar.

GATE 2 — SUBMIT FOR REVIEW (the curated bar, owner-controlled):
Condition (ALL required green) = name + about_text_de + phone + opening_hours(≥1 day) + ≥1 active service + (cover_photo OR ≥1 gallery) + stripe_account_id non-null AND charges_enabled. Action = POST /api/salon/go-live writes registration_completed=true, LEAVES is_active=false, leaves approved_at=null. Owner → PENDING_REVIEW banner.

GATE 3 — ADMIN PATH B APPROVAL (Solen-controlled):
Admin queue filters registration_completed=true AND is_active=false AND approved_at IS NULL. approve → is_active=true + approved_at + approved_by + rejection_reason=null → owner LIVE. reject → is_active=false + rejection_reason → owner CHANGES_REQUESTED. freeze (post-live) → frozen_at + frozen_reason + cancels/refunds bookings → owner FROZEN. PUBLIC VISIBILITY = is_active=true AND listed_on_marketplace=true (default true) AND is_test=false.

RESOLVING THE "DOUBLE-GATE" CONFUSION (Gate 2 + Gate 3 both reading as gates):
Make the mental model ONE arrow, not two checklists. Complete listing → ONE "Submit for review" button → ONE waiting state ("Pending review") → LIVE | "Changes requested: <reason>". The checklist is the to-do (Gate 2). Admin approval (Gate 3) is a single passive waiting state AFTER submit, NOT a second checklist the owner fills. The owner never "does" Gate 3.

═══ THE 3 LIVE BUGS THAT MAKE THIS NON-FUNCTIONAL TODAY (all confirmed in code; ALL backend, flag as out-of-pure-frontend-scope) ═══

BUG 1 — GoLiveStep never submits. handleGoLive() runs a 2s confetti setTimeout then onGoLive() (= router.push). It NEVER calls POST /api/salon/go-live and never writes registration_completed. So the admin pending queue is ALWAYS EMPTY. #1 launch blocker.

BUG 2 — go-live route is PATH A, not B. POST /api/salon/go-live sets is_active=true DIRECTLY (confirmed: `.update({ is_active: true })`), self-publishing past the curated review the owner LOCKED. Must change to write registration_completed=true and NOT is_active.

BUG 3 — NO RESUBMIT DISCRIMINATOR (confirmed: no rejected_at / resubmitted_at / status column exists on salons). reject sets is_active=false + rejection_reason but leaves registration_completed=true AND approved_at=null — the EXACT shape the "pending" filter matches. So a rejected salon NEVER leaves the admin queue, and pending vs rejected are indistinguishable. Needs a small schema add (a status enum or rejected_at column) so Resubmit can return the row to a clean pending state. Without it the rejected→fix→resubmit loop cannot work.

Build order (highest leverage first): (1) wire Submit → POST go-live with PATH-B semantics + add the resubmit discriminator column — unblocks the entire curated model end to end; (2) build the Publish-Checklist panel reading live status; (3) Tier-A field fixes (phone input, server-side TOS, postal_code capture, drop quartier hardcode, geocode-on-edit + no-geocode block); (4) add walk-in + 9 amenity keys to the PATCH whitelist + their editors.

## EDGE CASES

═══ EDGE-CASE HANDLING ═══

RESUME / ABANDON — salon_drafts (user_id, draft_data JSONB, current_step) + sessionStorage fallback already wired. On return: restore step + data. BUT once the salon ROW exists (Tier A done), DO NOT show the draft wizard again — route to the dashboard Publish Checklist, reading per-item status LIVE (setup-progress / go-live / Stripe-status), never from the draft blob.

MULTI-CATEGORY — categories[] min1, multi allowed (category = whole-salon property). Accent + adaptive-seed PRIMARY block = categories[0], but the Step-4 / category-checklist UI loops categories[] showing one independently-skippable config block per category (a coiffeur+nails salon configures BOTH colour-cycle AND stations; capacity entities differ — chairs vs stations vs rooms). Make the primary category EXPLICIT (selection order) rather than implicit array[0]. Shared OPERATE timeline + category switcher in MANAGE (locked). "Add a category later" = Settings PATCH salons.categories, NOT re-onboarding; unlocks that category's module + a new checklist item, must NOT wipe other categories' config; OPEN: does adding a category to a LIVE salon re-trigger admin review (recommend no — additive).

SOLO OPERATOR — Team + Schedule truly OPTIONAL, never block. A "Just me / solo" choice hard-skips both and auto-applies opening_hours as the owner's own schedule. FIX two stuck-step bugs: (a) staff completion needs staff_members.is_active=true (a pending invite never sets it → solo owners stuck); (b) auto-apply produces 0 rows with no staff. Staff-photo/portfolio checklist items satisfiable by the owner-as-staff record.

GEOCODE FAILS — if AddressAutocomplete returns no lat/lng (key missing, manual entry, ambiguous), DO NOT save null/Basel-center silently (blank map, search miss). BLOCK Tier-A completion: "We couldn't locate this address — pick a suggestion or drop a pin." Manual map-pin fallback. Re-geocode on EVERY address edit.

EDIT-AFTER-SUBMIT (pending) — allowed; does NOT auto-resubmit. Banner: "In review — edits will be included." Admin sees latest. OPEN: do edits reset the review timer (recommend no).

REJECTED → FIX → RESUBMIT — the biggest real gap (see BUG 3 in gates). reject leaves the row in the pending-filter shape forever; no owner Resubmit write path. Needs: (a) the discriminator column, (b) a "Changes requested: <rejection_reason>" banner (verbatim), (c) Resubmit returning the row to clean pending. If rejection_reason maps to a specific item, flag THAT row red (state 4) too.

STRIPE KYB STUCK / FAILED — B5 shows the live tri-state (not_connected / pending / connected), NOT a dead checkmark. On return from Stripe re-poll status (account.updated webhook flips accepts_online_payment). Stuck in pending blocks Submit — show WHY ("Stripe still verifying your details"), not a generic disabled button. The return_url today lands on /dashboard/settings, not the wizard — must resume at B5.

CASH-ONLY SALON vs Stripe-mandatory curated bar — a product fork (OPEN DECISION). Recommend: Stripe mandatory for ALL (deposits/no-show protection, KYB identity); even payment_mode=at_salon shops complete KYB; checklist copy explains "Stripe verifies you, even for in-salon payment." Alternative = a no-Stripe directory-only listing (online_booking_enabled=false).

VACATION DURING REVIEW / LIVE-IN-VACATION — vacation_start/end exist; a Live salon inside its vacation window should render "temporarily closed" + next-open date, bookings disabled, NOT delisted. OPEN: verify the feed/card/PDP actually render this (likely a display gap today).

PATH-B is_active DEFAULT LEAK — salons.is_active DEFAULTs true in DB; create MUST insert is_active=false explicitly (confirmed it does, route.ts:543). Keep it false until admin flips, else unapproved salons leak into the feed (feed = is_active=true AND listed_on_marketplace=true AND is_test=false).

DEAD-COLUMN / FABRICATION GUARDS — DROP cancellation_hours + cancellation_window_hours + late_cancel_fee_percent (no clean writer; overlap free_cancel_hours). Never render tiktok_url/facebook_url inputs into a void (SalonContact renders neither). google_place_id captured-then-discarded (add column or stop capturing). Never pre-check an amenity (false claim a disabled client trusts). SMS reminders show ON but no provider — "coming soon", not live. No fabricated review-SLA countdown.

SLOT/HOURS EDGE — overnight hours (close<open) handled by isOpenNow; all-closed blocked by hasAnyOpen; break_end<=break_start NOT validated today (silent bad data — add). Granularity change after slots generated = needs regeneration, not a flag flip (silent no-op otherwise). Photos only uploadable AFTER service exists (route needs the id) — why per-service photo is a post-create checklist item, not inline-create.

SERVICE DATA-LAYER LIMITS — FR/IT service name/description IMPOSSIBLE (no columns; type declares them = drift; don't promise). Per-service deposit/online-bookable/parallel-capacity DON'T EXIST as service fields (deposit=salon-level; bookable=is_active; capacity=category tables + station_required + daily_limit_per_staff). name_en="" → server writes name_en=name_de (keep the fallback).

PERMISSIONS, FIXED 2026-08-30, commit `91624012f`. This line used to say schedule-edit ALWAYS 403s. It never did: the route called `.includes()` on the object the modal writes, so it CRASHED, on every staff member. The route now understands both shapes: an explicit `can_edit_schedule: false` returns 403, and `{}`, null and both legacy array forms allow, matching the dashboard's own `?? true`. Standardize one vocabulary BEFORE shipping any permission toggle. accept-bookings/checkout/see-revenue are ASPIRATIONAL (not wired) = net-new keys + enforcement, not just UI. access_role column = dead (implement as preset→permission expansion, or drop).

## OPEN DECISIONS (owner)

═══ OPEN DECISIONS FOR THE OWNER (flag, don't silently default) ═══

1. PATH A vs PATH B reconfirm — DECISIONS locks PATH B; the BRIEF recommends PATH A; the LIVE go-live route IS PATH A (sets is_active=true directly). I designed to the LOCKED PATH B. Owner: confirm go-live writes registration_completed (NOT is_active) so the admin queue fills. (Single highest-leverage fix.)

2. RESUBMIT DISCRIMINATOR — no rejected_at/status column exists; rejected and never-reviewed salons are indistinguishable and rejected rows never leave the admin pending queue. A small schema add (status enum or rejected_at) is REQUIRED for the rejected→fix→resubmit loop. Approve the column.

3. KYB AS A GATE — DECISIONS' curated bar implies "Stripe KYB verified" before listing (so Stripe charges_enabled IS the gate); the BRIEF says label salon_documents upload OPTIONAL for launch. Resolve: is the Stripe-Connect KYB sufficient (my recommendation: yes — B5 = stripe charges_enabled is the gate; salon_documents stays an Optional checklist item the admin eyeballs, not a hard block), or do you want mandatory document upload too? (DECISIONS open-item confirms "exact curated checklist items / KYB states" is unanswered.)

4. CASH-ONLY FORK — is Stripe mandatory for ALL salons (including at_salon/cash-only, for KYB + deposit/no-show protection — my recommendation), or do you allow a no-Stripe directory-only listing? Determines whether stripe_account_id is truly NECESSARY.

5. payment_mode DEFAULT — DB default is 'at_salon' but PaymentsStep renders prepay-only. Does the marketplace force prepay/deposit (online payment, which is why Stripe gates) or allow at_salon (which weakens the Stripe requirement)? Render all 3 either way.

6. BUSINESS IDENTITY / UID — zero UID (CHE-###.###.###) / legal-entity / Handelsregister / legal-form field exists anywhere. For a curated, payment-taking Swiss marketplace this is arguably the biggest miss (can't dedupe "same business twice", can't match Handelsregister, can't issue compliant invoices). Stripe Connect collects some KYB but Solen holds no UID on its own record. Add a Legal step (UID + legal/trade name + legal form Einzelfirma/GmbH/AG), or rely entirely on Stripe? (My lean: add at minimum UID + legal name to the publish checklist for the curated bar.)

7. VAT yes/no in onboarding — DECISIONS defers VAT to Settings. But a salon >CHF 100k turnover is legally MwSt-pflichtig; default vat_registered=false silently mis-prices/mis-invoices VAT-liable salons until someone remembers Settings. At minimum ask the binary yes/no somewhere before listing?

8. CITIES — only 3 live rows (basel/zuerich/bern), identical to the hardcode. Launch 3-city-only (keep the select), or seed more cities / allow free-text city before the select can widen?

9. DEAD-FIELD DROP-vs-WIRE — decide per field, don't render dead fields: google_place_id (add column or drop), tiktok_url (render on PDP or drop), facebook_url (wire or drop), quartier (drop the "grossbasel" hardcode → derive or null).

10. BOOKING WINDOW CONTROLS — horizon / min-lead-time / slot-granularity have NO columns (hardcoded 60d/24h/30min). Adding them is backend. Surface as Optional checklist items with category defaults, or leave hardcoded for launch?

11. MULTI-LOCATION — parent_salon_id/group_id exist but no flow; a chain owner must create N disconnected salons with N Stripe accounts. In scope for launch onboarding, or deferred (later ship)?

12. REVIEW-TIME SLA — the PENDING_REVIEW banner needs a REAL agreed review window (e.g. "1-2 business days") or it must omit the time entirely. No fabricated countdown. What's the real SLA?

13. POLICY FIELD CONSOLIDATION — pick free_cancel_hours + no_show_fee_type/value as authoritative; confirm dropping cancellation_hours / cancellation_window_hours / late_cancel_fee_percent from all UI.
