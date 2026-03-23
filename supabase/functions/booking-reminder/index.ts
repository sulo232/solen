// Edge Function: booking-reminder
// Scheduled: daily at 09:00 ("0 9 * * *")
// Sends 24h-before reminder emails to customers with confirmed bookings.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: "solen.ch <noreply@solen.ch>", to, subject, html }),
  });
  if (!res.ok) console.error("[booking-reminder] Email error:", await res.text());
}

Deno.serve(async () => {
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing env vars", { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Find confirmed bookings starting in the next 24-25 hours
  const now = new Date();
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const windowEnd   = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  const { data: bookings, error } = await admin
    .from("bookings")
    .select("id, user_id, starts_at, services(name_de, name_en), salons(name), profiles!user_id(locale)")
    .eq("status", "confirmed")
    .eq("reminder_sent", false)
    .gte("starts_at", windowStart)
    .lte("starts_at", windowEnd);

  if (error) {
    console.error("[booking-reminder] DB error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const items = bookings ?? [];
  let sent = 0;

  for (const b of items) {
    const { data: authUser } = await admin.auth.admin.getUserById(b.user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    const locale = (b.profiles as any)?.locale ?? "de";
    const serviceName = locale === "en"
      ? (b.services as any)?.name_en ?? (b.services as any)?.name_de
      : (b.services as any)?.name_de ?? "Service";
    const salonName = (b.salons as any)?.name ?? "Salon";
    const timeStr = new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" });

    const subjects: Record<string, string> = {
      de: `Erinnerung: ${serviceName} morgen um ${timeStr}`,
      en: `Reminder: ${serviceName} tomorrow at ${timeStr}`,
      fr: `Rappel: ${serviceName} demain à ${timeStr}`,
    };
    const bodies: Record<string, string> = {
      de: `<p>Hallo,</p><p>Erinnerung: <strong>${serviceName}</strong> bei <strong>${salonName}</strong> ist morgen um ${timeStr} Uhr. Wir freuen uns auf Sie!</p><p>solen.ch</p>`,
      en: `<p>Hello,</p><p>Reminder: <strong>${serviceName}</strong> at <strong>${salonName}</strong> is tomorrow at ${timeStr}. See you then!</p><p>solen.ch</p>`,
      fr: `<p>Bonjour,</p><p>Rappel: <strong>${serviceName}</strong> chez <strong>${salonName}</strong> est demain à ${timeStr}. À bientôt!</p><p>solen.ch</p>`,
    };

    await sendEmail(email, subjects[locale] ?? subjects.de, bodies[locale] ?? bodies.de);
    await admin.from("bookings").update({ reminder_sent: true }).eq("id", b.id);
    sent++;
  }

  console.log(`[booking-reminder] Sent ${sent} reminder emails.`);
  return new Response(JSON.stringify({ sent }), { status: 200 });
});
