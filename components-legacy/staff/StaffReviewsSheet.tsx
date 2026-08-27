"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { ChevronDown, Star, Check } from "lucide-react";
import { Avatar, RatingStars } from "@/app/[locale]/_components/primitives";
import { BackButton } from "@/app/[locale]/_components/primitives/BackButton";
import { formatReviewDate } from "@/app/[locale]/_components/salon/_shared";

export interface SheetReview {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
  review_photos: { id: string; photo_url: string }[];
}

type Sort = "best" | "newest";

/**
 * StaffReviewsSheet — Fresha "Reviews" full page (IMG_4899/4900): rating summary,
 * "Filtern nach" star-breakdown bars (tap to filter), a sort control, and every
 * review. Opened from the staff profile's "Alle ansehen". Solen black/Geist —
 * bars are ink on a muted track (no Fresha purple).
 */
export default function StaffReviewsSheet({
  reviews,
  averageRating,
  reviewCount,
  locale,
  onClose,
}: {
  reviews: SheetReview[];
  averageRating: number;
  reviewCount: number;
  locale: string;
  onClose: () => void;
}) {
  const t = useTranslations("common");
  const [mounted, setMounted] = useState(false);
  const [filters, setFilters] = useState<Set<number>>(new Set());
  const [sort, setSort] = useState<Sort>("best");
  const [sortOpen, setSortOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  const counts = useMemo(() => {
    const c: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const n = Math.min(5, Math.max(1, Math.round(r.rating)));
      c[n] += 1;
    });
    return c;
  }, [reviews]);

  const shown = useMemo(() => {
    let list = filters.size
      ? reviews.filter((r) => filters.has(Math.min(5, Math.max(1, Math.round(r.rating)))))
      : reviews.slice();
    list.sort((a, b) =>
      sort === "best"
        ? b.rating - a.rating || +new Date(b.created_at) - +new Date(a.created_at)
        : +new Date(b.created_at) - +new Date(a.created_at)
    );
    return list;
  }, [reviews, filters, sort]);

  if (!mounted) return null;

  const fmtDate = (iso: string) => formatReviewDate(iso, locale);

  const toggleFilter = (n: number) =>
    setFilters((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });

  return createPortal(
    <div className="fixed inset-0 z-[75] flex flex-col bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-s-border bg-white px-4 py-3">
        {/* mockup-ok: revert/restores , same 44px white/hairline/shadow-elevation-2 circle already
            shipped 2026-08-10 (NAV CONTROLS lock) via this exact BackButton flat variant on
            SalonStickyTabNav.tsx and BookingWizard.tsx; composing the registered primitive per
            FLOORS LAW 9, no new appearance invented here. */}
        <BackButton variant="flat" label={t("back")} onClick={onClose} />
        <span className="font-heading text-[17px] font-bold text-s-ink">{t("reviews")}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-12">
        {/* Summary */}
        <div className="pt-6">
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <Star key={i} size={26} stroke="none" className={i < Math.round(averageRating) ? "fill-s-star" : "fill-s-border"} />
            ))}
          </div>
          <p className="mt-2.5 font-body text-[17px] text-s-ink">
            <span className="font-bold tabular-nums">{averageRating.toFixed(1)}</span>{" "}
            <span className="text-s-accent">({reviewCount})</span>
          </p>
        </div>

        {/* Filtern nach — star breakdown bars */}
        <div className="mt-7">
          <p className="mb-3 font-heading text-[17px] font-bold text-s-ink">Filtern nach</p>
          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((n) => {
              const c = counts[n];
              const pct = reviews.length ? Math.round((c / reviews.length) * 100) : 0;
              const on = filters.has(n);
              return (
                <button key={n} type="button" onClick={() => toggleFilter(n)} className="flex w-full items-center gap-3 text-left">
                  <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[6px] border transition-colors ${on ? "border-s-ink bg-s-ink" : "border-s-ink/25"}`}>
                    {on && <Check size={14} strokeWidth={1.6} className="text-white" />}
                  </span>
                  <span className="w-2 shrink-0 text-[14px] font-medium text-s-ink tabular-nums">{n}</span>
                  <span className="h-1 flex-1 overflow-hidden rounded-full bg-s-bg-sunken">
                    <span className="block h-full rounded-full bg-s-ink" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="w-6 shrink-0 text-right text-[14px] text-s-ink-2 tabular-nums">{c}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Count + sort */}
        <div className="mt-7 flex items-center justify-between">
          <span className="text-[14px] text-s-ink-2">{shown.length} Bewertungen</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border border-s-border px-4 py-2 font-heading text-[14px] font-semibold text-s-ink"
            >
              {sort === "best" ? "Bestbewertet" : "Neueste"}
              <ChevronDown size={15} strokeWidth={1.9} className={`transition-transform ${sortOpen ? "rotate-180" : ""}`} />
            </button>
            {sortOpen && (
              <div className="absolute right-0 z-10 mt-1.5 w-44 overflow-hidden rounded-input border border-s-border bg-white shadow-[0_8px_24px_-8px_rgba(10,10,10,0.18)]">
                {(["best", "newest"] as Sort[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setSort(s); setSortOpen(false); }}
                    className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-[14px] ${sort === s ? "font-semibold text-s-ink" : "text-s-ink-2"}`}
                  >
                    {s === "best" ? "Bestbewertet" : "Neueste"}
                    {sort === s && <Check size={15} strokeWidth={1.9} className="text-s-ink" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review cards */}
        <div className="mt-6 space-y-7">
          {shown.map((r) => {
            const who = r.profiles?.display_name ?? "Solen-Kund:in";
            return (
              <article key={r.id}>
                <div className="flex items-center gap-2.5">
                  <Avatar src={r.profiles?.avatar_url} name={who} size="md" />
                  <div className="min-w-0">
                    <div className="truncate text-[15px] font-semibold text-s-ink">{who}</div>
                    <div className="text-[12px] text-s-ink-2">{fmtDate(r.created_at)}</div>
                  </div>
                </div>
                <RatingStars value={r.rating} mode="five" size="md" className="mt-2.5" />
                {r.comment && <p className="mt-2.5 text-[14px] leading-relaxed text-s-ink-2">{r.comment}</p>}
                {r.review_photos?.length > 0 && (
                  <div className="mt-2.5 flex gap-2">
                    {r.review_photos.map((p) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={p.id} src={p.photo_url} alt="" className="h-16 w-16 rounded-input object-cover" />
                    ))}
                  </div>
                )}
              </article>
            );
          })}
          {shown.length === 0 && <p className="text-[14px] italic text-s-ink-2">{t("noReviewsForRating")}</p>}
        </div>
      </div>
    </div>,
    document.body
  );
}
