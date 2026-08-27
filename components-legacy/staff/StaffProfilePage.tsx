"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Share, Star, X, ArrowLeft, Instagram, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Avatar, RatingStars, SeeAllButton } from "@/app/[locale]/_components/primitives";
import { formatReviewDate } from "@/app/[locale]/_components/salon/_shared";
import Spinner from "@/components-legacy/ui/Spinner";
import StaffReviewsSheet from "@/components-legacy/staff/StaffReviewsSheet";
import { formatCurrency } from "@/lib/format-currency";
import { shareOrCopy } from "@/lib/share";
import { localizedField } from "@/lib/i18n/localized-field";

interface StaffProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[] | null;
  languages: string[] | null;
  bio: string | null;
  instagram_url: string | null;
  years_experience: number | null;
  average_rating: number;
  review_count: number;
  appointments_completed: number | null;
  clients_served: number | null;
  salon_name: string;
  salon_slug: string;
}
interface PortfolioImage { id: string; image_url: string; sort_order: number }
interface StaffService { id: string; name_de: string; name_en: string; duration_minutes: number; price: number }
interface StaffReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
  review_photos: { id: string; photo_url: string }[];
}

const LANG: Record<string, string> = {
  de: "Deutsch", en: "English", fr: "Français", it: "Italiano",
  es: "Español", uk: "Українська", pt: "Português", ru: "Русский",
};
type Tab = "about" | "services" | "portfolio" | "reviews";
const TAB_LABEL: Record<Tab, string> = {
  about: "Über", services: "Leistungen", portfolio: "Portfolio", reviews: "Bewertungen",
};
const SERVICES_PREVIEW = 4;
const REVIEWS_PREVIEW = 3;
const PORTFOLIO_PREVIEW = 9;

/**
 * StaffProfilePage — Fresha individual-stylist profile (IMG_4885–4892):
 * centered hero, stat row, scroll-spy tabs (Über / Verfügbarkeit / Leistungen /
 * Portfolio / Bewertungen), services + "Alle ansehen", portfolio grid + lightbox,
 * reviews + "Alle ansehen". Solen black/Geist · gold ★ · blue review count.
 *
 * Context-aware CTA:
 *   - `onSelect` set (opened from the booking staff-list) → "Auswählen" (pick).
 *   - else → "Termin buchen" (→ booking with this stylist preselected).
 * `onClose` → renders as a closeable sheet (X); else a back-link page.
 */
export default function StaffProfilePage({
  staffId,
  salonSlug,
  onClose,
  onSelect,
}: {
  staffId: string;
  salonSlug: string;
  onClose?: () => void;
  onSelect?: (staffId: string) => void;
}) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  // Back goes BACK in history (the old <Link> PUSHED the salon page, so the
  // salon's back returned here — endless ping-pong, owner 2026-06-12).
  // Deep links (fresh tab, no history) still land on the salon page.
  const handleBack = () => {
    if (window.history.length > 1) router.back();
    else router.push(`/${locale}/salon/${salonSlug}`);
  };
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [services, setServices] = useState<StaffService[]>([]);
  const [reviews, setReviews] = useState<StaffReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Tab>("about");
  const [condensed, setCondensed] = useState(false);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showReviews, setShowReviews] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const heroRef = useRef<HTMLDivElement | null>(null);
  const sectionRefs = useRef<Partial<Record<Tab, HTMLElement | null>>>({});
  const navLock = useRef(false); // suppresses scroll-spy while an explicit tap scrolls
  const navTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/staff/${staffId}/profile`);
        if (res.ok) {
          const d = await res.json();
          if (!active) return;
          setStaff(d.staff);
          setPortfolio(d.portfolio ?? []);
          setServices(d.services ?? []);
          setReviews(d.reviews ?? []);
        }
      } catch (err) {
        console.error("[StaffProfilePage] fetch failed:", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [staffId]);

  const tabs: Tab[] = [
    "about",
    ...(services.length > 0 ? (["services"] as Tab[]) : []),
    "portfolio",
    "reviews",
  ];

  // Scroll-spy + condensed-header — IntersectionObserver works whether the page
  // scrolls in the window (standalone route) or inside the booking sheet.
  useEffect(() => {
    if (loading) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (navLock.current) return;
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) {
          const t = (vis[0].target as HTMLElement).dataset.tab as Tab | undefined;
          if (t) setActive(t);
        }
      },
      { rootMargin: "-118px 0px -74% 0px", threshold: 0 }
    );
    tabs.forEach((t) => {
      const el = sectionRefs.current[t];
      if (el) io.observe(el);
    });
    const heroIo = new IntersectionObserver(
      ([e]) => setCondensed(!e.isIntersecting),
      { rootMargin: "-64px 0px 0px 0px", threshold: 0 }
    );
    if (heroRef.current) heroIo.observe(heroRef.current);
    return () => {
      io.disconnect();
      heroIo.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, tabs.join("|")]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-white">
        <Spinner />
      </div>
    );
  }
  if (!staff) {
    return (
      <div className="grid min-h-[60vh] place-items-center bg-white px-6 text-center">
        <p className="text-[15px] text-s-ink-2">Profil nicht gefunden.</p>
      </div>
    );
  }

  const langRole = [
    staff.languages?.map((l) => l.toUpperCase()).join("/"),
    staff.specialties?.[0],
  ]
    .filter(Boolean)
    .join("  ");
  const bookHref = `/${locale}/salon/${salonSlug}/booking?staff=${staff.id}`;
  const sName = (s: StaffService) => localizedField(s as unknown as Record<string, unknown>, "name", locale);
  const fmtDate = (iso: string) => formatReviewDate(iso, locale);

  const goTo = (t: Tab) => {
    navLock.current = true;
    setActive(t);
    sectionRefs.current[t]?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (navTimer.current) window.clearTimeout(navTimer.current);
    navTimer.current = window.setTimeout(() => {
      navLock.current = false;
    }, 800);
  };
  const visibleServices = showAllServices ? services : services.slice(0, SERVICES_PREVIEW);
  const visibleReviews = reviews.slice(0, REVIEWS_PREVIEW);
  const portfolioShown = portfolio.slice(0, PORTFOLIO_PREVIEW);
  const portfolioOverflow = portfolio.length - PORTFOLIO_PREVIEW;

  const setRef = (t: Tab) => (el: HTMLElement | null) => {
    sectionRefs.current[t] = el;
  };

  return (
    <div className="flex min-h-screen flex-col bg-white pb-24">
      {/* Top bar — back (left) + name on scroll */}
      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-s-border bg-white px-3 py-2.5">
        {onClose ? (
          <button type="button" onClick={onClose} aria-label={t("close")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-s-bg-sunken">
            <X size={20} strokeWidth={2.2} className="text-s-ink" />
          </button>
        ) : (
          <button type="button" onClick={handleBack} aria-label={t("back")} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-s-bg-sunken">
            <ArrowLeft size={20} strokeWidth={2.2} className="text-s-ink" />
          </button>
        )}
        <div className={`flex min-w-0 items-center gap-2 transition-opacity duration-200 ${condensed ? "opacity-100" : "opacity-0"}`}>
          <span className="grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-full bg-s-bg-sunken">
            {staff.avatar_url ? (
              <Image src={staff.avatar_url} alt="" width={28} height={28} className="h-full w-full object-cover" />
            ) : (
              <span className="text-[12px] font-semibold text-s-ink-2">{staff.name.charAt(0)}</span>
            )}
          </span>
          <span className="truncate font-heading text-[15px] font-semibold text-s-ink">{staff.name}</span>
        </div>
        {/* Mockup 18 (approved 2026-06-11): share, native share with clipboard fallback */}
        <button
          type="button"
          aria-label="Teilen"
          onClick={() => shareOrCopy(staff.name, window.location.href)}
          className="ml-auto grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-s-bg-sunken"
        >
          <Share size={18} strokeWidth={1.9} className="text-s-ink" />
        </button>
      </div>

      {/* Centered hero */}
      <div ref={heroRef} className="flex flex-col items-center px-5 pt-6 text-center">
        <Avatar src={staff.avatar_url} name={staff.name} size={104} />
        <h1 className="mt-3 font-heading text-[24px] font-bold leading-tight tracking-[-0.01em] text-s-ink">{staff.name}</h1>
        {langRole && <p className="mt-1 text-[14px] text-s-ink-2">{langRole}</p>}
        <div className="mt-2 flex items-center gap-3">
          {staff.average_rating > 0 && (
            <button type="button" onClick={() => goTo("reviews")} className="inline-flex items-center gap-1 text-[14px] transition-opacity hover:opacity-80" aria-label={`${staff.review_count} Bewertungen ansehen`}>
              <RatingStars value={staff.average_rating} size="lg" className="font-semibold text-s-ink" />
              <span className="text-s-accent underline-offset-2 hover:underline">({staff.review_count})</span>
            </button>
          )}
          {staff.instagram_url && (
            <a href={staff.instagram_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[14px] text-s-ink-2 transition-colors hover:text-s-accent">
              <Instagram size={14} strokeWidth={1.6} />
              Instagram
            </a>
          )}
        </div>
        {/* Mockup 18: Fresha stats row — only rendered with REAL data, never fabricated */}
        {staff.appointments_completed != null && staff.appointments_completed > 0 && (
          <div className="mt-4 w-full max-w-[340px]">
            <div className="flex items-center justify-between border-t border-s-border/70 py-2.5 text-[14px]">
              <span className="font-semibold text-s-ink">Abgeschlossene Termine</span>
              <span className="tabular-nums text-s-ink-2">{staff.appointments_completed}</span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky tabs */}
      <div className="sticky top-[53px] z-10 mt-5 border-b border-s-border bg-white px-4 pb-2.5 pt-1">
        <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => {
            const on = t === active;
            const count = t === "portfolio" ? portfolio.length : t === "reviews" ? staff.review_count : 0;
            return (
              <button
                key={t}
                type="button"
                onClick={() => goTo(t)}
                className={`shrink-0 rounded-full px-4 py-2 font-heading text-[13px] font-semibold transition-colors ${
                  // mockup-ok: locked selected-state contract (CLAUDE.md design contract, gate no-black-selected), gray sunken, never ink fill
                  on ? "bg-s-bg-sunken text-s-ink font-semibold border border-s-border" : "border border-s-border text-s-ink hover:border-s-ink/25"
                }`}
              >
                {TAB_LABEL[t]}
                {count > 0 && <span className={on ? "text-white/70" : "text-s-ink/45"}> {count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* About */}
      <section ref={setRef("about")} data-tab="about" className="scroll-mt-[112px] px-5 pt-6">
        {(staff.appointments_completed || staff.clients_served) ? (
          <div className="mb-6 divide-y divide-s-ink/[0.06] rounded-input border border-s-border">
            {staff.appointments_completed ? (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[14px] text-s-ink-2">Abgeschlossene Termine</span>
                <span className="font-body text-[15px] font-semibold text-s-ink tabular-nums">{staff.appointments_completed}</span>
              </div>
            ) : null}
            {staff.clients_served ? (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[14px] text-s-ink-2">Betreute Kund:innen</span>
                <span className="font-body text-[15px] font-semibold text-s-ink tabular-nums">{staff.clients_served}</span>
              </div>
            ) : null}
          </div>
        ) : null}
        {staff.bio && <p className="text-[15px] leading-relaxed text-s-ink/75">{staff.bio}</p>}
        {staff.years_experience != null && staff.years_experience > 0 && (
          <p className="mt-4 text-[14px] text-s-ink-2">{staff.years_experience} Jahre Erfahrung</p>
        )}
        {staff.languages && staff.languages.length > 0 && (
          <div className="mt-6">
            <p className="mb-2.5 font-heading text-[16px] font-bold text-s-ink">Sprachen</p>
            <div className="flex flex-wrap gap-2">
              {staff.languages.map((l) => (
                <span key={l} className="rounded-full bg-s-bg-sunken px-3.5 py-1.5 text-[13px] font-medium text-s-ink">
                  {LANG[l] ?? l.toUpperCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* No Verfügbarkeit section — owner picked A2 (2026-06-11, council round):
          pure Fresha employee-profile anatomy; availability lives in the booking
          date picker, not on the profile. */}

      {/* Leistungen */}
      {services.length > 0 && (
        <section ref={setRef("services")} data-tab="services" className="scroll-mt-[112px] px-5 pt-9">
          <p className="mb-4 font-heading text-[18px] font-bold text-s-ink">Leistungen</p>
          {/* Atelier grouped card (owner 2026-06-11): rows + dividers in one card */}
          <div className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
            {visibleServices.map((s) => (
              <div key={s.id} className="flex items-center justify-between gap-3 border-t border-s-border px-5 py-[18px] first:border-t-0">
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-s-ink">{sName(s)}</div>
                  <div className="mt-1 text-[13px] text-s-ink-2 tabular-nums">
                    {s.duration_minutes} Min {formatCurrency(s.price, locale)}
                  </div>
                </div>
                <Link href={`${bookHref}&service=${s.id}`} className="shrink-0 rounded-full border border-s-border px-5 py-2.5 font-heading text-[14px] font-semibold text-s-ink transition-colors hover:border-s-ink/30">
                  Buchen
                </Link>
              </div>
            ))}
          </div>
          {services.length > SERVICES_PREVIEW && (
            <button
              type="button"
              onClick={() => setShowAllServices((v) => !v)}
              className="mt-3 w-full rounded-full border border-s-border py-3 font-heading text-[14px] font-semibold text-s-ink transition-colors hover:border-s-ink/25"
            >
              {showAllServices ? "Weniger anzeigen" : `Alle ${services.length} Leistungen ansehen`}
            </button>
          )}
        </section>
      )}

      {/* Portfolio */}
      <section ref={setRef("portfolio")} data-tab="portfolio" className="scroll-mt-[112px] px-5 pt-9">
        <p className="mb-4 font-heading text-[18px] font-bold text-s-ink">
          Portfolio{portfolio.length > 0 && <span className="text-s-ink/45"> {portfolio.length}</span>}
        </p>
        {portfolio.length === 0 ? (
          <p className="py-2 text-[14px] italic text-s-ink-2">Noch kein Portfolio vorhanden.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {portfolioShown.map((img, i) => {
              const isLast = i === PORTFOLIO_PREVIEW - 1 && portfolioOverflow > 0;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="relative aspect-square overflow-hidden rounded-input transition-[filter] duration-150 hover:brightness-[0.95]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image_url} alt="" loading="lazy" className="h-full w-full object-cover" />
                  {isLast && (
                    <span className="absolute inset-0 grid place-items-center bg-s-ink/55 font-heading text-[18px] font-bold text-white">
                      +{portfolioOverflow + 1}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Bewertungen */}
      <section ref={setRef("reviews")} data-tab="reviews" className="scroll-mt-[112px] px-5 pb-2 pt-9">
        <p className="mb-4 font-heading text-[18px] font-bold text-s-ink">Bewertungen</p>
        <div className="mb-6 flex items-baseline gap-2.5">
          <div className="flex items-center gap-0.5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={18} strokeWidth={1.9} stroke="none" className={i < Math.floor(staff.average_rating) ? "fill-s-star" : "fill-s-border"} />
            ))}
          </div>
          <span className="font-body text-[18px] font-semibold tabular-nums text-s-ink">{staff.average_rating.toFixed(1)}</span>
          <span className="text-[14px] text-s-accent">({staff.review_count})</span>
        </div>
        {reviews.length === 0 ? (
          <p className="text-[14px] italic text-s-ink-2">Noch keine Bewertungen.</p>
        ) : (
          <>
            <div className="space-y-7">
              {visibleReviews.map((r) => {
                const who = r.profiles?.display_name ?? "Solen-Kund:in";
                return (
                  <article key={r.id}>
                    <div className="flex items-center gap-2.5">
                      <Avatar src={r.profiles?.avatar_url} name={who} size={40} />
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-s-ink">{who}</div>
                        <div className="text-[12px] text-s-ink-2">{fmtDate(r.created_at)}</div>
                      </div>
                    </div>
                    <RatingStars value={r.rating} mode="five" size="md" className="mt-2.5" />
                    {r.comment && <p className="mt-2.5 text-[14px] leading-relaxed text-s-ink-2">{r.comment}</p>}
                  </article>
                );
              })}
            </div>
            {reviews.length > REVIEWS_PREVIEW && (
              // CTA ladder (2026-07-24): pill-outline retired, this see-all now uses the
              // default "pill" (gray sunken) treatment, centred under the list like every
              // other see-all (SalonServices.tsx is the same centering pattern).
              <div className="mt-6 flex justify-center">
                <SeeAllButton label="Alle ansehen" onClick={() => setShowReviews(true)} />
              </div>
            )}
          </>
        )}
      </section>

      {/* Portfolio lightbox */}
      {lightboxIndex !== null && portfolio[lightboxIndex] && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-s-ink/80 backdrop-blur-sm" onClick={() => setLightboxIndex(null)}>
          <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxIndex(null); }} aria-label={t("closeOverlay")} className="absolute right-4 top-4 text-white/80 hover:text-white">
            <X size={24} strokeWidth={2.4} />
          </button>
          {lightboxIndex > 0 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }} aria-label={t("back")} className="absolute left-4 text-white/80 hover:text-white">
              <ChevronLeft size={32} />
            </button>
          )}
          {lightboxIndex < portfolio.length - 1 && (
            <button type="button" onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }} aria-label={t("next")} className="absolute right-4 text-white/80 hover:text-white">
              <ChevronRight size={32} />
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={portfolio[lightboxIndex].image_url} alt="" className="max-h-[90vh] max-w-[90vw] rounded-[12px] object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      {/* Full reviews sheet (Filtern nach + sort + all) */}
      {showReviews && (
        <StaffReviewsSheet
          reviews={reviews}
          averageRating={staff.average_rating}
          reviewCount={staff.review_count}
          locale={locale}
          onClose={() => setShowReviews(false)}
        />
      )}

      {/* CTA - Auswählen (selection mode) or Termin buchen */}
      <div className={`${onClose ? "sticky" : "fixed"} bottom-0 left-0 right-0 z-20 border-t border-s-border bg-white px-4 py-3`}>
        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(staff.id)}
            className="flex w-full items-center justify-center gap-2 rounded-btn bg-s-ink py-3.5 font-heading text-[15px] font-semibold text-white transition-[filter] hover:brightness-[1.06]"
          >
            <Check size={18} strokeWidth={1.9} />
            Auswählen
          </button>
        ) : (
          <Link
            href={bookHref}
            className="flex w-full items-center justify-center rounded-btn bg-s-ink py-3.5 font-heading text-[15px] font-semibold text-white transition-[filter] hover:brightness-[1.06]"
          >
            Termin buchen
          </Link>
        )}
      </div>
    </div>
  );
}
