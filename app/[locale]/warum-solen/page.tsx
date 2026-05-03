"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  MessageCircle, Camera, BarChart3, Star, MapPin,
  ChevronDown, Send, Check, ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import StampCard from "@/components/loyalty/StampCard";
import SolenExclusiveBadge from "@/components/ui/SolenExclusiveBadge";

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
    <div className="w-full max-w-xs mx-auto bg-white rounded-card border border-s-ink/[0.06] overflow-hidden shadow-v5-float">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-s-ink/5">
        <div className="w-8 h-8 rounded-full bg-s-coral/20 flex items-center justify-center text-s-coral text-xs font-heading">S</div>
        <div>
          <p className="text-sm font-heading text-s-ink">Studio Bella</p>
          <p className="text-[10px] text-s-ink/40">Online</p>
        </div>
      </div>
      {/* Messages */}
      <div className="px-4 py-3 space-y-2.5 min-h-[180px]">
        <div className="flex justify-end">
          <div className="bg-s-coral text-white text-xs px-3 py-2 rounded-[16px] rounded-br-md max-w-[75%]">
            {t("chatMsg1")}
          </div>
        </div>
        <div className="flex">
          <div className="bg-s-bg-sunken text-s-ink text-xs px-3 py-2 rounded-[16px] rounded-bl-md max-w-[75%]">
            {t("chatReply")}
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-s-coral text-white text-xs px-3 py-2 rounded-[16px] rounded-br-md max-w-[75%]">
            {t("chatMsg2")}
          </div>
        </div>
      </div>
      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-s-ink/5">
        <div className="flex-1 bg-s-bg-surface rounded-full px-3 py-1.5 text-xs text-s-ink/50">{t("chatInputPlaceholder")}</div>
        <div className="w-7 h-7 rounded-full bg-s-coral flex items-center justify-center">
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
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-[14px] border border-s-ink/[0.06]">
      <div className="grid grid-cols-3 text-center">
        {salons.map((s, i) => (
          <div
            key={i}
            className={`p-3 ${s.highlight ? "bg-s-coral/5 border-t-2 border-s-coral" : "bg-white"} relative`}
          >
            {s.highlight && (
              <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-s-coral text-white text-[8px] px-2 py-0.5 rounded-t-[6px] font-heading uppercase tracking-[.08em]">
                {t("compareRecommendation")}
              </span>
            )}
            <p className="text-xs font-heading text-s-ink truncate">{s.name}</p>
            <div className="flex items-center justify-center gap-0.5 mt-1.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs data-text text-s-ink">{s.rating}</span>
            </div>
            <p className="text-sm data-text font-semibold text-s-ink mt-1">{formatCurrency(s.price)}</p>
            <p className="text-[10px] text-s-ink/40">Balayage</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Mock map pins for Section 5
// ─────────────────────────────────────────
function MockMap() {
  const pins = [
    { left: "25%", top: "35%", price: "ab CHF 45", color: "bg-s-coral" },
    { left: "55%", top: "20%", price: "ab CHF 65", color: "bg-s-amber" },
    { left: "70%", top: "55%", price: "ab CHF 38", color: "bg-s-coral" },
    { left: "40%", top: "65%", price: "ab CHF 52", color: "bg-s-amber" },
  ];
  return (
    <div className="relative w-full max-w-md mx-auto h-64 rounded-[14px] overflow-hidden border border-s-coral/[0.15]"
      style={{ background: "linear-gradient(135deg, rgba(27, 77, 27,.07) 0%, rgba(250,236,231,.95) 100%)" }}>
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(6)].map((_, i) => (
          <div key={`h${i}`} className="absolute w-full h-px bg-s-coral" style={{ top: `${(i + 1) * 14}%` }} />
        ))}
        {[...Array(6)].map((_, i) => (
          <div key={`v${i}`} className="absolute h-full w-px bg-s-coral" style={{ left: `${(i + 1) * 14}%` }} />
        ))}
      </div>
      {/* Pins */}
      {pins.map((pin, i) => (
        <div key={i} className="absolute flex flex-col items-center" style={{ left: pin.left, top: pin.top }}>
          <span className="px-2 py-0.5 rounded-full text-[10px] data-text font-semibold text-white shadow-elevation-2 whitespace-nowrap mb-1" style={{ backgroundColor: pin.color === "bg-s-coral" ? "#1B4D1B" : "#F2C144" }}>
            {pin.price}
          </span>
          <MapPin className="w-4 h-4" style={{ color: pin.color === "bg-s-coral" ? "#1B4D1B" : "#F2C144" }} />
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
      {/* ── Section 0: Hero ── */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(27, 77, 27,0.12)_0%,_transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[9px] font-heading uppercase tracking-[.24em] text-s-coral mb-4">
            {t("heroEyebrow")}
          </p>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-s-ink leading-tight">
            {t("heroTitle1")} <span className="text-s-coral">Solen</span> {t("heroTitle2")}
          </h1>
          <p className="mt-4 text-xl sm:text-2xl text-s-ink/55 font-body max-w-xl mx-auto leading-relaxed">
            {t("heroSubtitle")}
          </p>
          <button
            onClick={() => document.getElementById("section-chat")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3.5 rounded-btn bg-s-coral text-white text-xs font-heading uppercase tracking-[.04em] active:scale-[0.97] transition-[transform,filter] shadow-elevation-2"
          >
            {t("heroCta")}
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ── Section 1: Chat ── */}
      <Section id="section-chat" className="bg-s-bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
                  style={{ background: "rgba(27, 77, 27,.08)" }}>
                  <MessageCircle size={14} className="text-s-coral" />
                  <SolenExclusiveBadge featureDescription="Chatte direkt mit deinem Salon — nur bei Solen!" />
                </div>
                <p className="text-[9px] font-heading uppercase tracking-[.22em] text-s-ink/50 mb-2">{t("chatEyebrow")}</p>
                <h2 className="font-heading text-2xl sm:text-3xl text-s-ink">
                  {t("chatTitle")}
                </h2>
              </div>
              <div className="space-y-3 text-s-ink/60 font-body">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  {t("chatBullet1")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  {t("chatBullet2")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
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
                <div className="animate-photo-upload w-48 h-48 rounded-[12px] border-2 border-dashed border-s-amber/30 flex flex-col items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, rgba(243,168,100,.08) 0%, rgba(243,168,100,.04) 100%)" }}>
                  <Camera className="w-8 h-8 text-s-amber" />
                  <p className="text-xs font-heading text-s-amber">Foto hochgeladen</p>
                </div>
                {/* Price offer card */}
                <div className="animate-price-appear absolute -bottom-4 -right-4 bg-white rounded-[12px] border border-s-ink/[0.06] px-4 py-3 w-44"
                  style={{ boxShadow: "0 2px 4px rgba(26,18,9,.08), 0 4px 16px rgba(26,18,9,.06)" }}>
                  <p className="text-[9px] font-heading uppercase tracking-[.12em] text-s-ink/45">Preisangebot</p>
                  <p className="data-text font-bold text-xl text-s-ink">CHF 120</p>
                  <p className="text-xs font-heading text-s-coral">Balayage + Pflege</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
                  style={{ background: "rgba(27, 77, 27,.08)" }}>
                  <Camera size={14} className="text-s-coral" />
                  <SolenExclusiveBadge featureDescription="Schick ein Foto und erhalte einen individuellen Preis!" />
                </div>
                <p className="text-[9px] font-heading uppercase tracking-[.22em] text-s-ink/50 mb-2">{t("photoEyebrow")}</p>
                <h2 className="font-heading text-2xl sm:text-3xl text-s-ink">
                  {t("photoTitle")}
                </h2>
              </div>
              <div className="space-y-3 text-s-ink/60 font-body">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  {t("photoBullet1")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  {t("photoBullet2")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  {t("photoBullet3")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Compare ── */}
      <Section className="bg-s-bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
              style={{ background: "rgba(27, 77, 27,.08)" }}>
              <BarChart3 size={14} className="text-s-coral" />
              <SolenExclusiveBadge featureDescription="Vergleiche bis zu 3 Salons — nur bei Solen!" />
            </div>
            <p className="text-[9px] font-heading uppercase tracking-[.22em] text-s-ink/50 mb-2">{t("compareEyebrow")}</p>
            <h2 className="font-heading text-2xl sm:text-3xl text-s-ink mb-3">
              {t("compareTitle")}
            </h2>
            <p className="text-s-ink/55 font-body max-w-md mx-auto">
              {t("compareDesc")}
            </p>
          </div>
          <MockCompare />
        </div>
      </Section>

      {/* ── Section 4: Stamps ── */}
      <Section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
                  style={{ background: "rgba(27, 77, 27,.08)" }}>
                  <Star size={14} className="text-s-coral" />
                  <SolenExclusiveBadge featureDescription="Sammle Stempel bei jedem Besuch!" />
                </div>
                <p className="text-[9px] font-heading uppercase tracking-[.22em] text-s-ink/50 mb-2">{t("loyaltyEyebrow")}</p>
                <h2 className="font-heading text-2xl sm:text-3xl text-s-ink">
                  {t("loyaltyTitle")}
                </h2>
              </div>
              <div className="space-y-3 text-s-ink/60 font-body">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  {t("loyaltyBullet1")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  {t("loyaltyBullet2")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
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

      {/* ── Section 5: Map ── */}
      <Section className="bg-s-bg-surface">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <MockMap />
            <div>
              <div className="mb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill mb-3"
                  style={{ background: "rgba(27, 77, 27,.08)" }}>
                  <MapPin size={14} className="text-s-coral" />
                  <SolenExclusiveBadge featureDescription="Sieh Preise direkt auf der Karte!" />
                </div>
                <p className="text-[9px] font-heading uppercase tracking-[.22em] text-s-ink/50 mb-2">{t("mapEyebrow")}</p>
                <h2 className="font-heading text-2xl sm:text-3xl text-s-ink">
                  {t("mapTitle")}
                </h2>
              </div>
              <div className="space-y-3 text-s-ink/60 font-body">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  {t("mapBullet1")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  {t("mapBullet2")}
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  {t("mapBullet3")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Bottom CTA ── */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        {/* Warm ink gradient (not cold gray-900) */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(26,18,9,.92) 0%, rgba(14,9,4,1) 100%)" }} />

        <div className="relative max-w-xl mx-auto px-4 sm:px-6">
          {/* Coral ambient glow behind card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] pointer-events-none"
            style={{ background: "radial-gradient(ellipse, rgba(27, 77, 27,.15) 0%, transparent 70%)" }} />

          <div className="relative rounded-[20px] bg-white p-8 sm:p-10 text-center"
            style={{ boxShadow: "0 24px 72px rgba(26,18,9,.48)" }}>
            <p className="text-[9px] font-heading uppercase tracking-[.24em] text-s-coral mb-3">
              {t("ctaEyebrow")}
            </p>
            <h2 className="font-heading text-2xl sm:text-3xl text-s-ink mb-3">
              {t("ctaTitle")}
            </h2>
            <p className="text-s-ink/55 font-body mb-8 text-sm leading-relaxed">
              {t("ctaDesc")}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-btn bg-s-coral text-white text-xs font-heading uppercase tracking-[.04em] active:scale-[0.97] transition-[transform,filter] shadow-elevation-2"
              >
                {t("ctaBtn")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/${locale}/partner`}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-btn border border-s-ink/[0.10] text-xs font-heading uppercase tracking-[.04em] text-s-ink/60 hover:border-s-coral/50 hover:text-s-coral transition-colors"
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
