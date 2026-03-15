// Supabase Edge Function: recurring-booking-processor
// Runs daily at 00:01 UTC (via pg_cron).
// Creates upcoming bookings for active recurring rules.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

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

function advanceDate(
  date: Date,
  frequency: string,
  customIntervalDays?: number | null
): Date {
  const next = new Date(date);
  switch (frequency) {
    case "weekly":   next.setDate(next.getDate() + 7);    break;
    case "biweekly": next.setDate(next.getDate() + 14);   break;
    case "monthly":  next.setMonth(next.getMonth() + 1);  break;
    case "custom":   next.setDate(next.getDate() + (customIntervalDays ?? 7)); break;
  }
  return next;
}

Deno.serve(async (_req: Request) => {
  const today = new Date();
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Fetch all active rules due within 7 days
  const { data: rules } = await supabase
    .from("recurring_booking_rules")
    .select("*, salons(name), services(name_de, duration_minutes, price), profiles!recurring_booking_rules_user_id_fkey(id)")
    .eq("is_active", true)
    .lte("next_booking_date", sevenDaysFromNow.toISOString().split("T")[0]);

  if (!rules?.length) {
    return new Response(JSON.stringify({ processed: 0 }), { headers: { "Content-Type": "application/json" } });
  }

  let booked = 0, failed = 0;

  for (const rule of rules) {
    const salon   = rule.salons   as { name: string };
    const service = rule.services as { name_de: string; duration_minutes: number; price: number };

    // Find a matching available slot
    const targetDate = new Date(rule.next_booking_date);
    const dayStart   = new Date(targetDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd     = new Date(targetDate); dayEnd.setHours(23, 59, 59, 999);

    let slotQuery = supabase
      .from("availability_slots")
      .select("*")
      .eq("salon_id", rule.salon_id)
      .eq("service_id", rule.service_id)
      .eq("status", "available")
      .gte("starts_at", dayStart.toISOString())
      .lte("starts_at", dayEnd.toISOString());

    if (rule.staff_member_id) {
      slotQuery = slotQuery.eq("staff_member_id", rule.staff_member_id);
    }

    if (rule.preferred_time) {
      const [h, m] = rule.preferred_time.split(":").map(Number);
      const preferredStart = new Date(targetDate);
      preferredStart.setHours(h, m, 0, 0);
      // Find slot closest to preferred time
      slotQuery = slotQuery.gte("starts_at", preferredStart.toISOString());
    }

    const { data: slots } = await slotQuery.limit(1);
    const slot = slots?.[0];

    // Get user email
    const { data: userAuth } = await supabase.auth.admin.getUserById(rule.user_id);
    const userEmail = userAuth?.user?.email;

    if (!slot) {
      // No slot found — notify customer
      if (userEmail) {
        await sendEmail(
          userEmail,
          `Wiederkehrende Buchung fehlgeschlagen: ${service.name_de}`,
          `<p>Hallo,</p><p>Deine wiederkehrende Buchung für <strong>${service.name_de}</strong> bei <strong>${salon.name}</strong> am <strong>${rule.next_booking_date}</strong> konnte nicht automatisch gebucht werden. Bitte buche manuell nach.</p>`
        );
      }
      failed++;
      continue;
    }

    const pricePaid = slot.price_override ?? service.price;

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id:            rule.user_id,
        salon_id:           rule.salon_id,
        service_id:         rule.service_id,
        staff_member_id:    rule.staff_member_id ?? slot.staff_member_id,
        slot_id:            slot.id,
        starts_at:          slot.starts_at,
        ends_at:            slot.ends_at,
        price_paid:         pricePaid,
        status:             "confirmed",
        is_first_visit:     false,
        is_recurring:       true,
      })
      .select()
      .single();

    if (bookingError) {
      failed++;
      continue;
    }

    // Mark slot as booked
    await supabase
      .from("availability_slots")
      .update({ status: "booked", booked_by: rule.user_id, booking_id: booking.id })
      .eq("id", slot.id);

    // Advance next_booking_date
    const nextDate = advanceDate(
      new Date(rule.next_booking_date),
      rule.frequency,
      rule.custom_interval_days
    );

    await supabase
      .from("recurring_booking_rules")
      .update({ next_booking_date: nextDate.toISOString().split("T")[0] })
      .eq("id", rule.id);

    // Send confirmation email
    if (userEmail) {
      await sendEmail(
        userEmail,
        `Buchungsbestätigung: ${service.name_de} bei ${salon.name}`,
        `<p>Hallo,</p><p>Dein Termin für <strong>${service.name_de}</strong> bei <strong>${salon.name}</strong> am <strong>${slot.starts_at}</strong> ist bestätigt.</p>`
      );
    }

    booked++;
  }

  return new Response(JSON.stringify({ booked, failed }), {
    headers: { "Content-Type": "application/json" },
  });
});
