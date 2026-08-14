import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Star, Scissors, UserPlus, Droplets, Shield, Lock, CreditCard, Hand } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";
import BentoBusiness, { JoinUsCard } from "../_components/homepage/BentoBusiness";
import { Step } from "../_components/business/Step";
import { FAQItem } from "../_components/business/FAQItem";
import { MarketplaceVisual } from "../_components/business/MarketplaceVisual";
import PartnerSignupForm from "@/components-legacy/partner/PartnerSignupForm";

/**
 * /de/fuer-salons — Canonical Solen B2B landing page.
 *
 * V3-D330 (2026-05-28, Phase 2 sweep): NEW canonical B2B page that absorbs
 * /business (formerly the V3-D220 rebuild) per master plan Section G fusion.
 * Built fresh against LOCKFILE §2.5 Type Role Registry + §1.5 Accent
 * Application Rules + §11 Imagery Pattern Registry.
 *
 * Strategy: /business sections 1-8 form the V1 spine. /partner-specific
 * pieces (categories grid, pricing comparison chart, social proof, signup
 * form) are TODO follow-up — flagged inline. /warum-solen stays standalone
 * (consumer B2C, different audience — plan locked decision).
 *
 * Differences from /business V3-D220:
 *   - All eyebrows: tracking 0.16em → 0.08em (canonical Eyebrow per §2.5),
 *     weight font-bold → font-semibold.
 *   - Hero overlay eyebrow: text-white/85 STAYS — overlay-on-image is the
 *     documented Hero variant exception (§5 Q25), white reads better on
 *     dark gradient than s-ink-2.
 *   - Eyebrows above sections (Marktplatz, So funktioniert's): accent blue
 *     → ink-3 grey (was text-s-accent decorative — §1.5 forbidden).
 *   - Pricing section h2: clamp(16,1.6vw,18) → Section H2 spec
 *     clamp(18,2vw,20) (was undersized for a heading).
 *   - FAQ h2: clamp(22,2.8vw,26) → Section H2 spec clamp(18,2vw,20).
 *   - All primary CTAs use Primary CTA recipe (15px / 500 / sentence /
 *     -0.005em). White overlay CTA on hero kept as documented variant.
 *   - Marketplace link text-s-accent → text-s-ink underline per §1.5.
 *
 * Section IA (V1 — V3-D330):
 *   1. HERO            — Pattern 1 split-hero (full-bleed image, text+CTA overlay).
 *   2. TRUST STRIP     — 1200+ Salons · 4 cities · 4.9 stars
 *   3. HOW IT WORKS    — 3-step. #how anchor.
 *   4. BENTO FEATURES  — BentoBusiness reused.
 *   5. MARKETPLACE     — "Kund:innen finden dich." + MarketplaceVisual.
 *   6. PRICING         — Keine versteckten Gebühren. #pricing anchor.
 *   7. FAQ             — 7-item native details accordion.
 *   8. FINAL CTA       — JoinUsCard. #anmelden anchor.
 *
 * TODO (V3-D{n+1} follow-up commits, pulled from /partner):
 *   - INSERT 5.5 CATEGORIES — 6-category grid (from /partner line 124)
 *   - REPLACE 6 PRICING — competitor comparison chart (from /partner line 279)
 *   - INSERT 6.5 SOCIAL PROOF — 4 trust badges (from /partner line 245)
 *   - REPLACE 8 FINAL CTA — embed signup form inline (from /partner)
 *   - REDIRECT /business + /partner → /fuer-salons (after V1 lands clean)
 *
 * Header dropdown routes (V3-D208 anchors carry over):
 *   - "Wie es funktioniert" → #how
 *   - "Werde Solen-Partner" → #anmelden
 *   - "Preise"              → #pricing
 */

const TITLES: Record<string, string> = {
  de: "Solen für dein Geschäft — Mehr Buchungen, weniger Aufwand",
  en: "Solen for your business — More bookings, less hassle",
  fr: "Solen pour ton commerce — Plus de réservations, moins d'efforts",
  it: "Solen per la tua attività — Più prenotazioni, meno fatica",
};

const DESCRIPTIONS: Record<string, string> = {
  de: "Werde Solen-Partner. Über 1'200 Schweizer Stores nutzen Solen für sofortige Bestätigungen, Direkt-Chat, einen vollen Kalender und tiefere Insights. In 60 Sekunden anmelden.",
  en: "Become a Solen partner. Over 1,200 Swiss stores use Solen for instant bookings, direct chat, a full calendar, and deeper insights. Sign up in 60 seconds.",
  fr: "Devenez partenaire Solen. Plus de 1 200 stores suisses utilisent Solen.",
  it: "Diventa partner di Solen. Oltre 1.200 store svizzeri usano Solen.",
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
  const alternates = buildAlternates("fuer-salons", loc);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://solen.ch/${loc}/fuer-salons`,
      siteName: "solen.ch",
      images: [
        {
          url: "/illustrations/business/business-hero.png",
          width: 1672,
          height: 941,
          alt: "Solen für Stores — Modernes Store-Interieur bei goldener Stunde",
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
    copy: "60 Sekunden Formular. Name, Store, Stadt — fertig.",
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
    a: "Ja. Wir unterstützen Imports aus den gängigen Schweizer Store-Systemen. Sprich uns nach der Anmeldung an.",
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

// V3-D342 (W10 V2, 2026-05-28): feature flag `?v2=1` adds 3 sections ported from /partner:
//   1. Categories grid (between Marketplace and Pricing)
//   2. Social Proof trust badges (between FAQ and Final CTA)
//   3. PartnerSignupForm replaces JoinUsCard in Final CTA
// V1 (no flag) renders unchanged. Reverse with git checkout single file.
// Council hard rule satisfied: PartnerSignupForm imported as-is, no state/validation edits.
export default async function FuerSalonsPage({
  searchParams,
}: {
  searchParams?: Promise<{ v?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const isV2 = sp.v === "2";
  // Pull /partner namespace translations (reused for categories + trust badges; all 4 langs already present)
  const tPartner = await getTranslations("partner");
  return (
    <div className="relative bg-white">
      {/* ───────────────── 1 · HERO ─────────────────
          Pattern 1 split-hero per LOCKFILE §11 (full-bleed image, text+CTA
          overlay). White overlay text + white CTA is the documented Hero
          variant exception (§5 Q25). Eyebrow tracking 0.16 → 0.08 canonical. */}
      <section className="relative">
        <div className="relative mx-auto max-w-[1400px] px-4 pt-6 md:px-8 md:pt-10">
          <div className="relative overflow-hidden rounded-card-lg md:rounded-[28px]">
            <div className="relative aspect-[4/5] w-full md:aspect-[16/9]">
              <Image
                src="/illustrations/business/business-hero.png"
                alt="Modernes Store-Interieur bei goldener Stunde — eine Store-Besitzerin steht am Empfangstresen, im Hintergrund eine Stylistin bei der Arbeit mit einer Kundin."
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1400px) 100vw, 1400px"
                className="object-cover"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-tr from-black/55 via-black/15 to-transparent md:from-black/65 md:via-black/20"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 md:bottom-0 md:left-0 md:right-auto md:max-w-[640px] md:p-12 lg:p-16">
                {/* Hero eyebrow — white-on-image variant. Tracking 0.16 → 0.08 canonical (§2.5). */}
                <p className="mb-3 font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-white/85">
                  Für Stores
                </p>
                <h1 className="font-display text-[clamp(26px,7vw,30px)] font-bold leading-[1.1] tracking-[-0.02em] text-white">
                  Solen für<br />dein Geschäft.
                </h1>
                <p className="mt-4 max-w-[460px] font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.4] tracking-[-0.005em] text-white/85">
                  Mehr Buchungen, weniger Aufwand. Vier Werkzeuge, eine Plattform.
                  Über 1&apos;200 Stores buchen schon mit Solen.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3 md:mt-8">
                  {/* Primary CTA — white overlay variant per §5 Q25. Recipe: 15px / 500 / sentence / -0.005em. */}
                  <Link
                    href="#anmelden"
                    className="inline-flex items-center gap-2 rounded-btn bg-white px-7 py-3.5 font-body text-[15px] font-medium tracking-[-0.005em] text-s-ink transition-all duration-200 ease-glide hover:-translate-y-[1px] active:scale-[0.97]"
                  >
                    Jetzt anmelden
                    <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
                  </Link>
                  {/* Secondary CTA — same recipe + border on transparent. */}
                  <Link
                    href="#how"
                    className="inline-flex items-center gap-2 rounded-btn border border-white/30 bg-transparent px-7 py-3.5 font-body text-[15px] font-medium tracking-[-0.005em] text-white transition-all duration-200 ease-glide hover:bg-white/10 active:scale-[0.97]"
                  >
                    Wie es funktioniert
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────── 2 · TRUST STRIP ───────────────── */}
      <section
        aria-label="Vertrauenssignale"
        className="mx-auto max-w-[1280px] px-4 py-8 md:px-8 md:py-12"
      >
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-center font-body text-[13px] font-medium text-s-ink-2 md:gap-x-10 md:text-[14px]">
          <span>
            <strong className="font-semibold text-s-ink">1&apos;200+</strong>{" "}
            Schweizer Stores
          </span>
          <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-2" />
          <span>Basel · Zürich · Bern · Lugano</span>
          <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-2" />
          <span className="inline-flex items-center gap-1.5">
            <Star size={12} fill="#FFC32B" stroke="none" aria-hidden />
            <strong className="font-semibold text-s-ink">4.9</strong>
            <span>· 1&apos;200+ Partner</span>
          </span>
        </div>
      </section>

      {/* ───────────────── 3 · HOW IT WORKS ─────────────────
          V3-D331 (2026-05-28): dropped eyebrow + dot per LOCKFILE §2.5
          Eyebrow decoration policy. Fresha + Uber B2B pages both go straight
          to H2 — eyebrow + decorative dot was a template trope (user flag
          2026-05-28: "looks ai and not real"). */}
      <section
        id="how"
        className="scroll-mt-24 mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20"
      >
        <div className="mb-10 text-center md:mb-12">
          <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
            In 3 Schritten Solen-Partner.
          </h2>
        </div>
        <ol className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          {STEPS.map((step) => (
            <Step key={step.n} n={step.n} title={step.title} copy={step.copy} />
          ))}
        </ol>
      </section>

      {/* ───────────────── 4 · BENTO FEATURES (reused) ───────────────── */}
      <BentoBusiness />

      {/* ───────────────── 5 · MARKETPLACE PITCH ─────────────────
          V3-D331 (2026-05-28): dropped eyebrow + dot per §2.5 (Fresha/Uber
          go straight to H2). Link text-s-accent → text-s-ink underline per
          §1.5 (decorative link forbidden). */}
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:items-center md:gap-16">
          <div>
            <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
              Kund:innen finden dich.<br />
              Du musst nicht akquirieren.
            </h2>
            <p className="mt-5 max-w-[460px] font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
              Über 1&apos;200 Schweizer Stores sind auf solen.ch sichtbar. Jeden Tag suchen Tausende Kund:innen nach Terminen — in Basel, Zürich, Bern, Lugano.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1 font-body text-[14px] font-semibold text-s-ink underline underline-offset-2 transition-colors duration-150 ease-glide hover:text-s-ink-2"
            >
              So findest du Solen-Kund:innen
              <ArrowRight size={14} strokeWidth={2.5} aria-hidden />
            </Link>
          </div>
          <MarketplaceVisual />
        </div>
      </section>

      {/* ───────────────── 5.5 · CATEGORIES (V2 only) ─────────────────
          V3-D342 (W10 V2): ported from /partner lines 124-155. Reuses `partner` i18n
          namespace (all 4 langs already populated). Only renders when ?v2=1 flag is set. */}
      {isV2 && (
        <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
          <div className="text-center mb-10">
            <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-3">
              {tPartner("cat_title")}
            </h2>
            <p className="text-s-ink-2 font-body font-normal">{tPartner("cat_subtitle")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Scissors, key: "cat_coiffeur" },
              { icon: UserPlus, key: "cat_barbershop" },
              { icon: Hand, key: "cat_nails" },
              { icon: Droplets, key: "cat_spa" },
              { icon: Star, key: "cat_makeup" },
              { icon: Droplets, key: "cat_waxing" },
            ].map((cat) => (
              <div
                key={cat.key}
                className="p-5 rounded-[14px] bg-white border border-s-border hover:border-s-ink hover:shadow-elevation-1 transition-[border-color,box-shadow] duration-200"
              >
                <cat.icon className="w-6 h-6 text-s-accent mb-3" />
                <h3 className="font-heading text-sm text-s-ink mb-1">{tPartner(`${cat.key}_title` as any)}</h3>
                <p className="text-xs font-body font-normal text-s-ink-2 leading-relaxed">{tPartner(`${cat.key}_desc` as any)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───────────────── 6 · PRICING ─────────────────
          V3-D330: h2 normalized to Section H2 (clamp 18-20). Was
          clamp(16,1.6vw,18) — undersized for a heading. */}
      <section
        id="pricing"
        className="scroll-mt-24 mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20"
      >
        <div className="rounded-card border border-s-border bg-white p-7 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
            <div>
              <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
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

      {/* ───────────────── 7 · FAQ ─────────────────
          V3-D330: H2 normalized to Section H2 (was clamp 22-26). */}
      <section className="mx-auto max-w-[820px] px-4 py-16 md:px-8 md:py-20">
        <h2 className="text-center font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
          Häufige Fragen.
        </h2>
        <div className="mt-10 divide-y divide-s-border">
          {FAQS.map(({ q, a }) => (
            <FAQItem key={q} q={q} a={a} />
          ))}
        </div>
      </section>

      {/* ───────────────── 7.5 · SOCIAL PROOF (V2 only) ─────────────────
          V3-D342 (W10 V2): ported from /partner lines 245-277. 4 trust badges. */}
      {isV2 && (
        <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20 bg-white">
          <div className="text-center mb-10">
            <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-3">
              {tPartner("social_title")}
            </h2>
            <p className="text-s-ink-2 font-body font-normal">{tPartner("social_subtitle")}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[
              { icon: Shield, key: "trust_basel" },
              { icon: Lock, key: "trust_gdpr" },
              { icon: CreditCard, key: "trust_stripe" },
              { icon: Check, key: "trust_no_contract" },
            ].map((badge) => (
              <div
                key={badge.key}
                className="flex flex-col items-center text-center p-4 bg-s-bg-sunken rounded-[14px] border border-s-border"
              >
                <badge.icon className="w-6 h-6 text-s-accent mb-2" />
                <span className="text-xs font-heading text-s-ink">{tPartner(badge.key as any)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ───────────────── 8 · FINAL CTA ─────────────────
          V3-D342 (W10 V2): when ?v2=1 flag is set, render inline PartnerSignupForm instead of JoinUsCard.
          PartnerSignupForm imported AS-IS (council hard rule: no state/validation edits). */}
      <section
        id="anmelden"
        className="mx-auto max-w-[1280px] scroll-mt-24 px-4 pb-20 md:px-8 md:pb-24"
      >
        {isV2 ? (
          <div className="rounded-card border border-s-border bg-white p-7 md:p-10">
            <div className="text-center mb-6">
              {/* Composed heading from existing partner keys (hero_title_1 + hero_title_accent + hero_title_2 are all 4-lang populated) */}
              <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-3">
                {tPartner("hero_title_1")} {tPartner("hero_title_accent")} {tPartner("hero_title_2")}
              </h2>
              {/* Note: hero_subtitle contains a pre-existing em-dash in DE — flagged as T7.5 catch-all candidate, not W10 V2's responsibility to fix. */}
              <p className="text-s-ink-2 font-body font-normal max-w-md mx-auto">{tPartner("hero_subtitle")}</p>
            </div>
            <PartnerSignupForm />
          </div>
        ) : (
          <JoinUsCard />
        )}
      </section>
    </div>
  );
}
