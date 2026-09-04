// Grounded-in: app/[locale]/_components/profile/AccountHub.tsx, app/[locale]/profile/page.tsx,
// app/[locale]/notifications/page.tsx
//
// Exists-check: `npm run exists notifications-link` ran this turn (1 hit: this folder's own
// AccountHubProposed.tsx from an earlier attempt, reused below, not net-new). A second run,
// `npm run exists "profile notifications link"`, returned 0 hits (no existing "link a notifications
// row into the hub" surface anywhere). REMOVED.md: grepped "notification", 2 hits, both unrelated
// dead backend routes, no hit on this row's ask.
// The one new thing: a single <Row> in the PERSONLICH group of the real /profile hub, linking to
// the real notifications inbox, compared here Current (today's hub, no notifications row) vs
// Proposed (the hub with the new row) at real size, stacked, both fed the same real logged-in
// account's data.
//
// Depicts: today's /profile hub -> app/[locale]/_components/profile/AccountHub.tsx (real, unmodified import)
// Depicts: proposed /profile hub -> ./AccountHubProposed.tsx (byte-copy of the real file, see its
//   header comment; the only diff is the one new notifications Row)
//
// Mockup-scope: section (one row added to one existing group; both hub renders are shown at full,
// real width/height, not a whole new page decision)
//
// measured: identical to /profile/page.tsx's own server queries, re-read this session
// (app/[locale]/profile/page.tsx:64-156): identity + Stripe wallet + next booking +
// favorites count + active loyalty stamp progress + active voucher count, all live Supabase reads
// for the real seeded test account with role "customer" and display_name
// "Test Kunde", not the salon-owner dev-login fixture. No number on this page is invented; the
// real /profile route runs the exact same queries for the exact same numbers.
//
// decisions: row anatomy, icon size (22px bare ink glyph, no tile), label size (15.5px/500),
// chevron (18px), and the "Notifications" copy all come from the LOCKED AccountHub.tsx component
// this page reuses, not invented here. The one new destination corrects the brief's literal
// "/profile/notifications" (does not exist) to the real notification inbox route,
// app/[locale]/notifications/page.tsx ("/notifications"); see AccountHubProposed.tsx's inline
// comment and this task's `concerns` for the surfaced mismatch.

export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import AccountHub, { type AccountHubWalletCard } from "@/app/[locale]/_components/profile/AccountHub";
import AccountHubProposed from "./AccountHubProposed";

type NextBookingRow = { id: string; starts_at: string };
type LoyaltyCardRow = { id: string; stamps_needed: number; loyalty_stamps: { id: string }[] };

export default async function NotificationsLinkMockup({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();

  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="min-h-screen bg-white px-5 pt-8">
        <p className="text-[14px] text-s-ink-2">
          Not logged in. Open this route through the dev login link the report gives you.
        </p>
      </main>
    );
  }

  const userId = user.id;
  const nowIso = new Date().toISOString();
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) console.error("[notifications-link mockup] profile fetch error:", profileErr.message);

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
    supabase
      .from("vouchers")
      .select("id, remaining_amount, redeemed_at, expires_at")
      .eq("buyer_id", userId),
  ]);

  if (nextBookingRes.error) console.error("[notifications-link mockup] next booking fetch error:", nextBookingRes.error.message);
  if (favoritesCountRes.error) console.error("[notifications-link mockup] favorites count fetch error:", favoritesCountRes.error.message);
  if (loyaltyRes.error) console.error("[notifications-link mockup] loyalty fetch error:", loyaltyRes.error.message);
  if (vouchersRes.error) console.error("[notifications-link mockup] vouchers fetch error:", vouchersRes.error.message);

  const favoritesCount = favoritesCountRes.error ? null : (favoritesCountRes.count ?? 0);

  let wallet: AccountHubWalletCard[] = [];
  const stripeCustomerId = profile?.stripe_customer_id;
  if (stripeCustomerId) {
    try {
      const methods = await getStripe().paymentMethods.list({ customer: stripeCustomerId, type: "card" });
      wallet = methods.data.map((m) => ({ brand: m.card?.brand ?? "unknown", last4: m.card?.last4 ?? "----" }));
    } catch (err) {
      console.error("[notifications-link mockup] Stripe payment methods list failed:", err instanceof Error ? err.message : err);
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

  const displayName = profile?.display_name?.trim() || user.email?.split("@")[0] || t("title");
  const avatarUrl = profile?.avatar_url && /^https?:\/\//.test(profile.avatar_url) ? profile.avatar_url : null;

  const sharedProps = {
    locale,
    avatarUrl,
    displayName,
    nextAppointment,
    favoritesCount,
    wallet,
    activeVouchersCount,
    stamps,
  };

  return (
    <main className="min-h-screen bg-white pb-16">
      <div className="mx-auto max-w-[560px] px-5 pt-6">
        <p className="text-[13px] font-semibold text-s-ink">Current</p>
        <p className="mt-0.5 text-[12px] text-s-ink-2">Today&apos;s /profile hub, no route to notifications.</p>
      </div>
      <AccountHub {...sharedProps} />

      <div className="mx-auto mt-2 max-w-[560px] border-t border-s-border px-5 pt-6">
        <p className="text-[13px] font-semibold text-s-ink">Proposed</p>
        <p className="mt-0.5 text-[12px] text-s-ink-2">One new row added to the Personal group, linking to /notifications.</p>
      </div>
      <AccountHubProposed {...sharedProps} />
    </main>
  );
}
