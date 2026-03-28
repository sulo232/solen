import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { generalLimiter, applyRateLimit } from "@/lib/ratelimit";

// GET /api/me
// Returns consolidated user-specific homepage data in one round-trip:
// profile (first_name), lastBooking, nextBooking, favorites (IDs only)
export async function GET() {
  const supabase = await createServerSupabaseClient();

  // Auth check
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    return NextResponse.json({ profile: null, lastBooking: null, nextBooking: null, favorites: [] });
  }

  const userId = session.user.id;

  // Rate limit by user ID
  const limited = await applyRateLimit(generalLimiter, { userId });
  if (limited) return limited;

  // Run all queries in parallel
  const now = new Date().toISOString();
  const [profileResult, lastBookingResult, nextBookingResult, favoritesResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("first_name")
      .eq("id", userId)
      .single(),
    supabase
      .from("bookings")
      .select("starts_at, salons!inner(name, slug)")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("bookings")
      .select("starts_at, salons!inner(name)")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .gt("starts_at", now)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("favorites")
      .select("salon_id")
      .eq("user_id", userId),
  ]);

  if (profileResult.error) console.error("[/api/me] profile query failed:", profileResult.error.message);
  if (lastBookingResult.error) console.error("[/api/me] lastBooking query failed:", lastBookingResult.error.message);
  if (nextBookingResult.error) console.error("[/api/me] nextBooking query failed:", nextBookingResult.error.message);
  if (favoritesResult.error) console.error("[/api/me] favorites query failed:", favoritesResult.error.message);

  const lb = lastBookingResult.data;
  const nb = nextBookingResult.data;
  const favs = favoritesResult.data ?? [];

  return NextResponse.json({
    profile: profileResult.data ?? null,
    lastBooking: lb
      ? { name: (lb.salons as any)?.name ?? null, slug: (lb.salons as any)?.slug ?? null }
      : null,
    nextBooking: nb
      ? { date: (nb as any).starts_at, salon: (nb.salons as any)?.name ?? null }
      : null,
    favorites: favs.map((f) => f.salon_id),
  });
}
