/**
 * Grounded-in: app/[locale]/profile/page.tsx (the EXACT queries this loader mirrors:
 * profile identity + stripe_customer_id, next upcoming booking, favorites count via
 * head-only count, loyalty_cards + loyalty_stamps for the closest-to-reward active
 * card, vouchers filtered the same way GET /api/profile/vouchers does, saved Stripe
 * payment methods), app/[locale]/dev/directions-0905/bookings-list/_va/loadBookingsA.ts
 * (the admin.auth.admin.listUsers() pattern for resolving the seed customer's auth id
 * by email, since `profiles` here is keyed by the auth user id and this dev route has
 * no session cookie to read it from).
 *
 * Exists-check: `npm run exists loadProfileB` -> 0, net-new. `npm run exists profile`
 * (run this session) surfaced the real /profile/page.tsx this loader mirrors plus
 * every sub-route it links to; no prior dev loader fetched the SAME profile-hub shape
 * (favorites/wallet/vouchers/stamps/next-appointment) for a session-less mockup.
 *
 * Server-only, dev-gated route (../../layout.tsx). Uses the admin client to bypass RLS
 * for the SAME justification seedBooking.ts / seedSalon.ts / loadBookingsA.ts already
 * use: this never runs on a real request path, only inside
 * /dev/directions-0905/profile. Never fabricates a value; a query that returns nothing
 * real (favorites count query error, no active loyalty card, no upcoming booking)
 * yields `null`/empty exactly like the real page, never an invented placeholder.
 */
import { createAdminSupabaseClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";

const CUSTOMER_EMAIL = "kunde@solen.ch";

export interface ProfileBWalletCard {
  brand: string;
  last4: string;
}

export interface ProfileBData {
  avatarUrl: string | null;
  displayName: string;
  nextAppointment: { dateLabel: string; timeLabel: string } | null;
  favoritesCount: number | null;
  wallet: ProfileBWalletCard[];
  activeVouchersCount: number | null;
  stamps: { collected: number; needed: number } | null;
}

const cacheByLocale = new Map<string, ProfileBData | null>();

export async function loadProfileB(locale: string): Promise<ProfileBData | null> {
  const cached = cacheByLocale.get(locale);
  if (cached !== undefined) return cached;

  const supabase = createAdminSupabaseClient();
  const localeCode =
    locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";

  const { data: userList, error: userErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (userErr) {
    console.error("[directions-0905/profile/_vb] listUsers failed:", userErr);
    cacheByLocale.set(locale, null);
    return null;
  }
  const customer = userList.users.find((u) => u.email === CUSTOMER_EMAIL);
  if (!customer) {
    console.error(`[directions-0905/profile/_vb] ${CUSTOMER_EMAIL} not found.`);
    cacheByLocale.set(locale, null);
    return null;
  }
  const userId = customer.id;
  const nowIso = new Date().toISOString();

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) console.error("[directions-0905/profile/_vb] profile fetch error:", profileErr.message);

  type NextBookingRow = { id: string; starts_at: string };
  const [nextBookingRes, favoritesCountRes, loyaltyRes, vouchersRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, starts_at")
      .eq("user_id", userId)
      .in("status", ["confirmed", "pending"])
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle<NextBookingRow>(),
    supabase.from("favorites").select("salon_id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("loyalty_cards")
      .select("id, stamps_needed, loyalty_stamps!inner(id, customer_id, stamped_at)")
      .eq("is_active", true)
      .eq("loyalty_stamps.customer_id", userId),
    supabase.from("vouchers").select("id, remaining_amount, redeemed_at, expires_at").eq("buyer_id", userId),
  ]);

  if (nextBookingRes.error) console.error("[directions-0905/profile/_vb] next booking error:", nextBookingRes.error.message);
  if (favoritesCountRes.error) console.error("[directions-0905/profile/_vb] favorites count error:", favoritesCountRes.error.message);
  if (loyaltyRes.error) console.error("[directions-0905/profile/_vb] loyalty error:", loyaltyRes.error.message);
  if (vouchersRes.error) console.error("[directions-0905/profile/_vb] vouchers error:", vouchersRes.error.message);

  const favoritesCount = favoritesCountRes.error ? null : (favoritesCountRes.count ?? 0);

  let wallet: ProfileBWalletCard[] = [];
  if (profile?.stripe_customer_id) {
    try {
      const methods = await getStripe().paymentMethods.list({ customer: profile.stripe_customer_id, type: "card" });
      wallet = methods.data.map((m) => ({ brand: m.card?.brand ?? "unknown", last4: m.card?.last4 ?? "----" }));
    } catch (err) {
      console.error("[directions-0905/profile/_vb] Stripe payment methods list failed:", err instanceof Error ? err.message : err);
    }
  }

  let nextAppointment: { dateLabel: string; timeLabel: string } | null = null;
  const nextStartsAt = nextBookingRes.data?.starts_at;
  if (nextStartsAt) {
    const d = new Date(nextStartsAt);
    const zone = { timeZone: "Europe/Zurich" } as const;
    nextAppointment = {
      dateLabel: d.toLocaleDateString(localeCode, { weekday: "short", day: "numeric", month: "long", ...zone }),
      timeLabel: d.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit", hour12: false, ...zone }),
    };
  }

  type LoyaltyCardRow = { id: string; stamps_needed: number; loyalty_stamps: { id: string }[] };
  const loyaltyCards = ((loyaltyRes.data ?? []) as unknown as LoyaltyCardRow[])
    .map((c) => ({ needed: c.stamps_needed, collected: c.loyalty_stamps.length }))
    .filter((c) => c.collected > 0 && c.collected < c.needed)
    .sort((a, b) => (a.needed - a.collected) - (b.needed - b.collected));
  const stamps = loyaltyCards[0] ?? null;

  const now = new Date();
  const activeVouchersCount = vouchersRes.error
    ? null
    : (vouchersRes.data ?? []).filter((v) => {
        const isExpired = v.expires_at ? new Date(v.expires_at) < now : false;
        const isRedeemed = v.redeemed_at !== null;
        return !isExpired && !isRedeemed && (v.remaining_amount ?? 0) > 0;
      }).length;

  const displayName = profile?.display_name?.trim() || customer.email?.split("@")[0] || "Account";
  const avatarUrl = profile?.avatar_url && /^https?:\/\//.test(profile.avatar_url) ? profile.avatar_url : null;

  const result: ProfileBData = {
    avatarUrl,
    displayName,
    nextAppointment,
    favoritesCount,
    wallet,
    activeVouchersCount,
    stamps,
  };
  cacheByLocale.set(locale, result);
  return result;
}
