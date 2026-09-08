"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonServices.tsx because
// `npm run exists bundles` found NO PDP bundles SECTION (only the service_bundles table,
// the new /api/salon/bundles route, and the /dev/bundles-products mockup). Reuses the
// SalonServices grouped-card grammar + SalonCard pale-green discount-pill recipe.

/**
 * SalonBundles , A5 Phase B-3 PDP bundles section.
 *
 * mockup-ok: grounded 1:1 in the APPROVED /dev/bundles-products Option B grammar
 * (app/[locale]/dev/bundles-products/page.tsx OptionB/BundleCard/IncludedRow):
 *   - BundleCard = rounded-[24px] border-s-border bg-white shadow-whisper, Combine icon + name (16/700)
 *   - IncludedRow = service name (14/500) + Clock duration ("N Min", s-ink-2 12px)
 *   - price row = struck summed price (13 s-ink-2 line-through) + bold bundle price (16/700 ink) + pale-green -X% pill
 *   - pale-green pill = bg-s-success-bg text-s-success (SalonCard DiscountBadge / project_card_badges recipe), percent mode only
 * Net-new beyond the mockup:
 *   - "Buchen" CTA (ink primary commit) that carries the bundle's services preselected into the booking flow:
 *     /salon/[slug]/booking?services=<csv>&bundle=<id> (the ?services= handoff the PDP "Alle ansehen" sheet already uses;
 *     bundle_id rides the URL for the backend agent's bundle-aware /api/bookings , this component only carries it through).
 *   - price computed AT READ server-side (GET /api/salon/bundles) from live services.price, never denormalized.
 *
 * Renders NOTHING (returns null) until active bundles load, so the sticky tab appears only when bundles exist.
 */

import * as React from "react";
import Link from "next/link";
import { Combine, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import { localizedField } from "@/lib/i18n/localized-field";

interface BundleService {
  id: string;
  name_de: string;
  name_en: string | null;
  name_fr?: string | null;
  name_it?: string | null;
  price: number; // CHF decimal
  duration_minutes: number;
}

interface Bundle {
  id: string;
  name: string;
  pricing_mode: "sum" | "custom" | "percent";
  percent_off: number | null;
  services: BundleService[];
  sum_price: number; // CHF decimal
  bundle_price: number; // CHF decimal
}

export function SalonBundles({
  salonId,
  slug,
  locale,
  onLoaded,
}: {
  salonId: string;
  slug: string;
  locale: string;
  /** Called with true once active bundles are confirmed present (registers the sticky tab). */
  onLoaded?: (hasBundles: boolean) => void;
}) {
  const t = useTranslations("salonDetail");
  const [bundles, setBundles] = React.useState<Bundle[] | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (!salonId) return;
    const ac = new AbortController();
    fetch(`/api/salon/bundles?salon_id=${salonId}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { bundles?: Bundle[] } | null) => {
        const list = d?.bundles ?? [];
        setBundles(list);
        onLoaded?.(list.length > 0);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("[SalonBundles] failed to load bundles:", err);
          setError(true);
          onLoaded?.(false);
        }
      });
    return () => ac.abort();
    // onLoaded is a stable parent callback , excluded intentionally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  // No bundles , render nothing (no empty section, no tab).
  if (bundles !== null && bundles.length === 0 && !error) return null;

  // mockup-ok: this DELETES a state rather than designing one. Nothing renders until we know there
  // is something to render (owner 2026-08-15: "I keep seeing this packages section, but then it
  // goes away").
  //
  // THAT WAS THIS BLOCK. It painted the heading plus a 160px shimmer the instant the section
  // mounted, then the fetch resolved, and `bundles.length === 0` returned null one line above, so
  // the whole thing vanished. Measured against the live database: 1 of 28 salons has an active
  // bundle, so on 27 of them the guaranteed experience was a heading appearing and then deleting
  // itself. A skeleton is a promise that content is coming, and here it was a promise that was
  // wrong 96% of the time.
  //
  // The cost, named rather than hidden: on the one salon that DOES have a bundle, the section now
  // pops in instead of fading up from a skeleton. That is the better trade at 1-in-28, and it flips
  // if bundles ever become common.
  if (bundles === null) return null;

  if (error || !bundles) {
    return (
      <section id="section-bundles">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          {t("bundlesTitle")}
        </h2>
        <p className="mt-4 text-[14px] text-s-ink-2">{t("bundlesError")}</p>
      </section>
    );
  }

  return (
    <section id="section-bundles">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("bundlesTitle")}
      </h2>

      <div className="mt-5 space-y-4">
        {bundles.map((b) => (
          <BundleCard key={b.id} bundle={b} slug={slug} locale={locale} />
        ))}
      </div>
    </section>
  );
}

function BundleCard({ bundle, slug, locale }: { bundle: Bundle; slug: string; locale: string }) {
  const t = useTranslations("salonDetail");
  const showDiscount = bundle.pricing_mode === "percent" && bundle.percent_off != null;
  const showStruck = bundle.bundle_price < bundle.sum_price;

  // Carry the bundle's services preselected into the booking flow + the bundle_id tag.
  const serviceCsv = bundle.services.map((s) => s.id).join(",");
  const bookingHref = `/${locale}/salon/${slug}/booking?services=${serviceCsv}&bundle=${bundle.id}`;

  return (
    <div className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        {/* mockup-ok: owner picked this off the three-way icon comparison at /dev/round5,
            "the combined two drilling into one". A cardboard parcel was wrong for two services
            sold together, which is what he flagged: nothing is being shipped. */}
        <Combine size={16} strokeWidth={2} className="text-s-ink" aria-hidden />
        {/* mockup-ok: /dev/round5 option two, "One font". The combo name was the ONLY thing on the
            PDP set in the display face at this size, so a card whose whole job is "these services
            belong together" was announcing itself in a different voice from the services it
            contains. Same face as the service rows below it now, which is what he tapped. */}
        <p className="font-body text-[16px] font-bold text-s-ink">{bundle.name}</p>
      </div>

      <div>
        {bundle.services.map((s) => (
          <div
            key={s.id}
            className="flex items-center justify-between border-t border-s-border px-4 py-3 first:border-t-0"
          >
            <p className="truncate font-body text-[14px] font-medium text-s-ink">
              {/* P3-3 (2026-09-05): was an en-only ternary, so fr/it always fell to German
                  anyway but by accident rather than by a real fallback chain. Same
                  localizedField helper as SalonServices.tsx's service rows. */}
              {localizedField(s as unknown as Record<string, unknown>, "name", locale)}
            </p>
            {/* mockup-ok: /dev/round5 option two, second half. 12px was a fifth type size that
                existed nowhere else in the card; 13px is one the card already used, so the card
                drops from five sizes to four without losing a single level of hierarchy. */}
            <span className="flex shrink-0 items-center gap-1 pl-3 text-[13px] text-s-ink-2 tabular-nums">
              {/* Casing matches SalonServices.tsx formatDurationDE (owner-locked 2026-06-09: lowercase
                  "min", no period) , NOT the shared minutesUnit i18n key ("Min", used by dashboard/services). */}
              <Clock size={11} strokeWidth={1.9} aria-hidden /> {s.duration_minutes} min
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-s-border px-4 py-3.5">
        <div className="flex min-w-0 items-baseline gap-2">
          {showStruck && (
            <span className="font-body text-[13px] text-s-ink-2 line-through tabular-nums">
              {formatCurrency(bundle.sum_price, locale)}
            </span>
          )}
          <span className="font-body text-[16px] font-bold text-s-ink tabular-nums">
            {formatCurrency(bundle.bundle_price, locale)}
          </span>
          {/* mockup-ok: /dev/round5 option two , same 12->13 step as the duration above, applied
              here too because the option he tapped moved every 12px in the card at once and this
              pill was one of them. The pale-green + s-success recipe itself is untouched. */}
          {showDiscount && (
            <span className="rounded-full bg-s-success-bg px-2.5 py-1 font-body text-[13px] font-semibold text-s-success tabular-nums">
              &minus;{bundle.percent_off}%
            </span>
          )}
        </div>
        {/* FIX-4: neutral OUTLINE pill , the SAME recipe the sibling service rows use
            (SalonServices ServiceRow). LOCKFILE: one ink commit CTA per page, owned by the
            sticky "Termin buchen"; sibling Buchen buttons are neutral outline, not bg-s-ink. */}
        <Link
          href={bookingHref}
          className="font-body shrink-0 rounded-full border border-s-border bg-white px-5 py-2 text-[13px] font-semibold text-s-ink transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.97] active:duration-[80ms] active:ease-glide md:px-6 md:py-2.5 md:text-[14px]"
        >
          {t("bundlesBook")}
        </Link>
      </div>
    </div>
  );
}
