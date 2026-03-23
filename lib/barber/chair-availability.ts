/** Checks BOTH bookings AND in_chair walk-ins against chair limit. */
export async function checkChairAvailability(
  supabase: any,
  salonId: string,
  startsAt: Date,
  endsAt: Date
): Promise<{ available: boolean; used: number; total: number }> {
  const { data: chairs } = await supabase
    .from("barber_chairs")
    .select("chair_count, buffer_minutes")
    .eq("salon_id", salonId)
    .single();

  if (!chairs) return { available: true, used: 0, total: Infinity };

  const bufferMs = (chairs.buffer_minutes || 0) * 60 * 1000;
  const bufferedEnd = new Date(endsAt.getTime() + bufferMs);

  // Count overlapping bookings
  const { count: bookingCount } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .in("status", ["confirmed", "pending"])
    .lt("starts_at", bufferedEnd.toISOString())
    .gt("ends_at", startsAt.toISOString());

  // Count in-chair walk-ins
  const { count: walkinCount } = await supabase
    .from("barber_walkin_queue")
    .select("*", { count: "exact", head: true })
    .eq("salon_id", salonId)
    .eq("status", "in_chair");

  const used = (bookingCount || 0) + (walkinCount || 0);
  return { available: used < chairs.chair_count, used, total: chairs.chair_count };
}
