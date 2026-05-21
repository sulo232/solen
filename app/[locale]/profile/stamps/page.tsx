/**
 * /profile/stamps — Q59 (locked 2026-05-02) consumer loyalty page.
 *
 * Surface 1 of the 3-surface loyalty system:
 *   - Q49-style header (eyebrow + Anton "Stempel")
 *   - HeroStampCard at top = closest-to-reward
 *   - Active list using existing StampCard component
 *   - Eingelöst (redeemed) history at 70% opacity with green check chip
 *
 * Server component — fetches user's stamp cards on the server, hands client
 * components only what they need.
 */
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import StampCard from "@/components-legacy/loyalty/StampCard";
import HeroStampCard from "@/components-legacy/loyalty/HeroStampCard";
import EmptyStateFTU from "@/components-legacy/ui/EmptyStateFTU";
import SignatureLockup from "@/components-legacy/ui/SignatureLockup";

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
  loyalty_stamps: { id: string }[];
}

const StampIllustration = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 100 100"
    fill="none"
    stroke="#1B4D1B"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="50" cy="50" r="32" />
    <path d="M38 50l8 8 16-16" />
  </svg>
);

export default async function ProfileStampsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect(`/${locale}/auth/sign-in?redirect=/${locale}/profile/stamps`);
  }

  const { data: cardsRaw } = await supabase
    .from("loyalty_cards")
    .select(`id, salon_id, stamps_needed, reward_text, is_active, salons(slug, name, cover_photo_url), loyalty_stamps(id, customer_id)`)
    .eq("is_active", true);

  // Filter to this user's stamps + compute stamps_collected
  const enriched = ((cardsRaw ?? []) as unknown as LoyaltyCardRow[])
    .map((c) => {
      const userStamps = (c.loyalty_stamps ?? []).filter(
        (s: any) => s.customer_id === session.user.id
      );
      return {
        id: c.id,
        salons: c.salons,
        stamps_needed: c.stamps_needed,
        stamps_collected: userStamps.length,
        reward_text: c.reward_text,
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
    return (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <SignatureLockup
          eyebrow={`Mein Profil · 0 Karten`}
          headline="Stempel"
          size="md"
        />
        <div className="mt-8">
          <EmptyStateFTU
            eyebrow="Noch keine Stempel"
            headline="Sammle Stempel bei deinem ersten Termin"
            subCopy="Buche bei einem Salon mit Treuekarte und sammle Stempel für deine nächste Belohnung."
            ctaLabel="Salon entdecken →"
            ctaHref={`/${locale}/entdecken`}
            illustration={<StampIllustration />}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <SignatureLockup
        eyebrow={`Mein Profil · ${allCards.length} Karten`}
        headline="Stempel"
        size="md"
      />

      {heroCard && heroCard.salons && (
        <div className="mt-6">
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
          <h2 className="font-body text-[10px] font-bold uppercase tracking-[.22em] text-s-ink/40 mb-3">
            Aktiv
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
                />
              ) : null
            )}
          </div>
        </section>
      )}

      {redeemed.length > 0 && (
        <section className="mt-8 opacity-70">
          <h2 className="font-body text-[10px] font-bold uppercase tracking-[.22em] text-s-ink/40 mb-3">
            Eingelöst · {redeemed.length}
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
                  />
                  <span
                    className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[9px] font-body font-bold tabular-nums uppercase tracking-[.08em]"
                    style={{ background: "rgba(22,163,74,0.10)", color: "#16A34A" }}
                  >
                    ✓ Belohnung verfügbar
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
