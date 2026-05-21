"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Store } from "lucide-react";
import { Section, SectionTitle, SectionFrame, ScrollRow } from "./SectionHeader";
import { cn } from "@/lib/utils";

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

const REVIEWS: Review[] = [
  {
    stars: 5,
    text: "Termin in 30 Sekunden, keine Anrufe, keine Vorab-Zahlung. Salon Maria war wie immer top, aber die Buchung über Solen war diesmal einfach besser.",
    initials: "LK",
    name: "Lara K.",
    meta: "Basel · vor 2 Wochen",
    salonName: "Salon Maria",
    salonSlug: "salon-maria",
  },
  {
    stars: 5,
    text: "Last-Minute heute Abend zu Bohème: 25% Rabatt und der beste Fade meines Lebens. Die Heute-frei-Anzeige ist Gold wert wenn man spontan ist.",
    initials: "MH",
    name: "Marc H.",
    meta: "Basel · vor 5 Tagen",
    salonName: "Bohème",
    salonSlug: "boheme",
  },
  {
    stars: 5,
    text: "Habe einen Look auf Entdecken gespeichert und konnte direkt buchen, same-day. Die Stylistin hatte das Foto schon offen als ich ankam. Magic.",
    initials: "SR",
    name: "Sara R.",
    meta: "Zürich · vor 1 Woche",
    salonName: "Nail Lab",
    salonSlug: "nail-lab",
  },
  {
    stars: 5,
    text: "Endlich kein Telefonieren mehr. Drei Optionen verglichen, eine gebucht, fertig in unter zwei Minuten. So sollte das überall funktionieren.",
    initials: "AM",
    name: "Anna M.",
    meta: "Bern · vor 3 Tagen",
    salonName: "Rhein Spa",
    salonSlug: "rhein-spa",
  },
  {
    stars: 4,
    text: "Buchung war easy, Salon top. Einziger Kritikpunkt: Wegbeschreibung zeigt nicht alle Eingänge. Aber das ist Detail. Komme wieder.",
    initials: "TW",
    name: "Tobias W.",
    meta: "Zürich · vor 1 Woche",
    salonName: "Atelier Coiffure",
    salonSlug: "atelier-coiffure",
  },
  {
    stars: 5,
    text: "Mein Geburtstagsgeschenk war eigentlich der Salonbesuch, aber dass ich es online buchen konnte, ohne fünfmal anzurufen, war fast besser.",
    initials: "ES",
    name: "Eva S.",
    meta: "Basel · vor 4 Tagen",
    salonName: "Nail Lab",
    salonSlug: "nail-lab",
  },
  {
    stars: 5,
    text: "Habe den Salon zufällig über die Karte gefunden, 200 m von zu Hause. Wie konnte ich den nicht kennen? Bewertungen waren spot-on.",
    initials: "NB",
    name: "Niklas B.",
    meta: "Luzern · vor 6 Tagen",
    salonName: "Studio Nord",
    salonSlug: "studio-nord",
  },
  {
    stars: 5,
    text: "Premium ohne Premium-Preise. Spa-Atmosphäre wie in einem 5-Sterne-Hotel, aber ich habe normal mit Solen gebucht: gleicher Preis, sofortige Bestätigung.",
    initials: "SL",
    name: "Sophie L.",
    meta: "Lausanne · vor 10 Tagen",
    salonName: "Rhein Spa",
    salonSlug: "rhein-spa",
  },
];

export default function Reviews() {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const router = useRouter();

  const openReview = (slug: string) => {
    router.push(`/salon/${slug}/reviews`);
  };

  return (
    <Section>
      <SectionFrame>
        <SectionTitle
          title="Bewertungen"
          link={{ label: "Alle Bewertungen →", href: "/reviews" }}
          scrollRef={scrollRef}
        />
        <ScrollRow ref={scrollRef}>
          {REVIEWS.map((r, i) => (
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
  return (
    <div
      className={cn(
        "relative shrink-0 w-[280px] md:w-[300px]",
        "flex flex-col min-h-[320px]",
        "snap-start scroll-snap-align-start",
        "rounded-2xl border bg-s-bg-surface p-6",
        "border-s-border",
        "shadow-[0_1px_3px_rgba(31,23,9,0.04)]",
        "transition-[transform,box-shadow] duration-200 ease-glide",
        "hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(31,23,9,0.08)]",
        "focus-within:-translate-y-[2px] focus-within:shadow-[0_8px_20px_rgba(31,23,9,0.08)]",
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
          "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2",
        )}
      />

      {/* Stars row */}
      <div
        className="relative pointer-events-none inline-flex gap-[2px] text-[14px] tracking-[0.05em] mb-4"
        style={{ color: "#F3A864" }}
        aria-hidden
      >
        {"★".repeat(review.stars)}
      </div>

      {/* Quote body — flex-1 + line-clamp-5 keeps consistent card heights */}
      <p className="relative pointer-events-none flex-1 font-body text-[14px] leading-[1.55] text-s-ink line-clamp-5 mb-4">
        &ldquo;{review.text}&rdquo;
      </p>

      {/* Footer: avatar + name + meta + salon link, divider above */}
      <div className="relative mt-auto pt-4 border-t border-s-border flex items-start gap-3">
        <div
          className="pointer-events-none font-display grid h-9 w-9 shrink-0 place-items-center rounded-full text-[11px] font-black text-s-ink-2 bg-s-bg-sunken"
          aria-hidden
        >
          {review.initials}
        </div>
        <div className="min-w-0 flex-1">
          <div className="pointer-events-none font-body text-[13px] font-bold text-s-ink truncate">
            {review.name}
          </div>
          <div className="pointer-events-none font-body text-[11px] text-s-ink-3 truncate">
            {review.meta}
          </div>
          {/* V2-D49l salon link — secondary tap target, z-10 above overlay */}
          <Link
            href={`/salon/${review.salonSlug}`}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Salon ${review.salonName} ansehen`}
            className={cn(
              "relative z-10 mt-1 inline-flex items-center gap-1",
              "font-body text-[12px] font-semibold text-s-brand",
              "transition-colors duration-150 ease-glide hover:text-s-brand-mid",
              "focus-visible:outline-2 focus-visible:outline-s-brand focus-visible:outline-offset-2 focus-visible:rounded-sm",
            )}
          >
            <Store size={12} strokeWidth={2.25} aria-hidden />
            <span className="truncate max-w-[140px]">{review.salonName}</span>
            <ChevronRight size={12} strokeWidth={2.5} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
