"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
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
      className={`py-16 sm:py-24 transition-all duration-700 ${
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
  return (
    <div className="w-full max-w-xs mx-auto bg-white dark:bg-s-dm-surface rounded-2xl shadow-lg border border-s-ink/5 dark:border-white/10 overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-s-ink/5 dark:border-white/10">
        <div className="w-8 h-8 rounded-full bg-s-coral/20 flex items-center justify-center text-s-coral text-xs font-heading font-bold">S</div>
        <div>
          <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">Studio Bella</p>
          <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">Online</p>
        </div>
      </div>
      {/* Messages */}
      <div className="px-4 py-3 space-y-2.5 min-h-[180px]">
        <div className="flex justify-end">
          <div className="bg-s-coral text-white text-xs px-3 py-2 rounded-2xl rounded-br-md max-w-[75%]">
            Hallo! Habt ihr morgen noch einen Termin für Balayage frei?
          </div>
        </div>
        <div className="flex">
          <div className="bg-s-bg-sunken dark:bg-white/10 text-s-ink dark:text-s-dm-text text-xs px-3 py-2 rounded-2xl rounded-bl-md max-w-[75%]">
            Hi! Ja, um 14:00 oder 16:30 — welche Zeit passt dir besser? 😊
          </div>
        </div>
        <div className="flex justify-end">
          <div className="bg-s-coral text-white text-xs px-3 py-2 rounded-2xl rounded-br-md max-w-[75%]">
            14:00 wäre perfekt!
          </div>
        </div>
      </div>
      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-s-ink/5 dark:border-white/10">
        <div className="flex-1 bg-s-bg-surface dark:bg-white/5 rounded-full px-3 py-1.5 text-xs text-s-ink/30 dark:text-s-dm-text/30">Nachricht...</div>
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
  const salons = [
    { name: "Studio Bella", rating: 4.8, price: 85, highlight: true },
    { name: "Hair Lounge", rating: 4.5, price: 95, highlight: false },
    { name: "Coiffeur Basel", rating: 4.2, price: 75, highlight: false },
  ];
  return (
    <div className="w-full max-w-md mx-auto overflow-hidden rounded-xl border border-s-ink/5 dark:border-white/10">
      <div className="grid grid-cols-3 text-center">
        {salons.map((s, i) => (
          <div
            key={i}
            className={`p-3 ${s.highlight ? "bg-s-coral/5 border-t-2 border-s-coral" : "bg-white dark:bg-s-dm-surface"} relative`}
          >
            {s.highlight && (
              <span className="absolute -top-0 left-1/2 -translate-x-1/2 -translate-y-full bg-s-coral text-white text-[9px] px-2 py-0.5 rounded-t-lg font-medium">
                Empfehlung
              </span>
            )}
            <p className="text-xs font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">{s.name}</p>
            <div className="flex items-center justify-center gap-0.5 mt-1.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs data-text text-s-ink dark:text-s-dm-text">{s.rating}</span>
            </div>
            <p className="text-sm data-text font-semibold text-s-ink dark:text-s-dm-text mt-1">{formatCurrency(s.price)}</p>
            <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">Balayage</p>
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
    { left: "55%", top: "20%", price: "ab CHF 65", color: "bg-yellow-400" },
    { left: "70%", top: "55%", price: "ab CHF 38", color: "bg-s-coral" },
    { left: "40%", top: "65%", price: "ab CHF 52", color: "bg-yellow-400" },
  ];
  return (
    <div className="relative w-full max-w-md mx-auto h-64 rounded-xl bg-gradient-to-br from-s-coral-50 to-s-coral-100 dark:from-s-coral-900/20 dark:to-s-coral-900/10 border border-s-coral-200/30 dark:border-s-coral-700/30 overflow-hidden">
      {/* Grid lines */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(6)].map((_, i) => (
          <div key={`h${i}`} className="absolute w-full h-px bg-s-coral-600" style={{ top: `${(i + 1) * 14}%` }} />
        ))}
        {[...Array(6)].map((_, i) => (
          <div key={`v${i}`} className="absolute h-full w-px bg-s-coral-600" style={{ left: `${(i + 1) * 14}%` }} />
        ))}
      </div>
      {/* Pins */}
      {pins.map((pin, i) => (
        <div key={i} className="absolute flex flex-col items-center" style={{ left: pin.left, top: pin.top }}>
          <span className="px-2 py-0.5 rounded-full text-[10px] data-text font-semibold text-white shadow-md whitespace-nowrap mb-1" style={{ backgroundColor: pin.color === "bg-s-coral" ? "#E8624A" : "#F2C144" }}>
            {pin.price}
          </span>
          <MapPin className="w-4 h-4" style={{ color: pin.color === "bg-s-coral" ? "#E8624A" : "#F2C144" }} />
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

  return (
    <div className="min-h-screen bg-white dark:bg-s-dm-bg">
      {/* ── Section 0: Hero ── */}
      <section className="relative overflow-hidden py-20 sm:py-32">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(232,98,74,0.12)_0%,_transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,_rgba(232,98,74,0.08)_0%,_transparent_70%)]" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading font-bold text-4xl sm:text-5xl lg:text-6xl text-s-ink dark:text-s-dm-text leading-tight">
            Was <span className="text-s-coral">Solen</span> anders macht
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-s-ink/60 dark:text-s-dm-text/60 font-body max-w-xl mx-auto">
            Nicht nur buchen — sondern erleben.
          </p>
          <button
            onClick={() => document.getElementById("section-chat")?.scrollIntoView({ behavior: "smooth" })}
            className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-button bg-s-coral text-white font-body font-medium hover:bg-s-coral/90 transition-colors shadow-lg shadow-s-coral/20"
          >
            Jetzt entdecken
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      </section>

      {/* ── Section 1: Chat ── */}
      <Section id="section-chat" className="bg-white dark:bg-s-dm-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-6 h-6 text-s-coral" />
                <SolenExclusiveBadge featureDescription="Chatte direkt mit deinem Salon — nur bei Solen!" />
              </div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-4">
                Chatte direkt mit deinem Salon
              </h2>
              <div className="space-y-3 text-s-ink/60 dark:text-s-dm-text/60 font-body">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Frag nach Verfügbarkeit, Preisen oder besonderen Wünschen
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Smarte Vorlagen für häufige Fragen
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  KI-gestützte Antwortvorschläge für Salons
                </p>
              </div>
            </div>
            <MockChat />
          </div>
        </div>
      </Section>

      {/* ── Section 2: Photo Quoting ── */}
      <Section className="bg-s-coral-50/50 dark:bg-s-coral-900/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Animated demo */}
            <div className="flex flex-col items-center gap-4 order-2 md:order-1">
              <div className="relative">
                {/* Photo frame */}
                <div className="animate-photo-upload w-48 h-48 rounded-card bg-gradient-to-br from-s-amber-subtle to-s-amber-subtle/70 dark:from-s-amber/10 dark:to-s-amber/5 border-2 border-dashed border-s-amber/30 dark:border-s-amber/20 flex flex-col items-center justify-center gap-2">
                  <Camera className="w-8 h-8 text-s-amber" />
                  <p className="text-xs text-s-amber-text dark:text-s-amber font-medium">Foto hochgeladen</p>
                </div>
                {/* Price offer card */}
                <div className="animate-price-appear absolute -bottom-4 -right-4 bg-white dark:bg-s-dm-surface rounded-xl shadow-lg border border-s-ink/5 dark:border-white/10 px-4 py-3 w-44">
                  <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">Preisangebot</p>
                  <p className="data-text font-bold text-lg text-s-ink dark:text-s-dm-text">CHF 120</p>
                  <p className="text-xs text-s-coral font-medium">Balayage + Pflege</p>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-2 mb-4">
                <Camera className="w-6 h-6 text-s-coral" />
                <SolenExclusiveBadge featureDescription="Schick ein Foto und erhalte einen individuellen Preis!" />
              </div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-4">
                Schick ein Foto, bekomm einen Preis
              </h2>
              <div className="space-y-3 text-s-ink/60 dark:text-s-dm-text/60 font-body">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Lade ein Foto deines Wunsch-Looks hoch
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Erhalte ein individuelles Preisangebot direkt im Chat
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Sicher bezahlen — alles in der App
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Compare ── */}
      <Section className="bg-white dark:bg-s-dm-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BarChart3 className="w-6 h-6 text-s-coral" />
              <SolenExclusiveBadge featureDescription="Vergleiche bis zu 3 Salons — nur bei Solen!" />
            </div>
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
              Vergleiche Salons nebeneinander
            </h2>
            <p className="text-s-ink/60 dark:text-s-dm-text/60 font-body max-w-md mx-auto">
              Preise, Bewertungen und Verfügbarkeit auf einen Blick — so findest du den perfekten Salon.
            </p>
          </div>
          <MockCompare />
        </div>
      </Section>

      {/* ── Section 4: Stamps ── */}
      <Section className="bg-s-coral-50/50 dark:bg-s-coral-900/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-6 h-6 text-s-coral" />
                <SolenExclusiveBadge featureDescription="Sammle Stempel bei jedem Besuch und erhalte Belohnungen!" />
              </div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-4">
                Sammle Stempel, bekomm Belohnungen
              </h2>
              <div className="space-y-3 text-s-ink/60 dark:text-s-dm-text/60 font-body">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Bei jedem Besuch automatisch einen Stempel sammeln
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Jeder Salon definiert eigene Belohnungen
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Fortschritt jederzeit im Profil einsehen
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
      <Section className="bg-white dark:bg-s-dm-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <MockMap />
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-6 h-6 text-s-coral" />
                <SolenExclusiveBadge featureDescription="Sieh Preise direkt auf der Karte!" />
              </div>
              <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-4">
                Preise direkt auf der Karte
              </h2>
              <div className="space-y-3 text-s-ink/60 dark:text-s-dm-text/60 font-body">
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Sieh sofort, was Salons in deiner Nähe kosten
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Gold-Pins markieren Top-bewertete Salons
                </p>
                <p className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                  Filtern nach Quartier, Preis und Verfügbarkeit
                </p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Bottom CTA ── */}
      <section className="relative py-20 sm:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-dark" />
        <div className="relative max-w-xl mx-auto px-4 sm:px-6">
          <div className="bg-white/80 dark:bg-s-ink/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 text-center border border-white/20 dark:border-white/10">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
              Bereit für bessere Beauty-Termine?
            </h2>
            <p className="text-s-ink/60 dark:text-s-dm-text/60 font-body mb-8">
              Entdecke Basels beste Salons — mit Chat, Stempelkarten und mehr.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href={`/${locale}`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-button bg-s-coral text-white font-body font-medium hover:bg-s-coral/90 transition-colors shadow-lg shadow-s-coral/20"
              >
                Jetzt ausprobieren
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/partner`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-button border border-s-ink/10 dark:border-white/20 text-s-ink/70 dark:text-s-dm-text/70 font-body font-medium hover:border-s-coral hover:text-s-coral transition-colors"
              >
                Bist du ein Salon?
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
