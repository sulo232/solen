import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const salonId = req.nextUrl.searchParams.get('salon_id');
    const staffId = req.nextUrl.searchParams.get('staff_id');
    const serviceIds = req.nextUrl.searchParams.get('service_ids')?.split(',').filter(Boolean) || [];

    if (!salonId) {
      return NextResponse.json(
        { error: 'Missing salon_id' },
        { status: 400 }
      );
    }

    if (serviceIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing service_ids' },
        { status: 400 }
      );
    }

    // Get admin client to bypass RLS
    const adminClient = createAdminSupabaseClient();

    // Query: get all dates with available slots for the given criteria
    let query = adminClient
      .from('availability_slots')
      .select('starts_at')
      .eq('salon_id', salonId)
      .eq('status', 'available')
      .in('service_id', serviceIds)
      .gte('starts_at', new Date().toISOString());

    // If staff_id is provided and not 'any', filter by staff member
    if (staffId) {
      query = query.eq('staff_member_id', staffId);
    }

    const { data: slots, error: slotsError } = await query;

    if (slotsError) {
      console.error('[/api/availability/unavailable-dates] DB error:', slotsError);
      throw slotsError;
    }

    // Vacation range — grey these days out even if slots still exist for them (the booking POST
    // also hard-blocks them via the SALON_ON_VACATION guard; this keeps the calendar honest).
    const { data: salonVac } = await adminClient
      .from('salons')
      .select('vacation_start, vacation_end')
      .eq('id', salonId)
      .single();
    const vacStart = salonVac?.vacation_start ?? null;
    const vacEnd = salonVac?.vacation_end ?? null;

    // Extract available dates from the slots using Europe/Zurich day boundaries.
    // Slots store true UTC instants; a slot at e.g. 22:30 UTC is 00:30 the next
    // calendar day in Zurich (CEST, UTC+2), so we must convert to local date here
    // to match the DateTimePicker which uses /api/availability/time-slots and its
    // Zurich-local day boundaries.
    const zurichDateFmt = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Zurich",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const toZurichDate = (isoInstant: string) =>
      zurichDateFmt.format(new Date(isoInstant));

    const availableDates = new Set(
      (slots || []).map((slot) => toZurichDate(slot.starts_at))
    );

    // Generate 60 days of all possible dates starting from today (Zurich local date).
    // Build the list by stepping a UTC midnight anchor so date arithmetic stays clean
    // and the output YYYY-MM-DD strings agree with the Zurich-local slot dates above.
    const allDates: string[] = [];
    const todayZurich = toZurichDate(new Date().toISOString());
    const anchor = new Date(`${todayZurich}T00:00:00Z`);
    for (let i = 0; i < 60; i++) {
      const d = new Date(anchor);
      d.setUTCDate(d.getUTCDate() + i);
      allDates.push(d.toISOString().split('T')[0]);
    }

    // Unavailable = dates with no available slots OR inside the salon's vacation range
    const inVacation = (d: string) => !!(vacStart && vacEnd && d >= vacStart && d <= vacEnd);
    const unavailableDates = allDates.filter((d) => !availableDates.has(d) || inVacation(d));

    return NextResponse.json({ unavailableDates });
  } catch (error) {
    console.error('[/api/availability/unavailable-dates]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
