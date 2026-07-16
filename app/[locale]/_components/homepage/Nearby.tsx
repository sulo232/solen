"use client";

import * as React from "react";
import { MapPin } from "lucide-react";
import { useLocale } from "next-intl";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
import { SalonCard, type SalonCardProps } from "./SalonCard";
import { useCustomerPrefs, sortByCategoryPicks, type CustomerPrefs } from "./useCustomerPrefs";
// 2026-07-13: real rating/address/price data, batch-fetched server-side in
// page.tsx (type-only import, the Supabase fetch code never reaches this
// client bundle).
import type { SalonCardDataMap } from "./salonCardData";

/**
 * In der Nähe — V3 (LIVE_TRUTH §Q51.2 + V2-D34 cards).
 *
 * Geo-aware section ordered by distance from user. Each card shows
 * "[distance] · [next-slot]" in row 2 (bold parts per §16.5).
 * Cards w slot today get the green "Heute frei" availability pill;
 * cards w next slot tomorrow+ omit the pill (date is in row 2).
 *
 * Server component. Static demo data — Phase 2 wires:
 *   - geolocation.permissionState() / Geolocation API to get user coords
 *   - PostGIS-style salon proximity query → top 8 within 5km
 *   - Per-salon next-slot resolution (today vs this-week)
 *
 * If geolocation denied: section either hides OR falls back to
 * "city center" coords. Decision deferred to Phase 2 §SY.
 */

interface NearbyEntry {
  /** Real salon UUID — threaded to SalonCard → HeartButton so the save persists. */
  id: string;
  slug: string;
  name: string;
  category: SalonCardProps["category"];
  /** Distance string e.g. "200 m" or "1.2 km" — bold in row 2. */
  distance: string;
  /** Next-slot label OR "in N min" — bold parts in row 2. */
  nextSlot: { prefix?: string; bold: string; suffix?: string };
  /** Show "Heute frei" pill when slot is today AND ≤ today/tonight. */
  freeToday?: boolean;
  isSaved?: boolean;
  photoUrl?: string;
}

// V2-D60-photos: Unsplash imagery — same slug reuses same photo across sections.
// 2026-06-05: slugs/names/ids point at the REAL seeded salons (Basel) so every
// card resolves to a live PDP instead of a 404. The curated distance/next-slot/
// photo styling is kept; only identity (id+slug+name) is real. Each entry maps
// to a real salon of its OWN category so the colorway/labels stay correct.
const DEMO: NearbyEntry[] = [
  // V3-D128 (2026-05-24): "15 Min" → "Heute 15:30" per user "we book by
  // TIME not by Min". Solen's data model is TIME-slot based, not duration.
  { id: "0ed041f9-149b-4241-a09e-d41351be7097", slug: "muse-beauty-studio", name: "Muse Beauty Studio", category: "coiffeur", distance: "200 m", nextSlot: { prefix: "Heute ", bold: "15:30" }, freeToday: true, isSaved: true,
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { id: "e34402f4-2986-4f63-8487-b09645395c65", slug: "glow-lab-basel", name: "Glow Lab Basel", category: "coiffeur", distance: "450 m", nextSlot: { bold: "14:30, 16:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
  { id: "ca037638-362a-491b-ada2-238e20d9d4a9", slug: "nail-studio-bliss", name: "Nail Studio Bliss", category: "nails", distance: "800 m", nextSlot: { prefix: "Nächster ", bold: "Mo. 09:00" },
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { id: "40c96be2-198c-471e-82d8-3ada6f7de0de", slug: "smooth-skin-studio", name: "Smooth Skin Studio", category: "spa", distance: "1.2 km", nextSlot: { prefix: "Nächster ", bold: "Do. 11:00" },
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
  // V3-D128 (2026-05-24): "30 Min" → "Heute 17:15" — same fix as above.
  { id: "599bb853-c713-4dae-a3c4-96c6216139c4", slug: "old-town-barbers", name: "Old Town Barbers", category: "barbershop", distance: "1.5 km", nextSlot: { prefix: "Heute ", bold: "17:15" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=450&fit=crop&q=80" },
  { id: "9f078a3f-071d-4797-a0cf-e5ab6f3c1d2f", slug: "the-fade-factory", name: "The Fade Factory", category: "barbershop", distance: "1.8 km", nextSlot: { prefix: "Heute ", bold: "18:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=450&fit=crop&q=80" },
  // V2-D60.1: expanded 6 → 15 cards per LIVE_TRUTH §17.4 update.
  { id: "d46e4ae5-8410-4fc9-a2da-43c978bc9477", slug: "salon-lumiere", name: "Salon Lumière", category: "coiffeur", distance: "2.0 km", nextSlot: { prefix: "Heute ", bold: "16:30" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=600&h=450&fit=crop&q=80" },
  { id: "08760993-cdfd-4cc7-ac69-6a2bf8aed383", slug: "pink-petal-nails", name: "Pink Petal Nails", category: "nails", distance: "2.2 km", nextSlot: { prefix: "Heute ", bold: "17:30" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&h=450&fit=crop&q=80" },
  { id: "1c217cdc-f342-4790-91ec-c87709468666", slug: "velvet-face", name: "Velvet Face", category: "coiffeur", distance: "2.4 km", nextSlot: { bold: "Morgen 09:00" },
    photoUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&h=450&fit=crop&q=80" },
  { id: "f4f9bdc6-96e9-4bbb-819d-3a2931897e57", slug: "haarsalon-margot", name: "Haarsalon Margot", category: "coiffeur", distance: "2.6 km", nextSlot: { prefix: "Nächster ", bold: "Mi. 14:00" },
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  { id: "6aedd8a4-30fd-4390-949c-4d1fa06e1ff1", slug: "wax-and-glow-basel", name: "Wax & Glow Basel", category: "spa", distance: "3.0 km", nextSlot: { prefix: "Nächster ", bold: "Fr. 10:00" },
    photoUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&h=450&fit=crop&q=80" },
  { id: "9956212b-166f-4a51-a880-6e99e329267a", slug: "rouge-studio", name: "Rouge Studio", category: "coiffeur", distance: "3.2 km", nextSlot: { bold: "Heute 17:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1600948836101-f9ffda59d250?w=600&h=450&fit=crop&q=80" },
  { id: "ff2abacd-661a-4e7a-9c00-2dda7ce29133", slug: "studio-schnittkunst", name: "Studio Schnittkunst", category: "coiffeur", distance: "3.5 km", nextSlot: { prefix: "Nächster ", bold: "Sa. 11:30" },
    photoUrl: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=600&h=450&fit=crop&q=80" },
  { id: "63e581dd-2b0e-4910-b4a5-543bc1e157f6", slug: "blade-and-stone", name: "Blade & Stone", category: "barbershop", distance: "3.8 km", nextSlot: { prefix: "Heute ", bold: "19:00" }, freeToday: true,
    photoUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=450&fit=crop&q=80" },
  { id: "dd4a3e35-8b9c-4ee6-a52e-1fb71ce04f89", slug: "atelier-haarwerk", name: "Atelier Haarwerk", category: "coiffeur", distance: "4.1 km", nextSlot: { prefix: "Nächster ", bold: "Di. 13:00" },
    photoUrl: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=600&h=450&fit=crop&q=80" },
];

// 2026-07-13: CATEGORY_DEFAULT_PRICE (fabricated per-category price) +
// NEARBY_ADDRESSES (rotating fake street address fallbacks) removed. Row 1
// rating and Row 3 now render the REAL per-salon rating + min active price +
// postal code/city from salonCardData.ts, omitting the field rather than
// showing an invented value when it's missing.

// V2-D60-cards-7: convert legacy nextSlot {prefix, bold, suffix} into a clean
// single label. Strips "Nächster " prefix; keeps the bold date/time chunk.
// "Only one time" rule: comma-lists like "14:30, 16:00" → first time only.
// V2-D60-cards-9: strip "Heute" prefix — green HEUTE FREI pill already signals today.
function formatNextSlot(e: NearbyEntry): string {
  const firstChunk = e.nextSlot.bold.split(",")[0].trim();
  return firstChunk; // e.g. "14:30", "Mi. 14:00", "21. Mai 14:00"
}

// V2-D66 (2026-05-16, Hayden move #16): pick the right directional state.
// Cards with freeToday + "In N Min" copy → "limited" (time-pressure ⚡).
// Cards with freeToday + multiple times → "urgent" (filling fast ↘).
// Cards with freeToday + single time → "now" (available ↗).
// Cards without freeToday → no pill (date in row 2 carries the info).
// TODO: Phase 2 derives state from real booking density / time-to-fill,
// not heuristics on demo copy.
function resolveAvailability(
  e: NearbyEntry,
  idx: number,
): { state: "now" | "urgent" | "limited"; label: string } | null {
  if (!e.freeToday) return null;
  // V3-D173 (2026-05-26): "Heute frei" badge retired per user — the
  // multi-slot branch now returns null (no pill). Single-slot cards
  // still show the urgency pill but with a count-based label.
  const hasMultipleSlots = e.nextSlot.bold.includes(",");
  if (hasMultipleSlots) return null;
  // V3-D173: "Schnell weg" → "Nur X heute" — explicit count is far more
  // actionable than vague urgency. V3-D175 (2026-05-26): shortened from
  // "Nur noch X heute" → "Nur X heute" so the badge can't overrun the
  // heart icon on the narrow 163px mobile carousel card. Demo cycles
  // 1/2/3 by idx; Phase 2 derives from real booking density.
  const slotsLeft = (idx % 3) + 1;
  return {
    state: "urgent",
    label: `Nur ${slotsLeft} heute`,
  };
}

export default function Nearby({
  prefsOverride,
  salonData = {},
}: {
  /** Test seam. Bypasses the live fetch when provided (dev previews). */
  prefsOverride?: CustomerPrefs | null;
  /** Real rating/address/price per salon id, batch-fetched server-side in page.tsx. */
  salonData?: SalonCardDataMap;
} = {}) {
  const locale = useLocale();
  const fetched = useCustomerPrefs();
  const prefs = prefsOverride !== undefined ? prefsOverride : fetched;
  // V3-D348: bend toward the user's picks — picked-category salons lead, the
  // rest keep their distance order. Logged-out (no prefs) = unchanged.
  const entries = sortByCategoryPicks(DEMO, prefs?.categories ?? []);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  return (
    // V3-D120 (2026-05-24): section bg tint REMOVED per user "remove these
    // color dividing things." Future-state homepage = all-white substrate,
    // teal section-arrow buttons + typography rhythm carry section breaks.
    <Section>
      <SectionFrame>
        <SectionTitle
          title="In der Nähe"
          link={{ label: "Alle in deiner Nähe →", href: `/${locale}/search?nearby=true` }}
          scrollRef={scrollRef}
        />
        {/* V3-D348 (tweak #2): map teaser — gives "In der Nähe" a location-led
            identity distinct from the editorial "Top auf Solen" carousel above.
            The salon cards below are UNCHANGED (name+star / street / time·price).
            Tap → nearby results. */}
        <a
          href={`/${locale}/search?view=map`}
          aria-label="Salons in der Nähe auf der Karte ansehen"
          className="relative mt-1 block h-[120px] overflow-hidden rounded-card border border-s-border bg-s-bg-sunken transition-transform duration-200 ease-glide active:scale-[0.97]"
        >
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(10,10,10,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(10,10,10,0.05) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          <MapPin className="absolute left-[26%] top-[28%] text-s-ink" size={20} strokeWidth={2.5} fill="currentColor" aria-hidden />
          <MapPin className="absolute left-[56%] top-[42%] text-s-ink" size={22} strokeWidth={2.5} fill="currentColor" aria-hidden />
          <MapPin className="absolute left-[40%] top-[62%] text-s-ink" size={18} strokeWidth={2.5} fill="currentColor" aria-hidden />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-pill bg-white px-3 py-1.5 text-[13px] font-medium text-s-ink shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
            <MapPin size={13} className="text-s-ink" aria-hidden /> 14 Salons in der Nähe Karte öffnen
          </span>
        </a>
        <ScrollRow ref={scrollRef}>
        {entries.map((e, idx) => {
          const real = salonData[e.id];
          return (
            <SalonCard
              key={`${e.slug}-${idx}`}
              slug={e.slug}
              salonId={e.id}
              name={e.name}
              rating={real?.rating ?? null}
              reviewCount={real?.reviewCount ?? null}
              category={e.category}
              photoUrl={e.photoUrl}
              isSaved={e.isSaved}
              variant="availability"
              nextSlotLabel={formatNextSlot(e)}
              citySelected={false}
              postalCode={real?.postalCode ?? undefined}
              city={real?.city ?? undefined}
              priceFromCHF={real?.priceFromCHF ?? null}
            />
          );
        })}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}
