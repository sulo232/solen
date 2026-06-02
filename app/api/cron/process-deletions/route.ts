export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getServerEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  try {
    const cronSecret = getServerEnv().CRON_SECRET;
    if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
    const adminAuth = request.headers.get("Authorization");
    // VERY simple auth for cron jobs — `CRON_SECRET` env var must match the secret
    // sent by `.github/workflows/cron-jobs.yml` (GitHub Actions invokes this route)
    if (adminAuth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      return NextResponse.json({ message: "No users to delete" });
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
    const TABLES_CLEARED = ["profiles", "bookings", "booking_disputes", "case_events"];

    const results = [];
    for (const user of usersToDelete) {
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

    return NextResponse.json({ message: `Processed ${usersToDelete.length} users`, results });
  } catch (err) {
    console.error("[api/cron/process-deletions] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
