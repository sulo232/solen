export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Cheap cookie-presence guard: a real session always carries an "sb-"
    // prefixed cookie (Supabase SSR auth cookie naming). Skip the
    // auth.getUser() round-trip entirely when it's absent (logged-out
    // callers), same unauthorized response as a null user below.
    const hasSbCookie = req.cookies.getAll().some((c) => c.name.startsWith('sb-'));
    if (!hasSbCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tab + pagination parameters
    const url = new URL(req.url);
    const tab = (url.searchParams.get('tab') as 'upcoming' | 'past' | 'cancelled') || 'upcoming';
    // `|| '0'` (not ??) so an empty `page=` also falls back; trailing `|| 0` guards parseInt NaN
    // (NaN would make .range(NaN, NaN) error).
    const page = Math.max(0, parseInt(url.searchParams.get('page') || '0', 10) || 0);
    // Generous cap: bounds the query (no unbounded lifetime fetch) yet no realistic user hits it,
    // so no silent history loss. hasMore is still returned for a future "Load more" (parked mockup).
    const PAGE_SIZE = 100;
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const now = new Date().toISOString();

    // Build query based on tab
    // Explicit column list, replacing the old `select('*')` which shipped all ~75
    // bookings columns to the client, including access_token_hash,
    // access_token_expires_at, policy_snapshot, crm_photo_url, gcal_event_id,
    // outlook_event_id, stripe_setup_intent_id, stripe_payment_method_id. This is
    // exactly what BookingCard / CancelBookingSheet / BookingsList's rebook call
    // read (id, salon_id, service_id, starts_at, ends_at, price_paid, status,
    // is_first_visit/is_recurring/sms/review flags in the Booking type) plus a
    // conservative margin (user_id, slot_id, created_at) for downstream use.
    let query = supabase
      .from('bookings')
      .select(
        `
        id, user_id, salon_id, service_id, slot_id,
        starts_at, ends_at, price_paid, status, created_at,
        is_first_visit, is_recurring,
        sms_sent_24h, sms_sent_1h, review_prompt_sent,
        salon:salons(id, slug, name, address, average_rating, review_count, cover_photo_url),
        service:services(id, name_de, name_en, name_fr, name_it, duration_minutes, price),
        staff:staff_members(id, name, avatar_url)
      `
      )
      .eq('user_id', user.id);

    // Apply status, date filters, and pagination based on tab.
    // 'upcoming' is naturally small so no pagination needed; 'past' and
    // 'cancelled' grow unbounded over a user's lifetime, so paginate them.
    if (tab === 'upcoming') {
      query = query
        .eq('status', 'confirmed')
        .gte('starts_at', now)
        .order('starts_at', { ascending: true });
    } else if (tab === 'past') {
      // A "past" booking is one that happened and wasn't cancelled: completed, OR a
      // confirmed booking whose time has passed (not every salon auto-completes , the
      // auto-complete cron only runs for auto_complete_enabled salons), OR a no-show.
      // Filtering to status='completed' alone hid confirmed-past + no_show bookings from
      // the customer entirely (they also fail upcoming's starts_at>=now), so a booking a
      // customer actually had would vanish from their list.
      query = query
        .in('status', ['completed', 'confirmed', 'no_show'])
        .lt('starts_at', now)
        .order('starts_at', { ascending: false })
        .range(from, to);
    } else if (tab === 'cancelled') {
      query = query
        .eq('status', 'cancelled')
        .order('starts_at', { ascending: false })
        .range(from, to);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('[GET /api/bookings/user] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const list = bookings ?? [];
    return NextResponse.json({
      bookings: list,
      page,
      pageSize: PAGE_SIZE,
      hasMore: list.length === PAGE_SIZE,
    });
  } catch (err) {
    console.error('[GET /api/bookings/user] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
