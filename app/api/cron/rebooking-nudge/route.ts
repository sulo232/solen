import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail, rebookingNudge } from "@/lib/email";
import type { EmailLocale } from "@/lib/email";

// GET /api/cron/rebooking-nudge
// Daily cron: users whose last booking was 28+ days ago get a nudge email.
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 28);
  const cutoffStr = cutoff.toISOString();

  // Find users whose most recent completed booking ended 28+ days ago
  // and who haven't received a nudge in the last 28 days
  const { data: candidates } = await admin.rpc("get_rebooking_candidates", {
    cutoff_date: cutoffStr,
  }).catch(() => ({ data: null }));

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
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ ok: true, sent, errors });
}
