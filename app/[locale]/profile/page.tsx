// mockup-ok: applying the owner-approved public/_mockups/restraint/account-hub.html
// ("konto hub better", 2026-08-02). Structure only changes on this file (bg-white main wrapper,
// unchanged from the prior hub); the row/card visual anatomy lives in AccountHub.tsx below.
//
// /profile: the account hub. Rebuilt 2026-08-02 into the owner-approved grouped-row model:
// a header (avatar + name) then labelled row groups (Buchungen / Wallet / Persönlich /
// Einstellungen) each linking to a real sub-page, plus Abmelden. Replaces the 2026-07-21
// Pinterest-tabs hub (Gespeichert/Termine tabs, search field, Sortieren pill, 3-photo collage
// grid, "Neu für dich" rail) , see _design-system/REMOVED.md for that removal's record.
//
// Two repo laws this rebuild satisfies (owner brief, 2026-08-02):
// - FLOORS LAW 10 (every element belongs to the screen's job): the search bar is gone, nobody
//   searches their own saved list from the account hub.
// - FLOORS LAW 8/9 (same entity, same component; screens are composed not hand-drawn): this hub
//   no longer renders any store card at all (bespoke 3-photo CollageTile deleted), the one place
//   a store still needs to render for a saved item is /profile/favorites, which already composes
//   the real `SalonCard` (components-legacy/SalonCard.tsx) via FavoritesList.tsx, unchanged here.
//
// exists-check: `npm run exists profile` and `npm run exists konto` ran this turn. `profile`
// surfaced every sub-route this hub links to (bookings, favorites, haarprofil, stamps, settings,
// settings/payment, vouchers) plus the existing `profileHub`/`Profile` i18n namespaces reused
// below; `konto` had 0 hits (net-new German label only, not a route). This file EDITS the
// existing `/profile` route, it does not create a new one.
//
// Server component: auth guard plus ALL data fetching (profile identity, the next upcoming
// booking, favorites count, saved payment methods, active vouchers, loyalty-stamp progress),
// passed as plain props to the client <AccountHub> (renders + translates).

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import AccountHub, {
  type AccountHubWalletCard,
} from "@/app/[locale]/_components/profile/AccountHub";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  // Account pages are private, keep them out of the index.
  return { title: t("title"), robots: { index: false, follow: false } };
}

type NextBookingRow = { id: string; starts_at: string };

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile`)}`);
  }

  const userId = user.id;
  const nowIso = new Date().toISOString();
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";

  // Profile identity + Stripe customer id (needed before the wallet lookup) fetched first,
  // the rest run in parallel.
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) console.error("[AccountHub] profile fetch error:", profileErr.message);

  const [nextBookingRes, favoritesCountRes, loyaltyRes, vouchersRes] = await Promise.all([
    // Buchungen row subline: the single next upcoming booking (confirmed/pending, in the
    // future). Mirrors app/[locale]/profile/bookings's own status set.
    supabase
      .from("bookings")
      .select("id, starts_at")
      .eq("user_id", userId)
      .in("status", ["confirmed", "pending"])
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle<NextBookingRow>(),
    // Gespeichert row: real favorites count, head-only (no rows fetched).
    supabase.from("favorites").select("salon_id", { count: "exact", head: true }).eq("user_id", userId),
    // Stempel row: same active-card query shape as /profile/stamps/page.tsx, scoped
    // server-side to this user's stamp rows only.
    supabase
      .from("loyalty_cards")
      .select("id, stamps_needed, loyalty_stamps!inner(id, customer_id, stamped_at)")
      .eq("is_active", true)
      .eq("loyalty_stamps.customer_id", userId),
    // Gutscheine row: mirrors GET /api/profile/vouchers's own "active" filter (not expired,
    // not redeemed, remaining balance > 0).
    supabase
      .from("vouchers")
      .select("id, remaining_amount, redeemed_at, expires_at")
      .eq("buyer_id", userId),
  ]);

  if (nextBookingRes.error) console.error("[AccountHub] next booking fetch error:", nextBookingRes.error.message);
  if (favoritesCountRes.error) console.error("[AccountHub] favorites count fetch error:", favoritesCountRes.error.message);
  if (loyaltyRes.error) console.error("[AccountHub] loyalty fetch error:", loyaltyRes.error.message);
  if (vouchersRes.error) console.error("[AccountHub] vouchers fetch error:", vouchersRes.error.message);

  // Gespeichert row: real favorites count. null when the query itself failed, distinct from a
  // real, successful zero, so AccountHub omits the number instead of fabricating "0 saved"
  // (regression of the countOf() fix from GAP_FIXES #47, dropped in the 2026-08-02 hub rebuild).
  const favoritesCount = favoritesCountRes.error ? null : (favoritesCountRes.count ?? 0);

  // Wallet row: saved Stripe cards, only looked up when a customer id exists (mirrors
  // GET /api/stripe/payment-methods's own guard, called server-side directly here instead of
  // an internal HTTP round trip since this is already a server component).
  let wallet: AccountHubWalletCard[] = [];
  if (profile?.stripe_customer_id) {
    try {
      const methods = await getStripe().paymentMethods.list({ customer: profile.stripe_customer_id, type: "card" });
      wallet = methods.data.map((m) => ({ brand: m.card?.brand ?? "unknown", last4: m.card?.last4 ?? "----" }));
    } catch (err) {
      console.error("[AccountHub] Stripe payment methods list failed:", err instanceof Error ? err.message : err);
    }
  }

  // Buchungen subline: pre-formatted "am {date} um {time}" pieces (Europe/Zurich display),
  // same weekday+day+month-long technique already used by SalonCard.tsx / CancelBookingSheet.tsx
  // elsewhere in the app. null when there is no upcoming booking (never a fabricated date).
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

  // Stempel: closest-to-reward active card, same selection rule as /profile/stamps/page.tsx's
  // heroCard (smallest needed-collected gap among cards with at least one real stamp).
  type LoyaltyCardRow = { id: string; stamps_needed: number; loyalty_stamps: { id: string }[] };
  const loyaltyCards = ((loyaltyRes.data ?? []) as unknown as LoyaltyCardRow[])
    .map((c) => ({ needed: c.stamps_needed, collected: c.loyalty_stamps.length }))
    .filter((c) => c.collected > 0 && c.collected < c.needed)
    .sort((a, b) => (a.needed - a.collected) - (b.needed - b.collected));
  const stamps = loyaltyCards[0] ?? null;

  // Gutscheine: real active count, same three conditions as /api/profile/vouchers's GET.
  // Same "don't fabricate a count" shape as favoritesCount above: null on a genuine query
  // error, distinct from a real, successful zero.
  const now = new Date();
  const activeVouchersCount = vouchersRes.error
    ? null
    : (vouchersRes.data ?? []).filter((v) => {
        const isExpired = v.expires_at ? new Date(v.expires_at) < now : false;
        const isRedeemed = v.redeemed_at !== null;
        return !isExpired && !isRedeemed && (v.remaining_amount ?? 0) > 0;
      }).length;

  const displayName = profile?.display_name?.trim() || user.email?.split("@")[0] || t("title");
  const avatarUrl = profile?.avatar_url && /^https?:\/\//.test(profile.avatar_url) ? profile.avatar_url : null;

  return (
    <main className="min-h-screen bg-white">
      <AccountHub
        locale={locale}
        avatarUrl={avatarUrl}
        displayName={displayName}
        nextAppointment={nextAppointment}
        favoritesCount={favoritesCount}
        wallet={wallet}
        activeVouchersCount={activeVouchersCount}
        stamps={stamps}
      />
    </main>
  );
}
