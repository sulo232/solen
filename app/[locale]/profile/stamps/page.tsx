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
import StampCard from "@/components/loyalty/StampCard";
import HeroStampCard from "@/components/loyalty/HeroStampCard";
import EmptyStateFTU from "@/components/ui/EmptyStateFTU";
import SignatureLockup from "@/components/ui/SignatureLockup";

interface StampCardRow {
  id: string;
  salon_id: string;
  stamps_total: number;
  stamps_collected: number;
  reward_text: string;
  is_redeemed: boolean;
  redeemed_at: string | null;
  salons: {
    slug: string;
    name: string;
    cover_url: string | null;
  } | null;
}

const StampIllustration = () => (
  <svg
    width="80"
    height="80"
    viewBox="0 0 100 100"
    fill="none"
    stroke="#E8624A"
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

  const { data: cards } = await supabase
    .from("loyalty_stamp_cards")
    .select("id, salon_id, stamps_total, stamps_collected, reward_text, is_redeemed, redeemed_at, salons(slug, name, cover_url)")
    .eq("user_id", session.user.id)
    .order("stamps_collected", { ascending: false });

  const allCards = (cards ?? []) as unknown as StampCardRow[];
  const active = allCards.filter((c) => !c.is_redeemed);
  const redeemed = allCards.filter((c) => c.is_redeemed);

  // Closest-to-reward = highest (collected/total) ratio among active, not yet at total
  const heroCard = [...active]
    .filter((c) => c.stamps_total > c.stamps_collected)
    .sort((a, b) => {
      const ra = a.stamps_collected / a.stamps_total;
      const rb = b.stamps_collected / b.stamps_total;
      return rb - ra;
    })[0];

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
            salonImageUrl={heroCard.salons.cover_url ?? undefined}
            stampsTotal={heroCard.stamps_total}
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
                  salonImageUrl={c.salons.cover_url ?? undefined}
                  stampsTotal={c.stamps_total}
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
                    salonImageUrl={c.salons.cover_url ?? undefined}
                    stampsTotal={c.stamps_total}
                    stampsCollected={c.stamps_total}
                    rewardText={c.reward_text}
                  />
                  {c.redeemed_at && (
                    <span
                      className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-[2px] rounded-full text-[9px] font-body font-bold tabular-nums uppercase tracking-[.08em]"
                      style={{ background: "rgba(22,163,74,0.10)", color: "#16A34A" }}
                    >
                      ✓ Eingelöst · {new Date(c.redeemed_at).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                    </span>
                  )}
                </div>
              ) : null
            )}
          </div>
        </section>
      )}
    </main>
  );
}
