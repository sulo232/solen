import { Section, SectionHeader } from "./SectionHeader";

/**
 * Echte Bewertungen — V3 (LIVE_TRUTH §Q51.7).
 *
 * Testimonial review cards. Different pattern from card carousels:
 *   - Static 3-col grid (no horizontal scroll)
 *   - Cards are review cards (white bg + border, NOT photos)
 *   - Filter rule: 4+ stars only, max 6, sorted by recency (Q57)
 *
 * Server component. Static demo data — Phase 2 wires
 * `/api/reviews/homepage` (4+ stars, max 6, latest first).
 *
 * NOT in this commit:
 *   - Real review query (Phase 2)
 *   - Per-review link to full review on /salon/[slug]/reviews
 *   - Photo display in review cards (review-with-photo variant) —
 *     defer until Phase 3 §RV reviews-write surfaces photo upload
 *   - Star slider for write-review prompt — different feature, §RV
 */

interface Review {
  /** 1-5 stars (we only render 4+ here per Q57). */
  stars: number;
  /** Quote text. */
  text: string;
  /** Reviewer initials for avatar. */
  initials: string;
  /** Reviewer first name + last initial. */
  name: string;
  /** "City · Category · how-recent". */
  meta: string;
}

const DEMO: Review[] = [
  {
    stars: 5,
    text: "Die App ist endlich was Solides für die Schweiz. Termin in 30 Sekunden, keine Anrufe, keine Vorab-Zahlung. Salon Maria war wie immer top — aber die Buchung über Solen war diesmal einfach besser.",
    initials: "LK",
    name: "Lara K.",
    meta: "Basel · Coiffeur · vor 2 Wochen",
  },
  {
    stars: 5,
    text: "Last-Minute heute Abend zu Bohème — 25% Rabatt und der beste Fade meines Lebens. Die Heute-frei-Anzeige ist Gold wert wenn man spontan ist.",
    initials: "MH",
    name: "Marc H.",
    meta: "Basel · Barbershop · vor 5 Tagen",
  },
  {
    stars: 5,
    text: "Habe einen Look auf Entdecken gespeichert und konnte direkt buchen — same-day. Die Stylistin hatte das Foto schon offen als ich ankam. Magic.",
    initials: "SR",
    name: "Sara R.",
    meta: "Zürich · Nails · vor 1 Woche",
  },
];

export default function Reviews() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Was Kund:innen sagen"
        meta={`4+ Sterne · max ${DEMO.length}`}
        title="Echte Bewertungen"
        link={{ label: "Alle Bewertungen →", href: "/reviews" }}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {DEMO.map((r) => (
          <article
            key={r.name}
            className="flex flex-col rounded-2xl border border-black/5 bg-white p-7 shadow-[0_1px_3px_rgba(50,47,44,0.04)]"
          >
            {/* Stars row — render N filled stars */}
            <div
              className="mb-3 inline-flex gap-[2px] text-[16px] text-[#F3A864]"
              aria-label={`${r.stars} von 5 Sternen`}
            >
              {Array.from({ length: r.stars }).map((_, i) => (
                <span key={i} aria-hidden>★</span>
              ))}
            </div>

            {/* Quote */}
            <p className="font-body flex-1 text-[16px] leading-[1.55] text-s-ink">
              &ldquo;{r.text}&rdquo;
            </p>

            {/* Author block — top-border separator */}
            <div className="mt-4 flex items-center gap-3 border-t border-black/5 pt-4">
              <div
                className="font-display grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-black text-s-brand"
                style={{
                  background: "linear-gradient(135deg, #C2F0F1, #CAE8FF)",
                }}
                aria-hidden
              >
                {r.initials}
              </div>
              <div className="min-w-0">
                <div className="font-body text-[14px] font-bold text-s-ink">{r.name}</div>
                <div className="font-body mt-[2px] text-[12px] text-s-ink-3">{r.meta}</div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
