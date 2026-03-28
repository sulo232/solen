"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { Star, ArrowLeft, Clock, Instagram, ChevronLeft, ChevronRight, X } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import StaffAvailability from "@/components/staff/StaffAvailability";
import { formatCurrency } from "@/lib/format-currency";

interface StaffProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[];
  bio: string | null;
  instagram_url: string | null;
  years_experience: number | null;
  average_rating: number;
  review_count: number;
  salon_name: string;
  salon_slug: string;
  salon_categories: string[];
}

interface PortfolioImage {
  id: string;
  image_url: string;
  sort_order: number;
}

interface StaffService {
  id: string;
  name_de: string;
  name_en: string;
  duration_minutes: number;
  price: number;
}

interface StaffReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
  review_photos: { id: string; photo_url: string }[];
}

interface StaffProfilePageProps {
  staffId: string;
  salonSlug: string;
}

export default function StaffProfilePage({ staffId, salonSlug }: StaffProfilePageProps) {
  const locale = useLocale();
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [services, setServices] = useState<StaffService[]>([]);
  const [reviews, setReviews] = useState<StaffReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/staff/${staffId}/profile`);
        if (res.ok) {
          const data = await res.json();
          setStaff(data.staff);
          setPortfolio(data.portfolio);
          setServices(data.services);
          setReviews(data.reviews);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [staffId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <p className="text-s-ink/50 dark:text-s-dm-text/50">Mitarbeiter nicht gefunden</p>
        <Link
          href={`/${locale}/salon/${salonSlug}`}
          className="text-s-coral hover:underline text-sm"
        >
          Zurück zum Salon
        </Link>
      </div>
    );
  }

  const serviceName = (s: StaffService) => (locale === "de" ? s.name_de : s.name_en) || s.name_de;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        href={`/${locale}/salon/${salonSlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-coral transition-colors mb-6"
      >
        <ArrowLeft size={16} />
        Zurück zum Salon
      </Link>

      {/* Hero card */}
      <div className="rounded-[12px] border border-s-ink/5 dark:border-white/5 p-6 bg-white dark:bg-s-dm-surface shadow-warm-md mb-8">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-s-bg-sunken dark:bg-s-dm-bg overflow-hidden shrink-0 flex items-center justify-center">
            {staff.avatar_url ? (
              <Image
                src={staff.avatar_url}
                alt={staff.name}
                width={96}
                height={96}
                priority
                sizes="96px"
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="data-text text-3xl font-bold text-s-ink/20 dark:text-s-dm-text/20">
                {staff.name[0]}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">
              {staff.name}
            </h1>

            {/* Specialties pills */}
            {staff.specialties?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {staff.specialties.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 rounded-pill bg-s-coral-subtle text-s-coral-text text-xs font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Rating + experience */}
            <div className="flex items-center gap-4 mt-2">
              {staff.average_rating > 0 && (
                <span className="flex items-center gap-1 text-sm text-s-ink/70 dark:text-s-dm-text/70">
                  <Star size={14} className="fill-s-coral text-s-coral" />
                  <span className="data-text">{staff.average_rating.toFixed(1)}</span>
                  {staff.review_count > 0 && (
                    <span className="text-s-ink/40 dark:text-s-dm-text/40">
                      ({staff.review_count})
                    </span>
                  )}
                </span>
              )}
              {staff.years_experience != null && (
                <span className="text-sm text-s-ink/60 dark:text-s-dm-text/60">
                  {staff.years_experience} {staff.years_experience === 1 ? "Jahr" : "Jahre"} Erfahrung
                </span>
              )}
            </div>

            {/* Instagram */}
            {staff.instagram_url && (
              <a
                href={staff.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral transition-colors mt-1"
              >
                <Instagram size={14} />
                Instagram
              </a>
            )}
          </div>
        </div>

        {/* Bio */}
        {staff.bio && (
          <p className="mt-4 text-[15px] text-s-ink/70 dark:text-s-dm-text/70 leading-relaxed">
            {staff.bio}
          </p>
        )}
      </div>

      {/* Portfolio gallery */}
      {portfolio.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-4">
            Portfolio
          </h2>
          <div className="grid grid-cols-3 gap-1.5 rounded-[12px] overflow-hidden">
            {portfolio.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setLightboxIndex(i)}
                className="aspect-square bg-s-bg-sunken dark:bg-s-dm-bg overflow-hidden hover:opacity-90 transition-opacity"
              >
                <Image
                  src={img.image_url}
                  alt={`${staff.name} portfolio ${i + 1}`}
                  width={300}
                  height={300}
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Availability */}
      <StaffAvailability staffId={staffId} locale={locale} />

      {/* Services */}
      {services.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-4">
            Services
          </h2>
          <div className="space-y-2">
            {services.map((s) => (
              <div
                key={s.id}
                className="rounded-[12px] border border-s-ink/5 dark:border-white/5 p-4 bg-white dark:bg-s-dm-surface flex items-center justify-between"
              >
                <div>
                  <p className="font-heading font-semibold text-s-ink dark:text-s-dm-text">
                    {serviceName(s)}
                  </p>
                  <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 flex items-center gap-1 mt-0.5">
                    <Clock size={12} />
                    {s.duration_minutes} Min. · {formatCurrency(s.price, locale)}
                  </p>
                </div>
                <Link
                  href={`/${locale}/salon/${salonSlug}?staffId=${staff.id}&serviceId=${s.id}`}
                  className="px-4 py-2 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-all shadow-warm-sm"
                >
                  Buchen
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews.length > 0 && (
        <section className="mb-8">
          <h2 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-4">
            Bewertungen
          </h2>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-[12px] border border-s-ink/5 dark:border-white/5 p-4 bg-white dark:bg-s-dm-surface"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-s-bg-sunken dark:bg-s-dm-bg overflow-hidden shrink-0 flex items-center justify-center">
                    {r.profiles?.avatar_url ? (
                      <Image
                        src={r.profiles.avatar_url}
                        alt=""
                        width={32}
                        height={32}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-xs font-bold text-s-ink/20 dark:text-s-dm-text/20">
                        {r.profiles?.display_name?.[0] ?? "?"}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">
                      {r.profiles?.display_name ?? "Anonym"}
                    </p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < r.rating ? "fill-s-coral text-s-coral" : "text-s-ink/15 dark:text-s-dm-text/15"}
                        />
                      ))}
                      <span className="text-xs text-s-ink/40 dark:text-s-dm-text/40 ml-1">
                        {new Date(r.created_at).toLocaleDateString(locale)}
                      </span>
                    </div>
                  </div>
                </div>
                {r.comment && (
                  <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70 leading-relaxed">
                    {r.comment}
                  </p>
                )}
                {r.review_photos?.length > 0 && (
                  <div className="flex gap-1.5 mt-2">
                    {r.review_photos.map((p) => (
                      <Image
                        key={p.id}
                        src={p.photo_url}
                        alt=""
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-btn object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-modal bg-s-ink/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X size={24} />
          </button>
          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
              className="absolute left-4 text-white/80 hover:text-white"
            >
              <ChevronLeft size={32} />
            </button>
          )}
          {lightboxIndex < portfolio.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
              className="absolute right-4 text-white/80 hover:text-white"
            >
              <ChevronRight size={32} />
            </button>
          )}
          <Image
            src={portfolio[lightboxIndex].image_url}
            alt=""
            width={800}
            height={800}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-[12px]"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
