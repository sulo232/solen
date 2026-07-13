export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { withCronRun } from "@/lib/cron-run";
import { purgeClientPhotoStorage } from "@/lib/gdpr/purge-client-photo-storage";
import { purgeReviewPhotoStorage } from "@/lib/gdpr/purge-review-photo-storage";

export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const adminAuth = request.headers.get("Authorization");
  // VERY simple auth for cron jobs: `CRON_SECRET` env var must match the secret
  // sent by `.github/workflows/cron-jobs.yml` (GitHub Actions invokes this route)
  if (adminAuth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("process-deletions", async () => {
  try {
    const admin = createAdminSupabaseClient();
    
    // Find profiles with deletion_requested_at > 30 days ago
    // Wait, the query is "deletion_requested_at < NOW() - 30 days"
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data: usersToDelete, error: fetchErr } = await admin
      .from("profiles")
      .select("id, email, deletion_requested_at")
      .not("deletion_requested_at", "is", null)
      .lt("deletion_requested_at", thirtyDaysAgo.toISOString());
      
    if (fetchErr) throw fetchErr;
    
    if (!usersToDelete || usersToDelete.length === 0) {
      return { message: "No users to delete", processed: 0 };
    }
    const dueUsers = usersToDelete;

    // Delete them via Auth API (triggers will cascade data if set up correctly, or auth handles it)
    // Wait, admin.auth.admin.deleteUser handles the CASCADE to profiles via the DB?
    // Actually, destroying the auth user normally deletes the profile if it's CASCADE,
    // but in Supabase, the user deletion might not cascade to `public.profiles` unless the foreign key is set to CASCADE.
    // However, calling admin.auth.admin.deleteUser(id) is the official way.

    // Tables the registered-user deletion path anonymizes/clears. The auth-user
    // delete cascades to public.profiles, which fires the BEFORE DELETE trigger
    // (migration 20260602083300, extended 20260713150000) that anonymizes these
    // dependent rows in place (keeps money, strips identity). Recorded verbatim
    // in the audit row below.
    const TABLES_CLEARED = [
      "profiles",
      "bookings",
      "booking_disputes",
      "case_events",
      "user_credits",
      "credit_redemptions",
      "barber_loyalty_history",
      "referrals",
      "client_notes",
      "account_actions",
      "voucher_redemptions",
      "vouchers",
      "discovery_staging",
      "hand_chart_notes",
      "price_disputes",
      "promo_codes",
      "feature_flags",
      "salon_badge_assignments",
      "salon_documents",
      "salons",
      "site_content",
      // GDPR deletion-completeness sweep (migration 20260713150000): tables
      // whose customer_id/user_id had no FK at all, so they were previously
      // never touched by anything on account deletion.
      "barber_walkin_queue",
      "barber_cut_history",
      "reviews",
      "client_formulas",
      "intake_form_responses",
      "client_photos",
      "nail_design_history",
      "nail_client_preferences",
      "package_purchases",
      "gift_cards",
      "group_bookings",
      "tips",
      "staff_members",
      "salon_clients",
      // review_photos: hard-deleted (DB row + storage bytes) at the
      // application layer, see lib/gdpr/purge-review-photo-storage.ts,
      // the review row itself survives (user_id SET NULL), only the photo
      // rows/bytes are removed.
      "review_photos",
      // user_salon_affinity: composite-PK behavioral scoring rows, no
      // tracked FK on user_id, hard-deleted by the trigger (migration
      // 20260713150000). (user_style_affinity is NOT listed here: it
      // already has a real `ON DELETE CASCADE` FK to auth.users, confirmed
      // in 20260623124500_user_style_affinity.sql, so it needs no help.)
      "user_salon_affinity",
      // spa_treatment_outcomes: client_id has no tracked FK, anonymized in
      // place by the trigger (migration 20260713150000).
      "spa_treatment_outcomes",
    ];

    // RING 3a: the ~19 pre-delete cleanup ops used to run per-user, sequentially
    // (19 awaited queries times N due users). They are now collapsed into ONE IN-list
    // DELETE/UPDATE per table across ALL due users. FK order is preserved exactly:
    // credit_redemptions.credit_id references user_credits.id (NOT NULL, no cascade),
    // so the credit_redemptions IN-list delete for every due user still runs BEFORE
    // the user_credits IN-list delete. The other 17 ops touch disjoint tables/columns
    // with no ordering constraint against that pair or each other, so they run
    // concurrently via Promise.all. A batch op failure is recorded (table + message)
    // and does NOT throw/abort the run: the real per-user GDPR safety net is the
    // auth.admin.deleteUser call below, which hits the SAME NOT NULL/NO ACTION FK
    // constraint and fails for any individual user whose rows weren't actually
    // cleared, exactly as the old per-user pre-check did (see equivalence table in
    // the ring report).
    const userIds = dueUsers.map((u) => u.id);
    const batchErrors: string[] = [];

    // GDPR deletion completeness, storage half: a Postgres trigger cannot call
    // the Storage API, so the client_photos bytes must be removed from the
    // private client-photos bucket HERE, before deleteUser() below cascades
    // and the trigger nulls the DB pointer (see lib/gdpr/purge-client-photo-storage.ts
    // for why the order matters).
    const photoPurge = await purgeClientPhotoStorage(admin, userIds);
    if (photoPurge.errors.length) batchErrors.push(...photoPurge.errors.map((e) => `client-photos storage: ${e}`));

    // GDPR deletion completeness, review-photos half: reviews.user_id is
    // SET NULL (the review row survives for aggregates) so nothing ever
    // cascades to review_photos. Hard-delete the rows + storage bytes here,
    // before deleteUser() below, same reasoning as purgeClientPhotoStorage
    // (see lib/gdpr/purge-review-photo-storage.ts).
    const reviewPhotoPurge = await purgeReviewPhotoStorage(admin, userIds);
    if (reviewPhotoPurge.errors.length) batchErrors.push(...reviewPhotoPurge.errors.map((e) => `review-photos storage: ${e}`));

    const { error: credErr } = await admin.from("credit_redemptions").delete().in("user_id", userIds);
    if (credErr) batchErrors.push(`credit_redemptions: ${credErr.message}`);

    const batchOps: Array<[string, PromiseLike<{ error: { message: string } | null }>]> = [
      ["user_credits", admin.from("user_credits").delete().in("user_id", userIds)],
      ["barber_loyalty_history", admin.from("barber_loyalty_history").delete().in("customer_id", userIds)],
      ["referrals (referrer_id)", admin.from("referrals").delete().in("referrer_id", userIds)],
      ["client_notes", admin.from("client_notes").delete().in("created_by", userIds)],
      ["account_actions", admin.from("account_actions").delete().in("admin_id", userIds)],
      ["referrals (referred_user_id)", admin.from("referrals").update({ referred_user_id: null }).in("referred_user_id", userIds)],
      ["voucher_redemptions", admin.from("voucher_redemptions").update({ user_id: null }).in("user_id", userIds)],
      ["vouchers (buyer_id)", admin.from("vouchers").update({ buyer_id: null }).in("buyer_id", userIds)],
      ["vouchers (redeemed_by)", admin.from("vouchers").update({ redeemed_by: null }).in("redeemed_by", userIds)],
      ["discovery_staging", admin.from("discovery_staging").update({ approved_by: null }).in("approved_by", userIds)],
      ["hand_chart_notes", admin.from("hand_chart_notes").update({ created_by: null }).in("created_by", userIds)],
      ["price_disputes", admin.from("price_disputes").update({ resolved_by: null }).in("resolved_by", userIds)],
      ["promo_codes", admin.from("promo_codes").update({ created_by: null }).in("created_by", userIds)],
      ["feature_flags", admin.from("feature_flags").update({ updated_by: null }).in("updated_by", userIds)],
      ["salon_badge_assignments", admin.from("salon_badge_assignments").update({ assigned_by: null }).in("assigned_by", userIds)],
      ["salon_documents", admin.from("salon_documents").update({ reviewed_by: null }).in("reviewed_by", userIds)],
      ["salons", admin.from("salons").update({ approved_by: null }).in("approved_by", userIds)],
      ["site_content", admin.from("site_content").update({ updated_by: null }).in("updated_by", userIds)],
    ];
    const batchResults = await Promise.all(batchOps.map(([, p]) => p));
    batchOps.forEach(([table], i) => {
      const err = batchResults[i].error;
      if (err) batchErrors.push(`${table}: ${err.message}`);
    });
    if (batchErrors.length) {
      console.error("[api/cron/process-deletions] batch cleanup errors:", batchErrors);
    }

    // Per-user auth delete: the Admin API has no bulk delete, so this stays
    // one call per user. It is also the real safety net (see comment above):
    // it fails per user, isolated, if that user's dependent rows weren't
    // actually cleared by the batch above.
    const results: { id: string; success: boolean; error?: string }[] = [];
    const deletedUsers: typeof dueUsers = [];
    for (const user of dueUsers) {
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) {
        results.push({ id: user.id, success: false, error: error.message });
        continue;
      }
      results.push({ id: user.id, success: true });
      deletedUsers.push(user);
    }

    // Accountability trail (revDSG Art. 25 / GDPR Art. 5(2)): one log row per
    // processed erasure. user_email is NOT NULL, so fall back to a stable
    // sentinel keyed by id if the profile carried no email. Batched into a
    // single insert for all users actually deleted this run.
    if (deletedUsers.length > 0) {
      const { error: logErr } = await admin.from("data_deletion_log").insert(
        deletedUsers.map((user) => ({
          user_email: user.email ?? `deleted-user:${user.id}`,
          requested_at: user.deletion_requested_at ?? null,
          completed_at: new Date().toISOString(),
          tables_cleared: TABLES_CLEARED,
        }))
      );
      if (logErr) {
        console.error("[api/cron/process-deletions] deletion_log insert failed:", logErr);
      }
    }

    return { message: `Processed ${dueUsers.length} users`, results, processed: dueUsers.length };
  } catch (err) {
    console.error("[api/cron/process-deletions] error:", err);
    return { error: "Internal error", errors: ["Internal error"] };
  }
  });
}
