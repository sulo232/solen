"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Star, MapPin, Phone, Instagram, Clock, ChevronRight, ChevronLeft, ChevronDown,
  Scissors, User, Sparkles, Waves, Palette, Zap, X, Info, ShieldCheck, Bus, Droplets, Award,
  Facebook, Globe
} from "lucide-react";
import BookingCalendar from "@/components/BookingCalendar";
import StaffPortfolio from "@/components/StaffPortfolio";
import ReviewBreakdown from "@/components/ReviewBreakdown";
import NearbySalons from "@/components/NearbySalons";
import BottomSheet from "@/components/ui/BottomSheet";
import Spinner from "@/components/ui/Spinner";
import { trackSalonView } from "@/components/RecentlyViewed";
import { motion, AnimatePresence } from "framer-motion";
import type { Salon, Service, StaffMember, Review, SalonCard, SalonCategory, OpeningHours } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface ReviewPhoto {
  id: string;
  photo_url: string;
  sort_order: number;
}

interface SalonDetail extends Salon {
  services: Service[];
  staff: StaffMember[];
  reviews: (Review & { profiles?: { display_name: string; avatar_url: string | null }; review_photos?: ReviewPhoto[] })[];
}

// ─────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAYS_DE = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const DAYS_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const CATEGORY_ICONS: Record<SalonCategory, React.FC<{ className?: string }>> = {
  coiffeur: Scissors, barbershop: User, nails: Sparkles,
  spa: Waves, makeup: Palette, waxing: Zap,
};

/** Star rating using Star lucide icon (not text ★) */
function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const sz = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  const rounded = Math.round(rating);
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={[sz, i <= rounded ? "fill-s-coral text-s-coral" : "text-gray-200"].join(" ")} />
      ))}
    </span>
  );
}


// ─────────────────────────────────────────────────
// JSON-LD
// ─────────────────────────────────────────────────

function JsonLd({ salon }: { salon: SalonDetail }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BeautySalon",
          name: salon.name,
          address: { "@type": "PostalAddress", streetAddress: salon.address, addressLocality: "Basel", addressCountry: "CH" },
          aggregateRating: { "@type": "AggregateRating", ratingValue: salon.average_rating, reviewCount: salon.review_count },
          telephone: salon.phone,
        }),
      }}
    />
  );
}

// ─────────────────────────────────────────────────
// Off-Peak Countdown
// ─────────────────────────────────────────────────

interface OffPeakSlot {
  id: string;
  start_time: string; // "14:00"
  end_time: string;   // "17:00"
  discount_percent: number;
}

function OffPeakCountdown({ salonId }: { salonId: string }) {
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
    <div className="bg-s-coral/10 border border-s-coral/20 rounded-card px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-s-coral/15 flex items-center justify-center shrink-0">
        <Clock size={16} className="text-s-coral" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-dark">
          Off-Peak: {slot.discount_percent}% Rabatt
        </p>
        <p className="text-xs text-dark/50">
          Noch bis {slot.end_time} Uhr · {slot.start_time}–{slot.end_time}
        </p>
      </div>
      <div className="shrink-0">
        <span className="data-text font-bold text-lg text-s-coral tabular-nums">{remaining}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────

export default function SalonProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  const locale = useLocale();

  const [salon, setSalon] = useState<SalonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedService, setSelectedService] = useState<string | undefined>();
  const [selectedStaff, setSelectedStaff] = useState<string | undefined>();
  const [reviewPage, setReviewPage] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("angebot");
  const [openAccordion, setOpenAccordion] = useState<string | null>("angebot");
  const [reviewSort, setReviewSort] = useState<"newest" | "highest" | "lowest">("newest");
  const [hoursExpanded, setHoursExpanded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/salons/${slug}`)
      .then((r) => r.json())
      .then((d) => { setSalon(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  // Track salon page view (fire-and-forget, rate-limited by session cookie)
  useEffect(() => {
    if (!salon?.id) return;
    fetch("/api/analytics/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salon.id, source: "direct" }),
    }).catch(() => {});

    // Track for "Recently Viewed" (localStorage)
    trackSalonView({
      id: salon.id,
      slug: salon.slug,
      name: salon.name,
      cover_photo_url: salon.cover_photo_url,
      average_rating: salon.average_rating,
      categories: salon.categories,
    });
  }, [salon?.id, salon?.slug, salon?.name, salon?.cover_photo_url, salon?.average_rating, salon?.categories]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-dark/40">
        <p className="font-heading text-2xl font-semibold">Salon nicht gefunden</p>
        <Link href={`/${locale}/coiffeur`} className="text-sm text-s-coral hover:underline">Alle Salons</Link>
      </div>
    );
  }

  const photos = [salon.cover_photo_url, ...(salon.gallery_urls ?? [])].filter(Boolean) as string[];
  // Sort reviews based on selected sort
  const sortedReviews = [...salon.reviews].sort((a, b) => {
    if (reviewSort === "highest") return b.rating - a.rating;
    if (reviewSort === "lowest") return a.rating - b.rating;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const reviewsVisible = sortedReviews.slice(0, reviewPage * 5);

  const scrollToReviews = () => {
    setActiveTab("bewertungen");
    setOpenAccordion("bewertungen");
    document.getElementById("section-bewertungen")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const servicesByCategory = salon.services.reduce<Record<string, Service[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] ?? []).push(s);
    return acc;
  }, {});
  const ratingBreakdown = [5, 4, 3, 2, 1].map((r) => ({
    r, count: salon.reviews.filter((rev) => Math.round(rev.rating) === r).length,
  }));

  // Build a SalonCard-compatible object for MapView
  const mapSalon: SalonCard = { ...salon };

  // Open/closed status indicator
  const now = new Date();
  const dayKey = DAY_KEYS[now.getDay()];
  const todayHours = salon.opening_hours?.[dayKey] as OpeningHours | null | undefined;
  const isOpen = (() => {
    if (!todayHours) return false;
    const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    return currentTime >= todayHours.open && currentTime <= todayHours.close;
  })();

  const TABS = [
    { key: "angebot", label: "Angebot" },
    { key: "bewertungen", label: "Bewertungen" },
    { key: "team", label: "Team" },
    { key: "standort", label: "Standort" },
  ] as const;

  return (
    <>
      <JsonLd salon={salon} />
      <div className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-2 text-xs text-dark/40">
          <Link href={`/${locale}`} className="hover:text-s-coral">Home</Link>
          <ChevronRight className="inline w-3 h-3 mx-1" />
          {salon.categories[0] && (
            <>
              <Link href={`/${locale}/${salon.categories[0]}`} className="capitalize hover:text-s-coral">{salon.categories[0]}</Link>
              <ChevronRight className="inline w-3 h-3 mx-1" />
            </>
          )}
          <span className="text-dark/70">{salon.name}</span>
        </nav>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 lg:pb-16">
          {/* Photo gallery — Framer Motion crossfade */}
          <div className="relative w-full aspect-[16/7] rounded-card overflow-hidden bg-gray-100 mb-6 select-none">
            <AnimatePresence mode="wait" initial={false}>
              {photos.length > 0 && (
                <motion.div key={photoIndex} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="absolute inset-0">
                  <Image src={photos[photoIndex]} alt={salon.name} fill className="object-cover" priority />
                </motion.div>
              )}
            </AnimatePresence>
            {photos.length > 0 ? (
              <>
                {/* transparent placeholder to keep aspect ratio */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={() => setPhotoIndex((i) => (i - 1 + photos.length) % photos.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="w-5 h-5 text-dark" />
                    </button>
                    <button
                      onClick={() => setPhotoIndex((i) => (i + 1) % photos.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center shadow hover:bg-white transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 text-dark" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photos.map((_, i) => (
                        <button key={i} onClick={() => setPhotoIndex(i)}
                          className={`h-1.5 rounded-full transition-all ${i === photoIndex ? "bg-white w-3" : "bg-white/50 w-1.5"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-dark/10 font-heading text-7xl">
                {salon.name[0]}
              </div>
            )}
          </div>

          {/* Two-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* ── Left: info */}
            <div className="lg:col-span-2 flex flex-col gap-8">

              {/* Name + meta */}
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="font-heading font-bold text-2xl sm:text-3xl text-dark">{salon.name}</h1>
                  <span className={`flex items-center gap-1.5 text-xs font-medium ${isOpen ? "text-emerald-600" : "text-dark/40"}`}>
                    <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-500 animate-pulse" : "bg-gray-300"}`} />
                    {isOpen ? "Geöffnet" : "Geschlossen"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {salon.categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <span key={cat} className="flex items-center gap-1 px-2.5 py-1 rounded-pill bg-s-coral/10 text-s-coral text-xs font-medium capitalize">
                        <Icon className="w-3 h-3" />{cat}
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Stars rating={salon.average_rating} />
                    <span className="data-text font-semibold text-dark text-sm">{salon.average_rating.toFixed(1)}</span>
                    <button onClick={scrollToReviews} className="text-dark/40 text-xs hover:text-s-coral transition-colors">({salon.review_count})</button>
                  </div>
                  <span className="flex items-center gap-1 text-dark/50 text-sm">
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="capitalize">{salon.quartier.replace("_", " ")}</span>
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 mt-3">
                  {salon.address && (
                    <a href={`https://maps.google.com/?q=${encodeURIComponent(salon.address + " Basel")}`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-s-coral transition-colors">
                      <MapPin className="w-4 h-4" />{salon.address}
                    </a>
                  )}
                  {salon.phone && (
                    <a href={`tel:${salon.phone}`} className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-s-coral transition-colors">
                      <Phone className="w-4 h-4" />{salon.phone}
                    </a>
                  )}
                  {salon.instagram_url && (
                    <a href={salon.instagram_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-s-coral transition-colors">
                      <Instagram className="w-4 h-4" />Instagram
                    </a>
                  )}
                  {(salon as any).facebook_url && (
                    <a href={(salon as any).facebook_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-s-coral transition-colors">
                      <Facebook className="w-4 h-4" />Facebook
                    </a>
                  )}
                  {(salon as any).tiktok_url && (
                    <a href={(salon as any).tiktok_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-s-coral transition-colors">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.78a8.18 8.18 0 003.76.92V6.25a4.82 4.82 0 01-.01.44z"/></svg>
                      TikTok
                    </a>
                  )}
                  {(salon as any).website_url && (
                    <a href={(salon as any).website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-s-coral transition-colors">
                      <Globe className="w-4 h-4" />Website
                    </a>
                  )}
                </div>
              </div>

              {/* Off-peak countdown */}
              <OffPeakCountdown salonId={salon.id} />

              {/* Desktop tab bar */}
              <div className="hidden md:flex items-center gap-1 border-b border-gray-100 sticky top-[57px] bg-white z-10">
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                    className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                      activeTab === key ? "border-s-coral text-s-coral" : "border-transparent text-dark/50 hover:text-dark"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Opening hours — mobile: collapsed with today preview */}
              {Object.keys(salon.opening_hours ?? {}).length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-base text-dark mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-s-coral" />Öffnungszeiten
                  </h2>
                  {/* Mobile: today preview + expand */}
                  <div className="md:hidden">
                    <button
                      onClick={() => setHoursExpanded(!hoursExpanded)}
                      className="w-full flex items-center justify-between py-2 text-sm"
                    >
                      <span className="text-dark/70">
                        Heute: {todayHours ? `${todayHours.open}–${todayHours.close}` : "Geschlossen"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-dark/40 transition-transform ${hoursExpanded ? "rotate-180" : ""}`} />
                    </button>
                    {hoursExpanded && (
                      <div className="grid grid-cols-1 gap-y-1.5 mt-1">
                        {DAY_KEYS.map((key, i) => {
                          const h = salon.opening_hours[key];
                          const label = locale === "de" ? DAYS_DE[i] : DAYS_EN[i];
                          return (
                            <div key={key} className="flex justify-between text-sm">
                              <span className="text-dark/50">{label}</span>
                              <span className={h ? "data-text text-dark" : "text-dark/25"}>
                                {h ? `${h.open}–${h.close}` : "Zu"}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  {/* Desktop: full grid */}
                  <div className="hidden md:grid grid-cols-2 gap-x-8 gap-y-1.5">
                    {DAY_KEYS.map((key, i) => {
                      const h = salon.opening_hours[key];
                      const label = locale === "de" ? DAYS_DE[i] : DAYS_EN[i];
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-dark/50">{label}</span>
                          <span className={h ? "data-text text-dark" : "text-dark/25"}>
                            {h ? `${h.open}–${h.close}` : "Zu"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saloninfo — atmosphere, expertise, products, transport */}
              {((salon as any).atmosphere || (salon as any).expertise || (salon as any).products || (salon as any).nearest_transport) && (
                <div>
                  <h2 className="font-heading font-semibold text-base text-dark mb-3 flex items-center gap-2">
                    <Info className="w-4 h-4 text-s-coral" />Saloninfo
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(salon as any).atmosphere && (
                      <div className="flex items-start gap-2.5 p-3 rounded-card bg-gray-50">
                        <Sparkles className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-dark/40 uppercase tracking-wide">Atmosphäre</p>
                          <p className="text-sm text-dark mt-0.5">{(salon as any).atmosphere}</p>
                        </div>
                      </div>
                    )}
                    {(salon as any).expertise && (
                      <div className="flex items-start gap-2.5 p-3 rounded-card bg-gray-50">
                        <Award className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-dark/40 uppercase tracking-wide">Expertise</p>
                          <p className="text-sm text-dark mt-0.5">{(salon as any).expertise}</p>
                        </div>
                      </div>
                    )}
                    {(salon as any).products && (
                      <div className="flex items-start gap-2.5 p-3 rounded-card bg-gray-50">
                        <Droplets className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-dark/40 uppercase tracking-wide">Produkte</p>
                          <p className="text-sm text-dark mt-0.5">{(salon as any).products}</p>
                        </div>
                      </div>
                    )}
                    {(salon as any).nearest_transport && (
                      <div className="flex items-start gap-2.5 p-3 rounded-card bg-gray-50">
                        <Bus className="w-4 h-4 text-s-coral shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-dark/40 uppercase tracking-wide">ÖV-Anbindung</p>
                          <p className="text-sm text-dark mt-0.5">{(salon as any).nearest_transport}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Staff / Team */}
              {salon.staff.length > 0 && (
                <div id="section-team">
                  {/* Mobile accordion header */}
                  <button
                    className="md:hidden w-full flex items-center justify-between py-3 border-b border-gray-100"
                    onClick={() => setOpenAccordion(openAccordion === "team" ? null : "team")}
                  >
                    <h2 className="font-heading font-semibold text-base text-dark">Team</h2>
                    <ChevronDown size={18} className={`text-dark/40 transition-transform ${openAccordion === "team" ? "rotate-180" : ""}`} />
                  </button>
                  <h2 className="hidden md:block font-heading font-semibold text-base text-dark mb-3">Team</h2>

                  <div className={`${openAccordion === "team" || typeof window !== "undefined" && window.innerWidth >= 768 ? "" : "hidden md:block"}`}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 md:mt-0">
                      {salon.staff.map((m) => (
                        <StaffPortfolio
                          key={m.id}
                          member={m}
                          salonSlug={slug}
                          onBook={(staffId) => { setSelectedStaff(staffId); setCalendarOpen(true); }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Services / Angebot */}
              {salon.services.length > 0 && (
                <div id="section-angebot">
                  {/* Mobile accordion header */}
                  <button
                    className="md:hidden w-full flex items-center justify-between py-3 border-b border-gray-100"
                    onClick={() => setOpenAccordion(openAccordion === "angebot" ? null : "angebot")}
                  >
                    <h2 className="font-heading font-semibold text-base text-dark">Angebot</h2>
                    <ChevronDown size={18} className={`text-dark/40 transition-transform ${openAccordion === "angebot" ? "rotate-180" : ""}`} />
                  </button>
                  <h2 className="hidden md:block font-heading font-semibold text-base text-dark mb-3">Leistungen</h2>

                  <div className={`${openAccordion === "angebot" ? "" : "hidden md:block"}`}>
                    {Object.entries(servicesByCategory).map(([cat, svcs]) => (
                      <div key={cat} className="mb-4 mt-3 md:mt-0">
                        <p className="text-xs font-medium text-dark/40 uppercase tracking-wide mb-2 capitalize">{cat}</p>
                        <div className="divide-y divide-gray-50">
                          {svcs.map((svc) => (
                            <button key={svc.id}
                              onClick={() => { setSelectedService(svc.id); setCalendarOpen(true); }}
                              className={`w-full flex items-center justify-between py-3 px-2 rounded text-left hover:bg-gray-50 transition-colors ${selectedService === svc.id ? "bg-s-coral/5" : ""}`}
                            >
                              <div className="flex items-center gap-2">
                                <div>
                                  <p className="text-sm font-medium text-dark">
                                    {locale === "de" ? svc.name_de : svc.name_en}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="flex items-center gap-1 text-xs text-dark/40">
                                      <Clock size={10} /> {svc.duration_minutes} Min.
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 shrink-0 ml-4">
                                <span className="data-text font-semibold text-sm text-dark">CHF {svc.price}</span>
                                <span className="text-xs text-s-coral font-medium hidden sm:inline">Buchen</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews / Bewertungen */}
              <div id="section-bewertungen">
                {/* Mobile accordion header */}
                <button
                  className="md:hidden w-full flex items-center justify-between py-3 border-b border-gray-100"
                  onClick={() => setOpenAccordion(openAccordion === "bewertungen" ? null : "bewertungen")}
                >
                  <h2 className="font-heading font-semibold text-base text-dark">Bewertungen</h2>
                  <ChevronDown size={18} className={`text-dark/40 transition-transform ${openAccordion === "bewertungen" ? "rotate-180" : ""}`} />
                </button>
                <h2 className="hidden md:block font-heading font-semibold text-base text-dark mb-4">Bewertungen</h2>
                <div className={`${openAccordion === "bewertungen" ? "" : "hidden md:block"} mt-3 md:mt-0`}>
                {salon.reviews.length === 0 ? (
                  <p className="text-sm text-dark/40">Noch keine Bewertungen.</p>
                ) : (
                  <>
                    <ReviewBreakdown
                      reviews={salon.reviews}
                      averageRating={salon.average_rating}
                      reviewCount={salon.review_count}
                      onReviewCountClick={scrollToReviews}
                    />

                    {/* Review sort */}
                    <div className="flex items-center gap-2 mt-4 mb-4">
                      <span className="text-xs text-dark/40">Sortieren:</span>
                      {(["newest", "highest", "lowest"] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => { setReviewSort(s); setReviewPage(1); }}
                          className={`px-2.5 py-1 rounded-pill text-xs font-medium transition-colors ${
                            reviewSort === s
                              ? "bg-s-coral/10 text-s-coral"
                              : "text-dark/50 hover:text-dark"
                          }`}
                        >
                          {s === "newest" ? "Neueste" : s === "highest" ? "Beste" : "Schlechteste"}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-4">
                      {reviewsVisible.map((rev) => (
                        <div key={rev.id} className="border border-gray-100 rounded-card p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center text-xs text-dark/40">
                                {rev.profiles?.avatar_url
                                  ? <Image src={rev.profiles.avatar_url} alt="" width={28} height={28} className="object-cover" />
                                  : (rev.profiles?.display_name?.[0] ?? "?")}
                              </div>
                              <span className="text-sm font-medium text-dark">{rev.profiles?.display_name ?? "Anonym"}</span>
                              {(rev as any).booking_id && (
                                <span className="flex items-center gap-0.5 text-xs text-emerald-600">
                                  <ShieldCheck className="w-3 h-3" />Verifiziert
                                </span>
                              )}
                            </div>
                            <Stars rating={rev.rating} size="sm" />
                          </div>
                          {rev.comment && <p className="text-sm text-dark/70 leading-relaxed">{rev.comment}</p>}
                          {/* Review photos */}
                          {rev.review_photos && rev.review_photos.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {rev.review_photos.map((photo) => (
                                <button
                                  key={photo.id}
                                  onClick={() => setLightboxPhoto(photo.photo_url)}
                                  className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 hover:opacity-80 transition-opacity"
                                  aria-label="Foto vergrössern"
                                >
                                  <Image src={photo.photo_url} alt="Review Foto" fill className="object-cover" sizes="64px" />
                                </button>
                              ))}
                            </div>
                          )}
                          {/* Review reply badge */}
                          {(rev as any).review_replies?.length > 0 && (rev as any).review_replies[0].is_public && (
                            <div className="mt-3 pl-4 border-l-2 border-s-coral/30">
                              <p className="text-xs text-s-coral font-medium flex items-center gap-1 mb-1">
                                <ShieldCheck className="w-3 h-3" />Salon hat geantwortet
                              </p>
                              <p className="text-xs text-dark/60">{(rev as any).review_replies[0].reply_text}</p>
                            </div>
                          )}
                          <p className="text-xs text-dark/30 mt-2">
                            {new Date(rev.created_at).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB")}
                          </p>
                        </div>
                      ))}
                    </div>
                    {salon.reviews.length > reviewsVisible.length && (
                      <button onClick={() => setReviewPage((p) => p + 1)}
                        className="mt-4 w-full py-2.5 border border-gray-200 rounded-button text-sm text-dark/60 hover:border-s-coral transition-colors">
                        Mehr Bewertungen
                      </button>
                    )}
                  </>
                )}
                </div>
              </div>

              {/* Standort / Mini Map */}
              {salon.latitude && salon.longitude && (
                <div id="section-standort">
                  <h2 className="font-heading font-semibold text-base text-dark mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-s-coral" />Standort
                  </h2>
                  <div className="h-48 rounded-card overflow-hidden">
                    <MapView salons={[mapSalon]} />
                  </div>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(salon.address + " Basel")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-sm text-s-coral hover:underline">
                    Route anzeigen <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Nearby salons — lazy loaded */}
              <NearbySalons salonSlug={slug} />
            </div>

            {/* ── Right: sticky booking sidebar (desktop only) */}
            <div className="hidden lg:block lg:col-span-1">
              <div className="lg:sticky lg:top-24">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-card">
                  {!calendarOpen ? (
                    <div className="flex flex-col gap-3">
                      <p className="font-heading font-semibold text-dark text-center">Termin buchen</p>
                      {salon.services.length > 0 && (
                        <p className="text-xs text-dark/50 text-center font-body">
                          ab CHF {Math.min(...salon.services.map((s) => s.price))}
                        </p>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setCalendarOpen(true)}
                        className="w-full py-4 rounded-card bg-s-coral text-white font-body font-semibold text-base hover:bg-s-coral-dark transition-colors shadow-warm-md"
                      >
                        Jetzt buchen
                      </motion.button>
                    </div>
                  ) : (
                    <BookingCalendar
                      salonId={salon.id}
                      serviceId={selectedService}
                      staffMemberId={selectedStaff}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile sticky CTA */}
        <div className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setMobileSheetOpen(true)}
            className="w-full py-3.5 rounded-card bg-s-coral text-white font-body font-semibold text-base shadow-warm-md flex items-center justify-center gap-2"
          >
            <span>Termin buchen</span>
            {salon.services.length > 0 && (
              <span className="text-white/80 data-text text-sm">
                — ab CHF {Math.min(...salon.services.map((s) => s.price))}
              </span>
            )}
          </motion.button>
        </div>

        {/* Mobile bottom sheet */}
        <BottomSheet isOpen={mobileSheetOpen} onClose={() => setMobileSheetOpen(false)} title="Termin buchen">
          <BookingCalendar
            salonId={salon.id}
            serviceId={selectedService}
            staffMemberId={selectedStaff}
          />
        </BottomSheet>

        {/* Photo lightbox */}
        <AnimatePresence>
          {lightboxPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/80 backdrop-blur-sm p-4"
              onClick={() => setLightboxPhoto(null)}
            >
              <button
                onClick={() => setLightboxPhoto(null)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                aria-label="Foto schliessen"
              >
                <X size={20} />
              </button>
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="relative max-w-3xl max-h-[80vh] w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <Image
                  src={lightboxPhoto}
                  alt="Review Foto"
                  width={1200}
                  height={800}
                  className="rounded-xl object-contain w-full h-auto max-h-[80vh]"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
