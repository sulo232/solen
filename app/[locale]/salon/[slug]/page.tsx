"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import Link from "next/link";

import {
  Star, MapPin, Phone, Instagram, Clock, ChevronRight,
  Scissors, User, Sparkles, Waves, Palette, Zap, Info, ShieldCheck, Bus, Droplets, Award,
  Facebook, Globe, Gift, Package, Share2
} from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import StaffSection from "@/components/salon/StaffSection";
import StaffPortfolio from "@/components/StaffPortfolio";
import SimilarSalons from "@/components/salon/SimilarSalons";
import WaitTimeDisplay from "@/components/barber/WaitTimeDisplay";
import RemoteQueueJoin from "@/components/barber/RemoteQueueJoin";
import ExpressRebook from "@/components/barber/ExpressRebook";
import Spinner from "@/components/ui/Spinner";
import { ReportContentButton } from "@/components/ui/ReportContentButton";
import { trackSalonView } from "@/components/RecentlyViewed";
import { motion } from "framer-motion";
import { usePostHog } from "posthog-js/react";
import type { Salon, Service, StaffMember, Review, SalonCategory, OpeningHours } from "@/lib/types";
import { generateSalonSchema } from "@/lib/seo";
import SalonSectionNav from "@/components/salon/SalonSectionNav";
import SalonPageSkeleton from "@/components/salon/SalonPageSkeleton";

// ── Extracted components ──
import SalonHero from "@/components/salon/SalonHero";
import SalonOpeningHours from "@/components/salon/SalonOpeningHours";
import SalonServices from "@/components/salon/SalonServices";
import SalonReviews from "@/components/salon/SalonReviews";
import SalonReviewsSummary from "@/components/salon/SalonReviewsSummary";
import SalonSidebar from "@/components/salon/SalonSidebar";
import SalonMobileCTA from "@/components/salon/SalonMobileCTA";



// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface ReviewPhoto {
  id: string;
  photo_url: string;
  sort_order: number;
}

interface ReviewReply {
  id: string;
  reply_text: string;
  is_public: boolean;
}

interface SalonDetail extends Salon {
  services: Service[];
  staff: StaffMember[];
  reviews: (Review & { profiles?: { display_name: string; avatar_url: string | null }; review_photos?: ReviewPhoto[]; review_replies?: ReviewReply[] })[];
  about_text_de?: string;
  about_text_en?: string;
  about_text_fr?: string;
  about_text_it?: string;
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

const CATEGORY_ICONS: Record<SalonCategory, React.FC<{ className?: string }>> = {
  coiffeur: Scissors, barbershop: User, nails: Sparkles,
  spa: Waves, makeup: Palette, waxing: Zap,
};

const CAT_TAG_COLOURS: Record<string, { bg: string; text: string }> = {
  coiffeur:   { bg: "rgba(151,123,89,.12)",  text: "#5A4429" },
  barbershop: { bg: "rgba(74,30,60,.12)",    text: "#4A1E3C" },
  nails:      { bg: "rgba(232,98,74,.12)",   text: "#7A2415" },
  spa:        { bg: "rgba(123,166,136,.15)", text: "#2E5E3A" },
  makeup:     { bg: "rgba(243,168,100,.10)",  text: "#6B4005" },
  waxing:     { bg: "rgba(107,163,200,.15)", text: "#1A4D72" },
};

/** Star rating */
function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const rounded = Math.round(rating);
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={[sz, i <= rounded ? "fill-s-coral text-s-coral" : "text-s-ink/20"].join(" ")} />
      ))}
    </span>
  );
}

/** JSON-LD */
function JsonLd({ salon, locale }: { salon: SalonDetail; locale: string }) {
  const schema = generateSalonSchema(salon, locale as "de" | "en");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/** Off-Peak Countdown */
interface OffPeakSlot {
  id: string;
  start_time: string;
  end_time: string;
  discount_percent: number;
}

function OffPeakCountdown({ salonId }: { salonId: string }) {
  const t = useTranslations("salonDetail");
  const [slot, setSlot] = useState<OffPeakSlot | null>(null);
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    fetch(`/api/salons/${salonId}/off-peak-today`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.slot) setSlot(d.slot); })
      .catch(() => {});
  }, [salonId]);

  useEffect(() => {
    if (!slot) return;
    const tick = () => {
      const now = new Date();
      const [eh, em] = slot.end_time.split(":").map(Number);
      const end = new Date();
      end.setHours(eh, em, 0, 0);
      const diff = end.getTime() - now.getTime();
      if (diff <= 0) { setRemaining(""); setSlot(null); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h > 0 ? `${h}h ` : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [slot]);

  if (!slot || !remaining) return null;

  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-card-lg shadow-elevation-1"
      style={{ background: "rgba(232,98,74,.08)", border: "1px solid rgba(232,98,74,.18)" }}>
      <div className="relative shrink-0">
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(232,98,74,.15)" }}>
          <Clock size={18} className="text-s-coral" />
        </div>
        <div className="absolute inset-0 rounded-full animate-pulse shadow-elevation-2" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-heading font-bold text-sm text-s-ink">
          {t("offPeakDiscount", { percent: slot.discount_percent })}
        </p>
        <p className="text-xs text-s-ink/50 mt-0.5">
          {t("offPeakToday", { start: slot.start_time, end: slot.end_time })}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-display text-[32px] leading-none text-s-coral">{remaining}</div>
        <div className="text-[10px] font-heading font-semibold uppercase tracking-[.14em] text-s-ink/45 mt-0.5">{t("remaining")}</div>
      </div>
    </div>
  );
}

/** Nail Artist Preview Card */
function NailArtistPreviewCard({ member, locale, onBook }: { member: StaffMember; locale: string; onBook: (id: string) => void }) {
  const t = useTranslations("salonDetail");
  const [previewImages, setPreviewImages] = useState<{ id: string; image_url: string }[]>([]);

  useEffect(() => {
    fetch(`/api/nail-tech/${member.id}/portfolio?limit=3`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.images) setPreviewImages(d.images.slice(0, 3)); })
      .catch(() => {});
  }, [member.id]);

  return (
    <div className="rounded-card-lg p-4"
      style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
               WebkitBackdropFilter: "blur(16px) saturate(1.2)",
               border: "1px solid rgba(255,255,255,.55)",
               boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05), inset 0 1px 0 rgba(255,255,255,.70)" }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-s-bg-surface overflow-hidden shrink-0 flex items-center justify-center">
          {member.avatar_url ? (
            <Image src={member.avatar_url} alt={member.name} width={40} height={40} className="object-cover w-full h-full" />
          ) : (
            <span className="text-sm font-bold text-s-ink/50">{member.name[0]}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-heading font-semibold text-sm text-s-ink truncate">{member.name}</p>
          {member.specialties?.length > 0 && (
            <p className="text-xs text-s-ink/50 truncate">{member.specialties.join(", ")}</p>
          )}
        </div>
      </div>
      {previewImages.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5 mb-3">
          {previewImages.map((img) => (
            <div key={img.id} className="aspect-square rounded-input overflow-hidden bg-s-bg-surface">
              <Image src={img.image_url} alt="" width={120} height={120} className="object-cover w-full h-full" />
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <Link
          href={`/${locale}/nail-tech/${member.id}`}
          className="flex-1 text-center text-xs py-1.5 rounded-btn border border-s-ink/10 text-s-ink/70 hover:border-s-coral/30 transition-colors duration-150"
        >
          {t("viewAllDesigns")}
        </Link>
        <button
          onClick={() => onBook(member.id)}
          className="flex-1 text-center text-xs py-1.5 rounded-btn bg-s-coral text-white hover:brightness-[1.06] transition-colors duration-150"
        >
          {t("book")}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Page Component
// ─────────────────────────────────────────────────

export default function SalonProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const locale = useLocale();
  const t = useTranslations("salonDetail");
  const posthog = usePostHog();

  const TABS = [
    { key: "angebot", label: t("services") },
    { key: "bewertungen", label: t("reviews") },
    { key: "team", label: t("team") },
    { key: "fotos", label: t("photos") },
    { key: "portfolio", label: t("portfolio") },
    { key: "standort", label: t("location") },
    { key: "info", label: t("info") },
  ];

  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [selectedStaff, setSelectedStaff] = useState<string | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [unreviewedBookingId, setUnreviewedBookingId] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [nextSlot, setNextSlot] = useState<any>(null);

  const handleTabClick = (key: string) => {
    document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Data fetching ──
  useEffect(() => {
    if (!slug) return;
    fetch(`/api/salons/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setSalon(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!salon?.id) return;
    fetch(`/api/reviews/my-booking?salon_id=${salon.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.booking?.id) setUnreviewedBookingId(d.booking.id); })
      .catch(() => {});

    fetch("/api/salons/mine")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.salon?.id === salon.id) setIsOwner(true); })
      .catch(() => {});

    // Fetch next available slot for quick-book
    fetch(`/api/slots/next-available?salon_id=${salon.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.available) setNextSlot(d.slot); })
      .catch(() => {});
  }, [salon?.id]);

  // ── Analytics ──
  useEffect(() => {
    if (!salon?.id) return;
    fetch("/api/analytics/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salon.id, source: "direct" }),
    }).catch(() => {});

    trackSalonView({
      id: salon.id, slug: salon.slug, name: salon.name,
      cover_photo_url: salon.cover_photo_url,
      average_rating: salon.average_rating, categories: salon.categories,
    });

    posthog?.capture("salon_profile_viewed", { salon_id: salon.id, salon_name: salon.name });
  }, [salon?.id, salon?.slug, salon?.name, salon?.cover_photo_url, salon?.average_rating, salon?.categories, posthog]);

  // ── Loading / 404 ──
  if (loading) {
    return <div className="min-h-screen bg-white"><SalonPageSkeleton /></div>;
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6 px-4">
        <div className="font-display text-[80px] leading-none text-s-ink/10">404</div>
        <p className="font-heading font-bold text-s-ink text-2xl">{t("notFound")}</p>
        <p className="font-body text-s-ink/50 text-sm text-center max-w-xs">{t("notFoundMessage")}</p>
        <Link href={`/${locale}/coiffeur`}
          className="px-6 py-3 rounded-btn bg-s-coral text-white font-heading font-bold text-sm uppercase tracking-[.04em] shadow-elevation-2">
          {t("viewAllSalons")}
        </Link>
      </div>
    );
  }

  // ── Derived data ──
  const photos = [salon.cover_photo_url, ...(salon.gallery_urls ?? [])].filter(Boolean) as string[];
  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const todayHours = salon.opening_hours?.[dayKey] as OpeningHours | null | undefined;
  const isOpen = (() => {
    if (!todayHours) return false;
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  })();

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    setCalendarOpen(true);
  };

  const handleQuickBook = (slot: any) => {
    // Set the selected staff member and open calendar for the next available slot
    if (slot.staff_id) {
      setSelectedStaff(slot.staff_id);
    }
    setCalendarOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: salon.name, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      // Could show a toast here
    }
  };

  const reloadSalon = () => {
    fetch(`/api/salons/${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setSalon(d); })
      .catch(() => {});
  };

  return (
    <>
      <JsonLd salon={salon} locale={locale} />
      <div className="min-h-screen bg-white relative overflow-x-hidden">
        <div className="relative z-10">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-3">
            <ol className="flex items-center gap-1.5 text-[11px] font-heading font-semibold uppercase tracking-[.12em]">
              <li><Link href={`/${locale}`} className="text-s-ink/45 hover:text-s-coral transition-colors duration-150">Home</Link></li>
              <li aria-hidden><ChevronRight className="w-3 h-3 text-s-ink/20" /></li>
              {salon.categories[0] && (
                <>
                  <li><Link href={`/${locale}/${salon.categories[0]}`}
                    className="text-s-ink/45 hover:text-s-coral capitalize transition-colors duration-150">{salon.categories[0]}</Link></li>
                  <li aria-hidden><ChevronRight className="w-3 h-3 text-s-ink/20" /></li>
                </>
              )}
              <li className="text-s-ink/70 truncate max-w-[200px]" aria-current="page">{salon.name}</li>
            </ol>
          </nav>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 lg:pb-16">
            {/* ── Q52 Photo Hero — single full-bleed + thumbnail strip + bottom-fade overlay ── */}
            <SalonHero
              photos={photos}
              salonName={salon.name}
              overlayContent={
                <div>
                  <p className="font-body text-[10px] sm:text-[11px] font-bold uppercase tracking-[.20em]" style={{ color: "#F3A864" }}>
                    {salon.categories[0] ?? "SALON"}{(salon as any).quartier ? ` · ${String((salon as any).quartier).replace("_", " ")}` : ""}
                  </p>
                  <p className="mt-1.5 font-heading text-[24px] sm:text-[32px] md:text-[40px] uppercase leading-[0.95]" style={{ letterSpacing: "0.01em" }}>
                    {salon.name}
                  </p>
                </div>
              }
            />

            {/* Two-column grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* ── Left: info ── */}
              <div className="lg:col-span-2 flex flex-col gap-8">

                {/* Name + meta — Q52: name now lives in the hero overlay; sr-only h1 retained
                    for SEO + screen-reader landmark, visible meta below */}
                <div>
                  <h1 className="sr-only">{salon.name}</h1>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1.5 text-xs font-medium ${isOpen ? "text-s-success" : "text-s-ink/40"}`}>
                      <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-s-success" : "bg-s-ink/20"}`} />
                      {isOpen ? t("open") : t("closed")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {salon.categories.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat];
                      const colours = CAT_TAG_COLOURS[cat] ?? { bg: "rgba(232,98,74,.12)", text: "#7A2415" };
                      return (
                        <span key={cat} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-btn text-xs font-heading font-bold uppercase tracking-[.06em]"
                          style={{ background: colours.bg, color: colours.text }}>
                          <Icon className="w-3 h-3" />{cat}
                        </span>
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5">
                      <Stars rating={salon.average_rating} />
                      <span className="data-text font-semibold text-s-ink text-sm">{salon.average_rating.toFixed(1)}</span>
                      <button onClick={() => handleTabClick("bewertungen")} className="text-s-ink/40 text-xs hover:text-s-coral transition-colors duration-150">({salon.review_count})</button>
                    </div>
                    <span className="flex items-center gap-1 text-s-ink/50 text-sm">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="capitalize">{(salon as any).quartier?.replace("_", " ")}</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-3">
                    {salon.address && (
                      <a href={`https://maps.google.com/?q=${encodeURIComponent(salon.address + " Basel")}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-s-ink/55 hover:text-s-coral transition-colors duration-150 px-2 py-1 rounded-input hover:bg-s-coral/[0.06]">
                        <MapPin className="w-4 h-4" />{salon.address}
                      </a>
                    )}
                    {salon.phone && (
                      <a href={`tel:${salon.phone}`} className="flex items-center gap-1.5 text-sm text-s-ink/55 hover:text-s-coral transition-colors duration-150 px-2 py-1 rounded-input hover:bg-s-coral/[0.06]">
                        <Phone className="w-4 h-4" />{salon.phone}
                      </a>
                    )}
                    {salon.instagram_url && (
                      <a href={salon.instagram_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-s-ink/55 hover:text-s-coral transition-colors duration-150 px-2 py-1 rounded-input hover:bg-s-coral/[0.06]">
                        <Instagram className="w-4 h-4" />Instagram
                      </a>
                    )}
                    {(salon as any).facebook_url && (
                      <a href={(salon as any).facebook_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-s-ink/55 hover:text-s-coral transition-colors duration-150 px-2 py-1 rounded-input hover:bg-s-coral/[0.06]">
                        <Facebook className="w-4 h-4" />Facebook
                      </a>
                    )}
                    {(salon as any).tiktok_url && (
                      <a href={(salon as any).tiktok_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-s-ink/55 hover:text-s-coral transition-colors duration-150 px-2 py-1 rounded-input hover:bg-s-coral/[0.06]">
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.78a8.18 8.18 0 003.76.92V6.25a4.82 4.82 0 01-.01.44z"/></svg>
                        TikTok
                      </a>
                    )}
                    {(salon as any).website_url && (
                      <a href={(salon as any).website_url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-sm text-s-ink/55 hover:text-s-coral transition-colors duration-150 px-2 py-1 rounded-input hover:bg-s-coral/[0.06]">
                        <Globe className="w-4 h-4" />Website
                      </a>
                    )}

                    <div className="flex-1 min-w-4" />
                    {/* Share button */}
                    <button
                      onClick={handleShare}
                      className="flex items-center gap-1.5 text-sm text-s-ink/55 hover:text-s-coral transition-colors duration-150 px-2 py-1 rounded-input hover:bg-s-coral/[0.06]"
                    >
                      <Share2 className="w-4 h-4" />{t("shareProfile")}
                    </button>
                    <ReportContentButton targetType="salon" targetId={salon.id} />
                  </div>
                </div>

                {/* Off-peak countdown */}
                <OffPeakCountdown salonId={salon.id} />

                {/* Section nav */}
                <SalonSectionNav
                  sections={TABS.map((tab) => ({ id: `section-${tab.key}`, label: tab.label }))}
                />

                {/* About section */}
                <div id="section-info" className="scroll-mt-[80px]">
                  {(salon.about_text_de || salon.about_text_en || salon.about_text_fr || salon.about_text_it) && (
                    <div className="mb-8 p-6 rounded-card-lg bg-white border border-s-ink/5 shadow-elevation-1">
                      <h2 className="font-heading font-semibold text-base text-s-ink mb-3">{t("aboutUs")}</h2>
                      <p className="text-sm text-s-ink/70 leading-relaxed whitespace-pre-wrap">
                        {(salon as any)[`about_text_${locale}`] || salon.about_text_en || salon.about_text_de}
                      </p>
                    </div>
                  )}
                </div>

                {/* Opening hours */}
                <SalonOpeningHours openingHours={salon.opening_hours} locale={locale} />

                {/* Salon info — atmosphere, expertise, products, transport */}
                {((salon as any).atmosphere || (salon as any).expertise || (salon as any).products || (salon as any).nearest_transport) && (
                  <div>
                    <h2 className="font-heading font-semibold text-base text-s-ink mb-3 flex items-center gap-2">
                      <Info className="w-4 h-4 text-s-coral" />{t("salonInfo")}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(salon as any).atmosphere && (
                        <div className="flex items-start gap-3 p-4 rounded-card"
                          style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
                                   WebkitBackdropFilter: "blur(16px) saturate(1.2)", border: "1px solid rgba(255,255,255,.55)",
                                   boxShadow: "0 1px 2px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.70)" }}>
                          <div className="w-8 h-8 rounded-input flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(232,98,74,.10)" }}>
                            <Sparkles className="w-4 h-4 text-s-coral" />
                          </div>
                          <div>
                            <p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/45 mb-1">{t("atmosphere")}</p>
                            <p className="text-sm text-s-ink leading-snug">{(salon as any).atmosphere}</p>
                          </div>
                        </div>
                      )}
                      {(salon as any).expertise && (
                        <div className="flex items-start gap-3 p-4 rounded-card"
                          style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
                                   WebkitBackdropFilter: "blur(16px) saturate(1.2)", border: "1px solid rgba(255,255,255,.55)",
                                   boxShadow: "0 1px 2px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.70)" }}>
                          <div className="w-8 h-8 rounded-input flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(232,98,74,.10)" }}>
                            <Award className="w-4 h-4 text-s-coral" />
                          </div>
                          <div>
                            <p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/45 mb-1">{t("expertise")}</p>
                            <p className="text-sm text-s-ink leading-snug">{(salon as any).expertise}</p>
                          </div>
                        </div>
                      )}
                      {(salon as any).products && (
                        <div className="flex items-start gap-3 p-4 rounded-card"
                          style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
                                   WebkitBackdropFilter: "blur(16px) saturate(1.2)", border: "1px solid rgba(255,255,255,.55)",
                                   boxShadow: "0 1px 2px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.70)" }}>
                          <div className="w-8 h-8 rounded-input flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(232,98,74,.10)" }}>
                            <Droplets className="w-4 h-4 text-s-coral" />
                          </div>
                          <div>
                            <p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/45 mb-1">{t("products")}</p>
                            <p className="text-sm text-s-ink leading-snug">{(salon as any).products}</p>
                          </div>
                        </div>
                      )}
                      {(salon as any).nearest_transport && (
                        <div className="flex items-start gap-3 p-4 rounded-card"
                          style={{ background: "rgba(255,255,255,.62)", backdropFilter: "blur(16px) saturate(1.2)",
                                   WebkitBackdropFilter: "blur(16px) saturate(1.2)", border: "1px solid rgba(255,255,255,.55)",
                                   boxShadow: "0 1px 2px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.70)" }}>
                          <div className="w-8 h-8 rounded-input flex items-center justify-center shrink-0 mt-0.5" style={{ background: "rgba(232,98,74,.10)" }}>
                            <Bus className="w-4 h-4 text-s-coral" />
                          </div>
                          <div>
                            <p className="text-[9px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/45 mb-1">{t("publicTransport")}</p>
                            <p className="text-sm text-s-ink leading-snug">{(salon as any).nearest_transport}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Staff/Team */}
                {salon.staff.length > 0 && (
                  <div id="section-team" className="scroll-mt-[80px]">
                    <h2 className="font-heading font-semibold text-base text-s-ink mb-3">Team</h2>
                    <div className="mt-3 md:mt-0">
                      <StaffSection
                        staff={salon.staff}
                        salonSlug={slug}
                        locale={locale}
                        onBook={(staffId) => { setSelectedStaff(staffId); setCalendarOpen(true); }}
                      />
                    </div>
                    {/* Instagram-style portfolios — render per staff member who has images */}
                    {salon.staff.some((m: any) => (m.staff_portfolio_images ?? []).length > 0) && (
                      <div className="mt-6 flex flex-col gap-4">
                        {salon.staff.filter((m: any) => (m.staff_portfolio_images ?? []).length > 0).map((m: any) => (
                          <StaffPortfolio
                            key={m.id}
                            member={m}
                            images={m.staff_portfolio_images}
                            salonSlug={slug}
                            onBook={(staffId) => { setSelectedStaff(staffId); setCalendarOpen(true); }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Nail Artists — only for nail salons */}
                {salon.categories?.includes("nails") && salon.staff.length > 0 && (
                  <div id="section-nail-artists" className="scroll-mt-[80px]">
                    <h2 className="font-heading font-semibold text-base text-s-ink mb-3">{t("team")}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 md:mt-0">
                      {salon.staff.map((m) => (
                        <NailArtistPreviewCard key={m.id} member={m} locale={locale}
                          onBook={(staffId) => { setSelectedStaff(staffId); setCalendarOpen(true); }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Barber Roster — only for barbershops */}
                {salon.categories?.includes("barbershop") && salon.staff.length > 0 && (
                  <div id="section-barbers" className="scroll-mt-[80px]">
                    <h2 className="font-heading font-semibold text-base text-s-ink mb-3">{t("team")}</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3 md:mt-0">
                      {salon.staff.map((m) => (
                        <Link key={m.id} href={`/${locale}/salon/${slug}/barber/${(m as any).slug ?? m.id}`}
                          className="group glass-frost rounded-card-lg p-4 text-center hover:-translate-y-[5px] hover:shadow-v5-card-hover transition-[transform,box-shadow] duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
                          <div className="w-14 h-14 rounded-full bg-s-bg-surface mx-auto mb-3 overflow-hidden ring-2 ring-transparent group-hover:ring-s-coral/40 transition-[box-shadow,transform]">
                            {m.avatar_url ? (
                              <Image src={m.avatar_url} alt={m.name} width={56} height={56} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-s-ink/20">
                                <Scissors size={20} />
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium text-s-ink truncate">{m.name}</p>
                          {m.specialties?.length > 0 && (
                            <p className="text-xs text-s-ink/50 truncate mt-0.5">{m.specialties[0]}</p>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Walk-in Queue — only for barbershops */}
                {salon.categories?.includes("barbershop") && (
                  <div id="section-walkin" className="scroll-mt-[80px]">
                    <h2 className="font-heading font-semibold text-base text-s-ink mb-3">Walk-in</h2>
                    <div className="space-y-4 mt-3 md:mt-0">
                      <WaitTimeDisplay salonId={salon.id} />
                      <RemoteQueueJoin
                        salonId={salon.id}
                        staff={salon.staff.map((s) => ({ id: s.id, name: s.name }))}
                        services={salon.services.map((s) => ({ id: s.id, name_de: s.name_de ?? "" }))}
                      />
                      <ExpressRebook salonId={salon.id} />
                    </div>
                  </div>
                )}

                {/* ── Services ── */}
                <SalonServices
                  services={salon.services}
                  salonId={salon.id}
                  onServiceSelect={handleServiceSelect}
                  selectedServiceId={selectedService}
                />

                {/* Packages & Gift Cards */}
                <div className="flex gap-3 my-4">
                  <Link href={`/${locale}/salon/${slug}/gift-card`}
                    className="flex-1 flex items-center gap-3 p-3 rounded-card border border-s-coral/15 bg-s-coral/5 hover:bg-s-coral/10 transition-colors duration-150">
                    <Gift size={18} className="text-s-coral shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-s-ink">{t("giftCard")}</p>
                      <p className="text-xs text-s-ink/40">{t("book")}</p>
                    </div>
                  </Link>
                  <Link href={`/${locale}/salon/${slug}/packages`}
                    className="flex-1 flex items-center gap-3 p-3 rounded-card border border-s-ink/5 bg-white hover:bg-s-bg-surface transition-colors duration-150">
                    <Package size={18} className="text-s-blue shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-s-ink">{t("packages")}</p>
                      <p className="text-xs text-s-ink/40">{t("book")}</p>
                    </div>
                  </Link>
                </div>

                {/* ── Q54 Reviews — summary on detail tab; full list at /salon/[slug]/reviews ── */}
                <SalonReviewsSummary
                  salonSlug={slug}
                  averageRating={salon.average_rating ?? 0}
                  reviewCount={salon.review_count ?? 0}
                  distribution={(() => {
                    const dist: [number, number, number, number, number] = [0, 0, 0, 0, 0];
                    (salon.reviews ?? []).forEach((r: any) => {
                      const star = Math.round(r.rating);
                      if (star >= 1 && star <= 5) dist[5 - star]++;
                    });
                    return dist;
                  })()}
                  latestReviews={(salon.reviews ?? []).slice(0, 3).map((r: any) => ({
                    id: r.id,
                    rating: r.rating,
                    comment: r.comment,
                    created_at: r.created_at,
                    user_name: r.profiles?.display_name ?? r.user_name,
                    user_avatar: r.profiles?.avatar_url ?? r.user_avatar,
                    reply_text: r.reply?.reply_text ?? r.review_replies?.[0]?.reply_text ?? null,
                  }))}
                />

                {/* Location / Map */}
                {salon.latitude && salon.longitude && (
                  <div id="section-standort" className="scroll-mt-[80px]">
                    <h2 className="font-heading font-semibold text-base text-s-ink mb-3">{t("location")}</h2>
                    <a
                      href={`https://maps.google.com/?q=${salon.latitude},${salon.longitude}`}
                      target="_blank" rel="noopener noreferrer"
                      className="block w-full aspect-[2/1] rounded-card overflow-hidden bg-s-bg-surface border border-s-ink/[0.08] hover:border-s-coral/30 transition-colors duration-150 relative group"
                    >
                      <img
                        src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/pin-s+E8624A(${salon.longitude},${salon.latitude})/${salon.longitude},${salon.latitude},14,0/600x300@2x?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''}`}
                        alt={`${salon.name} ${t("location")}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                    </a>
                    {salon.address && (
                      <p className="text-sm text-s-ink/60 mt-2">{salon.address}</p>
                    )}
                  </div>
                )}

                {/* Portfolio placeholder for nail/makeup salons */}
                {(salon.categories?.includes("nails") || salon.categories?.includes("makeup")) && (
                  <div id="section-portfolio" className="scroll-mt-[80px]">
                    {/* Portfolio content is handled by the nail-artists section above */}
                  </div>
                )}

                {/* Similar Salons */}
                {salon.categories?.length > 0 && (
                  <SimilarSalons currentSalonId={salon.id} category={salon.categories[0]} locale={locale} />
                )}
              </div>

              {/* ── Right: sticky booking sidebar ── */}
              <SalonSidebar
                salonId={salon.id}
                salonName={salon.name}
                salonSlug={slug}
                services={salon.services}
                averageRating={salon.average_rating}
                reviewCount={salon.review_count}
                isOpen={isOpen}
                calendarOpen={calendarOpen}
                onOpenCalendar={() => setCalendarOpen(true)}
                selectedServiceId={selectedService}
                selectedStaffId={selectedStaff}
                nextSlot={nextSlot}
                onQuickBook={handleQuickBook}
              />
            </div>
          </div>

          {/* ── Mobile CTA + Sheet ── */}
          <SalonMobileCTA
            salonId={salon.id}
            salonName={salon.name}
            salonSlug={slug}
            services={salon.services}
            averageRating={salon.average_rating}
            reviewCount={salon.review_count}
            isOpen={isOpen}
            selectedServiceId={selectedService}
            selectedStaffId={selectedStaff}
          />
        </div>{/* end z-10 wrapper */}
      </div>
    </>
  );
}
