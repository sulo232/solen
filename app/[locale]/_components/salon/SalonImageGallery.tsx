"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { SalonLightbox } from "./SalonLightbox";
import type { StaffMember } from "./_shared";
import { cn } from "@/lib/utils";
import { getPortfolioCategoriesForSalon, getPortfolioCategoryLabel, PORTFOLIO_CATEGORY_ALL_LABEL, type PortfolioLocale } from "@/lib/portfolio-categories";

/**
 * SalonImageGallery: full-screen photo browser (Fresha "Image gallery" pattern,
 * 2026-06-09). Opened from the hero photo-counter + the Portfolio section. Two modes:
 *   • Salon: the salon's photos (salon_portfolio_images, categorized), full-width stacked,
 *     with category pills (fixed taxonomy, lib/portfolio-categories.ts) in the SAME filter
 *     row as the Salon/Team toggle (owner 2026-07-24/25: never a second stacked row).
 *   • Team: per-stylist sub-tabs (each with its photo count) + that stylist's grid.
 * Tapping any photo opens the shared SalonLightbox to zoom/swipe within the current
 * (possibly category-filtered) set.
 * Per-stylist photos come from staff_portfolio_images (public-read RLS); salon photos +
 * their categories come from salon_portfolio_images (public-read RLS, same pattern), both
 * fetched lazily the first time the gallery opens.
 *
 * Portaled straight to document.body (overlap-bug fix, 2026-07-23, same root
 * cause + fix as SalonLightbox.tsx): the root layout's
 * `<main id="main-content">` carries `isolation: isolate`, which trapped
 * this modal's z-[70] inside a single stacking slot, so the portaled
 * SalonStickyTabNav (fixed, z-[60], mounted outside that isolated slot)
 * always painted on top of this gallery's own header, regardless of the
 * z-index numbers. Portaling here escapes the same trap.
 */
export function SalonImageGallery({
  open,
  onClose,
  salonId,
  salonName,
  salonCategories,
  venuePhotos,
  staff,
}: {
  open: boolean;
  onClose: () => void;
  salonId: string;
  salonName: string;
  /** salon.categories, resolves which fixed taxonomy this salon's photos can carry. */
  salonCategories: string[];
  venuePhotos: string[];
  staff: StaffMember[];
}) {
  const locale = useLocale();
  const [tab, setTab] = React.useState<"salon" | "team">("salon");
  const [activeStylist, setActiveStylist] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [portfolios, setPortfolios] = React.useState<Record<string, string[]>>({});
  const [salonPhotos, setSalonPhotos] = React.useState<Array<{ url: string; category: string | null }>>([]);
  const [loaded, setLoaded] = React.useState(false);
  const [lb, setLb] = React.useState<{ open: boolean; photos: string[]; index: number }>({
    open: false,
    photos: [],
    index: 0,
  });

  // Lazy-fetch, the first time the gallery opens: per-stylist portfolios (staff_portfolio_images)
  // AND the salon's own categorized photos (salon_portfolio_images). Runs even when the salon
  // has zero staff (a staffless salon still has its own gallery + categories to load).
  React.useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    (async () => {
      const supabase = createBrowserSupabaseClient();
      try {
        if (staff.length > 0) {
          const { data, error } = await supabase
            .from("staff_portfolio_images")
            .select("staff_id, image_url, sort_order")
            .in("staff_id", staff.map((s) => s.id))
            .order("sort_order", { ascending: true });
          if (error) throw error;
          if (!cancelled) {
            const grouped: Record<string, string[]> = {};
            for (const row of data ?? []) {
              (grouped[row.staff_id as string] ??= []).push(row.image_url as string);
            }
            setPortfolios(grouped);
            setActiveStylist(staff.find((s) => (grouped[s.id]?.length ?? 0) > 0)?.id ?? null);
          }
        }
      } catch (err) {
        console.error("[SalonImageGallery] staff portfolio fetch failed:", err);
      }

      try {
        const { data, error } = await supabase
          .from("salon_portfolio_images")
          .select("image_url, category, sort_order")
          .eq("salon_id", salonId)
          .order("sort_order", { ascending: true });
        if (error) throw error;
        if (!cancelled) {
          setSalonPhotos((data ?? []).map((row) => ({ url: row.image_url as string, category: row.category as string | null })));
        }
      } catch (err) {
        console.error("[SalonImageGallery] salon portfolio fetch failed:", err);
      }

      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded, staff, salonId]);

  // Lock body scroll while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const stylistsWithPhotos = staff.filter((s) => (portfolios[s.id]?.length ?? 0) > 0);
  const teamTotal = stylistsWithPhotos.reduce((n, s) => n + (portfolios[s.id]?.length ?? 0), 0);

  // Category pills: fixed taxonomy for THIS salon's own category/categories, in the owner's
  // stated per-category order, filtered to only categories that actually have a photo (never
  // show a category with zero photos).
  const taxonomyForSalon = getPortfolioCategoriesForSalon(salonCategories);
  const categoryCounts = taxonomyForSalon
    .map((cat) => ({
      key: cat.key,
      count: salonPhotos.filter((p) => p.category === cat.key).length,
    }))
    .filter((c) => c.count > 0);

  // Fall back to the venuePhotos prop until the categorized fetch resolves (or if it comes
  // back empty), so the grid never regresses to blank while salon_portfolio_images loads.
  const salonPhotosBase = salonPhotos.length > 0 ? salonPhotos.map((p) => p.url) : venuePhotos;
  const filteredSalonPhotos =
    activeCategory === "all"
      ? salonPhotosBase
      : salonPhotos.filter((p) => p.category === activeCategory).map((p) => p.url);

  const activePhotos =
    tab === "salon" ? filteredSalonPhotos : activeStylist ? portfolios[activeStylist] ?? [] : [];

  const openLb = (photos: string[], i: number) => setLb({ open: true, photos, index: i });

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-s-border px-4 py-3">
        <button
          type="button"
          aria-label="Zurück"
          onClick={onClose}
          className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-s-ink transition-transform active:scale-95 active:duration-[80ms] active:ease-glide"
        >
          <ArrowLeft size={20} strokeWidth={2.2} aria-hidden />
        </button>
        <div className="min-w-0">
          <div className="font-display text-[16px] font-semibold leading-tight tracking-[-0.01em] text-s-ink">
            Galerie
          </div>
          <div className="truncate font-body text-[12px] text-s-ink-3">{salonName}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* mockup-ok: porting the owner-approved _overhaul/SalonImageGalleryOverhaul.tsx S4
            fix (owner 2026-07-24, "two stacked selector rows is a 'double thing'", logged
            REMOVED.md). ONE filter-pill row: Salon/Team toggle pills, then , in the SAME
            row , the stylist pills (Team tab only), all sharing the one neutral filter-pill
            grammar. Never two stacked rows or the old underline content-tab treatment. */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-s-border px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Pill active={tab === "salon"} onClick={() => setTab("salon")}>
            Salon ({venuePhotos.length})
          </Pill>
          {teamTotal > 0 && (
            <Pill active={tab === "team"} onClick={() => setTab("team")}>
              Team ({teamTotal})
            </Pill>
          )}

          {tab === "team" && stylistsWithPhotos.length > 0 && (
            <>
              <span className="mx-1 h-5 w-px shrink-0 bg-s-border" aria-hidden />
              {stylistsWithPhotos.map((s) => (
                <Pill key={s.id} active={activeStylist === s.id} onClick={() => setActiveStylist(s.id)}>
                  {s.name} ({portfolios[s.id]?.length ?? 0})
                </Pill>
              ))}
            </>
          )}

          {/* Category pills, SAME row (owner 2026-07-24: never a second stacked row). Alle +
              only categories that actually have a photo, in the taxonomy's declared order. */}
          {tab === "salon" && categoryCounts.length > 0 && (
            <>
              <span className="mx-1 h-5 w-px shrink-0 bg-s-border" aria-hidden />
              <Pill active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
                {PORTFOLIO_CATEGORY_ALL_LABEL[locale as PortfolioLocale] ?? PORTFOLIO_CATEGORY_ALL_LABEL.de} ({salonPhotosBase.length})
              </Pill>
              {categoryCounts.map((c) => (
                <Pill key={c.key} active={activeCategory === c.key} onClick={() => setActiveCategory(c.key)}>
                  {getPortfolioCategoryLabel(c.key, locale)} ({c.count})
                </Pill>
              ))}
            </>
          )}
        </div>

        {/* mockup-ok: salon tab is now a dense 3-col square grid (same grammar as the real
            SalonPortfolio UniformGrid), replacing the old stacked 4:3 list; team tab keeps
            its 2-col grid. */}
        <div className="px-4 py-4">
          {tab === "salon" ? (
            <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
              {filteredSalonPhotos.map((u, i) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => openLb(filteredSalonPhotos, i)}
                  className="relative aspect-square overflow-hidden rounded-md bg-s-bg-sunken transition-transform hover:scale-[0.99] active:scale-[0.98] active:duration-[80ms] active:ease-glide md:rounded-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u} alt={`${salonName} – ${i + 1}`} className="h-full w-full object-cover" loading="lazy" /> {/* em-dash-ok */}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activePhotos.map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={u}
                  alt=""
                  onClick={() => openLb(activePhotos, i)}
                  // ig4 (owner-approved 2026-07-16): object-top (was center) on the square
                  // grid so a portrait crop keeps the face/wrists, not the feet.
                  className="aspect-square w-full cursor-pointer rounded-xl bg-s-bg-sunken object-cover object-top transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide"
                  loading="lazy"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <SalonLightbox
        photos={lb.photos}
        open={lb.open}
        startIndex={lb.index}
        onClose={() => setLb((p) => ({ ...p, open: false }))}
      />
    </div>,
    document.body
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        // mockup-ok: the LOCKED neutral filter-pill grammar (design contract "filter pill"
        // row): selected = gray sunken fill, never ink/black.
        "font-body shrink-0 rounded-full px-4 py-2 text-[13px] font-semibold transition-colors",
        active
          ? "bg-s-bg-sunken text-s-ink"
          : "border border-s-border bg-white text-s-ink-2 hover:bg-s-bg-sunken",
      )}
    >
      {children}
    </button>
  );
}
