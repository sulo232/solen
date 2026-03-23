// Edge Function: salon-verification
// Scheduled: runs on the 1st of every month
// Escalates verification warnings and freezes inactive salons

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const BASE_URL = Deno.env.get("NEXT_PUBLIC_SITE_URL") ?? "https://solen.ch";
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: "solen.ch <noreply@solen.ch>", to, subject, html }),
  });
}

// Scheduled: "0 0 1 * *" = midnight on the 1st of every month
Deno.cron("salon-verification", "0 0 1 * *", async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const sixMonthsAgo = new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString();
  const twoWeeksAgo = new Date(Date.now() - TWO_WEEKS_MS).toISOString();

  const { data: salons } = await supabase
    .from("salons")
    .select("id, name, owner_id, verification_warnings, last_verified_at")
    .lt("last_verified_at", sixMonthsAgo)
    .eq("is_active", true);

  if (!salons || salons.length === 0) return;

  for (const salon of salons) {
    const { data: ownerAuth } = await supabase.auth.admin.getUserById(salon.owner_id);
    const ownerEmail = ownerAuth?.user?.email;
    if (!ownerEmail) continue;

    const verifyToken = btoa(JSON.stringify({ salon_id: salon.id, owner_id: salon.owner_id, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 }));
    const confirmUrl = `${BASE_URL}/api/salons/verify?token=${verifyToken}&salon_id=${salon.id}`;
    const warnings = salon.verification_warnings;
    const lastVerified = new Date(salon.last_verified_at).getTime();

    if (warnings === 0) {
      // First warning
      await sendEmail(ownerEmail,
        "Ist Ihr Salon noch aktiv auf solen.ch?",
        `<p>Hallo,</p><p>Wir haben bemerkt, dass <strong>${salon.name}</strong> seit mehr als 6 Monaten nicht bestätigt wurde. Bitte klicken Sie auf den Link, um zu bestätigen, dass Ihr Salon noch aktiv ist:</p><p><a href="${confirmUrl}">Salon bestätigen</a></p>`
      );
      await supabase.from("salons").update({ verification_warnings: 1 }).eq("id", salon.id);

    } else if (warnings === 1 && lastVerified < Date.now() - TWO_WEEKS_MS) {
      await sendEmail(ownerEmail,
        "Warnung 2/3: Bitte bestätigen Sie Ihren Salon",
        `<p>Warnung 2 von 3: <strong>${salon.name}</strong> wurde noch nicht bestätigt. <a href="${confirmUrl}">Jetzt bestätigen</a></p>`
      );
      await supabase.from("salons").update({ verification_warnings: 2 }).eq("id", salon.id);

    } else if (warnings === 2 && lastVerified < Date.now() - TWO_WEEKS_MS) {
      await sendEmail(ownerEmail,
        "Letzte Warnung: Ihr Salon wird eingefroren",
        `<p>Letzte Warnung: <strong>${salon.name}</strong> wird in 14 Tagen eingefroren, wenn keine Bestätigung erfolgt. <a href="${confirmUrl}">Jetzt bestätigen</a></p>`
      );
      await supabase.from("salons").update({ verification_warnings: 3 }).eq("id", salon.id);

    } else if (warnings >= 3 && lastVerified < Date.now() - TWO_WEEKS_MS) {
      // FREEZE the salon
      await supabase.from("salons").update({ is_active: false }).eq("id", salon.id);

      // Cancel all future bookings
      const { data: futureBookings } = await supabase
        .from("bookings")
        .select("id, user_id, starts_at, services(name_de)")
        .eq("salon_id", salon.id)
        .eq("status", "confirmed")
        .gte("starts_at", new Date().toISOString());

      if (futureBookings) {
        for (const booking of futureBookings) {
          await supabase.from("bookings").update({
            status: "cancelled",
            cancellation_reason: "Salon frozen due to inactivity",
            cancelled_at: new Date().toISOString(),
          }).eq("id", booking.id);

          // Free the slot
          await supabase.from("availability_slots")
            .update({ status: "available", booked_by: null, booking_id: null })
            .eq("booking_id", booking.id);

          // Notify customer
          const { data: customer } = await supabase.auth.admin.getUserById(booking.user_id);
          if (customer?.user?.email) {
            const serviceName = (booking.services as { name_de: string } | null)?.name_de ?? "Service";
            await sendEmail(customer.user.email,
              `Ihre Buchung bei ${salon.name} wurde storniert`,
              `<p>Ihre Buchung für <strong>${serviceName}</strong> bei <strong>${salon.name}</strong> am ${new Date(booking.starts_at).toLocaleDateString("de-CH")} wurde storniert, da der Salon nicht mehr aktiv ist.</p>`
            );
          }
        }
      }

      // Notify salon owner
      await sendEmail(ownerEmail,
        "Ihr Salon wurde aufgrund von Inaktivität gesperrt",
        `<p><strong>${salon.name}</strong> wurde auf solen.ch gesperrt. Kontaktieren Sie support@solen.ch zur Reaktivierung.</p>`
      );
    }
  }
});

// Also serve as HTTP endpoint for manual triggers
Deno.serve(() => new Response(JSON.stringify({ ok: true, message: "Salon verification cron active" }), {
  headers: { "Content-Type": "application/json" },
}));
