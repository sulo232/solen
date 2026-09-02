/**
 * /profile/stamps — Q59 (locked 2026-05-02) consumer loyalty page.
 *
 * Surface 1 of the 3-surface loyalty system:
 *   - Q49-style header (eyebrow + Anton "Stempel")
 *   - HeroStampCard at top = closest-to-reward
 *   - Active list using existing StampCard component
 *   - Abgeschlossen (completed, not "redeemed": no redemption column exists yet)
 *     history at 70% opacity with green check chip
 *
 * Server component — fetches user's stamp cards on the server, hands client
 * components only what they need.
 */
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import { createServerSupabaseClient } from "@/lib/supabase";
import StampCard from "@/components-legacy/loyalty/StampCard";
import HeroStampCard from "@/components-legacy/loyalty/HeroStampCard";
import EmptyStateDiscovery from "@/app/[locale]/_components/profile/EmptyStateDiscovery";

/**
 * Schema note (verified 2026-05-02): loyalty programs live in `loyalty_cards`;
 * each stamp is a row in `loyalty_stamps` joined by `loyalty_card_id` +
 * `customer_id`. `stamps_collected` is a derived count, NOT a column.
 * Salon photo column is `cover_photo_url`. Redemption is tracked via
 * separate flow (no `is_redeemed` boolean on this table — pending v2 schema).
 */
interface LoyaltyCardRow {
  id: string;
  salon_id: string;
  stamps_needed: number;
  reward_text: string;
  is_active: boolean;
  salons: {
    slug: string;
    name: string;
    cover_photo_url: string | null;
  } | null;
  loyalty_stamps: { id: string; stamped_at: string | null }[];
}

/**
 * "Just earned" window (motion audit RANK 4 / Motion sheet 22: "Earned moment
 * without a client event, e.g. stamp | DO NOT fake on load"). `loyalty_stamps`
 * has no "seen"/"celebrated" flag (verified against the live table), so the
 * real signal available is the newest stamp's actual `stamped_at` timestamp,
 * not the stamp count. A card only celebrates while its latest stamp is
 * inside this window; a plain revisit outside it renders with no motion.
 */
const RECENT_STAMP_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

export default async function ProfileStampsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileStamps" });
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/stamps`)}`);
  }

  // `loyalty_stamps!inner(...)` + the `.eq("loyalty_stamps.customer_id", ...)` embedded filter scope the
  // stamp rows server-side to the verified user (same pattern as app/api/profile/live-state/route.ts),
  // so no other customer's stamp data is ever fetched into this page.
  const { data: cardsRaw } = await supabase
    .from("loyalty_cards")
    .select(`id, salon_id, stamps_needed, reward_text, is_active, salons(slug, name, cover_photo_url), loyalty_stamps!inner(id, customer_id, stamped_at)`)
    .eq("is_active", true)
    .eq("loyalty_stamps.customer_id", user.id);

  // loyalty_stamps is now already scoped to this user's rows only (see query above).
  const enriched = ((cardsRaw ?? []) as unknown as LoyaltyCardRow[])
    .map((c) => {
      const stamps = c.loyalty_stamps ?? [];
      const latestStampedAt = stamps.reduce<number | null>((latest, s) => {
        if (!s.stamped_at) return latest;
        const t = new Date(s.stamped_at).getTime();
        return latest === null || t > latest ? t : latest;
      }, null);
      const justEarned = latestStampedAt !== null && Date.now() - latestStampedAt < RECENT_STAMP_WINDOW_MS;
      return {
        id: c.id,
        salons: c.salons,
        stamps_needed: c.stamps_needed,
        stamps_collected: stamps.length,
        reward_text: c.reward_text,
        just_earned: justEarned,
      };
    })
    .filter((c) => c.stamps_collected > 0); // only show cards user has stamps on

  const active = enriched.filter((c) => c.stamps_collected < c.stamps_needed);
  const redeemed = enriched.filter((c) => c.stamps_collected >= c.stamps_needed);
  const allCards = enriched;

  // Closest-to-reward = smallest (needed - collected) gap among active
  const heroCard = [...active].sort(
    (a, b) =>
      (a.stamps_needed - a.stamps_collected) - (b.stamps_needed - b.stamps_collected)
  )[0];

  const heroId = heroCard?.id;
  const otherActive = active.filter((c) => c.id !== heroId);

  if (allCards.length === 0) {
    // Mockup-19 Option B: real top-rated salons for the empty-state rail + banner.
    const { data: topSalons } = await supabase
      .from("salons")
      .select("slug, name, cover_photo_url, average_rating, review_count, quartier")
      .eq("is_active", true)
      .order("average_rating", { ascending: false })
      .limit(6);
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-8">
        {/* Title lives in the global header beside the back tile */}
        <div className="mt-2">
          <EmptyStateDiscovery
            locale={locale}
            title={t("title")}
            lead={t("lead")}
            bannerImg={topSalons?.[0]?.cover_photo_url ?? null}
            bannerTitle={t("bannerTitle")}
            bannerSub={t("bannerSub")}
            bannerHref={`/${locale}/coiffeur`}
            hintIcon="stamp"
            hintText={t("hintText")}
            railTitle={t("railTitle")}
            railHref={`/${locale}/coiffeur`}
            salons={topSalons ?? []}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-4 pb-8">
      <p className="font-body text-[13px] text-s-ink-2">{t("cardsCount", { count: allCards.length })}</p>

      {heroCard && heroCard.salons && (
        <div className="mt-2">
          <HeroStampCard
            salonName={heroCard.salons.name}
            salonSlug={heroCard.salons.slug}
            salonImageUrl={heroCard.salons.cover_photo_url ?? undefined}
            stampsTotal={heroCard.stamps_needed}
            stampsCollected={heroCard.stamps_collected}
            rewardText={heroCard.reward_text}
          />
        </div>
      )}

      {otherActive.length > 0 && (
        <section className="mt-8">
          <h2 className="font-body text-[12px] font-bold uppercase tracking-[.22em] text-s-ink/40 mb-3">
            {t("sectionActive")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {otherActive.map((c) =>
              c.salons ? (
                <StampCard
                  key={c.id}
                  salonName={c.salons.name}
                  salonSlug={c.salons.slug}
                  salonImageUrl={c.salons.cover_photo_url ?? undefined}
                  stampsTotal={c.stamps_needed}
                  stampsCollected={c.stamps_collected}
                  rewardText={c.reward_text}
                  celebrate={c.just_earned}
                />
              ) : null
            )}
          </div>
        </section>
      )}

      {redeemed.length > 0 && (
        <section className="mt-8 opacity-70">
          <h2 className="font-body text-[12px] font-bold uppercase tracking-[.22em] text-s-ink/40 mb-3">
            {t("sectionCompleted", { count: redeemed.length })}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {redeemed.map((c) =>
              c.salons ? (
                <div key={c.id} className="relative">
                  <StampCard
                    salonName={c.salons.name}
                    salonSlug={c.salons.slug}
                    salonImageUrl={c.salons.cover_photo_url ?? undefined}
                    stampsTotal={c.stamps_needed}
                    stampsCollected={c.stamps_needed}
                    rewardText={c.reward_text}
                    celebrate={c.just_earned}
                  />
                  <span
                    // V3-D289: was hardcoded rgba(22,163,74,0.10) + #16A34A → s-success token (matches the literal hex but via LOCKFILE §1 token)
                    // V3-D330 (Section E lock): retired check-mark (U+2713) emoji per V3-D203 → lucide Check icon
                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[12px] font-body font-bold tabular-nums uppercase tracking-[.08em] bg-s-success/10 text-s-success"
                  >
                    <Check size={9} strokeWidth={2.5} aria-hidden /> {t("rewardAvailable")}
                  </span>
                </div>
              ) : null
            )}
          </div>
        </section>
      )}
    </main>
  );
}
