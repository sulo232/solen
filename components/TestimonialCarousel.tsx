"use client";

import { useTranslations } from "next-intl";

interface Testimonial {
  quote: string;
  name: string;
  city: string;
  initial: string;
  avatarColor: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Endlich eine App wo ich alle Salons vergleichen kann. Hab meinen Lieblingssalon gefunden und buche jetzt nur noch über Solen.",
    name: "Mira S.",
    city: "Basel",
    initial: "M",
    avatarColor: "#E8624A",
  },
  {
    quote: "Super einfach zu buchen, immer aktuelle Verfügbarkeit. Benutze es jede Woche — kein Telefonieren mehr!",
    name: "Lisa M.",
    city: "Bern",
    initial: "L",
    avatarColor: "#D4870A",
  },
  {
    quote: "Sogar Last-Minute Angebote mit Rabatt gefunden. Mega Plattform für die Schweiz — so eine App hat gefehlt!",
    name: "Elena P.",
    city: "Winterthur",
    initial: "E",
    avatarColor: "#4A1E3C",
  },
];

function StarRow() {
  return (
    <div className="flex gap-0.5" role="img" aria-label="5 von 5 Sternen">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#E8624A" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialCarousel() {
  const t = useTranslations("home");

  return (
    <section
      className="px-5 md:px-6 lg:px-10 xl:px-20 py-16"
      style={{ background: "#FDFAF6" }}
      aria-labelledby="testimonials-heading"
    >
      {/* Header */}
      <span className="block font-heading text-[10px] font-bold uppercase tracking-[.14em] text-s-coral mb-1.5">
        {t("testimonials.eyebrow") || "Echte Bewertungen"}
      </span>
      <h2
        id="testimonials-heading"
        className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text tracking-tight mb-7"
        style={{ lineHeight: "1.1", letterSpacing: "-.01em" }}
      >
        {t("testimonials.title") || "Was unsere Nutzer sagen"}
      </h2>

      {/* 3-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {TESTIMONIALS.map((testimonial) => (
          <article
            key={testimonial.name}
            className="bg-white dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.08] rounded-[16px] p-6 flex flex-col gap-3.5 transition-[transform,box-shadow] duration-[300ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[3px] hover:shadow-[0_4px_16px_rgba(26,18,9,.07)]"
            style={{ boxShadow: "0 1px 3px rgba(26,18,9,.04)" }}
          >
            <StarRow />
            <p className="font-body text-sm leading-relaxed text-s-ink dark:text-s-dm-text italic flex-1">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div className="flex items-center gap-2.5 pt-3 border-t border-s-ink/[0.08] dark:border-white/[0.08]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-heading font-bold text-[13px] text-white"
                style={{ background: testimonial.avatarColor }}
                aria-hidden="true"
              >
                {testimonial.initial}
              </div>
              <div>
                <p className="font-heading font-semibold text-[13px] text-s-ink dark:text-s-dm-text leading-tight">
                  {testimonial.name}
                </p>
                <p className="font-body text-[11px] text-s-ink/40 dark:text-s-dm-text/40 leading-tight">
                  {testimonial.city}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
