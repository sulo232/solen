export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";
import { withCronRun } from "@/lib/cron-run";

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
    
    // Delete them via Auth API (triggers will cascade data if set up correctly, or auth handles it)
    // Wait, admin.auth.admin.deleteUser handles the CASCADE to profiles via the DB?
    // Actually, destroying the auth user normally deletes the profile if it's CASCADE, 
    // but in Supabase, the user deletion might not cascade to `public.profiles` unless the foreign key is set to CASCADE.
    // However, calling admin.auth.admin.deleteUser(id) is the official way.
    
    // Tables the registered-user deletion path anonymizes/clears. The auth-user
    // delete cascades to public.profiles, which fires the BEFORE DELETE trigger
    // (migration 20260602083300) that anonymizes these dependent rows in place
    // (keeps money, strips identity). Recorded verbatim in the audit row below.
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
    ];

    const results = [];
    for (const user of usersToDelete) {
      // GDPR: these tables reference auth.users/profiles with ON DELETE NO ACTION, so the
      // auth-user delete below fails (FK violation) unless the referencing rows are
      // cleared/anonymized FIRST. NOT NULL columns are deleted; nullable columns are set to
      // null (keeps the record, strips the user link). Run SEQUENTIALLY, not in parallel:
      // credit_redemptions.credit_id references user_credits.id (NOT NULL, no cascade), so
      // credit_redemptions is cleared before user_credits below.
      const cleanups: Array<[string, { error: { message: string } | null }]> = [];
      cleanups.push(["credit_redemptions", await admin.from("credit_redemptions").delete().eq("user_id", user.id)]);
      cleanups.push(["user_credits", await admin.from("user_credits").delete().eq("user_id", user.id)]);
      cleanups.push(["barber_loyalty_history", await admin.from("barber_loyalty_history").delete().eq("customer_id", user.id)]);
      cleanups.push(["referrals (referrer_id)", await admin.from("referrals").delete().eq("referrer_id", user.id)]);
      cleanups.push(["client_notes", await admin.from("client_notes").delete().eq("created_by", user.id)]);
      cleanups.push(["account_actions", await admin.from("account_actions").delete().eq("admin_id", user.id)]);
      cleanups.push(["referrals (referred_user_id)", await admin.from("referrals").update({ referred_user_id: null }).eq("referred_user_id", user.id)]);
      cleanups.push(["voucher_redemptions", await admin.from("voucher_redemptions").update({ user_id: null }).eq("user_id", user.id)]);
      cleanups.push(["vouchers (buyer_id)", await admin.from("vouchers").update({ buyer_id: null }).eq("buyer_id", user.id)]);
      cleanups.push(["vouchers (redeemed_by)", await admin.from("vouchers").update({ redeemed_by: null }).eq("redeemed_by", user.id)]);
      cleanups.push(["discovery_staging", await admin.from("discovery_staging").update({ approved_by: null }).eq("approved_by", user.id)]);
      cleanups.push(["hand_chart_notes", await admin.from("hand_chart_notes").update({ created_by: null }).eq("created_by", user.id)]);
      cleanups.push(["price_disputes", await admin.from("price_disputes").update({ resolved_by: null }).eq("resolved_by", user.id)]);
      cleanups.push(["promo_codes", await admin.from("promo_codes").update({ created_by: null }).eq("created_by", user.id)]);
      cleanups.push(["feature_flags", await admin.from("feature_flags").update({ updated_by: null }).eq("updated_by", user.id)]);
      cleanups.push(["salon_badge_assignments", await admin.from("salon_badge_assignments").update({ assigned_by: null }).eq("assigned_by", user.id)]);
      cleanups.push(["salon_documents", await admin.from("salon_documents").update({ reviewed_by: null }).eq("reviewed_by", user.id)]);
      cleanups.push(["salons", await admin.from("salons").update({ approved_by: null }).eq("approved_by", user.id)]);
      cleanups.push(["site_content", await admin.from("site_content").update({ updated_by: null }).eq("updated_by", user.id)]);

      const failedCleanup = cleanups.find(([, r]) => r.error);
      if (failedCleanup) {
        const [failedTable, { error: cleanupError }] = failedCleanup;
        console.error("[api/cron/process-deletions] pre-delete cleanup failed for", user.id, "at", failedTable, ":", cleanupError);
        results.push({ id: user.id, success: false, error: `pre-delete cleanup failed (${failedTable}): ${cleanupError?.message}` });
        continue;
      }

      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) {
        results.push({ id: user.id, success: false, error: error.message });
        continue;
      }
      results.push({ id: user.id, success: true });

      // Accountability trail (revDSG Art. 25 / GDPR Art. 5(2)): one log row per
      // processed erasure. user_email is NOT NULL — fall back to a stable
      // sentinel keyed by id if the profile carried no email.
      const { error: logErr } = await admin.from("data_deletion_log").insert({
        user_email: user.email ?? `deleted-user:${user.id}`,
        requested_at: user.deletion_requested_at ?? null,
        completed_at: new Date().toISOString(),
        tables_cleared: TABLES_CLEARED,
      });
      if (logErr) {
        console.error("[api/cron/process-deletions] deletion_log insert failed:", logErr);
      }
    }

    return { message: `Processed ${usersToDelete.length} users`, results, processed: usersToDelete.length };
  } catch (err) {
    console.error("[api/cron/process-deletions] error:", err);
    return { error: "Internal error", errors: ["Internal error"] };
  }
  });
}
