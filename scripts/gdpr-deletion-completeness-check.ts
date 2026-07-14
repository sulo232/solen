// GDPR/revDSG deletion completeness harden gate.
//
// WHAT THIS PROVES: that deleting a Solen account (the real production path,
// admin.auth.admin.deleteUser -> cascades to profiles -> fires the BEFORE
// DELETE trigger public.anonymize_financial_rows_on_profile_delete, extended
// by supabase/migrations/20260713150000_gdpr_deletion_completeness.sql)
// actually leaves ZERO of this account's PII behind, across every table that
// migration touches, plus the client-photos storage bucket.
//
// SCOPE (deliberate, read the reasoning before extending):
//   This gate seeds + verifies exactly the tables governed by the
//   BEFORE DELETE TRIGGER (the thing 20260713150000 changed): bookings,
//   booking_disputes, case_events, reviews, favorites, barber_walkin_queue,
//   barber_cut_history, client_photos (+ storage bytes), client_formulas,
//   intake_form_responses, nail_design_history, nail_client_preferences,
//   gift_cards, group_bookings, tips, staff_members, salon_clients,
//   user_salon_affinity, spa_treatment_outcomes, PLUS review_photos (+
//   review-photos storage bytes), which is fixed at the APPLICATION layer
//   (lib/gdpr/purge-review-photo-storage.ts), not the trigger, because
//   reviews.user_id is SET NULL (the review row survives) so nothing ever
//   cascades to review_photos.
//
//   user_style_affinity is deliberately NOT seeded here: it already carries
//   a real `ON DELETE CASCADE` FK to auth.users (confirmed in
//   20260623124500_user_style_affinity.sql:11), so it needs no gate
//   coverage, re-testing a pre-existing Postgres FK constraint would just
//   be testing Postgres, not this migration.
//
//   It deliberately does NOT seed user_credits / credit_redemptions /
//   referrals / client_notes / account_actions / voucher_redemptions /
//   vouchers / discovery_staging / hand_chart_notes / price_disputes /
//   promo_codes / feature_flags / salon_badge_assignments /
//   salon_documents / salons / site_content. Those columns are NOT NULL
//   with NO ON DELETE action (or NOT NULL with CASCADE that would hard-
//   delete rows this test wants to keep inspecting), so a raw
//   admin.auth.admin.deleteUser() call WITHOUT first running the cron's
//   batched pre-delete cleanup (app/api/cron/process-deletions/route.ts)
//   would throw a foreign-key violation before the trigger even runs.
//   That batched cleanup is already covered by scripts/ring3a-kill-test.ts
//   (equivalence-by-inspection, deliberately not run against the live DB
//   per that script's own header). Re-deriving it here would either
//   duplicate that risk surface or silently drift from the real cron code.
//   This gate's job is narrower and sharper: prove the NEW trigger
//   extension (20260713150000) is complete. It calls deleteUser() directly
//   (bypassing the cron route's HTTP/CRON_SECRET plumbing) because that is
//   the exact operation the trigger fires on; the cron is just a scheduler
//   around the same call.
//
// SELF-TEST (how to know this gate itself actually discriminates, not a
// rubber stamp that always prints PASS):
//   SHOULD PASS: run `npx tsx scripts/gdpr-deletion-completeness-check.ts`
//   after migration 20260713150000 is applied live. Expect every scenario
//   PASS and exit code 0.
//   DELIBERATE MISS (trigger-governed table): comment out ONE block in
//   public.anonymize_financial_rows_on_profile_delete() (e.g. the
//   client_formulas UPDATE) via a throwaway `CREATE OR REPLACE FUNCTION`
//   applied live, then rerun this script. Expect the matching scenario
//   ("client_formulas.customer_id scrubbed") to FAIL and the process to
//   exit 1, proving the check reads the ACTUAL post-deletion row, not a
//   tautology. Revert the throwaway function afterward (re-apply
//   20260713150000, or CREATE OR REPLACE with the real body from that
//   file) before trusting the gate again.
//   DELIBERATE MISS (application-layer fix): comment out the
//   `purgeReviewPhotoStorage(admin, [userId])` call above (or temporarily
//   have it early-return), then rerun. Expect
//   "purgeReviewPhotoStorage found + removed the review-photos object + row"
//   and "review_photos: row hard-deleted" to FAIL, and
//   "review-photos storage folder is empty after purge" to also FAIL,
//   proving this gate actually exercises the storage-purge code path, not
//   just the DB trigger.
//
// SAFETY: every row this script writes is tied to a disposable auth user
// (email ending @example.invalid) and a disposable booking/slot/dispute
// chain; it borrows only the ID of an EXISTING salon+service (read-only)
// to satisfy NOT NULL FKs. A `finally` block hard-deletes every row this
// script created, regardless of pass/fail, so no permanent test data is
// left behind even though the tables it is testing are designed to RETAIN
// (anonymized) rows in normal production use.
//
// Requires DB access (SUPABASE_SERVICE_ROLE_KEY). The orchestrator runs
// this, never run it against a database holding real customers.
//
// Usage: npx tsx scripts/gdpr-deletion-completeness-check.ts
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

async function main() {
  const { createAdminSupabaseClient } = await import("@/lib/supabase");
  const { purgeClientPhotoStorage } = await import("@/lib/gdpr/purge-client-photo-storage");
  const { purgeReviewPhotoStorage } = await import("@/lib/gdpr/purge-review-photo-storage");
  const admin = createAdminSupabaseClient();

  const rows: { scenario: string; pass: boolean; details: Record<string, unknown> }[] = [];
  let allPass = true;
  function check(scenario: string, pass: boolean, details: Record<string, unknown> = {}) {
    rows.push({ scenario, pass, details });
    if (!pass) allPass = false;
  }
  function skip(scenario: string, reason: string) {
    console.log(`[SKIP] ${scenario}: ${reason}`);
  }

  const stamp = Date.now();
  const testTag = `gdpr-gate-${stamp}`;

  // Ids to clean up in the finally block, tracked as we create them.
  let userId: string | null = null;
  let slotId: string | null = null;
  let bookingId: string | null = null;
  let disputeId: string | null = null;
  let caseEventId: string | null = null;
  let reviewId: string | null = null;
  let favoriteId: string | null = null;
  let clientPhotoId: string | null = null;
  let clientPhotoStoragePath: string | null = null;
  let clientFormulaId: string | null = null;
  let intakeFormId: string | null = null;
  let nailHistoryId: string | null = null;
  let nailPrefId: string | null = null;
  let giftCardId: string | null = null;
  let groupBookingId: string | null = null;
  let tipId: string | null = null;
  let walkinId: string | null = null;
  let cutHistoryId: string | null = null;
  let staffMemberId: string | null = null;
  let salonClientId: string | null = null;
  let salonClientsTableExists = false;
  let packagePurchaseId: string | null = null;
  let reviewPhotoId: string | null = null;
  let reviewPhotoPath: string | null = null;
  let userSalonAffinityExists = false;
  let spaOutcomeId: string | null = null;
  let spaOutcomeTableExists = false;
  // Kept populated for the whole run (unlike userId, which is deliberately
  // nulled on the success path below) so the finally block can always
  // clean up rows keyed by user_id directly, even if deleteUser() never ran.
  let throwawayUserId: string | null = null;

  try {
    // ── 0. Borrow an existing salon + service (read-only) ────────────────
    const { data: svc, error: svcErr } = await admin
      .from("services")
      .select("id, salon_id")
      .limit(1)
      .maybeSingle();
    if (svcErr || !svc) {
      throw new Error(`Could not find an existing service to borrow salon_id/service_id from: ${svcErr?.message ?? "no services exist"}`);
    }
    const salonId = svc.salon_id as string;
    const serviceId = svc.id as string;

    // ── 1. Disposable auth user (never a real customer) ──────────────────
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: `${testTag}@example.invalid`,
      email_confirm: true,
      password: crypto.randomUUID(),
    });
    userId = created?.user?.id ?? null;
    throwawayUserId = userId;
    check("throwaway auth user created", !createErr && !!userId, { error: createErr?.message, userId });
    if (!userId) throw new Error("cannot continue without a throwaway user id");

    // profiles row is auto-created by the handle_new_user() trigger on auth.users insert.
    const { data: profileRow } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
    check("profiles row auto-created for the throwaway user", !!profileRow, { profileRow });

    // ── 2. Throwaway slot + booking (financial-retention regression check) ──
    const { data: slot, error: slotErr } = await admin
      .from("availability_slots")
      .insert({ salon_id: salonId, service_id: serviceId, starts_at: "2099-01-01T10:00:00Z", ends_at: "2099-01-01T11:00:00Z" })
      .select("id")
      .single();
    slotId = slot?.id ?? null;
    check("throwaway availability_slot created", !slotErr && !!slotId, { error: slotErr?.message });

    const { data: booking, error: bookingErr } = await admin
      .from("bookings")
      .insert({
        salon_id: salonId, service_id: serviceId, slot_id: slotId!, user_id: userId,
        starts_at: "2099-01-01T10:00:00Z", ends_at: "2099-01-01T11:00:00Z",
        price_paid: 1000, paid_amount: 1000, status: "cancelled",
        guest_name: null, guest_email: null, guest_phone: null,
        customer_note: "gate test note", payment_intent_id: "pi_gate_test",
      })
      .select("id")
      .single();
    bookingId = booking?.id ?? null;
    check("throwaway booking created (user_id set, paid_amount set)", !bookingErr && !!bookingId, { error: bookingErr?.message });

    if (bookingId) {
      const { data: dispute, error: disputeErr } = await admin
        .from("booking_disputes")
        .insert({ booking_id: bookingId, reporter_id: userId, requested_by_user_id: userId, status: "closed", guest_name: null, guest_email: null, description: "gate test dispute" })
        .select("id")
        .single();
      disputeId = dispute?.id ?? null;
      check("throwaway booking_disputes row created", !disputeErr && !!disputeId, { error: disputeErr?.message });

      if (disputeId) {
        const { data: caseEvent, error: caseErr } = await admin
          .from("case_events")
          .insert({ dispute_id: disputeId, actor_user_id: userId, actor_role: "customer", action: "gate_test", note: "gate test note" })
          .select("id")
          .single();
        caseEventId = caseEvent?.id ?? null;
        check("throwaway case_events row created", !caseErr && !!caseEventId, { error: caseErr?.message });
      }

      const { data: review, error: reviewErr } = await admin
        .from("reviews")
        .insert({ salon_id: salonId, user_id: userId, booking_id: bookingId, rating: 5, comment: "gate test review comment" })
        .select("id")
        .single();
      reviewId = review?.id ?? null;
      check("throwaway reviews row created", !reviewErr && !!reviewId, { error: reviewErr?.message });

      if (reviewId) {
        // review_photos: public bucket, photo_url stores the FULL PUBLIC URL
        // (not a raw path, unlike client_photos), mirror the real upload
        // route (app/api/reviews/[id]/photos/route.ts) exactly so the gate
        // proves the same URL shape purgeReviewPhotoStorage has to parse.
        reviewPhotoPath = `${reviewId}/${testTag}.txt`;
        const { error: reviewPhotoUploadErr } = await admin.storage
          .from("review-photos")
          .upload(reviewPhotoPath, new Blob(["gate test review photo bytes"]), { contentType: "text/plain" });
        check("throwaway file uploaded to review-photos storage", !reviewPhotoUploadErr, { error: reviewPhotoUploadErr?.message, reviewPhotoPath });

        if (!reviewPhotoUploadErr) {
          const { data: publicUrlData } = admin.storage.from("review-photos").getPublicUrl(reviewPhotoPath);
          const { data: reviewPhoto, error: reviewPhotoErr } = await admin
            .from("review_photos")
            .insert({ review_id: reviewId, photo_url: publicUrlData.publicUrl, sort_order: 0 })
            .select("id")
            .single();
          reviewPhotoId = reviewPhoto?.id ?? null;
          check("throwaway review_photos row created", !reviewPhotoErr && !!reviewPhotoId, { error: reviewPhotoErr?.message });
        }
      }

      const { data: tip, error: tipErr } = await admin
        .from("tips")
        .insert({ salon_id: salonId, booking_id: bookingId, user_id: userId, amount: 500, status: "paid" })
        .select("id")
        .single();
      tipId = tip?.id ?? null;
      check("throwaway tips row created", !tipErr && !!tipId, { error: tipErr?.message });
    }

    const { data: favorite, error: favErr } = await admin
      .from("favorites")
      .insert({ salon_id: salonId, user_id: userId })
      .select("id")
      .single();
    favoriteId = favorite?.id ?? null;
    check("throwaway favorites row created", !favErr && !!favoriteId, { error: favErr?.message });

    // ── 3. The gap tables this migration actually fixes ──────────────────
    const photoPath = `${salonId}/${userId}/${testTag}.txt`;
    const { error: uploadErr } = await admin.storage.from("client-photos").upload(photoPath, new Blob(["gate test photo bytes"]), { contentType: "text/plain" });
    check("throwaway file uploaded to client-photos storage", !uploadErr, { error: uploadErr?.message, photoPath });
    if (!uploadErr) clientPhotoStoragePath = photoPath;

    const { data: clientPhoto, error: photoRowErr } = await admin
      .from("client_photos")
      .insert({ salon_id: salonId, customer_id: userId, photo_url: photoPath, photo_type: "progress" })
      .select("id")
      .single();
    clientPhotoId = clientPhoto?.id ?? null;
    check("throwaway client_photos row created", !photoRowErr && !!clientPhotoId, { error: photoRowErr?.message });

    const { data: formula, error: formulaErr } = await admin
      .from("client_formulas")
      .insert({ salon_id: salonId, customer_id: userId, mix_formula: "gate test formula", notes: "gate test allergy note" })
      .select("id")
      .single();
    clientFormulaId = formula?.id ?? null;
    check("throwaway client_formulas row created", !formulaErr && !!clientFormulaId, { error: formulaErr?.message });

    const { data: intake, error: intakeErr } = await admin
      .from("intake_form_responses")
      .insert({ salon_id: salonId, customer_id: userId, template_key: "gate_test", responses: { note: "gate test" }, ai_recommendation: "gate test recommendation" })
      .select("id")
      .single();
    intakeFormId = intake?.id ?? null;
    check("throwaway intake_form_responses row created", !intakeErr && !!intakeFormId, { error: intakeErr?.message });

    const { data: nailHistory, error: nailHistErr } = await admin
      .from("nail_design_history")
      .insert({ salon_id: salonId, customer_id: userId, notes: "gate test nail note", photo_url: "fake/gate-test.jpg" })
      .select("id")
      .single();
    nailHistoryId = nailHistory?.id ?? null;
    check("throwaway nail_design_history row created", !nailHistErr && !!nailHistoryId, { error: nailHistErr?.message });

    const { data: nailPref, error: nailPrefErr } = await admin
      .from("nail_client_preferences")
      .insert({ salon_id: salonId, customer_id: userId, allergy_notes: "gate test allergy", notes: "gate test pref note" })
      .select("id")
      .single();
    nailPrefId = nailPref?.id ?? null;
    check("throwaway nail_client_preferences row created", !nailPrefErr && !!nailPrefId, { error: nailPrefErr?.message });

    const { data: giftCard, error: giftErr } = await admin
      .from("gift_cards")
      .insert({ salon_id: salonId, code: `GATE${stamp}`, original_amount: 5000, remaining_amount: 5000, purchaser_user_id: userId, purchaser_email: `${testTag}@example.invalid` })
      .select("id")
      .single();
    giftCardId = giftCard?.id ?? null;
    check("throwaway gift_cards row created", !giftErr && !!giftCardId, { error: giftErr?.message });

    const { data: groupBooking, error: groupErr } = await admin
      .from("group_bookings")
      .insert({ salon_id: salonId, organizer_user_id: userId, organizer_name: "Gate Test Organizer", organizer_phone: "+41000000000", group_size: 2, notes: "gate test group note" })
      .select("id")
      .single();
    groupBookingId = groupBooking?.id ?? null;
    check("throwaway group_bookings row created", !groupErr && !!groupBookingId, { error: groupErr?.message });

    // Neutral status ("cancelled") so this never surfaces in a real salon's
    // live "waiting" walk-in queue dashboard.
    const { data: walkin, error: walkinErr } = await admin
      .from("barber_walkin_queue")
      .insert({ salon_id: salonId, customer_id: userId, customer_name: "Gate Test Walkin", customer_phone: "+41000000000", position: 999999, tracking_token: `${testTag}-token`, status: "cancelled" })
      .select("id")
      .single();
    walkinId = walkin?.id ?? null;
    check("throwaway barber_walkin_queue row created", !walkinErr && !!walkinId, { error: walkinErr?.message });

    const { data: cutHistory, error: cutErr } = await admin
      .from("barber_cut_history")
      .insert({ salon_id: salonId, customer_id: userId, customer_name: "Gate Test Cut", notes: "gate test cut note", photo_url: "fake/gate-test-cut.jpg" })
      .select("id")
      .single();
    cutHistoryId = cutHistory?.id ?? null;
    check("throwaway barber_cut_history row created", !cutErr && !!cutHistoryId, { error: cutErr?.message });

    const { data: staffMember, error: staffErr } = await admin
      .from("staff_members")
      .insert({ salon_id: salonId, user_id: userId, name: "Gate Test Staff", is_publicly_listed: false })
      .select("id")
      .single();
    staffMemberId = staffMember?.id ?? null;
    check("throwaway staff_members row created", !staffErr && !!staffMemberId, { error: staffErr?.message });

    // salon_clients: untracked/live-only table (see migration header). Probe
    // existence first so a DB where it doesn't exist yet SKIPs, not FAILs.
    const { error: salonClientsProbeErr } = await admin.from("salon_clients").select("id").limit(1);
    salonClientsTableExists = !salonClientsProbeErr || !/does not exist|relation .* does not exist/i.test(salonClientsProbeErr.message);
    if (salonClientsTableExists) {
      const { data: salonClient, error: scErr } = await admin
        .from("salon_clients")
        .insert({ salon_id: salonId, profile_id: userId, email: `${testTag}@example.invalid`, name: "Gate Test Client", phone: "+41000000000", notes: "gate test note" })
        .select("id")
        .single();
      salonClientId = salonClient?.id ?? null;
      if (scErr) {
        skip("throwaway salon_clients row", `insert failed, table shape unconfirmed (untracked schema): ${scErr.message}`);
        salonClientsTableExists = false;
      } else {
        check("throwaway salon_clients row created", !!salonClientId, {});
      }
    } else {
      skip("salon_clients", "table does not exist on this DB");
    }

    // user_salon_affinity: untracked/live-only table (no CREATE TABLE found
    // anywhere in supabase/migrations/*.sql, see migration header). Probe
    // existence first so a DB where it doesn't exist yet SKIPs, not FAILs.
    const { error: affinityProbeErr } = await admin.from("user_salon_affinity").select("user_id").limit(1);
    userSalonAffinityExists = !affinityProbeErr || !/does not exist|relation .* does not exist/i.test(affinityProbeErr.message);
    if (userSalonAffinityExists) {
      const { error: affinityErr } = await admin
        .from("user_salon_affinity")
        .insert({ user_id: userId, salon_id: salonId, score: 1, clicks: 1, books: 0 });
      if (affinityErr) {
        skip("throwaway user_salon_affinity row", `insert failed, table shape unconfirmed (untracked schema): ${affinityErr.message}`);
        userSalonAffinityExists = false;
      } else {
        check("throwaway user_salon_affinity row created", true, {});
      }
    } else {
      skip("user_salon_affinity", "table does not exist on this DB");
    }

    // spa_treatment_outcomes: untracked/live-only table (no CREATE TABLE
    // found anywhere in supabase/migrations/*.sql, see migration header).
    // Probe existence first so a DB where it doesn't exist yet SKIPs.
    const { error: spaProbeErr } = await admin.from("spa_treatment_outcomes").select("id").limit(1);
    spaOutcomeTableExists = !spaProbeErr || !/does not exist|relation .* does not exist/i.test(spaProbeErr.message);
    if (spaOutcomeTableExists) {
      const { data: spaOutcome, error: spaErr } = await admin
        .from("spa_treatment_outcomes")
        .insert({ salon_id: salonId, client_id: userId, skin_before: "gate test skin before", skin_after: "gate test skin after", follow_up_notes: "gate test follow up notes" })
        .select("id")
        .single();
      spaOutcomeId = spaOutcome?.id ?? null;
      if (spaErr) {
        skip("throwaway spa_treatment_outcomes row", `insert failed, table shape unconfirmed (untracked schema): ${spaErr.message}`);
        spaOutcomeTableExists = false;
      } else {
        check("throwaway spa_treatment_outcomes row created", !!spaOutcomeId, {});
      }
    } else {
      skip("spa_treatment_outcomes", "table does not exist on this DB");
    }

    // package_purchases needs an existing service_packages row (package_id
    // NOT NULL, no throwaway one created here to avoid touching a salon's
    // real package catalog). Borrow one if it exists; SKIP otherwise.
    const { data: pkg } = await admin.from("service_packages").select("id, salon_id").limit(1).maybeSingle();
    if (pkg) {
      const { data: pp, error: ppErr } = await admin
        .from("package_purchases")
        .insert({ package_id: pkg.id, user_id: userId, salon_id: pkg.salon_id, sessions_total: 1 })
        .select("id")
        .single();
      packagePurchaseId = pp?.id ?? null;
      check("throwaway package_purchases row created", !ppErr && !!packagePurchaseId, { error: ppErr?.message });
    } else {
      skip("package_purchases", "no existing service_packages row to borrow package_id/salon_id from");
    }

    // ── 4. RUN THE REAL DELETION PATH ─────────────────────────────────────
    // Same order the cron uses: purge storage bytes BEFORE the trigger nulls
    // the DB pointer, then deleteUser() (cascades to profiles, fires the
    // trigger synchronously, in the SAME transaction as the row delete).
    const purgeResult = await purgeClientPhotoStorage(admin, [userId]);
    check("purgeClientPhotoStorage found + removed the client-photos object", purgeResult.pathsFound === 1 && purgeResult.removed === 1 && purgeResult.errors.length === 0, { purgeResult });

    const reviewPhotoPurgeResult = await purgeReviewPhotoStorage(admin, [userId]);
    if (reviewPhotoId) {
      check(
        "purgeReviewPhotoStorage found + removed the review-photos object + row",
        reviewPhotoPurgeResult.pathsFound === 1 && reviewPhotoPurgeResult.removed === 1 && reviewPhotoPurgeResult.errors.length === 0,
        { reviewPhotoPurgeResult },
      );
    }

    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    check("admin.auth.admin.deleteUser succeeded (no FK violation)", !deleteErr, { error: deleteErr?.message });
    const deletedUserId = userId; // keep for assertions below even though we null userId in finally-guard logic

    // ── 5. ASSERT: zero PII survives, financial figures retained ─────────
    const { data: profileAfter } = await admin.from("profiles").select("id").eq("id", deletedUserId).maybeSingle();
    check("profiles row is gone", !profileAfter, { profileAfter });

    const { data: storageAfter } = await admin.storage.from("client-photos").list(`${salonId}/${deletedUserId}`);
    check("client-photos storage folder is empty after purge", !storageAfter || storageAfter.length === 0, { storageAfter });

    if (bookingId) {
      const { data: bookingAfter } = await admin.from("bookings").select("user_id, guest_name, guest_email, anonymized_at, paid_amount, price_paid, payment_intent_id").eq("id", bookingId).single();
      check(
        "bookings: user_id nulled + guest_name tombstoned + anonymized_at stamped, paid_amount/price_paid/payment_intent_id RETAINED",
        bookingAfter?.user_id === null && bookingAfter?.guest_name === "Deleted user" && !!bookingAfter?.anonymized_at &&
          bookingAfter?.paid_amount === 1000 && bookingAfter?.price_paid === 1000 && bookingAfter?.payment_intent_id === "pi_gate_test",
        { bookingAfter },
      );
    }
    if (disputeId) {
      const { data: disputeAfter } = await admin.from("booking_disputes").select("reporter_id, requested_by_user_id, guest_name, description").eq("id", disputeId).single();
      check("booking_disputes: reporter_id/requested_by_user_id nulled + description scrubbed", disputeAfter?.reporter_id === null && disputeAfter?.requested_by_user_id === null && disputeAfter?.description === null, { disputeAfter });
    }
    if (caseEventId) {
      const { data: caseEventAfter } = await admin.from("case_events").select("actor_user_id, note").eq("id", caseEventId).single();
      check("case_events: actor_user_id nulled + note scrubbed", caseEventAfter?.actor_user_id === null && caseEventAfter?.note === null, { caseEventAfter });
    }
    if (reviewId) {
      const { data: reviewAfter } = await admin.from("reviews").select("user_id, comment, rating").eq("id", reviewId).single();
      check("reviews: user_id nulled (FK SET NULL) + comment scrubbed, rating RETAINED", reviewAfter?.user_id === null && reviewAfter?.comment === null && reviewAfter?.rating === 5, { reviewAfter });
    }
    if (reviewPhotoId) {
      const { data: reviewPhotoAfter } = await admin.from("review_photos").select("id").eq("id", reviewPhotoId).maybeSingle();
      check("review_photos: row hard-deleted (parent review row survives, but the photo does not)", !reviewPhotoAfter, { reviewPhotoAfter });
    }
    if (reviewPhotoPath) {
      const { data: reviewPhotoStorageAfter } = await admin.storage.from("review-photos").list(reviewId ?? undefined);
      check("review-photos storage folder is empty after purge", !reviewPhotoStorageAfter || reviewPhotoStorageAfter.length === 0, { reviewPhotoStorageAfter });
    }
    if (tipId) {
      const { data: tipAfter } = await admin.from("tips").select("user_id, amount").eq("id", tipId).single();
      check("tips: user_id nulled, amount RETAINED", tipAfter?.user_id === null && tipAfter?.amount === 500, { tipAfter });
    }
    {
      const { data: favAfter } = await admin.from("favorites").select("id").eq("id", favoriteId ?? "").maybeSingle();
      check("favorites: row cascade-deleted (FK CASCADE, pre-existing behavior)", !favAfter, { favAfter });
    }
    if (clientPhotoId) {
      const { data: photoAfter } = await admin.from("client_photos").select("customer_id, photo_url").eq("id", clientPhotoId).single();
      check("client_photos: customer_id + photo_url nulled", photoAfter?.customer_id === null && photoAfter?.photo_url === null, { photoAfter });
    }
    if (clientFormulaId) {
      const { data: formulaAfter } = await admin.from("client_formulas").select("customer_id, notes").eq("id", clientFormulaId).single();
      check("client_formulas: customer_id nulled + notes scrubbed", formulaAfter?.customer_id === null && formulaAfter?.notes === null, { formulaAfter });
    }
    if (intakeFormId) {
      const { data: intakeAfter } = await admin.from("intake_form_responses").select("customer_id, responses, ai_recommendation").eq("id", intakeFormId).single();
      check("intake_form_responses: customer_id nulled + responses cleared + ai_recommendation scrubbed", intakeAfter?.customer_id === null && JSON.stringify(intakeAfter?.responses) === "{}" && intakeAfter?.ai_recommendation === null, { intakeAfter });
    }
    if (nailHistoryId) {
      const { data: nailHistAfter } = await admin.from("nail_design_history").select("customer_id, notes, photo_url").eq("id", nailHistoryId).single();
      check("nail_design_history: customer_id nulled + notes/photo_url scrubbed", nailHistAfter?.customer_id === null && nailHistAfter?.notes === null && nailHistAfter?.photo_url === null, { nailHistAfter });
    }
    if (nailPrefId) {
      const { data: nailPrefAfter } = await admin.from("nail_client_preferences").select("customer_id, allergy_notes, notes").eq("id", nailPrefId).single();
      check("nail_client_preferences: customer_id nulled + allergy_notes/notes scrubbed", nailPrefAfter?.customer_id === null && nailPrefAfter?.allergy_notes === null && nailPrefAfter?.notes === null, { nailPrefAfter });
    }
    if (giftCardId) {
      const { data: giftAfter } = await admin.from("gift_cards").select("purchaser_user_id, purchaser_email, remaining_amount").eq("id", giftCardId).single();
      check("gift_cards: purchaser_user_id + purchaser_email nulled, remaining_amount RETAINED", giftAfter?.purchaser_user_id === null && giftAfter?.purchaser_email === null && giftAfter?.remaining_amount === 5000, { giftAfter });
    }
    if (groupBookingId) {
      const { data: groupAfter } = await admin.from("group_bookings").select("organizer_user_id, organizer_name, organizer_phone, notes").eq("id", groupBookingId).single();
      check("group_bookings: organizer_user_id nulled + organizer_name tombstoned + phone/notes scrubbed", groupAfter?.organizer_user_id === null && groupAfter?.organizer_name === "Deleted user" && groupAfter?.organizer_phone === null && groupAfter?.notes === null, { groupAfter });
    }
    if (walkinId) {
      const { data: walkinAfter } = await admin.from("barber_walkin_queue").select("customer_id, customer_name, customer_phone").eq("id", walkinId).single();
      check("barber_walkin_queue: customer_id nulled + name tombstoned + phone redacted", walkinAfter?.customer_id === null && walkinAfter?.customer_name === "Deleted user" && walkinAfter?.customer_phone === "[redacted]", { walkinAfter });
    }
    if (cutHistoryId) {
      const { data: cutAfter } = await admin.from("barber_cut_history").select("customer_id, customer_name, notes, photo_url").eq("id", cutHistoryId).single();
      check("barber_cut_history: customer_id nulled + name tombstoned + notes/photo scrubbed", cutAfter?.customer_id === null && cutAfter?.customer_name === "Deleted user" && cutAfter?.notes === null && cutAfter?.photo_url === null, { cutAfter });
    }
    if (staffMemberId) {
      const { data: staffAfter } = await admin.from("staff_members").select("user_id, name").eq("id", staffMemberId).single();
      check(
        "staff_members: user_id (login link) nulled, name UNCHANGED (deliberate, see migration header: public listing content is salon-owned)",
        staffAfter?.user_id === null && staffAfter?.name === "Gate Test Staff",
        { staffAfter },
      );
    }
    if (salonClientId) {
      const { data: scAfter } = await admin.from("salon_clients").select("profile_id, email, name, phone, notes").eq("id", salonClientId).single();
      check("salon_clients: profile_id nulled + email/phone/notes scrubbed", scAfter?.profile_id === null && scAfter?.email === null && scAfter?.phone === null && scAfter?.notes === null, { scAfter });
    }
    if (packagePurchaseId) {
      const { data: ppAfter } = await admin.from("package_purchases").select("user_id, sessions_total").eq("id", packagePurchaseId).single();
      check("package_purchases: user_id nulled, sessions_total RETAINED", ppAfter?.user_id === null && ppAfter?.sessions_total === 1, { ppAfter });
    }
    if (userSalonAffinityExists) {
      const { data: affinityAfter } = await admin.from("user_salon_affinity").select("user_id").eq("user_id", deletedUserId).maybeSingle();
      check("user_salon_affinity: row hard-deleted (composite PK, no FK to null out)", !affinityAfter, { affinityAfter });
    }
    if (spaOutcomeId) {
      const { data: spaAfter } = await admin.from("spa_treatment_outcomes").select("client_id, skin_before, skin_after, follow_up_notes, salon_id").eq("id", spaOutcomeId).single();
      check(
        "spa_treatment_outcomes: client_id nulled + skin_before/skin_after/follow_up_notes scrubbed, salon_id RETAINED",
        spaAfter?.client_id === null && spaAfter?.skin_before === null && spaAfter?.skin_after === null && spaAfter?.follow_up_notes === null && spaAfter?.salon_id === salonId,
        { spaAfter },
      );
    }

    userId = null; // deleteUser already ran; nothing left for the finally block to delete on auth
  } finally {
    // Best-effort cleanup, regardless of pass/fail, so this gate never
    // leaves permanent test rows in tables designed to RETAIN anonymized
    // rows forever in normal production use.
    async function cleanup(table: string, id: string | null) {
      if (!id) return;
      const { error } = await admin.from(table as any).delete().eq("id", id);
      if (error) console.error(`[gdpr-deletion-completeness-check] cleanup ${table} failed:`, error.message);
    }
    await cleanup("package_purchases", packagePurchaseId);
    await cleanup("spa_treatment_outcomes", spaOutcomeId);
    if (userSalonAffinityExists && throwawayUserId) {
      const { error } = await admin.from("user_salon_affinity").delete().eq("user_id", throwawayUserId);
      if (error) console.error("[gdpr-deletion-completeness-check] cleanup user_salon_affinity failed:", error.message);
    }
    await cleanup("review_photos", reviewPhotoId);
    if (reviewPhotoPath) {
      const { error } = await admin.storage.from("review-photos").remove([reviewPhotoPath]);
      if (error) console.error("[gdpr-deletion-completeness-check] cleanup review-photos storage failed:", error.message);
    }
    await cleanup("salon_clients", salonClientId);
    await cleanup("staff_members", staffMemberId);
    await cleanup("barber_cut_history", cutHistoryId);
    await cleanup("barber_walkin_queue", walkinId);
    await cleanup("group_bookings", groupBookingId);
    await cleanup("gift_cards", giftCardId);
    await cleanup("nail_client_preferences", nailPrefId);
    await cleanup("nail_design_history", nailHistoryId);
    await cleanup("intake_form_responses", intakeFormId);
    await cleanup("client_formulas", clientFormulaId);
    await cleanup("client_photos", clientPhotoId);
    await cleanup("tips", tipId);
    await cleanup("reviews", reviewId);
    await cleanup("case_events", caseEventId);
    await cleanup("booking_disputes", disputeId);
    await cleanup("favorites", favoriteId);
    await cleanup("bookings", bookingId);
    await cleanup("availability_slots", slotId);
    if (clientPhotoStoragePath) {
      const { error } = await admin.storage.from("client-photos").remove([clientPhotoStoragePath]);
      if (error) console.error("[gdpr-deletion-completeness-check] cleanup client-photos storage failed:", error.message);
    }
    if (userId) {
      // deleteUser never ran (an earlier assertion threw) -> clean up the
      // throwaway auth user directly so it never lingers.
      await admin.auth.admin.deleteUser(userId);
    }
    console.log("[gdpr-deletion-completeness-check] cleaned up all throwaway rows.");
  }

  console.log("\nGDPR deletion completeness check\n");
  for (const row of rows) {
    console.log(`[${row.pass ? "PASS" : "FAIL"}] ${row.scenario}`);
    if (!row.pass) console.log(`       ${JSON.stringify(row.details)}`);
  }
  console.log("");
  console.log(`${rows.filter((r) => r.pass).length}/${rows.length} scenarios passed.`);
  console.log(allPass ? "All scenarios passed. No PII left behind." : "One or more scenarios FAILED. PII survived deletion.");
  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("[gdpr-deletion-completeness-check] threw:", err);
  process.exit(1);
});
