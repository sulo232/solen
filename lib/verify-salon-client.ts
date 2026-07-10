import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * There is no salon_clients table. A customer belongs to a salon if they have
 * a booking there (any status, not just completed) OR a barber_walkin_queue
 * entry there. This is the ONLY relationship a CRM write (note, tag, formula,
 * photo, cut/nail/consultation history, ...) should trust before attaching a
 * request-supplied client_id/customer_id to a salon's records, otherwise a
 * salon owner can write an attacker-controlled record onto an arbitrary user
 * UUID (IDOR). Reference pattern: app/api/dashboard/barber-reminders/send/route.ts.
 *
 * Pass the admin (service-role) client so the check sees across RLS. Never
 * throws on a not-found lookup, only resolves to false.
 */
export async function clientBelongsToSalon(
  admin: SupabaseClient,
  salonId: string,
  clientId: string,
): Promise<boolean> {
  const { data: booking } = await admin
    .from("bookings")
    .select("id")
    .eq("salon_id", salonId)
    .eq("user_id", clientId)
    .limit(1)
    .maybeSingle();
  if (booking) return true;

  const { data: walkin } = await admin
    .from("barber_walkin_queue")
    .select("id")
    .eq("salon_id", salonId)
    .eq("customer_id", clientId)
    .limit(1)
    .maybeSingle();

  return !!walkin;
}
