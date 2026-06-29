"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { ChevronRight, Star, Store } from "lucide-react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
import { cn, slugify } from "@/lib/utils";

/**
 * Bewertungen — Fresha-style horizontal carousel (2026-05-14).
 *
 * SUPERSEDES the V2-D47 / V2-D49l vertical-marquee 3-column layout. New
 * pattern matches every other homepage carousel (Coiffeur, LastMinute,
 * Nearby, RecentlyViewed): `Section > SectionFrame > SectionTitle +
 * ScrollRow` — gets the Airbnb-style scroll arrows (V2-D49m) for free
 * via SectionTitle's `scrollRef` prop.
 *
 * V2-D49l SPLIT-TAP preserved: each card has TWO independent click
 * targets — overlay button on card body opens the review (stub: routes
 * to /salon/[slug]/reviews until /api/reviews/featured ships), salon
 * link jumps to /salon/[slug].
 *
 * BACKEND CONTRACT (Phase 2 — `/api/reviews/featured?limit=10`):
 *   Returns reviews shaped EXACTLY like the demo data below:
 *     { stars, text, initials, name, salonName, salonSlug, meta }
 */

interface Review {
  stars: number;
  text: string;
  initials: string;
  name: string;
  meta: string;
  salonName: string;
  salonSlug: string;
}

// 2026-06-05: salonSlug/salonName point at REAL seeded salons (Basel) so the
// salon-link + the card-body "open review" target both resolve to a live PDP
// instead of a 404. Inline salon-name mentions in the quote text were updated
// to match. The reviewer/quote content is otherwise unchanged demo copy.
const REVIEWS: Review[] = [
  {
    stars: 5,
    text: "Termin in 30 Sekunden, keine Anrufe, keine Vorab-Zahlung. Muse Beauty Studio war wie immer top, aber die Buchung über Solen war diesmal einfach besser.",
    initials: "LK",
    name: "Lara K.",
    meta: "Basel vor 2 Wochen",
    salonName: "Muse Beauty Studio",
    salonSlug: "muse-beauty-studio",
  },
  {
    stars: 5,
    text: "Spontan ohne Termin zu Old Town Barbers: Nummer auf dem Handy gezogen, kurz Kaffee geholt und der beste Fade meines Lebens. Die Warteschlangen-Anzeige ist Gold wert.",
    initials: "MH",
    name: "Marc H.",
    meta: "Basel vor 5 Tagen",
    salonName: "Old Town Barbers",
    salonSlug: "old-town-barbers",
  },
  {
    stars: 5,
    text: "Habe einen Look auf Inspo gespeichert und konnte direkt buchen, same-day. Die Stylistin hatte das Foto schon offen als ich ankam. Magic.",
    initials: "SR",
    name: "Sara R.",
    meta: "Basel vor 1 Woche",
    salonName: "Nail Studio Bliss",
    salonSlug: "nail-studio-bliss",
  },
  {
    stars: 5,
    text: "Endlich kein Telefonieren mehr. Drei Optionen verglichen, eine gebucht, fertig in unter zwei Minuten. So sollte das überall funktionieren.",
    initials: "AM",
    name: "Anna M.",
    meta: "Basel vor 3 Tagen",
    salonName: "Smooth Skin Studio",
    salonSlug: "smooth-skin-studio",
  },
  {
    stars: 4,
    text: "Buchung war easy, Salon top. Einziger Kritikpunkt: Wegbeschreibung zeigt nicht alle Eingänge. Aber das ist Detail. Komme wieder.",
    initials: "TW",
    name: "Tobias W.",
    meta: "Basel vor 1 Woche",
    salonName: "Glow Lab Basel",
    salonSlug: "glow-lab-basel",
  },
  {
    stars: 5,
    text: "Mein Geburtstagsgeschenk war eigentlich der Salonbesuch, aber dass ich es online buchen konnte, ohne fünfmal anzurufen, war fast besser.",
    initials: "ES",
    name: "Eva S.",
    meta: "Basel vor 4 Tagen",
    salonName: "Nail Studio Bliss",
    salonSlug: "nail-studio-bliss",
  },
  {
    stars: 5,
    text: "Habe den Salon zufällig über die Karte gefunden, 200 m von zu Hause. Wie konnte ich den nicht kennen? Bewertungen waren spot-on.",
    initials: "NB",
    name: "Niklas B.",
    meta: "Basel vor 6 Tagen",
    salonName: "The Fade Factory",
    salonSlug: "the-fade-factory",
  },
  {
    stars: 5,
    text: "Premium ohne Premium-Preise. Spa-Atmosphäre wie in einem 5-Sterne-Hotel, aber ich habe normal mit Solen gebucht: gleicher Preis, sofortige Bestätigung.",
    initials: "SL",
    name: "Sophie L.",
    meta: "Basel vor 10 Tagen",
    salonName: "Smooth Skin Studio",
    salonSlug: "smooth-skin-studio",
  },
];

export default function Reviews() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();
  const locale = useLocale();
  const [reviews, setReviews] = React.useState<Review[]>(REVIEWS);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/reviews/featured?limit=10")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        const items: any[] = Array.isArray(data?.items) ? data.items : [];
        if (items.length === 0) return; // keep fallback
        const mapped: Review[] = items.map((item) => {
          const name: string = item.reviewer_name ?? "Anonym";
          // Derive initials from the reviewer name (up to 2 chars).
          const initials = name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w: string) => w[0].toUpperCase())
            .join("");
          // Prefer the real slug from the API; fall back to deriving one from the name.
          const salonName: string = item.salon_name ?? "";
          const salonSlug = item.salon_slug || slugify(salonName);
          // created_at gives us a relative date label, in the active locale.
          const meta: string = item.created_at
            ? new Date(item.created_at).toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
              })
            : "";
          return {
            stars: Math.min(5, Math.max(1, Math.round(item.rating ?? 5))),
            text: item.comment ?? "",
            initials,
            name,
            meta,
            salonName,
            salonSlug,
          };
        });
        setReviews(mapped);
      })
      .catch((err) => {
        console.error("[Reviews] featured fetch failed:", err);
        // keep hardcoded fallback
      });
    return () => { cancelled = true; };
  }, []);

  const openReview = (slug: string) => {
    router.push(`/${locale}/salon/${slug}/reviews`);
  };

  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title="Bewertungen"
          link={{ label: "Alle Bewertungen →", href: `/${locale}/reviews` }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
          {reviews.map((r, i) => (
            <ReviewCard
              key={`${r.salonSlug}-${i}`}
              review={r}
              onOpenReview={() => openReview(r.salonSlug)}
            />
          ))}
        </ScrollRow>
      </SectionFrame>
    </Section>
  );
}

function ReviewCard({
  review,
  onOpenReview,
}: {
  review: Review;
  onOpenReview: () => void;
}) {
  const locale = useLocale();
  // V3-D169 (2026-05-26): split `meta` ("Basel · vor 2 Wochen") so the
  // time-relative portion can sit top-right (Fresha/TexBazar pattern)
  // while the city stays implicit via the salon name below.
  const dateText = review.meta.includes("·") ? (review.meta.split("·").pop() ?? "").trim() : review.meta;

  return (
    <div
      className={cn(
        // V3-D169: card shrunk. 280-300 → 260-280, p-6 → p-4, min-h
        // 320 → 220. Density up = more cards visible per scroll =
        // feels "alive" without any added motion.
        "relative shrink-0 w-[260px] md:w-[280px]",
        "flex flex-col min-h-[220px]",
        "snap-start scroll-snap-align-start",
        "rounded-2xl border bg-s-bg-surface p-4",
        "border-s-border",
        "shadow-elevation-2",
        "transition-[transform,box-shadow] duration-200 ease-glide",
        "hover:-translate-y-[2px] hover:shadow-elevation-3",
        "focus-within:-translate-y-[2px] focus-within:shadow-elevation-3",
      )}
    >
      {/* V2-D49l overlay button — full-card click target for opening review */}
      <button
        type="button"
        onClick={onOpenReview}
        aria-label={`Bewertung von ${review.name} öffnen`}
        className={cn(
          "absolute inset-0 z-0 rounded-2xl",
          "active:scale-[0.98] active:duration-[80ms] transition-transform",
          "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2",
        )}
      />

      {/* Top row: filled lucide stars left, date right.
          V3-D169: replaces the bare orange ★ row with lucide Star icons.
          V3-D180 (2026-05-26, council unanimous): (1) star size 13→12
          to match SalonCard exactly (1px parity break across page).
          (2) Dropped "(5/5)" — 5 gold stars already say it. */}
      <div className="relative pointer-events-none mb-3 flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-[1px]">
          {Array.from({ length: review.stars }).map((_, i) => (
            <Star
              key={i}
              size={12}
              stroke="none"
              aria-hidden
              className="fill-s-star"
            />
          ))}
        </div>
        <span className="shrink-0 font-body text-[12px] font-normal text-s-ink-3 tabular-nums">
          {dateText}
        </span>
      </div>

      {/* Quote body — flex-1 + line-clamp-3 keeps consistent card heights.
          V3-D180 (council unanimous): (3) line-clamp-4 → line-clamp-3
          (3 lines reads as quote pull, 4 reads as paragraph). (4) leading
          1.55 → 1.5 (card density not article density). */}
      <p className="relative pointer-events-none flex-1 font-body text-[14px] leading-[1.5] text-s-ink line-clamp-3 mb-3">
        &ldquo;{review.text}&rdquo;
      </p>

      {/* Footer (no divider line per V3-D169 — content carries itself).
          Avatar + name stacked with salon link. */}
      <div className="relative mt-auto flex items-center gap-2.5">
        <div
          className="pointer-events-none font-display grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-black text-s-ink-2 bg-s-bg-sunken"
          aria-hidden
        >
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="pointer-events-none font-body text-[13px] font-medium leading-[1.2] text-s-ink truncate">
            {review.name}
          </div>
          {/* V2-D49l salon link — secondary tap target, z-10 above overlay */}
          <Link
            href={`/${locale}/salon/${review.salonSlug}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Salon ${review.salonName} ansehen`}
            className={cn(
              "relative z-10 mt-0.5 inline-flex items-center gap-1",
              "font-body text-[12px] font-normal text-s-ink-2",
              "transition-colors duration-150 ease-glide hover:text-s-ink",
              "focus-visible:outline-2 focus-visible:outline-s-ink focus-visible:outline-offset-2 focus-visible:rounded-sm",
            )}
          >
            <Store size={11} strokeWidth={2.25} aria-hidden />
            <span className="truncate max-w-[140px]">{review.salonName}</span>
            <ChevronRight size={11} strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
