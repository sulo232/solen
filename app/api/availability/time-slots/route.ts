import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const salonId = req.nextUrl.searchParams.get('salon_id');
    const date = req.nextUrl.searchParams.get('date');
    const staffId = req.nextUrl.searchParams.get('staff_id') || null;
    const serviceIds = req.nextUrl.searchParams.get('service_ids')?.split(',').filter(Boolean) || [];
    const durationMinutes = parseInt(
      req.nextUrl.searchParams.get('duration_minutes') || '30'
    );

    if (!salonId || !date) {
      return NextResponse.json(
        { error: 'Missing salon_id or date', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (serviceIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing service_ids', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Get admin client to bypass RLS
    const adminClient = createAdminSupabaseClient();

    // Query: available slots that can accommodate the duration.
    // Day boundaries are the SWISS calendar day rendered as true UTC instants
    // (slots store real instants since the 2026-06-12 generator fix).
    const zOff = (() => {
      const guess = new Date(`${date}T12:00:00Z`);
      const asUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
      const asZ = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
      return asZ.getTime() - asUtc.getTime();
    })();
    const startOfDay = new Date(new Date(`${date}T00:00:00Z`).getTime() - zOff).toISOString();
    const endOfDay = new Date(new Date(`${date}T23:59:59Z`).getTime() - zOff).toISOString();

    let query = adminClient
      .from('availability_slots')
      .select('id, starts_at, ends_at')
      .eq('salon_id', salonId)
      .eq('status', 'available')
      .gte('starts_at', startOfDay)
      .lte('starts_at', endOfDay)
      .in('service_id', serviceIds);

    if (staffId) {
      query = query.eq('staff_member_id', staffId);
    }

    const { data: slots, error: slotsError } = await query;

    if (slotsError) {
      console.error('[/api/availability/time-slots] DB error:', slotsError);
      throw slotsError;
    }

    // Filter slots by duration (slot must be at least durationMinutes long)
    const validSlots = (slots || []).filter((slot) => {
      const start = new Date(slot.starts_at);
      const end = new Date(slot.ends_at);
      const durationMs = end.getTime() - start.getTime();
      const durationMinutesSlot = durationMs / (60 * 1000);
      return durationMinutesSlot >= durationMinutes;
    });

    // Extract unique start times (30-min intervals)
    const times = Array.from(
      new Set(
        validSlots.map((slot) =>
          // 2026-06-12: slots now store TRUE instants (generator tz fix), so labels
          // are formatted in Europe/Zurich. The old getUTC* read assumed the retired
          // "wall-clock-tagged-UTC" convention and showed 09:00 CH as "07:00" — the
          // picked label then round-tripped to a nonexistent instant -> 409 SLOT_TAKEN.
          new Intl.DateTimeFormat("de-CH", {
            timeZone: "Europe/Zurich",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }).format(new Date(slot.starts_at))
        )
      )
    ).sort();

    // Grey out times the LOGGED-IN customer already booked at this salon that day
    // (owner 2026-06-12: "is there even a mechanism of graying it out?") — better
    // than letting the tap run into the 409 DUPLICATE_BOOKING backstop.
    const mineTimes = new Set<string>();
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: mine } = await adminClient
          .from('bookings')
          .select('starts_at')
          .eq('salon_id', salonId)
          .eq('user_id', user.id)
          .in('status', ['pending', 'confirmed'])
          .gte('starts_at', startOfDay)
          .lte('starts_at', endOfDay);
        const fmt = new Intl.DateTimeFormat('de-CH', { timeZone: 'Europe/Zurich', hour: '2-digit', minute: '2-digit', hour12: false });
        for (const b of mine ?? []) mineTimes.add(fmt.format(new Date(b.starts_at)));
      }
    } catch (err) { console.error("[availability/time-slots] mine-times lookup failed (anon / cookie-less callers: no personal greying, the 409 guard remains):", err); }

    // Every returned slot is already filtered to status='available' above, so it IS bookable.
    // DateTimeStep gates each slot on `slot.isAvailable`; emit it explicitly so the field the
    // UI reads is never undefined (undefined → every slot rendered disabled → booking dead).
    return NextResponse.json({ slots: times.map((time) => ({ time, isAvailable: !mineTimes.has(time) })) });
  } catch (error) {
    console.error('[/api/availability/time-slots]', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
