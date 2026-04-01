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

    // Get tab parameter (default: upcoming)
    const url = new URL(req.url);
    const tab = (url.searchParams.get('tab') as 'upcoming' | 'past' | 'cancelled') || 'upcoming';

    const now = new Date().toISOString();

    // Build query based on tab
    let query = supabase
      .from('bookings')
      .select(
        `
        *,
        salon:salons(id, name, address, average_rating, review_count),
        service:services(id, name_de, name_en, name_fr, name_it, duration_minutes, price),
        staff:staff_members(id, name, avatar_url)
      `
      )
      .eq('user_id', user.id);

    // Apply status and date filters based on tab
    if (tab === 'upcoming') {
      query = query
        .eq('status', 'confirmed')
        .gte('starts_at', now)
        .order('starts_at', { ascending: true });
    } else if (tab === 'past') {
      query = query
        .eq('status', 'completed')
        .lt('starts_at', now)
        .order('starts_at', { ascending: false });
    } else if (tab === 'cancelled') {
      query = query
        .eq('status', 'cancelled')
        .order('starts_at', { ascending: false });
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('[GET /api/bookings/user] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bookings: bookings ?? [] });
  } catch (err) {
    console.error('[GET /api/bookings/user] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
