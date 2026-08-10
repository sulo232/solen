"use client";

/**
 * /dev/pdp/cta — owner review: 3 REAL-COMPONENT directions for the mid-page PDP
 * booking CTA. Renders the ACTUAL app/[locale]/_components/salon/SalonAppCta.tsx
 * three times — no hand-drawn approximation, no forked copy of the component.
 * The three renders are varied ONLY via SalonAppCta's new optional `variant`
 * prop (default "hero" = today's shipped markup, byte-identical, so every other
 * caller of SalonAppCta — SalonDetailV3.tsx — is unaffected by this route).
 *
 * Directions (owner brief):
 *   A "hero"    — current booking-first hero card + quiet footer-links row.
 *   B "twoTier" — same hero card, but cross-links promoted to an explicitly
 *                 labelled "Andere Salons in Basel" chip row (intentional
 *                 discovery, not a demoted afterthought).
 *   C "minimal" — single full-width book bar, SEO links reduced to one quiet
 *                 text line.
 *
 * Fixture: "Cuts & Culture" — the same barbershop identity already used as a
 * dev fixture elsewhere (app/[locale]/dev/search-rich, search-balance,
 * review-preview: name "Cuts & Culture", rating 4.8, Basel). SalonAppCta's own
 * prop shape is only locale/slug/salonName/city/quartier/variant — it has no
 * rating/review-count prop — so 4.8 (16) is shown as page-level context text
 * here, never invented as a prop the component doesn't accept.
 *
 * Exists-check: no app/[locale]/dev/pdp/* route existed before this file
 * (grep app/[locale]/dev for "pdp" = no hits pre-change) — net-new dev route.
 * Dev-only: notFound() in production, matching every other /dev/* page here.
 */
import { notFound } from "next/navigation";
import { SalonAppCta } from "@/app/[locale]/_components/salon/SalonAppCta";

// Real prop shape SalonAppCta expects — no fields beyond what the component
// declares. slug/salonName/city match the "Cuts & Culture" fixture already
// used in app/[locale]/dev/search-rich + search-balance + review-preview;
// quartier is the raw DB-slug shape (formatQuartier turns "grossbasel" into
// "Grossbasel" inside the component, same as every other quartier caller).
const FIXTURE = {
  locale: "de",
  slug: "cuts-culture",
  salonName: "Cuts & Culture",
  city: "Basel",
  quartier: "grossbasel",
};

const DIRECTIONS: {
  key: "hero" | "twoTier" | "minimal";
  title: string;
  rationale: string;
}[] = [
  {
    key: "hero",
    title: "Direction A — Booking-first (aktuell)",
    rationale:
      "Eine starke Ink-Karte trägt den Buchen-CTA allein, die Cross-Links laufen ruhig als eine Zeile darunter.",
  },
  {
    key: "twoTier",
    title: "Direction B — Two tiers",
    rationale:
      "Die Booking-Karte bleibt unverändert, die Cross-Links werden als klar beschriftete Andere-Salons-in-Basel-Chip-Reihe zur bewussten Entdeckung befördert statt anonym demotet.",
  },
  {
    key: "minimal",
    title: "Direction C — Minimal",
    rationale:
      "Ein schmaler, ganzbreiter Book-Balken statt Karte; SEO-Links auf eine einzige, sehr ruhige Textzeile reduziert.",
  },
];

export default function PdpCtaDirectionsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-screen bg-s-bg-sunken px-4 py-10">
      <div className="mx-auto max-w-[460px]">
        <p className="font-body text-[12px] font-semibold text-s-ink-2">Solen — /dev/pdp/cta</p>
        <h1 className="mt-1 font-heading text-[22px] font-bold tracking-[-0.01em] text-s-ink">
          PDP-Buchen-CTA — 3 Richtungen
        </h1>
        <p className="mt-1 font-body text-[13.5px] text-s-ink-2">
          Die echte SalonAppCta-Komponente, dreimal gerendert — nur der neue variant-Prop
          unterscheidet sich. Fixture: Cuts &amp; Culture, Basel, 4.8 (16 Bewertungen).
        </p>

        <div className="mt-10 flex flex-col gap-12">
          {DIRECTIONS.map((d) => (
            <div key={d.key}>
              <h2 className="font-body text-[15px] font-bold text-s-ink">{d.title}</h2>
              <p className="mt-1 font-body text-[13px] text-s-ink-2">{d.rationale}</p>

              <div className="mx-auto mt-4 w-full max-w-[390px] overflow-hidden rounded-2xl border border-s-border bg-white shadow-elevation-2">
                <div className="px-4 py-6">
                  <SalonAppCta {...FIXTURE} variant={d.key} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
