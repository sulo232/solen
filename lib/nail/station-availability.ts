/**
 * Check if a nail salon has available stations at a given time.
 * Returns true if the concurrent booking count is below station_count.
 */
export async function checkStationAvailability(
  supabase: any,
  salonId: string,
  startsAt: Date,
  endsAt: Date
): Promise<{ available: boolean; used: number; total: number }> {
  const { data: station } = await supabase
    .from('nail_stations').select('station_count, sterilization_buffer_minutes')
    .eq('salon_id', salonId).single();

  if (!station) return { available: true, used: 0, total: Infinity };

  const bufferMs = (station.sterilization_buffer_minutes || 0) * 60 * 1000;
  const bufferedEnd = new Date(endsAt.getTime() + bufferMs);

  const { count } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('salon_id', salonId)
    .in('status', ['confirmed', 'pending'])
    .lt('starts_at', bufferedEnd.toISOString())
    .gt('ends_at', startsAt.toISOString());

  return {
    available: (count || 0) < station.station_count,
    used: count || 0,
    total: station.station_count,
  };
}
