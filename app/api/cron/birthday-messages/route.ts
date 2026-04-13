export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { sendEmail } from "@/lib/email";

// Cron: Send birthday messages. Daily 8am CET.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminSupabaseClient();

  // Get today's date in Swiss timezone
  const swissNow = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Zurich" });
  const [, month, day] = swissNow.split("-").map(Number);

  // Find profiles with birthday today
  // birthday column is DATE type, extract month and day
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, display_name, birthday, staff_salon_id")
    .not("birthday", "is", null);

  const birthdayProfiles = (profiles ?? []).filter((p) => {
    if (!p.birthday) return false;
    const bday = new Date(p.birthday);
    return bday.getMonth() + 1 === month && bday.getDate() === day;
  });

  let sent = 0;

  for (const profile of birthdayProfiles) {
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
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({ sent, total_birthdays: birthdayProfiles.length });
}
