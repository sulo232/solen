"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  MessageCircle, Camera, BarChart3, Star, MapPin,
  ChevronDown, Send, Check, ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import StampCard from "@/components-legacy/loyalty/StampCard";
import SolenExclusiveBadge from "@/components-legacy/ui/SolenExclusiveBadge";

// ─────────────────────────────────────────
// Intersection observer hook for scroll animations
// ─────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// ─────────────────────────────────────────
// Section wrapper with fade-in animation
// ─────────────────────────────────────────
function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const { ref, visible } = useInView();
  return (
    <section
      ref={ref}
      id={id}
      className={`py-16 sm:py-24 transition-[opacity,transform] duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </section>
  );
}

// ─────────────────────────────────────────
// Mock chat UI for Section 1
// ─────────────────────────────────────────
function MockChat() {
  const t = useTranslations("whySolen");
  return (
    <div className="w-full max-w-xs mx-auto bg-white rounded-card border border-s-border overflow-hidden shadow-elevation-2">
      {/* Chat header */}
      {/* V3-D330: avatar bg-s-accent-pale text-s-accent → neutral bg-s-bg-sunken text-s-ink
          per §1.5 forbidden. "Online" status label IS a legit Tag/Status role (semantic),
          tracking normalized 0.16 → 0.08 (canonical per §2.5). */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-s-border">
        <div className="w-8 h-8 rounded-full bg-s-bg-sunken flex items-center justify-center text-s-ink text-xs font-heading">S</div>
        <div>
          <p className="text-sm font-heading text-s-ink">Studio Bella</p>
          <p className="text-[12px] md:text-[12px] font-body font-semibold uppercase tracking-[0.08em] text-s-success">Online</p>
        </div>
      </div>
      {/* Messages */}
      <div className="px-4 py-3 space-y-2.5 min-h-[180px]">
        <div className="flex justify-end">
          <div className="bg-s-ink text-white text-xs px-3 py-2 rounded-[16px] rounded-br-md max-w-[75%]">
            {t("chatMsg1")}
          </div>
        </div>
        <div className="flex">
          <div className="bg-s-bg-sunken text-s-ink text-xs px-3 py-2 rounded-[16px] rounded-bl-md max-w-[75%]">
            {t("chatReply")}
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-s-ink text-white text-xs px-3 py-2 rounded-[16px] rounded-br-md max-w-[75%]">
            {t("chatMsg2")}
          </div>
        </div>
      </div>
      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-s-border">
        <div className="flex-1 bg-s-bg-sunken rounded-full px-3 py-1.5 text-xs text-s-ink-2">{t("chatInputPlaceholder")}</div>
        <div className="w-7 h-7 rounded-full bg-s-ink flex items-center justify-center">
          <Send className="w-3.5 h-3.5 text-white" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Mock compare table for Section 3
// ─────────────────────────────────────────
function MockCompare() {
  const t = useTranslations("whySolen");
  const salons = [
    { name: "Studio Bella", rating: 4.8, price: 85, highlight: true },
    { name: "Hair Lounge", rating: 4.5, price: 95, highlight: false },
    { name: "Coiffeur Basel", rating: 4.2, price: 75, highlight: false },
  ];
  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-[14px] border border-s-border">
      <div className="grid grid-cols-3 text-center">
        {salons.map((s, i) => (
          <div
            key={i}
            className={`p-3 ${s.highlight ? "bg-s-bg-sunken border-t-2 border-s-ink" : "bg-white"} relative`}
          >
            {s.highlight && (
              <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-s-ink text-white text-[12px] px-2 py-0.5 rounded-t-[6px] font-heading uppercase tracking-[.08em]">
                {t("compareRecommendation")}
              </span>
            )}
            <p className="text-xs font-heading text-s-ink truncate">{s.name}</p>
            <div className="flex items-center justify-center gap-0.5 mt-1.5">
              <Star className="w-3 h-3 fill-s-star text-s-star" />
              <span className="text-xs data-text text-s-ink">{s.rating}</span>
            </div>
            <p className="text-sm data-text font-semibold text-s-ink mt-1">{formatCurrency(s.price)}</p>
            <p className="text-[12px] text-s-ink-2">Balayage</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Mock map pins for Section 5
// ─────────────────────────────────────────
// V3-D330 (§1.5): MockMap previously alternated bg-s-ink + bg-s-accent on pins
// to create visual interest. Per Accent Application Rules, s-accent decorative
// usage on a map pin is forbidden — accent reserved for focus/spinner only.
// All pins now use s-ink; visual differentiation moves to size/weight if needed.
function MockMap() {
  const pins = [
    { left: "25%", top: "35%", price: "ab CHF 45" },
    { left: "55%", top: "20%", price: "ab CHF 65" },
    { left: "70%", top: "55%", price: "ab CHF 38" },
    { left: "40%", top: "65%", price: "ab CHF 52" },
  ];
  return (
    <div className="relative w-full max-w-md mx-auto h-64 rounded-[14px] overflow-hidden border border-s-border bg-s-bg-sunken">
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(6)].map((_, i) => (
          <div key={`h${i}`} className="absolute w-full h-px bg-s-ink" style={{ top: `${(i + 1) * 14}%` }} />
        ))}
        {[...Array(6)].map((_, i) => (
          <div key={`v${i}`} className="absolute h-full w-px bg-s-ink" style={{ left: `${(i + 1) * 14}%` }} />
        ))}
      </div>
      {/* Pins — all ink, no decorative accent (§1.5) */}
      {pins.map((pin, i) => (
        <div key={i} className="absolute flex flex-col items-center" style={{ left: pin.left, top: pin.top }}>
          <span className="px-2 py-0.5 rounded-full text-[12px] data-text font-semibold text-white whitespace-nowrap mb-1 bg-s-ink">
            {pin.price}
          </span>
          <MapPin className="w-4 h-4 text-s-ink" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────
// Page
// ─────────────────────────────────────────

export default function WarumSolenPage() {
  const locale = useLocale();
  const t = useTranslations("whySolen");

  return (
    <div className="min-h-screen bg-white">
      {/* ── Section 0: Hero ──
          V3-D330 (Phase 2 sweep, Uber-alignment): dropped eyebrow per LOCKFILE
          §2.5 (max 1 per surface, this surface has 7 → 0); removed text-s-accent
          span on "Solen" per §1.5 (decorative accent forbidden); CTA swept to
          Primary CTA role recipe (15px/500/sentence/-0.005em/no chevron) per
          §2.5. The H1 itself stays at clamp(26,7vw,30)/46px since /warum-solen
          is a content-page hero (smaller than homepage Hero H1 64px). Weight
          + tracking normalized: 600→700, -0.03→-0.02, leading 1.0→1.1. */}
      <section className="relative overflow-hidden py-20 sm:py-32 bg-s-bg-sunken">
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading text-[clamp(26px,7vw,30px)] md:text-[46px] font-bold text-s-ink leading-[1.1] tracking-[-0.02em]">
            {t("heroTitle1")} Solen {t("heroTitle2")}
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-s-ink-2 font-body font-normal max-w-xl mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>
          <button
            onClick={() => document.getElementById("section-chat")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-8 inline-flex items-center gap-2 px-7 py-3.5 rounded-btn bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em] active:scale-[0.97] transition-[transform,filter]"
          >
            {t("heroCta")}
          </button>
        </div>
      </section>

      {/* ── Section 1: Chat ──
          V3-D330: drop chatEyebrow per §2.5 (max 1/surface = 0 on this surface);
          pill bg s-accent-pale → s-bg-sunken + icon text-s-accent → text-s-ink-2
          per §1.5 forbidden (decorative accent); bullet check icons → s-ink-2
          (was s-accent decorative tint); H2 tracking -0.02 → -0.01 per Section
          H2 recipe in §2.5. */}
      <Section id="section-chat" className="bg-s-bg-sunken">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-4 bg-s-bg-sunken border border-s-border">
                  <MessageCircle size={14} strokeWidth={1.6} className="text-s-ink-2" />
                  <SolenExclusiveBadge featureDescription="Chatten Sie direkt mit Ihrem Store, nur bei Solen." />
                </div>
                <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
                  {t("chatTitle")}
                </h2>
              </div>
              <div className="space-y-3 text-s-ink-2 font-body font-normal">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("chatBullet1")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("chatBullet2")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("chatBullet3")}
                </p>
              </div>
            </div>
            <MockChat />
          </div>
        </div>
      </Section>

      {/* ── Section 2: Photo Quoting ── */}
      <Section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Animated demo */}
            <div className="flex flex-col items-center gap-4 order-2 md:order-1">
              <div className="relative">
                {/* Photo frame */}
                <div className="animate-photo-upload w-48 h-48 rounded-[12px] border-2 border-dashed border-s-border bg-s-bg-sunken flex flex-col items-center justify-center gap-2">
                  <Camera className="w-8 h-8 text-s-ink-2" />
                  <p className="text-xs font-heading text-s-ink-2">Foto hochgeladen</p>
                </div>
                {/* Price offer card */}
                <div className="animate-price-appear absolute -bottom-4 -right-4 bg-white rounded-[12px] border border-s-border px-4 py-3 w-44 shadow-elevation-2">
                  {/* V3-D330: "Preisangebot" stays as Tag/Status role (semantic "this is a quote"). Tracking 0.16 → 0.08 canonical. "Balayage + Pflege" text-s-accent → text-s-ink-2 per §1.5 forbidden. */}
                  <p className="text-[12px] md:text-[12px] font-body font-semibold uppercase tracking-[0.08em] text-s-ink-2">Preisangebot</p>
                  <p className="data-text font-bold text-xl text-s-ink">CHF 120</p>
                  <p className="text-xs font-heading text-s-ink-2">Balayage + Pflege</p>
                </div>
              </div>
            </div>
            {/* V3-D330: same sweep as Section 1 — drop eyebrow, neutralize pill, ink-3 bullets. */}
            <div className="order-1 md:order-2">
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-4 bg-s-bg-sunken border border-s-border">
                  <Camera size={14} strokeWidth={1.6} className="text-s-ink-2" />
                  <SolenExclusiveBadge featureDescription="Schick ein Foto und erhalte einen individuellen Preis." />
                </div>
                <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
                  {t("photoTitle")}
                </h2>
              </div>
              <div className="space-y-3 text-s-ink-2 font-body font-normal">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("photoBullet1")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("photoBullet2")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("photoBullet3")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Compare ──
          V3-D330: drop compareEyebrow; pill bg/icon neutralized. H2 normalized to Section H2 recipe. */}
      <Section className="bg-s-bg-sunken">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-4 bg-s-bg-sunken border border-s-border">
              <BarChart3 size={14} strokeWidth={1.6} className="text-s-ink-2" />
              <SolenExclusiveBadge featureDescription="Vergleiche bis zu 3 Stores, nur bei Solen." />
            </div>
            <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink mb-3">
              {t("compareTitle")}
            </h2>
            <p className="text-s-ink-2 font-body font-normal max-w-md mx-auto">
              {t("compareDesc")}
            </p>
          </div>
          <MockCompare />
        </div>
      </Section>

      {/* ── Section 4: Stamps ──
          V3-D330: same sweep — drop eyebrow, neutralize pill, ink-3 bullets, H2 tracking. */}
      <Section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-4 bg-s-bg-sunken border border-s-border">
                  <Star size={14} strokeWidth={1.6} className="text-s-ink-2" />
                  <SolenExclusiveBadge featureDescription="Sammle Stempel bei jedem Besuch." />
                </div>
                <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
                  {t("loyaltyTitle")}
                </h2>
              </div>
              <div className="space-y-3 text-s-ink-2 font-body font-normal">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("loyaltyBullet1")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("loyaltyBullet2")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("loyaltyBullet3")}
                </p>
              </div>
            </div>
            <div className="max-w-xs mx-auto w-full">
              <StampCard
                salonName="Studio Bella"
                salonSlug="studio-bella"
                stampsTotal={5}
                stampsCollected={4}
                rewardText="Gratis Pflege-Treatment"
              />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 5: Map ──
          V3-D330: same sweep + MockMap accent pins are handled in the MockMap fn itself (now all ink). */}
      <Section className="bg-s-bg-sunken">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <MockMap />
            <div>
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-4 bg-s-bg-sunken border border-s-border">
                  <MapPin size={14} strokeWidth={1.6} className="text-s-ink-2" />
                  <SolenExclusiveBadge featureDescription="Sieh Preise direkt auf der Karte." />
                </div>
                <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink">
                  {t("mapTitle")}
                </h2>
              </div>
              <div className="space-y-3 text-s-ink-2 font-body font-normal">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("mapBullet1")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("mapBullet2")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-ink-2 shrink-0 mt-0.5" />
                  {t("mapBullet3")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Bottom CTA ──
          V3-D330: drop ctaEyebrow; primary CTA → Primary CTA recipe (15px/500/sentence/-0.005);
          secondary CTA → Secondary CTA recipe (same recipe, transparent bg + border). ArrowRight
          icon kept on primary (signals "this leads forward"); dropped shadow-elevation-2
          (Uber CTAs don't carry shadow, they sit naturally inside container). */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-s-ink">
        <div className="relative max-w-xl mx-auto px-4 sm:px-6">
          <div className="relative rounded-[20px] bg-white p-8 sm:p-10 text-center shadow-elevation-3">
            <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.25] tracking-[-0.01em] text-s-ink mb-3">
              {t("ctaTitle")}
            </h2>
            <p className="text-s-ink-2 font-body font-normal mb-8 text-sm leading-relaxed">
              {t("ctaDesc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-btn bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em] active:scale-[0.97] transition-[transform,filter]"
              >
                {t("ctaBtn")}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/partner`}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-btn border border-s-border text-[15px] font-medium tracking-[-0.005em] text-s-ink hover:border-s-ink transition-colors"
              >
                {t("ctaSalonBtn")}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
