import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Star, Shield, Lock, CreditCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { buildAlternates } from "@/lib/seo";
import { FAQItem } from "../_components/business/FAQItem";
import { AssetPlaceholder } from "../_components/business/AssetPlaceholder";
import { EarningsCalculator } from "../_components/business/EarningsCalculator";
import { Reveal } from "../_components/business/Reveal";
import { CountUp } from "../_components/business/CountUp";
import { MotionProvider } from "../_components/business/MotionProvider";
import PartnerSignupForm from "@/components-legacy/partner/PartnerSignupForm";

/**
 * /de/fuer-salons — Canonical Solen B2B landing page.
 *
 * V3-D350 (2026-05-30): full rebuild to the competitor-teardown mockup
 * (public/solen-fuer-salons-mockup.html). Structure axis from the 8-site teardown
 * (_audits/competitor-teardowns/); aesthetic axis LOCKFILE (Geist, s-accent
 * #185CE0, s-ink CTAs, pill buttons) — NOT the warm-coral category norm.
 *
 * V3-D351 (2026-05-30): scroll-in motion wired via <Reveal> (per-card spring
 * "pop" = rise + scale overshoot, Solen spring-bounce curve; staggered) +
 * <CountUp> on stat cards + hover-lift on cards. Framer Motion, on-brand,
 * respects prefers-reduced-motion. (Replaced a rejected blur-fade prototype.)
 *
 * Real assets are AssetPlaceholder scaffolds + amber markers. Stat numbers are
 * DEMO figures (count-up) flagged "Beispiel — echte Daten folgen"; swap CountUp
 * `to` for real numbers when known. Page is NOT yet linked from nav (→ /business);
 * going-live (redirects + nav) is separate and gated on real assets.
 *
 * ⚠️ HEADLINE softened from the mockup's literal "#1" to a definite-article
 * leadership claim for Swiss UWG Art. 3 safety. i18n: pricing chart uses the
 * `partner` namespace (4 langs); new hero/feature/calculator copy is inline German.
 *
 * Section IA: 1 Hero · 2 Stat cards · 3 Categories · 4 Features ·
 *   5 Calculator (#rechner) · 6 Pricing (#pricing) · 7 Social proof · 8 FAQ ·
 *   9 Final CTA = PartnerSignupForm (#anmelden, wired to partner_leads).
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
          alt: "Solen für Salons",
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

// Stat numbers are DEMO figures (count-up shows the effect) — swap for real data.
const STATS: { to: number; suffix?: string; plus?: boolean; cap: string }[] = [
  { to: 89, suffix: "%", cap: "weniger No-Shows" },
  { to: 1200, plus: true, cap: "Schweizer Salons auf Solen" },
  { to: 32, suffix: "%", cap: "mehr Folgetermine" },
];

const CATEGORIES: { name: string; sub: string; desc: string }[] = [
  { name: "Coiffeur", sub: "Schnitt, Farbe, Styling", desc: "Coiffeur — echtes Schweizer Haarsalon-Interieur" },
  { name: "Barbershop", sub: "Schnitt, Bart, Pflege", desc: "Barbershop — Schnitt & Bart, echter Shop" },
  { name: "Nagelstudio", sub: "Maniküre, Pediküre, Nail-Art", desc: "Nagelstudio — Maniküre-Station" },
  { name: "Spa & Wellness", sub: "Massage, Facials", desc: "Spa & Wellness — Behandlungsraum" },
  { name: "Makeup", sub: "Braut, Events, Kurse", desc: "Makeup — Artist bei der Arbeit" },
  { name: "Waxing", sub: "Haarentfernung, Haut", desc: "Waxing / Ästhetik — sauberes Studio" },
];

const FEATURES: {
  eyebrow: string;
  title: string;
  copy: string;
  checks: string[];
  shotLabel: string;
  shotDesc: string;
  reverse: boolean;
}[] = [
  {
    eyebrow: "Buchungen",
    title: "Voller Kalender, kein Telefon-Pingpong.",
    copy: "Kund:innen buchen und verschieben selbst — rund um die Uhr. Sofortige Bestätigung, automatische Erinnerungen, keine Doppelbuchungen.",
    checks: [
      "Echtzeit-Verfügbarkeit über dein ganzes Team",
      "SMS- & E-Mail-Erinnerungen gegen No-Shows",
      "Anzahlungen & Stornoregeln, die du bestimmst",
    ],
    shotLabel: "Product screenshot",
    shotDesc: "Buchungskalender — Wochenansicht mit einer Bestätigung; Erinnerungs-Toggle sichtbar.",
    reverse: false,
  },
  {
    eyebrow: "Kund:innen",
    title: "Kenn jede:n Kund:in beim Namen.",
    copy: "Besuchshistorie, Notizen, Vorlieben und Umsatz — alles in einem Profil. Mach aus Einmalbesuchen Stammkund:innen.",
    checks: [
      "Notizen, Fotos & Service-Historie pro Kund:in",
      "Automatische Wiederbuchungs-Erinnerungen",
      "Treueprogramm & Bewertungsanfragen integriert",
    ],
    shotLabel: "Product screenshot",
    shotDesc: "Kund:innen-Profil (CRM) — Besuchshistorie, Notizen, Gesamtumsatz, nächster Termin.",
    reverse: true,
  },
];

const FAQS: { q: string; a: string }[] = [
  { q: "Wie viel kostet Solen?", a: "Kostenlose Anmeldung, keine Setup-Gebühr, keine monatliche Grundgebühr. Du zahlst nur pro vermitteltem Termin — fair und transparent." },
  { q: "Wann zahle ich?", a: "Erst ab dem ersten erfolgreich vermittelten Termin. Bis dahin entstehen keine Kosten." },
  { q: "Wie lange dauert das Onboarding?", a: "Anmelden in 60 Sekunden, Onboarding in 7 Tagen. Wir melden uns binnen 24 Stunden nach deiner Anmeldung." },
  { q: "Kann ich meine bestehende Kalender-Software importieren?", a: "Ja. Wir unterstützen Imports aus den gängigen Schweizer Salon-Systemen. Sprich uns nach der Anmeldung an." },
  { q: "Wer kümmert sich um Zahlungen?", a: "Solen verarbeitet die Zahlungen sicher via Stripe. Du erhältst eine monatliche Auszahlung." },
  { q: "In welchen Städten ist Solen verfügbar?", a: "Aktuell Basel, Zürich, Bern und Lugano. Weitere Städte folgen 2026." },
];

const TRUST_BADGES: { icon: typeof Shield; label: string }[] = [
  { icon: Shield, label: "Schweizer Hosting" },
  { icon: Lock, label: "DSGVO-konform" },
  { icon: CreditCard, label: "Sichere Zahlung via Stripe" },
  { icon: Check, label: "Kein Vertrag" },
];

export default async function FuerSalonsPage() {
  const tPartner = await getTranslations("partner");
  return (
    <MotionProvider>
    <div className="relative bg-white">
      {/* ───────────────── 1 · HERO (product-UI) ───────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 pt-12 pb-6 md:px-8 md:pt-16">
        <div className="grid grid-cols-1 items-center gap-9 md:grid-cols-[1.05fr_1.1fr] md:gap-12">
          <Reveal>
            <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2">
              Für Salons
            </p>
            {/* ⚠️ literal "Nr. 1" softened — see file header (UWG). */}
            <h1 className="mt-3 font-display text-[clamp(30px,5vw,42px)] font-bold leading-[1.06] tracking-[-0.025em] text-s-ink">
              Die Buchungsplattform für Schweizer Salons.
            </h1>
            <p className="mt-[18px] max-w-[440px] font-body text-[clamp(15px,2vw,17px)] font-normal leading-[1.5] text-s-ink-2">
              Mehr Buchungen, weniger No-Shows, ein Kalender. Über 1&apos;200 Salons in Basel, Zürich, Bern und Lugano wachsen schon mit Solen.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#anmelden"
                className="inline-flex items-center gap-2 rounded-btn bg-s-ink px-7 py-3.5 font-body text-[15px] font-medium tracking-[-0.005em] text-white transition-transform duration-200 ease-glide hover:-translate-y-[1px] active:scale-[0.97]"
              >
                Jetzt anmelden
                <ArrowRight size={16} strokeWidth={2.5} aria-hidden />
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center gap-2 rounded-btn border border-s-border bg-transparent px-7 py-3.5 font-body text-[15px] font-medium tracking-[-0.005em] text-s-ink transition-colors duration-200 ease-glide hover:bg-s-bg-sunken active:scale-[0.97]"
              >
                So funktioniert&apos;s
              </Link>
            </div>
            <div className="mt-[22px] flex flex-wrap items-center gap-x-3.5 gap-y-2 font-body text-[13px] font-medium text-s-ink-2">
              <span><strong className="font-semibold text-s-ink">1&apos;200+</strong> Salons</span>
              <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />
              <span className="inline-flex items-center gap-1">
                <Star size={13} fill="#FFC32B" stroke="none" aria-hidden />
                <strong className="font-semibold text-s-ink">4.9</strong>
              </span>
              <span aria-hidden className="h-1 w-1 rounded-full bg-s-ink-3" />
              <span>Basel · Zürich · Bern · Lugano</span>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <AssetPlaceholder
              variant="screenshot"
              label="Product screenshot"
              desc="Solen Partner-Dashboard — Kalender / Tagesansicht. Echte Termine über Team-Spalten, heutiger Plan, eine bestätigte Buchung. Browser- oder App-Frame."
              dim="~1200 × 860 · helle UI"
              className="aspect-[1200/860]"
            />
          </Reveal>
        </div>
      </section>

      {/* ───────────────── 2 · STAT PROOF CARDS (pop + count-up; numbers are demo) ───────────────── */}
      <section aria-label="Kennzahlen" className="bg-white py-2">
        <div className="mx-auto grid max-w-[1280px] grid-cols-3 gap-4 px-4 md:px-8">
          {STATS.map((s, i) => (
            <Reveal key={s.cap} delay={i * 0.08}>
              <div className="rounded-card border border-s-border bg-white px-3 py-7 text-center shadow-elevation-1 transition-transform duration-200 ease-glide hover:-translate-y-1.5 hover:shadow-elevation-2 md:py-9">
                <div className="font-display text-[clamp(32px,4.2vw,46px)] font-bold leading-none tracking-[-0.03em] text-s-ink tabular-nums">
                  <CountUp to={s.to} plus={s.plus} className="text-s-accent" />
                  {s.suffix}
                </div>
                <div className="mt-2 font-body text-[13px] text-s-ink-2">{s.cap}</div>
                <span className="mt-2 inline-block rounded-md bg-s-warning-bg px-1.5 py-0.5 font-mono text-[10px] text-s-warning-text">
                  Beispiel — echte Daten folgen
                </span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── 3 · CATEGORIES (photos, not icons) ───────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
        <Reveal>
          <div className="mx-auto mb-10 max-w-[620px] text-center">
            <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2">
              Jeder Stuhl, jedes Handwerk
            </p>
            <h2 className="mt-2.5 font-display text-[clamp(20px,2.4vw,26px)] font-semibold leading-[1.2] tracking-[-0.015em] text-s-ink">
              Für jede Salon-Kategorie gemacht.
            </h2>
            <p className="mt-3 font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
              Was auch immer du machst — Solen passt sich deinem Ablauf an. Eine Plattform, keine Kategorie-Sonderfälle.
            </p>
          </div>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {CATEGORIES.map((cat, i) => (
            <Reveal key={cat.name} delay={(i % 3) * 0.07}>
              <div className="overflow-hidden rounded-card border border-s-border bg-white transition-[box-shadow,border-color,transform] duration-200 ease-glide hover:-translate-y-1.5 hover:border-s-ink hover:shadow-elevation-2">
                <AssetPlaceholder
                  variant="photo"
                  label="Photo"
                  desc={cat.desc}
                  dim="4:3"
                  className="aspect-[4/3] rounded-none border-0 border-b-[1.5px]"
                />
                <div className="px-4 py-3.5">
                  <div className="font-heading text-[15px] font-semibold text-s-ink">{cat.name}</div>
                  <div className="mt-0.5 font-body text-[12px] font-normal text-s-ink-2">{cat.sub}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── 4 · FEATURE ROWS (product UI) ───────────────── */}
      <section id="features" className="scroll-mt-24 bg-s-bg-sunken">
        <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
          {FEATURES.map((f) => (
            <Reveal key={f.title}>
              <div className="grid grid-cols-1 items-center gap-7 py-7 md:grid-cols-2 md:gap-14">
                <div className={f.reverse ? "md:order-2" : ""}>
                  <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2">
                    {f.eyebrow}
                  </p>
                  <h2 className="mb-3.5 mt-2 font-display text-[clamp(20px,2.4vw,26px)] font-semibold leading-[1.2] tracking-[-0.015em] text-s-ink">
                    {f.title}
                  </h2>
                  <p className="font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
                    {f.copy}
                  </p>
                  <ul className="mt-4 flex flex-col gap-2.5">
                    {f.checks.map((c) => (
                      <li key={c} className="flex items-start gap-2.5 font-body text-[14px] text-s-ink">
                        <Check size={18} strokeWidth={2.5} aria-hidden className="mt-0.5 shrink-0 text-s-ink" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <AssetPlaceholder
                  variant="screenshot"
                  label={f.shotLabel}
                  desc={f.shotDesc}
                  dim="~960 × 660"
                  className={`aspect-[16/11] ${f.reverse ? "md:order-1" : ""}`}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── 5 · EARNINGS CALCULATOR ───────────────── */}
      <section id="rechner" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 py-16 md:px-8 md:py-20">
        <Reveal>
          <div className="mx-auto mb-10 max-w-[620px] text-center">
            <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2">
              Dein Potenzial
            </p>
            <h2 className="mt-2.5 font-display text-[clamp(20px,2.4vw,26px)] font-semibold leading-[1.2] tracking-[-0.015em] text-s-ink">
              Schätze deinen Solen-Umsatz.
            </h2>
            <p className="mt-3 font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
              Nenn uns deine Eckdaten — wir zeigen das monatliche Plus aus neuen Buchungen und vermiedenen No-Shows.
            </p>
          </div>
        </Reveal>
        <Reveal delay={0.06}>
          <EarningsCalculator />
        </Reveal>
      </section>

      {/* ───────────────── 6 · PRICING (comparison chart, ported from /partner) ───────────────── */}
      <section id="pricing" className="scroll-mt-24 bg-s-bg-sunken">
        <div className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
          <Reveal>
            <div className="mx-auto mb-12 max-w-[620px] text-center">
              <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2">
                {tPartner("section_pricing")}
              </p>
              <h2 className="mt-2.5 font-display text-[clamp(20px,2.4vw,26px)] font-semibold leading-[1.2] tracking-[-0.015em] text-s-ink">
                {tPartner("pricing_title")}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
                {tPartner("pricing_subtitle")}
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">
            {/* Left — pricing card */}
            <Reveal>
              <div className="relative overflow-hidden rounded-[18px] border border-s-border bg-white p-8 shadow-elevation-2">
                <div className="absolute right-4 top-4 rounded-pill bg-s-ink px-3 py-1.5 font-heading text-[9px] font-bold uppercase tracking-[0.14em] text-white">
                  {tPartner("pricing_badge")}
                </div>
                <p className="mb-1 font-body text-[14px] text-s-ink-2">{tPartner("pricing_label")}</p>
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="font-display text-4xl font-bold text-s-ink">15%</span>
                  <span className="text-[14px] text-s-ink-2">{tPartner("pricing_per_booking")}</span>
                </div>
                <p className="mb-0.5 font-body text-[11px] text-s-ink-2">{tPartner("pricing_intro_model")}</p>
                <p className="mb-5 font-body text-[10px] italic text-s-warning-text">{tPartner("pricing_intro_qualifier")}</p>
                <p className="mb-6 text-[12px] text-s-ink-2">{tPartner("pricing_no_fixed")}</p>
                <ul className="flex flex-col gap-3">
                  {["pricing_feature_1", "pricing_feature_2", "pricing_feature_3", "pricing_feature_4", "pricing_feature_5", "pricing_feature_6", "pricing_feature_7", "pricing_feature_8"].map((k) => (
                    <li key={k} className="flex items-start gap-3">
                      <Check size={16} strokeWidth={3} aria-hidden className="mt-0.5 shrink-0 text-s-success" />
                      <span className="font-body text-[14px] text-s-ink">{tPartner(k as never)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>

            {/* Right — competitor comparison chart */}
            <Reveal delay={0.08}>
              <div className="rounded-[16px] bg-white p-8 lg:bg-transparent lg:p-0">
                <h3 className="mb-6 font-heading text-lg font-semibold text-s-ink">{tPartner("compare_title")}</h3>
                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-body text-[14px] font-semibold text-s-ink">solen.ch</span>
                      <span className="font-body text-[14px] font-bold text-s-ink">15%</span>
                    </div>
                    <div className="h-8 w-full overflow-hidden rounded-btn border border-s-border bg-white">
                      <div className="h-full rounded-btn bg-s-ink" style={{ width: "33%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-body text-[14px] text-s-ink-2">{tPartner("compare_treatwell")}</span>
                      <span className="font-body text-[14px] font-bold text-s-ink-2">~30%</span>
                    </div>
                    <div className="h-8 w-full overflow-hidden rounded-btn border border-s-border bg-white">
                      <div className="h-full rounded-btn bg-s-chart-2" style={{ width: "100%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-body text-[14px] text-s-ink-2">{tPartner("compare_others")}</span>
                      <span className="font-body text-[14px] font-bold text-s-ink-2">15–25%</span>
                    </div>
                    <div className="h-8 w-full overflow-hidden rounded-btn border border-s-border bg-white">
                      <div className="h-full rounded-btn bg-s-chart-3" style={{ width: "66%" }} />
                    </div>
                  </div>
                </div>
                <div className="mt-8 rounded-[12px] border border-s-success/20 bg-s-success-bg p-4">
                  <p className="font-body text-[14px] text-s-success">
                    <span className="font-heading font-bold">{tPartner("compare_savings_bold")}</span>{" "}
                    {tPartner("compare_savings_text")}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────────── 7 · SOCIAL PROOF (testimonial + trust badges) ───────────────── */}
      <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8 md:py-20">
        <div className="grid grid-cols-1 items-center gap-7 md:grid-cols-[0.8fr_1.2fr] md:gap-11">
          <Reveal>
            <AssetPlaceholder
              variant="photo"
              label="Owner photo"
              desc="Echte:r Salon-Inhaber:in — Porträt oder an der Station."
              dim="1:1"
              className="aspect-square"
            />
          </Reveal>
          <Reveal delay={0.08}>
            <div>
              <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-2">
                Von Schweizer Salons geliebt
              </p>
              <h2 className="mt-2.5 font-display text-[clamp(20px,2.4vw,26px)] font-semibold leading-[1.25] tracking-[-0.015em] text-s-ink">
                „[ Echtes Zitat einer:s Inhaber:in — ein, zwei prägnante Sätze zu Buchungen / weniger No-Shows. ]"
              </h2>
              <p className="mt-3.5 font-body text-[clamp(14px,3.5vw,16px)] font-normal leading-[1.55] text-s-ink-2">
                <span className="rounded-md bg-s-warning-bg px-1.5 py-0.5 font-mono text-[11px] text-s-warning-text">
                  echtes Zitat nötig
                </span>{" "}
                — Name, Salon, Stadt
              </p>
              <div className="mt-5 flex flex-wrap gap-6">
                <div className="font-body text-[14px]">
                  <strong className="text-[18px]">★ </strong>
                  <span className="rounded-md bg-s-warning-bg px-1.5 py-0.5 font-mono text-[11px] text-s-warning-text">4.x</span>{" "}
                  <span className="text-s-ink-2">Trustpilot</span>
                </div>
                <div className="font-body text-[14px]">
                  <strong className="text-[18px]">★ </strong>
                  <span className="rounded-md bg-s-warning-bg px-1.5 py-0.5 font-mono text-[11px] text-s-warning-text">4.x</span>{" "}
                  <span className="text-s-ink-2">Capterra</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
        <div className="mx-auto mt-9 grid max-w-[760px] grid-cols-2 gap-3.5 md:grid-cols-4">
          {TRUST_BADGES.map((b, i) => (
            <Reveal key={b.label} delay={(i % 4) * 0.07}>
              <div className="flex flex-col items-center gap-2 rounded-[14px] border border-s-border bg-s-bg-sunken p-4 text-center transition-transform duration-200 ease-glide hover:-translate-y-1">
                <b.icon size={22} strokeWidth={2} aria-hidden className="text-s-accent" />
                <span className="font-heading text-[12px] font-semibold text-s-ink">{b.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ───────────────── 8 · FAQ ───────────────── */}
      <section className="bg-s-bg-sunken">
        <div className="mx-auto max-w-[820px] px-4 py-16 md:px-8 md:py-20">
          <Reveal>
            <h2 className="text-center font-display text-[clamp(20px,2.4vw,26px)] font-semibold leading-[1.25] tracking-[-0.015em] text-s-ink">
              Häufige Fragen.
            </h2>
          </Reveal>
          <Reveal delay={0.06}>
            <div className="mt-10 divide-y divide-s-border">
              {FAQS.map(({ q, a }) => (
                <FAQItem key={q} q={q} a={a} />
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── 9 · FINAL CTA (lead form → partner_leads) ───────────────── */}
      <section id="anmelden" className="mx-auto max-w-[1280px] scroll-mt-24 px-4 pb-20 md:px-8 md:pb-24 md:pt-4">
        <Reveal>
          <div className="rounded-card-lg bg-s-ink p-10 text-center md:p-14">
            <h2 className="font-display text-[clamp(24px,3.4vw,32px)] font-bold leading-[1.1] tracking-[-0.02em] text-white">
              Bereit für einen vollen Kalender?
            </h2>
            <p className="mx-auto mt-3 max-w-md font-body text-[15px] font-normal text-white/80">
              In 60 Sekunden anmelden. Keine Setup-Gebühr — Bezahlung erst ab dem ersten Termin.
            </p>
            <PartnerSignupForm />
          </div>
        </Reveal>
      </section>
    </div>
    </MotionProvider>
  );
}
