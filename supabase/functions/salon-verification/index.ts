// Supabase Edge Function: salon-verification
// Runs on the 1st of every month at 08:00 UTC (via pg_cron).
// Sends verification emails to inactive salons and freezes those that ignore all warnings.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const APP_URL = Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "https://solen.ch";
const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from: "noreply@solen.ch", to, subject, html }),
  });
}

Deno.serve(async (_req: Request) => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  // Query all active salons that haven't verified in 6+ months
  const { data: salons } = await supabase
    .from("salons")
    .select("id, name, owner_id, verification_warnings, last_verified_at, profiles!salons_owner_id_fkey(id)")
    .eq("is_active", true)
    .lt("last_verified_at", sixMonthsAgo.toISOString());

  if (!salons?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { headers: { "Content-Type": "application/json" } });
  }

  let processed = 0;

  for (const salon of salons) {
    const lastVerified = new Date(salon.last_verified_at);
    const twoWeeksHavePassed = Date.now() - lastVerified.getTime() > TWO_WEEKS_MS;

    // Get salon owner email
    const { data: ownerAuth } = await supabase.auth.admin.getUserById(salon.owner_id);
    const ownerEmail = ownerAuth?.user?.email;
    if (!ownerEmail) continue;

    // Generate a short-lived verification token (JWT with salon_id)
    const { data: tokenData } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: ownerEmail,
      options: {
        redirectTo: `${APP_URL}/api/salons/verify`,
        data: { salon_id: salon.id },
      },
    });
    const verifyUrl = tokenData?.properties?.action_link ?? `${APP_URL}/api/salons/verify`;

    const warnings = salon.verification_warnings;

    if (warnings === 0) {
      // First warning
      await sendEmail(
        ownerEmail,
        `Ist dein Salon noch aktiv auf solen.ch?`,
        `<p>Hallo,</p><p>Ist dein Salon <strong>${salon.name}</strong> noch aktiv auf solen.ch? Bitte bestätige hier: <a href="${verifyUrl}">Salon bestätigen</a></p>`
      );
      await supabase.from("salons").update({ verification_warnings: 1 }).eq("id", salon.id);

    } else if (warnings === 1 && twoWeeksHavePassed) {
      await sendEmail(
        ownerEmail,
        `Warnung 2/3: Bitte bestätige deinen Salon`,
        `<p>Hallo,</p><p><strong>Warnung 2/3:</strong> Bitte bestätige, dass dein Salon <strong>${salon.name}</strong> noch aktiv ist. <a href="${verifyUrl}">Salon bestätigen</a></p>`
      );
      await supabase.from("salons").update({ verification_warnings: 2 }).eq("id", salon.id);

    } else if (warnings === 2 && twoWeeksHavePassed) {
      await sendEmail(
        ownerEmail,
        `Letzte Warnung 3/3: Dein Salon wird eingefroren`,
        `<p>Hallo,</p><p><strong>Letzte Warnung 3/3:</strong> Dein Salon <strong>${salon.name}</strong> wird demnächst eingefroren. <a href="${verifyUrl}">Jetzt bestätigen</a></p>`
      );
      await supabase.from("salons").update({ verification_warnings: 3 }).eq("id", salon.id);

    } else if (warnings >= 3 && twoWeeksHavePassed) {
      // FREEZE the salon
      await supabase
        .from("salons")
        .update({ is_active: false })
        .eq("id", salon.id);

      // Cancel all future bookings
      const { data: futureBookings } = await supabase
        .from("bookings")
        .select("id, user_id, starts_at, services(name_de)")
        .eq("salon_id", salon.id)
        .eq("status", "confirmed")
        .gte("starts_at", new Date().toISOString());

      for (const booking of futureBookings ?? []) {
        await supabase
          .from("bookings")
          .update({ status: "cancelled", cancellation_reason: "Salon frozen due to inactivity", cancelled_at: new Date().toISOString() })
          .eq("id", booking.id);

        // Free the slot
        await supabase
          .from("availability_slots")
          .update({ status: "available", booked_by: null, booking_id: null })
          .eq("booking_id", booking.id);

        // Email affected customer
        const { data: customerAuth } = await supabase.auth.admin.getUserById(booking.user_id);
        if (customerAuth?.user?.email) {
          const serviceData = booking.services as { name_de: string } | null;
          await sendEmail(
            customerAuth.user.email,
            `Deine Buchung bei ${salon.name} wurde storniert`,
            `<p>Hallo,</p><p>Deine Buchung für <strong>${serviceData?.name_de ?? "einen Service"}</strong> bei <strong>${salon.name}</strong> wurde storniert, weil der Salon derzeit inaktiv ist.</p>`
          );
        }
      }

      // Notify salon owner
      await sendEmail(
        ownerEmail,
        `Dein Salon wurde eingefroren`,
        `<p>Hallo,</p><p>Dein Salon <strong>${salon.name}</strong> wurde wegen Inaktivität eingefroren. Bitte kontaktiere uns um ihn wieder zu aktivieren.</p>`
      );
    }

    processed++;
  }

  return new Response(JSON.stringify({ processed }), {
    headers: { "Content-Type": "application/json" },
  });
});
