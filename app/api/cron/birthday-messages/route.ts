export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";
import { getServerEnv } from "@/lib/env";

// Cron: Send birthday messages. Daily 8am CET.
export async function GET(req: NextRequest) {
  const cronSecret = getServerEnv().CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  // Get today's date in Swiss timezone
  const swissNow = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Zurich" });
  const [year, month, day] = swissNow.split("-").map(Number);
  const yearStart = `${year}-01-01T00:00:00Z`;

  // Find profiles with birthday today
  // date_of_birth column is DATE type, extract month and day
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, date_of_birth, staff_salon_id")
    .not("date_of_birth", "is", null);

  const birthdayProfiles = (profiles ?? []).filter((p) => {
    if (!p.date_of_birth) return false;
    const bday = new Date(p.date_of_birth);
    return bday.getMonth() + 1 === month && bday.getDate() === day;
  });

  let sent = 0;

  for (const profile of birthdayProfiles) {
    // Idempotency guard: mirrors the notifications-table sent-log pattern used by
    // cron/rebooking-nudge (query before send, insert after send) so a re-run/overlapping
    // tick doesn't re-send the birthday email to the same profile within the same year.
    const { data: alreadySent } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", profile.id)
      .eq("type", "birthday_message")
      .gte("created_at", yearStart)
      .limit(1)
      .maybeSingle();
    if (alreadySent) continue;

    // Get user email
    const { data: userAuth } = await admin.auth.admin.getUserById(profile.id);
    const email = userAuth?.user?.email;
    if (!email) continue;

    try {
      await sendEmail({
        to: email,
        subject: `Alles Gute zum Geburtstag, ${profile.display_name ?? ""}! 🎂`,
        html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;text-align:center">
<h2 style="color:#C05038">Happy Birthday!</h2>
<p>Liebe/r ${profile.display_name ?? "Kunde/in"},</p>
<p>Wir wünschen dir alles Gute zum Geburtstag! 🎉</p>
<p>Als kleines Geschenk haben wir eine Überraschung für dich.</p>
<p><a href="https://www.solen.ch" style="display:inline-block;padding:12px 24px;background:#C05038;color:#fff;border-radius:8px;text-decoration:none">Jetzt entdecken →</a></p>
</div>`,
      });
      sent++;
      // Record the send so the guard above suppresses a repeat within this calendar year.
      await admin.from("notifications").insert({
        user_id: profile.id,
        type: "birthday_message",
        title: "Birthday message sent",
        body: `Birthday email sent for ${swissNow}`,
        data: { year },
      });
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ sent, total_birthdays: birthdayProfiles.length });
}
