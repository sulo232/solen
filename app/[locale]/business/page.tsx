import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Star } from "lucide-react";
import { buildAlternates } from "@/lib/seo";
import BentoBusiness, { JoinUsCard } from "../_components/homepage/BentoBusiness";
import { Step } from "../_components/business/Step";
import { FAQItem } from "../_components/business/FAQItem";
import { MarketplaceVisual } from "../_components/business/MarketplaceVisual";

/**
 * /de/business — Solen B2B landing page. V3-D220 (2026-05-26, /business rebuild).
 *
 * Replaces V3-D147 base with the Fresha-bones + Solen-skin IA per
 * `_tasks/rebuild-specs/business.md`.
 *
 * Section IA (top → bottom):
 *   1. HERO            — full-width illustration + overlay text + 2 CTAs
 *                        (Jetzt anmelden + Wie es funktioniert).
 *   2. TRUST STRIP     — "1'200+ Salons · Basel · Zürich · Bern · Lugano · ★ 4.9"
 *                        with lucide Star icon (no unicode per §7).
 *   3. HOW IT WORKS    — 3-step section using <Step> primitive. #how anchor.
 *   4. BENTO FEATURES  — Reuses BentoBusiness (4 cards + header).
 *   5. MARKETPLACE     — NEW. "Kund:innen finden dich." + <MarketplaceVisual>.
 *   6. PRICING         — Reaffirms no hidden fees, no setup, pay-per-booking.
 *                        #pricing anchor.
 *   7. FAQ             — NEW. 7-item native <details> accordion list.
 *   8. FINAL CTA       — JoinUsCard MorphingDialog inside BentoBusiness.
 *                        #anmelden anchor.
 *
 * Testimonials section deliberately omitted per spec Q23 — better silent
 * than fake. Re-add when 3+ real Solen partners have usable quotes.
 *
 * Header dropdown (V3-D208) routes:
 *   - "Wie es funktioniert" → #how      (handled by scroll-mt-24 on the section)
 *   - "Werde Solen-Partner" → #anmelden (inside JoinUsCard wrapper, below)
 *   - "Preise"              → #pricing  (handled by scroll-mt-24 on the section)
 */

const TITLES: Record<string, string> = {
  de: "Solen für dein Geschäft — Mehr Buchungen, weniger Aufwand",
  en: "Solen for your business — More bookings, less hassle",
  fr: "Solen pour ton commerce — Plus de réservations, moins d'efforts",
  it: "Solen per la tua attività — Più prenotazioni, meno fatica",
};

const DESCRIPTIONS: Record<string, string> = {
  de: "Werde Solen-Partner. Über 1'200 Schweizer Salons nutzen Solen für sofortige Bestätigungen, Direkt-Chat, einen vollen Kalender und tiefere Insights. In 60 Sekunden anmelden.",
  en: "Become a Solen partner. Over 1,200 Swiss salons use Solen for instant bookings, direct chat, a full calendar, and deeper insights. Sign up in 60 seconds.",
  fr: "Devenez partenaire Solen. Plus de 1 200 salons suisses utilisent Solen.",
  it: "Diventa partner di Solen. Oltre 1.200 saloni svizzeri usano Solen.",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale ?? "de";
  const title = TITLES[loc] ?? TITLES.de;
  const description = DESCRIPTIONS[loc] ?? DESCRIPTIONS.de;
  const alternates = buildAlternates("business", loc);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://solen.ch/${loc}/business`,
      siteName: "solen.ch",
      images: [
        {
          url: "/illustrations/business/business-hero.png",
          width: 1672,
          height: 941,
          alt: "Solen für Salons — Modern beauty salon at golden hour",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/illustrations/business/business-hero.png"],
    },
    alternates,
  };
}

export const revalidate = 600;

const STEPS = [
  {
    n: "01",
    title: "Anmelden",
    copy: "60 Sekunden Formular. Name, Salon, Stadt — fertig.",
  },
  {
    n: "02",
    title: "Verbinden",
    copy: "Wir melden uns innerhalb 24 Stunden. Onboarding in 7 Tagen.",
  },
  {
    n: "03",
    title: "Buchungen empfangen",
    copy: "Kund:innen finden dich, buchen direkt. Du bestätigst nichts mehr.",
  },
];

const PRICING_CHECKS = [
  "Kostenloses Onboarding",
  "Keine Setup-Gebühr",
  "Bezahlung pro Buchung",
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Wie viel kostet Solen?",
    a: "Kostenlose Anmeldung, keine Setup-Gebühr, keine monatliche Grundgebühr. Du zahlst nur pro vermitteltem Termin — fair und transparent.",
  },
  {
    q: "Wann zahle ich?",
    a: "Erst ab dem ersten erfolgreich vermittelten Termin. Bis dahin entstehen keine Kosten.",
  },
  {
    q: "Wie lange dauert das Onboarding?",
    a: "Anmelden in 60 Sekunden, Onboarding in 7 Tagen. Wir melden uns binnen 24 Stunden nach deiner Anmeldung.",
  },
  {
    q: "Kann ich meine bestehende Kalender-Software importieren?",
    a: "Ja. Wir unterstützen Imports aus den gängigen Schweizer Salon-Systemen. Sprich uns nach der Anmeldung an.",
  },
  {
    q: "Wer kümmert sich um Zahlungen?",
    a: "Solen verarbeitet die Zahlungen sicher via Stripe. Du erhältst eine monatliche Auszahlung — Anteil deiner Wahl.",
  },
  {
    q: "In welchen Städten ist Solen verfügbar?",
    a: "Aktuell Basel, Zürich, Bern und Lugano. Weitere Städte folgen 2026.",
  },
  {
    q: "Muss ich Mindestkund:innen vermitteln?",
    a: "Nein. Solen ist ein Marktplatz — du nimmst nur die Termine an, die dir passen.",
  },
];

export default async function BusinessPage() {
  return (
    <div className="relative bg-white">
      {/* ───────────────── 1 · HERO ─────────────────
          Full-width illustration with overlay text bottom-left (magazine
          cover treatment). Mobile: image stacks portrait above text.
          Desktop: image full-width with absolute text overlay.

          V3-D220 fixes from V3-D147:
            - H1 inline clamp(36,6.5vw,64) + tracking -0.025 → Hero H1 spec
              clamp(36,9vw,46) + tracking -0.03em (SOURCE.md §3).
            - Eyebrow tracking 0.18em → 0.16em (§3 Eyebrow role).
            - Added second CTA "Wie es funktioniert" (ghost, → #how).
            - Hero radius literal 28px → rounded-card-lg + custom md:rounded-[28px]
              kept because card-lg=20 (smaller than design needs at desktop).
              Inline class is the documented hero variant. */}
      <section className="relative">
        <div className="relative mx-auto max-w-[1400px] px-4 pt-6 md:px-8 md:pt-10">
          <div className="relative overflow-hidden rounded-card-lg md:rounded-[28px]">
            <div className="relative aspect-[4/5] w-full md:aspect-[16/9]">
              <Image
                src="/illustrations/business/business-hero.png"
                alt="Modernes Hairsalon-Interieur bei goldener Stunde — eine Salonbesitzerin steht am Empfangstresen, im Hintergrund eine Stylistin bei der Arbeit mit einer Kundin."
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1400px) 100vw, 1400px"
                className="object-cover"
              />
              {/* Gradient overlay — bottom-left dark, top-right transparent.
                  Gives the text-overlay legibility against the image without
                  killing the illustration's character. */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/15 to-transparent md:from-black/65 md:via-black/20"
              />
              {/* Text overlay — bottom-left on desktop, bottom-center on mobile.
                  Hero primary CTA is `bg-white text-s-ink` — documented overlay
                  variant exception to V3-D192-fix (per spec §5 Q25): pure ink
                  would vanish on the dark-image hero. Fresha makes the same
                  call for the same reason. */}
              <div className="absolute inset-x-0 bottom-0 p-5 md:bottom-0 md:left-0 md:right-auto md:max-w-[640px] md:p-12 lg:p-16">
                <p className="mb-3 font-body text-[12px] font-bold uppercase tracking-[0.16em] text-white/85">
                  Für Salons
                </p>
                <h1 className="font-display text-[clamp(26px,7vw,30px)] font-semibold leading-[1.0] tracking-[-0.03em] text-white">
                  Solen für<br />dein Geschäft.
                </h1>
                <p className="mt-4 max-w-[460px] font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.4] tracking-[-0.025em] text-white/85">
                  Mehr Buchungen, weniger Aufwand. Vier Werkzeuge, eine Plattform.
                  Über 1&apos;200 Salons buchen schon mit Solen.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-8">
                  <Link
                    href="#anmelden"
                    className="inline-flex items-center gap-2 rounded-btn bg-white px-6 py-3 font-body text-[14px] font-bold text-s-ink shadow-elevation-2 transition-all duration-200 ease-glide hover:-translate-y-[1px] hover:shadow-elevation-3 active:scale-[0.97] md:px-7 md:py-3.5 md:text-[15px]"
                  >
                    Jetzt anmelden
                    <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
                  </Link>
                  <Link
                    href="#how"
                    className="inline-flex items-center gap-2 rounded-btn border border-white/30 bg-transparent px-6 py-3 font-body text-[14px] font-semibold text-white transition-all duration-200 ease-glide hover:bg-white/10 active:scale-[0.97] md:px-7 md:py-3.5 md:text-[15px]"
                  >
                    Wie es funktioniert
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 2 · TRUST STRIP ─────────────────
          Slim band of social proof. V3-D220:
            - Star: lucide icon fill #FFC32B (was unicode "★" — forbidden per §7).
            - Body weight medium (500) instead of semibold (600);
              emphasis words go semibold within the run. */}
      <section
        aria-label="Vertrauenssignale"
        className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-12"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center font-body text-[13px] font-medium text-s-ink-2 md:gap-x-10 md:text-[14px]">
          <span>
            <strong className="font-semibold text-s-ink">1&apos;200+</strong>{" "}
            Schweizer Salons
          </span>
          <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />
          <span>Basel | Zürich | Bern | Lugano</span>
          <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />
          <span className="inline-flex items-center gap-1.5">
            <Star size={12} fill="#FFC32B" stroke="none" aria-hidden />
            <strong className="font-semibold text-s-ink">4.9</strong>
            <span>| 1&apos;200+ Partner</span>
          </span>
        </div>
      </section>

      {/* ───────────────── 3 · HOW IT WORKS ─────────────────
          V3-D208 anchor: `#how` is target of Header "Wie es funktioniert".
          V3-D220 fixes:
            - Eyebrow gains s-accent + accent bullet (was grey ink-3, no bullet)
              per §2.1 primary accent use case.
            - h2 inline clamp(28,4vw,44) + tracking -0.025 → Page H2 spec
              clamp(25,4vw,40) + tracking -0.03em.
            - <Step> primitive replaces inline JSX. */}
      <section
        id="how"
        className="scroll-mt-24 mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20"
      >
        {/* V3-D331: dropped eyebrow + dot per §2.5 Eyebrow decoration policy. */}
        <div className="mb-10 text-center md:mb-12">
          <h2 className="font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink">
            In 3 Schritten Solen-Partner.
          </h2>
        </div>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((step) => (
            <Step key={step.n} n={step.n} title={step.title} copy={step.copy} />
          ))}
        </ol>
      </section>

      {/* ───────────────── 4 · BENTO FEATURES (reused) ─────────────────
          Reuses BentoBusiness which contains the section header + 4 feature
          cards (Sofortige Bestätigung / Direkt-Chat / Voller Kalender /
          Analytics) + JoinUsCard expand-to-form. Marked NOT as the
          #anmelden target — that wraps Section 8 below so #anmelden lands
          on the JoinUsCard, not the bento header. */}
      <BentoBusiness />

      {/* ───────────────── 5 · MARKETPLACE PITCH (NEW) ─────────────────
          Reinforces that Solen IS a marketplace, not just calendar software.
          Visual: stacked SalonCard mockups (per spec §5 Q22 recommendation).
          NO primary CTA — link-only — to avoid competing with hero + final CTA. */}
      {/* V3-D331: dropped eyebrow + dot per §2.5 Eyebrow decoration policy. */}
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <h2 className="font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink">
              Kund:innen finden dich.<br />
              Du musst nicht akquirieren.
            </h2>
            <p className="mt-5 max-w-[460px] font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
              Über 1&apos;200 Schweizer Salons sind auf solen.ch sichtbar. Jeden Tag suchen Tausende Kund:innen nach Terminen — in Basel, Zürich, Bern, Lugano.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1 font-body text-[14px] font-semibold text-s-accent transition-colors duration-150 ease-glide hover:text-s-accent-deep"
            >
              So findest du Solen-Kund:innen
              <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>
          <MarketplaceVisual />
        </div>
      </section>

      {/* ───────────────── 6 · PRICING ─────────────────
          V3-D208 anchor: `#pricing` is target of Header "Preise" dropdown.
          V3-D220 fixes:
            - Wrapper pb-16 md:pb-20 → py-16 md:py-20 (4-pt scale, symmetric).
            - Card border-s-border → border-s-border (token).
            - Card rounded-2xl → rounded-card (semantic).
            - h2 text-[22px]/[26px] + tracking -0.015 → Section H2 spec
              clamp(18,2vw,23) + font-bold (700, not extrabold) + tracking -0.03em. */}
      <section
        id="pricing"
        className="scroll-mt-24 mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20"
      >
        <div className="rounded-card border border-s-border bg-white p-7 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
            <div>
              <h2 className="font-display text-[clamp(16px,1.6vw,18px)] font-semibold tracking-[-0.03em] text-s-ink">
                Keine versteckten Gebühren.
              </h2>
              <p className="mt-2 font-body text-[14px] font-normal leading-[1.55] text-s-ink-2 md:text-[15px]">
                Bezahlung erst ab erstem Termin. Keine Setup-Kosten. Keine monatliche Grundgebühr.
              </p>
            </div>
            <ul className="flex flex-col gap-2 text-[14px] md:text-[15px]">
              {PRICING_CHECKS.map((item) => (
                <li
                  key={item}
                  className="inline-flex items-center gap-2 font-body font-medium text-s-ink"
                >
                  <Check
                    size={16}
                    strokeWidth={2.5}
                    aria-hidden
                    className="shrink-0 text-s-ink"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ───────────────── 7 · FAQ (NEW) ─────────────────
          Native <details> via <FAQItem> primitive. Keyboard + ARIA come free.
          Section reuses the page's standard width but narrower (max-w-[820px])
          so the question column stays scannable. */}
      <section className="mx-auto max-w-[820px] px-4 py-16 md:px-8 md:py-20">
        <h2 className="text-center font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink">
          Häufige Fragen.
        </h2>
        <div className="mt-10 divide-y divide-s-border">
          {FAQS.map(({ q, a }) => (
            <FAQItem key={q} q={q} a={a} />
          ))}
        </div>
      </section>

      {/* ───────────────── 8 · FINAL CTA (anchored as #anmelden) ─────────────────
          V3-D222 (2026-05-26, /business verifier #1 fix): JoinUsCard moved here
          (after FAQ) per spec — was wedged inside the bento between rows 4 and
          5, off-spec for "hero / trust / how / bento / marketplace / pricing /
          FAQ / final CTA" IA. BentoBusiness now ends on its promised 4 cards.
          The #anmelden anchor + scroll-mt-24 wrap THIS render so Hero CTA +
          Header "Werde Solen-Partner" still scroll-into-view here. */}
      <section
        id="anmelden"
        className="mx-auto max-w-[1280px] scroll-mt-24 px-4 pb-20 md:px-8 md:pb-24"
      >
        <JoinUsCard />
      </section>
    </div>
  );
}
