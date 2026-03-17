"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  Star, MapPin, Phone, Instagram, Clock, ChevronRight, ChevronLeft,
  Scissors, User, Sparkles, Waves, Palette, Zap, X
} from "lucide-react";
import BookingCalendar from "@/components/BookingCalendar";
import Spinner from "@/components/ui/Spinner";
import { motion, AnimatePresence } from "framer-motion";
import type { Salon, Service, StaffMember, Review, SalonCard, SalonCategory } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

// ─────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────

interface SalonDetail extends Salon {
  services: Service[];
  staff: StaffMember[];
  reviews: (Review & { profiles?: { display_name: string; avatar_url: string | null } })[];
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
        <Star key={i} className={[sz, i <= rounded ? "fill-coral text-coral" : "text-gray-200"].join(" ")} />
      ))}
    </span>
  );
}

/** Mobile bottom sheet for booking */
function BookingBottomSheet({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            className="absolute inset-0 bg-dark/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="absolute bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-glass-hover overscroll-contain max-h-[90vh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            <div className="flex items-center justify-between px-6 pb-3">
              <h3 className="font-heading font-semibold text-dark">Termin buchen</h3>
              <button onClick={onClose} className="p-1.5 rounded-full text-dark/40 hover:text-dark hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-4 pb-8">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/salons/${slug}`)
      .then((r) => r.json())
      .then((d) => { setSalon(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  // Track page view — fire-and-forget, once per salon load
  useEffect(() => {
    if (!salon?.id) return;
    fetch("/api/analytics/track-view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salon.id, source: "direct" }),
    }).catch(() => {});
  }, [salon?.id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  }

  if (!salon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-dark/40">
        <p className="font-heading text-2xl font-semibold">Salon nicht gefunden</p>
        <Link href={`/${locale}/coiffeur`} className="text-sm text-teal hover:underline">Alle Salons</Link>
      </div>
    );
  }

  const photos = [salon.cover_photo_url, ...(salon.gallery_urls ?? [])].filter(Boolean) as string[];
  const reviewsVisible = salon.reviews.slice(0, reviewPage * 5);
  const servicesByCategory = salon.services.reduce<Record<string, Service[]>>((acc, s) => {
    (acc[s.category] = acc[s.category] ?? []).push(s);
    return acc;
  }, {});
  const ratingBreakdown = [5, 4, 3, 2, 1].map((r) => ({
    r, count: salon.reviews.filter((rev) => Math.round(rev.rating) === r).length,
  }));

  // Build a SalonCard-compatible object for MapView
  const mapSalon: SalonCard = { ...salon };

  return (
    <>
      <JsonLd salon={salon} />
      <div className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-2 text-xs text-dark/40">
          <Link href={`/${locale}`} className="hover:text-teal">Home</Link>
          <ChevronRight className="inline w-3 h-3 mx-1" />
          {salon.categories[0] && (
            <>
              <Link href={`/${locale}/${salon.categories[0]}`} className="capitalize hover:text-teal">{salon.categories[0]}</Link>
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
                <h1 className="font-heading font-bold text-2xl sm:text-3xl text-dark">{salon.name}</h1>
                <div className="flex flex-wrap gap-2 mt-2">
                  {salon.categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat];
                    return (
                      <span key={cat} className="flex items-center gap-1 px-2.5 py-1 rounded-pill bg-teal/10 text-teal text-xs font-medium capitalize">
                        <Icon className="w-3 h-3" />{cat}
                      </span>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <div className="flex items-center gap-1.5">
                    <Stars rating={salon.average_rating} />
                    <span className="font-data font-semibold text-dark text-sm">{salon.average_rating.toFixed(1)}</span>
                    <span className="text-dark/40 text-xs">({salon.review_count})</span>
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
                      className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-teal transition-colors">
                      <MapPin className="w-4 h-4" />{salon.address}
                    </a>
                  )}
                  {salon.phone && (
                    <a href={`tel:${salon.phone}`} className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-teal transition-colors">
                      <Phone className="w-4 h-4" />{salon.phone}
                    </a>
                  )}
                  {salon.instagram_url && (
                    <a href={salon.instagram_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-dark/60 hover:text-teal transition-colors">
                      <Instagram className="w-4 h-4" />Instagram
                    </a>
                  )}
                </div>
              </div>

              {/* Opening hours */}
              {Object.keys(salon.opening_hours ?? {}).length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-base text-dark mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal" />Öffnungszeiten
                  </h2>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1.5">
                    {DAY_KEYS.map((key, i) => {
                      const h = salon.opening_hours[key];
                      const label = locale === "de" ? DAYS_DE[i] : DAYS_EN[i];
                      return (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-dark/50">{label}</span>
                          <span className={h ? "font-data text-dark" : "text-dark/25"}>
                            {h ? `${h.open}–${h.close}` : "Zu"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Staff grid */}
              {salon.staff.length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-base text-dark mb-3">Team</h2>
                  <div className="flex flex-wrap gap-3">
                    {salon.staff.map((m) => (
                      <button key={m.id}
                        onClick={() => { setSelectedStaff(m.id); setCalendarOpen(true); }}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-card border transition-all duration-150 ${selectedStaff === m.id ? "border-teal bg-teal/5" : "border-gray-100 hover:border-teal/30"}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center text-xs font-medium text-dark/40">
                          {m.avatar_url
                            ? <Image src={m.avatar_url} alt={m.name} width={32} height={32} className="object-cover" />
                            : m.name[0]}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-dark">{m.name}</p>
                          {m.specialties?.length > 0 && (
                            <p className="text-xs text-dark/40 truncate max-w-[120px]">{m.specialties.slice(0, 2).join(", ")}</p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {salon.services.length > 0 && (
                <div>
                  <h2 className="font-heading font-semibold text-base text-dark mb-3">Leistungen</h2>
                  {Object.entries(servicesByCategory).map(([cat, svcs]) => (
                    <div key={cat} className="mb-4">
                      <p className="text-xs font-medium text-dark/40 uppercase tracking-wide mb-2 capitalize">{cat}</p>
                      <div className="divide-y divide-gray-50">
                        {svcs.map((svc) => (
                          <button key={svc.id}
                            onClick={() => { setSelectedService(svc.id); setCalendarOpen(true); }}
                            className={`w-full flex items-center justify-between py-3 px-2 rounded text-left hover:bg-gray-50 transition-colors ${selectedService === svc.id ? "bg-teal/5" : ""}`}
                          >
                            <div>
                              <p className="text-sm font-medium text-dark">
                                {locale === "de" ? svc.name_de : svc.name_en}
                              </p>
                              <p className="text-xs text-dark/40 mt-0.5">{svc.duration_minutes} Min.</p>
                            </div>
                            <span className="font-data font-semibold text-sm text-dark shrink-0 ml-4">ab CHF {svc.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Reviews */}
              <div>
                <h2 className="font-heading font-semibold text-base text-dark mb-4">Bewertungen</h2>
                {salon.reviews.length === 0 ? (
                  <p className="text-sm text-dark/40">Noch keine Bewertungen.</p>
                ) : (
                  <>
                    <div className="flex gap-6 items-center mb-6">
                      <div className="text-center shrink-0">
                        <p className="font-data font-bold text-4xl text-dark">{salon.average_rating.toFixed(1)}</p>
                        <Stars rating={salon.average_rating} />
                        <p className="text-xs text-dark/40 mt-1">{salon.review_count} Bewertungen</p>
                      </div>
                      <div className="flex-1 flex flex-col gap-1.5">
                        {ratingBreakdown.map(({ r, count }) => (
                          <div key={r} className="flex items-center gap-2 text-xs">
                            <span className="text-dark/40 w-2">{r}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-coral rounded-full" style={{ width: salon.review_count > 0 ? `${(count / salon.review_count) * 100}%` : "0%" }} />
                            </div>
                            <span className="text-dark/30 w-4">{count}</span>
                          </div>
                        ))}
                      </div>
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
                            </div>
                            <Stars rating={rev.rating} size="sm" />
                          </div>
                          {rev.comment && <p className="text-sm text-dark/70 leading-relaxed">{rev.comment}</p>}
                          <p className="text-xs text-dark/30 mt-2">
                            {new Date(rev.created_at).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB")}
                          </p>
                        </div>
                      ))}
                    </div>
                    {salon.reviews.length > reviewsVisible.length && (
                      <button onClick={() => setReviewPage((p) => p + 1)}
                        className="mt-4 w-full py-2.5 border border-gray-200 rounded-button text-sm text-dark/60 hover:border-teal transition-colors">
                        Mehr Bewertungen
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Mini Map */}
              {salon.latitude && salon.longitude && (
                <div>
                  <h2 className="font-heading font-semibold text-base text-dark mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-teal" />Standort
                  </h2>
                  <div className="h-48 rounded-card overflow-hidden">
                    <MapView salons={[mapSalon]} />
                  </div>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(salon.address + " Basel")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-sm text-teal hover:underline">
                    Route anzeigen <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
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
                        className="w-full py-4 rounded-card bg-coral text-white font-body font-semibold text-base hover:bg-coral-dark transition-colors shadow-coral-glow"
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
            className="w-full py-3.5 rounded-card bg-coral text-white font-body font-semibold text-base shadow-coral-glow"
          >
            Verfügbarkeit prüfen
          </motion.button>
        </div>

        {/* Mobile bottom sheet */}
        <BookingBottomSheet open={mobileSheetOpen} onClose={() => setMobileSheetOpen(false)}>
          <BookingCalendar
            salonId={salon.id}
            serviceId={selectedService}
            staffMemberId={selectedStaff}
          />
        </BookingBottomSheet>
      </div>
    </>
  );
}
