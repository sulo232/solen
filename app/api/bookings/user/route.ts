export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tab + pagination parameters
    const url = new URL(req.url);
    const tab = (url.searchParams.get('tab') as 'upcoming' | 'past' | 'cancelled') || 'upcoming';
    const page = Math.max(0, parseInt(url.searchParams.get('page') ?? '0', 10));
    const PAGE_SIZE = 20;
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const now = new Date().toISOString();

    // Build query based on tab
    let query = supabase
      .from('bookings')
      .select(
        `
        *,
        salon:salons(id, slug, name, address, average_rating, review_count, cover_photo_url),
        service:services(id, name_de, name_en, duration_minutes, price),
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
      query = query
        .eq('status', 'completed')
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
