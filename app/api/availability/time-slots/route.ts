import { NextRequest, NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase';

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
        { error: 'Missing salon_id or date' },
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

    // Query: available slots that can accommodate the duration
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;

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
        validSlots.map((slot) => {
          const date = new Date(slot.starts_at);
          return `${date.getHours().toString().padStart(2, '0')}:${date
            .getMinutes()
            .toString()
            .padStart(2, '0')}`;
        })
      )
    ).sort();

    return NextResponse.json({ slots: times.map((time) => ({ time })) });
  } catch (error) {
    console.error('[/api/availability/time-slots]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
