// exists-check: net-new homepage row. Consumes the affinity-aware /api/salons/recommendations
// (the points engine, user_salon_affinity). Mirrors the ForYouSalonRows + useCustomerPrefs
// hydration-safe client-fetch pattern; NOT a dup (forYouSalons.ts is static demo data; this is the
// real per-user affinity row). Renders NOTHING unless the API returns source:"affinity" with salons.
"use client";

import * as React from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { Section, SectionFrame, SectionTitle, ScrollRow } from "./SectionHeader";
import { SalonCard } from "./SalonCard";
import { useTranslations, useLocale } from "next-intl";
// foryou-card-props: same helper TopCategoryRails.tsx uses to turn the per-locale service-name
// record the API returns into the one string SalonCard's priceFromService prop wants.
import { nameForLocale, type ServiceNameLocale } from "@/lib/min-price-service";

type Category = "coiffeur" | "barbershop" | "nails" | "spa";
const CARD_CATS: Category[] = ["coiffeur", "barbershop", "nails", "spa"];

interface ApiSalon {
  id: string;
  name: string;
  slug: string;
  categories: string[] | null;
  average_rating: number | null;
  cover_photo_url: string | null;
  // foryou-card-props: added by /api/salons/recommendations' withCardData(), same
  // getSalonCardDataMap fields TopCategoryRails.tsx already renders (salonCardData.ts).
  priceFromCHF: number | null;
  priceFromServiceNames: Record<ServiceNameLocale, string | null> | null;
  postalCode: string | null;
  city: string | null;
}

/** Map the salon's category array onto a SalonCard-supported colorway (defaults to coiffeur). */
function toCardCategory(cats: string[] | null): Category {
  for (const c of cats ?? []) {
    if (c === "barber") return "barbershop";
    if ((CARD_CATS as string[]).includes(c)) return c as Category;
  }
  return "coiffeur";
}

// One module-level promise: the row fetches once after hydration (keeps the homepage ISR-cached,
// same approach as useCustomerPrefs). Guests short-circuit on getSession (no network 401).
let cached: Promise<ApiSalon[] | null> | null = null;
function loadAffinity(): Promise<ApiSalon[] | null> {
  if (cached) return cached;
  cached = createBrowserSupabaseClient()
    .auth.getSession()
    .then(({ data: { session } }) => {
      if (!session) return null;
      return fetch("/api/salons/recommendations", { credentials: "include" }).then((r) =>
        r.ok ? r.json() : null,
      );
    })
    .then((data) => {
      // affinity = personalized (engaged users); engagement = popular cold-start (new users).
      const src = (data as { source?: string } | null)?.source;
      if (!data || (src !== "affinity" && src !== "engagement")) return null;
      const salons = (data as { salons?: unknown }).salons;
      return Array.isArray(salons) ? (salons as ApiSalon[]) : null;
    })
    .catch((err) => {
      console.error("[ForYouAffinityRow] affinity fetch failed:", err);
      return null;
    });
  return cached;
}

export default function ForYouAffinityRow() {
  // 2026-08-15: this label was a hardcoded German literal, so it rendered German on /en,
  // /fr and /it. Same bug class the owner caught on the recently-viewed row that day.
  const t = useTranslations("home.featured");
  const locale = useLocale();
  const [salons, setSalons] = React.useState<ApiSalon[] | null>(null);
  React.useEffect(() => {
    let mounted = true;
    loadAffinity().then((s) => {
      if (mounted) setSalons(s);
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!salons || salons.length === 0) return null;

  return (
    <Section>
      <SectionFrame>
        <SectionTitle title={t("forYou")} />
        <ScrollRow>
          {salons.map((s) => (
            <SalonCard
              key={s.id}
              slug={s.slug}
              salonId={s.id}
              name={s.name}
              rating={s.average_rating}
              category={toCardCategory(s.categories)}
              photoUrl={s.cover_photo_url ?? undefined}
              variant="service"
              priceFromCHF={s.priceFromCHF}
              priceFromService={nameForLocale(s.priceFromServiceNames, locale)}
              postalCode={s.postalCode ?? undefined}
              city={s.city ?? undefined}
            />
          ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
