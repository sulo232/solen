// Edge Function: smart-nudges
// Scheduled: daily at 10:00 ("0 10 * * *")
// Sends re-booking nudges, review prompts, and welcome series emails.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";

const admin = createClient(supabaseUrl, serviceRoleKey);

async function sendEmail(to: string, subject: string, html: string) {
  if (!resendKey || resendKey === "PASTE_RESEND_KEY_HERE") {
    console.warn("[smart-nudges] RESEND_API_KEY not set — skipping");
    return;
  }
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "solen.ch <noreply@solen.ch>", to, subject, html }),
  });
}

const DAY_MS = 24 * 60 * 60 * 1000;

Deno.serve(async () => {
  try {
    const now = new Date();
    let rebookingSent = 0;
    let reviewsSent = 0;
    let welcomeSent = 0;

    // ─── 1. Re-booking nudges ───
    const { data: prefs } = await admin
      .from("user_preferences")
      .select("user_id, avg_booking_interval_days, last_nudge_sent_at")
      .not("avg_booking_interval_days", "is", null);

    for (const pref of prefs ?? []) {
      const interval = pref.avg_booking_interval_days ?? 28;

      // Skip if nudged within last 7 days
      if (pref.last_nudge_sent_at && (now.getTime() - new Date(pref.last_nudge_sent_at).getTime()) < 7 * DAY_MS) {
        continue;
      }

      // Find last booking for this user
      const { data: lastBooking } = await admin
        .from("bookings")
        .select("starts_at, salon_id, service_id")
        .eq("user_id", pref.user_id)
        .in("status", ["confirmed", "completed"])
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!lastBooking) continue;

      const daysSince = Math.floor((now.getTime() - new Date(lastBooking.starts_at).getTime()) / DAY_MS);
      if (daysSince < interval) continue;

      // Fetch salon + service names
      const { data: salon } = await admin.from("salons").select("name").eq("id", lastBooking.salon_id).single();
      const { data: service } = await admin.from("services").select("name_de").eq("id", lastBooking.service_id).single();
      const { data: userAuth } = await admin.auth.admin.getUserById(pref.user_id);

      if (userAuth?.user?.email && salon && service) {
        await sendEmail(
          userAuth.user.email,
          `Zeit für einen neuen Termin bei ${salon.name}?`,
          `<p>Dein letzter <strong>${service.name_de}</strong>-Termin bei <strong>${salon.name}</strong> war vor ${daysSince} Tagen.</p><p><a href="https://solen.ch">Neuen Termin buchen →</a></p>`
        );
        await admin.from("user_preferences").update({ last_nudge_sent_at: now.toISOString() }).eq("user_id", pref.user_id);
        rebookingSent++;
      }
    }

    // ─── 2. Review prompts ───
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
    const { data: completedBookings } = await admin
      .from("bookings")
      .select("id, user_id, salon_id, service_id, ends_at")
      .eq("status", "completed")
      .lt("ends_at", twoHoursAgo)
      .gte("ends_at", new Date(now.getTime() - 3 * DAY_MS).toISOString()); // Only last 3 days

    for (const booking of completedBookings ?? []) {
      // Check if review already exists
      const { count } = await admin
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("user_id", booking.user_id)
        .eq("salon_id", booking.salon_id);

      if ((count ?? 0) > 0) continue;

      const { data: salon } = await admin.from("salons").select("name, slug").eq("id", booking.salon_id).single();
      const { data: service } = await admin.from("services").select("name_de").eq("id", booking.service_id).single();
      const { data: userAuth } = await admin.auth.admin.getUserById(booking.user_id);

      if (userAuth?.user?.email && salon && service) {
        const reviewUrl = `https://solen.ch/de/salon/${salon.slug}#reviews`;
        await sendEmail(
          userAuth.user.email,
          `Wie war dein Besuch bei ${salon.name}?`,
          `<p>Vielen Dank für deinen <strong>${service.name_de}</strong>-Termin bei <strong>${salon.name}</strong>!</p><p><a href="${reviewUrl}">Bewertung schreiben →</a></p>`
        );
        reviewsSent++;
      }
    }

    // ─── 3. Welcome series ───
    const welcomeSteps = [
      { step: 1, minDays: 0, maxDays: 1 },
      { step: 2, minDays: 3, maxDays: 4 },
      { step: 3, minDays: 7, maxDays: 8 },
    ];

    for (const ws of welcomeSteps) {
      const minDate = new Date(now.getTime() - ws.maxDays * DAY_MS).toISOString();
      const maxDate = new Date(now.getTime() - ws.minDays * DAY_MS).toISOString();

      const { data: users } = await admin
        .from("user_preferences")
        .select("user_id, welcome_step")
        .lt("welcome_step", ws.step)
        .gte("user_id", minDate); // This won't work — need a join on profiles.created_at

      // Use profiles table for created_at filtering
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, display_name, created_at")
        .gte("created_at", minDate)
        .lt("created_at", maxDate);

      for (const profile of profiles ?? []) {
        // Check welcome_step
        const { data: pref } = await admin
          .from("user_preferences")
          .select("welcome_step")
          .eq("user_id", profile.id)
          .maybeSingle();

        if ((pref?.welcome_step ?? 0) >= ws.step) continue;

        const { data: userAuth } = await admin.auth.admin.getUserById(profile.id);
        if (!userAuth?.user?.email) continue;

        const name = profile.display_name ?? "dort";
        const subjects: Record<number, string> = {
          1: `Willkommen bei solen.ch, ${name}!`,
          2: `Entdecke Last-Minute-Angebote, ${name}`,
          3: `Dein Profil vervollständigen`,
        };
        const htmls: Record<number, string> = {
          1: `<p>Hallo <strong>${name}</strong>,</p><p>Willkommen bei solen.ch — deiner Plattform für Beauty & Wellness in Basel.</p><p><a href="https://solen.ch/de/explore">Entdecke Salons →</a></p>`,
          2: `<p>Wusstest du, dass viele Salons Last-Minute-Rabatte anbieten? Spare bis zu 50 %.</p><p><a href="https://solen.ch/de/explore?filter=lastminute">Last-Minute ansehen →</a></p>`,
          3: `<p>Vervollständige dein Profil für personalisierte Empfehlungen.</p><p><a href="https://solen.ch/de/account">Profil bearbeiten →</a></p>`,
        };

        await sendEmail(userAuth.user.email, subjects[ws.step], htmls[ws.step]);
        await admin.from("user_preferences").upsert(
          { user_id: profile.id, welcome_step: ws.step },
          { onConflict: "user_id" }
        );
        welcomeSent++;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, rebooking_sent: rebookingSent, reviews_sent: reviewsSent, welcome_sent: welcomeSent }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[smart-nudges] error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
  }
});
