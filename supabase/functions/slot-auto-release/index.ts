// Edge Function: slot-auto-release
// Scheduled: every hour ("0 * * * *")
// Releases booked availability_slots where the booking was never completed
// within 72h (payment_status = 'deposit_held' but booking is past starts_at by 72h).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

Deno.serve(async () => {
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response("Missing env vars", { status: 500 });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString();

  // Find bookings that are still 'confirmed' but started more than 72h ago
  // These should have been marked 'completed' or 'no_show' by the salon — auto-release if not.
  const { data: staleBookings, error } = await admin
    .from("bookings")
    .select("id, slot_id")
    .eq("status", "confirmed")
    .lt("starts_at", cutoff);

  if (error) {
    console.error("[slot-auto-release] DB error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const bookings = staleBookings ?? [];
  if (bookings.length === 0) {
    return new Response(JSON.stringify({ released: 0 }), { status: 200 });
  }

  // Mark as completed (auto) and free the slot
  const bookingIds = bookings.map((b) => b.id);
  const slotIds = bookings.map((b) => b.slot_id).filter(Boolean);

  await admin
    .from("bookings")
    .update({ status: "completed", auto_completed: true })
    .in("id", bookingIds);

  if (slotIds.length > 0) {
    await admin
      .from("availability_slots")
      .update({ status: "available", booked_by: null, booking_id: null })
      .in("id", slotIds);
  }

  console.log(`[slot-auto-release] Released ${bookings.length} stale bookings.`);
  return new Response(JSON.stringify({ released: bookings.length }), { status: 200 });
});
