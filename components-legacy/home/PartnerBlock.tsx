"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

/**
 * PartnerBlock — Phase 8.5 / B4 (locked 2026-05-03).
 *
 * Reference: `public/solen-coral.html:1084-1116` (HTML) + 331-347 (CSS).
 * Additive marketing block for the homepage — pitch to salon owners.
 *
 * Anatomy:
 * - Outer section: white bg, 80px vertical padding
 * - Inner card: solid plum `#4A1E3C` (Q16 lock — no gradient), 20px radius,
 *   56px×48px padding, soft plum-tinted shadow
 * - Two decorative white-alpha circles (.p-deco1 + .p-deco2) for the
 *   "premium pitch" feel without violating the no-blob-elsewhere rule
 *   (these are localized to the partner card only)
 * - Two-col grid: copy on left, stats on right
 * - Eyebrow Figtree 700 11px white-60% .22em uppercase
 * - Headline Anton clamp(52px,7vw,96px) line-height 0.87 white, 2 lines
 * - Sub Figtree italic 16px white-70% line-1.8 max-w 480
 * - 4 feature dots (yellow `#F2C144` per ref `:342`) with labels
 * - Two CTAs: "Jetzt registrieren" + "Mehr erfahren" (white-alpha buttons)
 * - Stats: 2 Anton 52px white numbers with Figtree label below
 */

export default function PartnerBlock() {
  const locale = useLocale();
  const t = useTranslations("home") as any;

  return (
    <section className="px-5 md:px-10 lg:px-20 py-16 md:py-20" style={{ background: "#FFFFFF" }} aria-labelledby="partner-heading">
      <div className="max-w-[1200px] mx-auto">
        <div
          className="relative overflow-hidden rounded-[20px]"
          style={{
            background: "#4A1E3C",
            padding: "56px 48px",
            boxShadow: "0 12px 40px rgba(74,30,60,0.22)",
          }}
        >
          {/* Decorative circles per ref :334-335 */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{ width: 300, height: 300, background: "rgba(255,255,255,0.08)", right: -60, top: -60 }}
            aria-hidden
          />
          <div
            className="absolute pointer-events-none rounded-full"
            style={{ width: 200, height: 200, background: "rgba(255,255,255,0.05)", left: "48%", bottom: -40 }}
            aria-hidden
          />

          {/* Content */}
          <div className="relative z-[1] grid gap-12 md:grid-cols-[1fr_auto] items-center">
            {/* Left column — copy + features + CTAs */}
            <div>
              {/* Strings hardcoded German — next-intl's t() returns literal key path
                  for missing keys, so `|| "fallback"` never fires. i18n key migration
                  is a separate task per Phase 9 polish. */}
              <span
                className="block font-body font-bold uppercase mb-3"
                style={{ fontSize: 11, letterSpacing: ".22em", color: "rgba(255,255,255,0.6)" }}
              >
                Für Salon-Inhaber
              </span>

              <h2
                id="partner-heading"
                className="font-heading mb-4 uppercase"
                style={{
                  fontSize: "clamp(52px, 7vw, 96px)",
                  lineHeight: 0.87,
                  color: "#FFFFFF",
                  letterSpacing: "0.01em",
                }}
              >
                DEIN SALON.
                <br />
                BASEL BUCHT.
              </h2>

              <p
                className="font-body italic mb-7 max-w-[480px]"
                style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", lineHeight: 1.8 }}
              >
                Bringe dein Geschäft auf das nächste Level. Neue Kund:innen, volle Termine, weniger Leerstunden.
              </p>

              {/* Feature dots */}
              <div className="flex flex-wrap mb-8" style={{ gap: 24 }}>
                {[
                  "Kostenloser Einstieg",
                  "Last-Minute Angebote",
                  "Echtzeit-Kalender",
                  "TWINT-Zahlung",
                ].map((label) => (
                  <div
                    key={label}
                    className="flex items-center font-body"
                    style={{ gap: 8, fontSize: 13, color: "rgba(255,255,255,0.8)" }}
                  >
                    <span
                      className="inline-block rounded-full shrink-0"
                      style={{ width: 6, height: 6, background: "#F2C144" }}
                      aria-hidden
                    />
                    {label}
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex gap-3 flex-wrap">
                <Link
                  href={`/${locale}/onboarding/salon`}
                  className="inline-flex items-center justify-center font-body font-bold uppercase transition-all duration-150 hover:brightness-[1.06] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 focus-visible:ring-offset-[#4A1E3C]"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "#FFFFFF",
                    padding: "10px 20px",
                    borderRadius: 99,
                    fontSize: 13,
                    letterSpacing: ".04em",
                  }}
                >
                  Jetzt registrieren
                </Link>
                <Link
                  href={`/${locale}/partner`}
                  className="inline-flex items-center justify-center font-body font-bold uppercase transition-all duration-150 hover:bg-white/[0.08] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 focus-visible:ring-offset-[#4A1E3C]"
                  style={{
                    background: "transparent",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "rgba(255,255,255,0.7)",
                    padding: "10px 20px",
                    borderRadius: 99,
                    fontSize: 13,
                    letterSpacing: ".04em",
                  }}
                >
                  Mehr erfahren
                </Link>
              </div>
            </div>

            {/* Right column — stats */}
            <div className="flex flex-wrap" style={{ gap: 32 }}>
              <div>
                <div className="font-heading tabular-nums" style={{ fontSize: 52, lineHeight: 1, color: "#FFFFFF", marginBottom: 2 }}>
                  247
                </div>
                <div
                  className="font-body font-semibold uppercase"
                  style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(255,255,255,0.45)" }}
                >
                  Buchungen
                  <br />
                  diese Woche
                </div>
              </div>
              <div>
                <div className="font-heading tabular-nums" style={{ fontSize: 52, lineHeight: 1, color: "#FFFFFF", marginBottom: 2 }}>
                  38
                </div>
                <div
                  className="font-body font-semibold uppercase"
                  style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(255,255,255,0.45)" }}
                >
                  Partner-
                  <br />
                  salons
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
