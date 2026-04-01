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

    // Extract available dates from the slots
    const availableDates = new Set(
      (slots || []).map((slot) =>
        new Date(slot.starts_at).toISOString().split('T')[0]
      )
    );

    // Generate 60 days of all possible dates starting from today
    const allDates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      allDates.push(date.toISOString().split('T')[0]);
    }

    // Unavailable = dates NOT in availableDates
    const unavailableDates = allDates.filter((d) => !availableDates.has(d));

    return NextResponse.json({ unavailableDates });
  } catch (error) {
    console.error('[/api/availability/unavailable-dates]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
