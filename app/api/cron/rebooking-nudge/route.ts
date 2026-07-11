export const dynamic = "force-dynamic";
export const runtime = "edge";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, rebookingNudge } from "@/lib/email";
import type { EmailLocale } from "@/lib/email";
import { getServerEnv } from "@/lib/env";
import { withCronRun } from "@/lib/cron-run";

// GET /api/cron/rebooking-nudge
// Daily cron: users whose last booking was 28+ days ago get a nudge email.
export async function GET(request: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return withCronRun("rebooking-nudge", async () => {
  const admin = createAdminSupabaseClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);
  const cutoffStr = cutoff.toISOString();

  // Find users whose most recent completed booking ended 28+ days ago
  // and who haven't received a nudge in the last 28 days
  let rpcResult: { data: unknown[] | null } = { data: null };
  try {
    const { data } = await admin.rpc("get_rebooking_candidates", { cutoff_date: cutoffStr });
    rpcResult = { data };
  } catch {
    rpcResult = { data: null };
  }
  const { data: candidates } = rpcResult;

  // Fallback: manual query if RPC doesn't exist
  let users = candidates;
  if (!users) {
    const { data } = await admin
      .from("bookings")
      .select("user_id, salon_id, starts_at, services(name_de), salons(name)")
      .eq("status", "completed")
      .lt("starts_at", cutoffStr)
      .order("starts_at", { ascending: false });

    // Deduplicate by user_id (keep most recent booking per user)
    const seen = new Set<string>();
    users = (data ?? []).filter((b: any) => {
      if (seen.has(b.user_id)) return false;
      seen.add(b.user_id);
      return true;
    });
  }

  let sent = 0;
  let errors = 0;

  for (const booking of users ?? []) {
    const userId = (booking as any).user_id;

    // Check rebooking preference
    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("rebooking_enabled")
      .eq("user_id", userId)
      .single();

    if (prefs && prefs.rebooking_enabled === false) continue;

    // Cooldown / already-sent guard: the candidate query above has no send-once
    // column, so a user who still hasn't rebooked would otherwise be re-matched
    // and re-emailed every single day the cron runs. Reuses the existing
    // `notifications` table (type='rebooking_nudge'), the same pattern already
    // used for review_prompt tracking elsewhere in the codebase.
    const { data: alreadyNudged } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", userId)
      .eq("type", "rebooking_nudge")
      .gte("created_at", cutoffStr)
      .limit(1)
      .maybeSingle();
    if (alreadyNudged) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email;
    if (!email) continue;

    const { data: profile } = await admin
      .from("profiles")
      .select("locale")
      .eq("id", userId)
      .single();

    const locale: EmailLocale = (profile?.locale as EmailLocale) ?? "de";
    const daysSince = Math.floor(
      (Date.now() - new Date((booking as any).starts_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    try {
      await sendEmail(
        rebookingNudge(
          email,
          {
            service: (booking as any).services?.name_de ?? "Service",
            salon: (booking as any).salons?.name ?? "Salon",
            daysSince,
          },
          locale
        )
      );
      sent++;
      // Record the send so the guard above can suppress a repeat within this cutoff window.
      await admin.from("notifications").insert({
        user_id: userId,
        type: "rebooking_nudge",
        title: "Rebooking nudge sent",
        body: `Nudge email sent, ${daysSince} days since last visit`,
        data: { salon_id: (booking as any).salon_id ?? null, days_since: daysSince },
      });
    } catch {
      errors++;
    }
  }

  return { ok: true, sent, errors, processed: sent };
  });
}
