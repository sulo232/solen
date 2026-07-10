// exists-check: net-new (4-agent research 2026-06-21 found no hair-DNA endpoint). Reuses the
// existing auth/fetch pattern (app/api/bookings/user) + real tables: bookings (completed),
// client_formulas (via booking join), loyalty_status, profiles.customer_preferences.persona.
// Computes the DNA with lib/persona/deriv (the pure algorithm). Does NOT add new tables.
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { deriveHairDna, type BookingLite, type FormulaLite, type PersonaSelection } from '@/lib/persona/deriv';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1) completed bookings (+ service category) — the history the DNA derives from
    const { data: bRows } = await supabase
      .from('bookings')
      .select('starts_at, status, refunded_amount, price_paid, extras_bleaching, staff_member_id, service:services(category)')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('starts_at', { ascending: true });

    const bookings: BookingLite[] = (bRows ?? []).map((b: Record<string, unknown>) => ({
      starts_at: b.starts_at as string,
      status: b.status as string,
      refunded_amount: (b.refunded_amount as number) ?? 0,
      price_paid: (b.price_paid as number) ?? null,
      extras_bleaching: (b.extras_bleaching as boolean) ?? false,
      staff_member_id: (b.staff_member_id as string) ?? null,
      category: ((b.service as { category?: string } | null)?.category) ?? null,
    }));

    // 2) the user's colour formulas (client_formulas -> bookings.user_id)
    const { data: fRows } = await supabase
      .from('client_formulas')
      .select('shade_code, developer_volume, created_at, booking:bookings!inner(user_id)')
      .eq('booking.user_id', user.id)
      .order('created_at', { ascending: false });

    const formulas: FormulaLite[] = (fRows ?? []).map((f: Record<string, unknown>) => ({
      shade_code: (f.shade_code as string) ?? null,
      developer_volume: (f.developer_volume as string) ?? null,
      created_at: (f.created_at as string) ?? null,
    }));

    // 3) loyalty (already-computed rolling visits/tier — reuse, don't re-aggregate)
    const { data: loyalty } = await supabase
      .from('loyalty_status')
      .select('visits, tier')
      .eq('user_id', user.id)
      .maybeSingle();

    // 4) onboarding selections (persona seed) from customer_preferences
    const { data: profile } = await supabase
      .from('profiles')
      .select('customer_preferences')
      .eq('id', user.id)
      .maybeSingle();
    const prefs = (profile?.customer_preferences ?? {}) as Record<string, unknown>;
    const selection = (prefs.persona ?? {}) as PersonaSelection;

    const dna = deriveHairDna({ selection, bookings, formulas, loyalty: loyalty ?? null });
    return NextResponse.json({ dna });
  } catch (err) {
    console.error('[api/persona/hair-dna] derive failed:', err);
    return NextResponse.json({ error: 'Failed to derive hair DNA' }, { status: 500 });
  }
}
