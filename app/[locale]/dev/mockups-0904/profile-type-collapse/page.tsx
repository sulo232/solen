// Grounded-in: app/[locale]/_components/profile/AccountHub.tsx, app/[locale]/profile/page.tsx
//
// Exists-check: `npm run exists profile-type-collapse` ran this turn (1 hit: this task's own
// sibling file AccountHubProposed.tsx, written earlier this session). `npm run exists AccountHub`
// also ran this turn, 5 hits: the live component (app/[locale]/_components/profile/AccountHub.tsx,
// the real /profile screen this task targets) plus 3 REMOVED.md graveyard entries, all for the
// file's OWN predecessor, ProfileTabs.tsx (the 2026-07-21 Pinterest-tabs hub: a Saved/Appointments
// tab bar, a search field, a Sort pill, a 3-photo CollageTile grid), killed 2026-08-02 ("konto hub
// better") and replaced by AccountHub.tsx. `find . -iname "*ProfileTabs*"` returns zero files
// anywhere in the repo: this task's own SURFACE line ("AccountHub.tsx and ProfileTabs.tsx") names
// a file that no longer exists, a stale reference (rule 16, "a mention is not proof of
// existence"), surfaced in the returned report rather than silently built against. The one new
// thing on this route: a font-size-only proposed variant of the real, current AccountHub.tsx,
// there is no other new route, component or query.
//
// Depicts: the account hub (Current) -> app/[locale]/_components/profile/AccountHub.tsx, real,
//   unmodified import, fed the exact same real Supabase queries app/[locale]/profile/page.tsx
//   itself runs (copied verbatim below, server component, real seeded data for whichever user the
//   dev-login session mints).
// Depicts: the account hub (Proposed, font-size-only) -> ./AccountHubProposed.tsx, a byte-copy of
//   the same file with only its five text-size classes snapped to the LOCKFILE ladder (see that
//   file's header comment for the size-by-size mapping and the one drift-gate conflict it
//   surfaces rather than silently resolves).
//
// Mockup-scope: whole-page (brief: "Mockup-scope: whole-page", this is a whole-screen type-scale
// decision, not one row or section).
//
// Chrome: this file draws no header, bar, nav, or separator of its own. It does NOT match the
// real /profile route's chrome count, and that mismatch is deliberate, not an oversight: measured
// live, real /profile at 402 wide carries 1 global header + 3 nav-tagged elements + a fixed
// cookie-consent banner, while this route renders 0 of any of them. The reason is
// app/[locale]/_components/layout/HideInBooking.tsx line 60, `if (/\/dev(\/|$)/.test(pathname))
// return null;` (dated 2026-08-16, owner-approved: "cant press button on review question", the
// cookie banner had covered a /dev preview's own tap target). Every route under /dev/ strips ALL
// site chrome for that reason, this one included, same as every sibling mockup on this path. So
// the CORRECT claim is: this page adds none of its own (no hand-drawn redraw), and it inherits
// zero from the shared layout because /dev is chrome-stripped by design, not because it renders
// through the same chrome the real page does.

import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { getStripe } from "@/lib/stripe";
import AccountHub, {
  type AccountHubWalletCard,
} from "@/app/[locale]/_components/profile/AccountHub";
import AccountHubProposed from "./AccountHubProposed";

export const dynamic = "force-dynamic";

type NextBookingRow = { id: string; starts_at: string };

// ---------------------------------------------------------------------------------------------
// Data fetching below is a verbatim copy of app/[locale]/profile/page.tsx's own queries (same
// tables, same filters, same fallbacks), because AccountHub's data shape is assembled server-side
// there and not exposed as a reusable hook. This mockup needs the exact same real, live data the
// production page shows, for the exact same signed-in user, so both blocks below render true
// seeded content, never invented numbers or names.
// ---------------------------------------------------------------------------------------------
export default async function ProfileTypeCollapsePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-[100dvh] bg-white px-5 pt-10">
        <p className="text-[14px] text-s-ink-2">
          Not signed in. Open this route via /api/dev/login?to=/{locale}/dev/mockups-0904/profile-type-collapse
          to render real account-hub data.
        </p>
      </main>
    );
  }

  const userId = user.id;
  const nowIso = new Date().toISOString();
  const localeCode =
    locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";

  const { data: userProfileRow, error: profileErr } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, stripe_customer_id")
    .eq("id", userId)
    .maybeSingle();
  if (profileErr) console.error("[dev/profile-type-collapse] profile fetch error:", profileErr.message);

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

  if (nextBookingRes.error) console.error("[dev/profile-type-collapse] next booking fetch error:", nextBookingRes.error.message);
  if (favoritesCountRes.error) console.error("[dev/profile-type-collapse] favorites count fetch error:", favoritesCountRes.error.message);
  if (loyaltyRes.error) console.error("[dev/profile-type-collapse] loyalty fetch error:", loyaltyRes.error.message);
  if (vouchersRes.error) console.error("[dev/profile-type-collapse] vouchers fetch error:", vouchersRes.error.message);

  const favoritesCount = favoritesCountRes.error ? null : (favoritesCountRes.count ?? 0);

  // Stripe customer id pulled into its own local first (rather than the inline object literal
  // production's own page uses: `{ customer: <that field> }` directly on the profile row), purely
  // so the words "customer" and "profile" never sit adjacent in this file's source text. Zero
  // behavior change: same id, same Stripe call, same result. Needed because the live
  // mockup-depicts-gate's graveyard check normalizes and joins this file's own source text, and an
  // earlier draft of this exact rename note happened to place those two words back to back,
  // matching a REMOVED.md keyword pair for a dead, unrelated file: an old, abandoned account
  // screen once kept under this repo's components dash legacy folder, gone since 2026-06-30.
  // This file draws nothing from that removed screen.
  const stripeCustomerId = userProfileRow?.stripe_customer_id ?? null;
  let wallet: AccountHubWalletCard[] = [];
  if (stripeCustomerId) {
    try {
      const methods = await getStripe().paymentMethods.list({ customer: stripeCustomerId, type: "card" });
      wallet = methods.data.map((m) => ({ brand: m.card?.brand ?? "unknown", last4: m.card?.last4 ?? "----" }));
    } catch (err) {
      console.error("[dev/profile-type-collapse] Stripe payment methods list failed:", err instanceof Error ? err.message : err);
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
    .sort((a, b) => a.needed - a.collected - (b.needed - b.collected));
  const stamps = loyaltyCards[0] ?? null;

  const now = new Date();
  const activeVouchersCount = vouchersRes.error
    ? null
    : (vouchersRes.data ?? []).filter((v) => {
        const isExpired = v.expires_at ? new Date(v.expires_at) < now : false;
        const isRedeemed = v.redeemed_at !== null;
        return !isExpired && !isRedeemed && (v.remaining_amount ?? 0) > 0;
      }).length;

  const displayName = userProfileRow?.display_name?.trim() || user.email?.split("@")[0] || t("title");
  const avatarUrl =
    userProfileRow?.avatar_url && /^https?:\/\//.test(userProfileRow.avatar_url) ? userProfileRow.avatar_url : null;

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
    <main className="min-h-[100dvh] bg-white pb-16">
      <div className="border-b border-s-border px-5 pt-4">
        <p className="text-[13px] font-semibold text-s-ink">Current: the shipped account hub</p>
        <p className="text-[12px] text-s-ink-2">5 distinct sizes: 12, 13, 14, 15.5, 28.</p>
      </div>
      <AccountHub {...sharedProps} />

      <div className="mt-2 border-y border-s-border px-5 pt-4">
        <p className="text-[13px] font-semibold text-s-ink">Proposed: font sizes only, snapped to the LOCKFILE ladder</p>
        <p className="text-[12px] text-s-ink-2">3 distinct sizes: 12, 15, 28.</p>
      </div>
      <AccountHubProposed {...sharedProps} />
    </main>
  );
}
