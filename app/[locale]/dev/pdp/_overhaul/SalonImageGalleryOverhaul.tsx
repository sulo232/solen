"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonImageGallery.tsx (real,
// unmodified). `npm run exists` for "portfolio" (2026-07-24) found SalonPortfolio,
// StaffPortfolio, TechPortfolio (all per-STAFF nail/barber, gated behind DISABLED flags) and
// staff_portfolio_images (per-staff, has barber_style/nail_style columns) , none of these is a
// SALON-level generic category system, confirmed by the research spec's DB gap: salons.gallery_urls
// is a bare text[] with zero per-photo metadata. This mockup therefore fixed-splits the real
// gallery photos into 3 SAMPLE categories client-side (no new table); a real build needs
// salon_portfolio_images(category) per the research spec, flagged in the footnote on the page.

import * as React from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { SalonLightbox } from "../../../_components/salon/SalonLightbox";
import type { StaffMember } from "../../../_components/salon/_shared";
import { cn } from "@/lib/utils";

/** Sample category preset for a barbershop (research spec option 1, fixed taxonomy per
 *  salon category). Real system needs the owner to confirm the preset list per category
 *  (coiffeur / barbershop / nails / spa) , this is a MOCKUP-ONLY 3-way split of the real
 *  gallery photos, not real per-photo data. */
const SAMPLE_CATEGORIES = [
  { key: "fades", label: "Fades" },
  { key: "haircuts", label: "Haircuts" },
  { key: "beard-trims", label: "Beard trims" },
] as const;

function categorizePhotos(urls: string[]) {
  const perCat = Math.max(1, Math.ceil(urls.length / SAMPLE_CATEGORIES.length));
  return SAMPLE_CATEGORIES.map((c, i) => ({
    ...c,
    photos: urls.slice(i * perCat, (i + 1) * perCat),
  })).filter((c) => c.photos.length > 0);
}

/**
 * SalonImageGalleryOverhaul , mockup copy of
 * app/[locale]/_components/salon/SalonImageGallery.tsx (real, unmodified).
 * ROUND 3 (S4, owner rejects the earlier "double thing"): the Salon/Team pill row and the
 * underline content-tab row (category tabs + per-stylist sub-tabs) used to stack as TWO
 * selector rows. Collapsed to ONE single filter-pill row: Salon/Team toggle pills, then a
 * hairline divider, then the category pills (Salon tab) or stylist pills (Team tab) inline in
 * the SAME row , never two rows visible at once. The underline/content-tab treatment is
 * deleted entirely from this file; every pill in the row (toggle + sub-filter) now shares the
 * one neutral filter-pill grammar (selected = `bg-s-bg-sunken` + ink text + semibold,
 * unselected = white + hairline, never blue/black).
 */
export function SalonImageGalleryOverhaul({
  open,
  onClose,
  salonName,
  venuePhotos,
  staff,
}: {
  open: boolean;
  onClose: () => void;
  salonName: string;
  venuePhotos: string[];
  staff: StaffMember[];
}) {
  const [tab, setTab] = React.useState<"salon" | "team">("salon");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [activeStylist, setActiveStylist] = React.useState<string | null>(null);
  const [portfolios, setPortfolios] = React.useState<Record<string, string[]>>({});
  const [loaded, setLoaded] = React.useState(false);
  const [lb, setLb] = React.useState<{ open: boolean; photos: string[]; index: number }>({
    open: false,
    photos: [],
    index: 0,
  });

  React.useEffect(() => {
    if (!open || loaded || staff.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createBrowserSupabaseClient();
        const { data, error } = await supabase
          .from("staff_portfolio_images")
          .select("staff_id, image_url, sort_order")
          .in("staff_id", staff.map((s) => s.id))
          .order("sort_order", { ascending: true });
        if (error) throw error;
        if (cancelled) return;
        const grouped: Record<string, string[]> = {};
        for (const row of data ?? []) {
          (grouped[row.staff_id as string] ??= []).push(row.image_url as string);
        }
        setPortfolios(grouped);
        setActiveStylist(staff.find((s) => (grouped[s.id]?.length ?? 0) > 0)?.id ?? null);
        setLoaded(true);
      } catch (err) {
        console.error("[SalonImageGalleryOverhaul] portfolio fetch failed:", err);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded, staff]);

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
  const activePhotos =
    tab === "salon" ? venuePhotos : activeStylist ? portfolios[activeStylist] ?? [] : [];

  const categories = categorizePhotos(venuePhotos);
  const activeCategoryPhotos =
    activeCategory === "all"
      ? venuePhotos
      : categories.find((c) => c.key === activeCategory)?.photos ?? [];

  const openLb = (photos: string[], i: number) => setLb({ open: true, photos, index: i });

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-s-border px-4 py-3">
        <button
          type="button"
          aria-label="Back"
          onClick={onClose}
          className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-s-ink transition-transform active:scale-95"
        >
          <ArrowLeft size={20} strokeWidth={2.2} aria-hidden />
        </button>
        <div className="min-w-0">
          <div className="font-display text-[16px] font-semibold leading-tight tracking-[-0.01em] text-s-ink">
            Gallery
          </div>
          <div className="truncate font-body text-[12px] text-s-ink-3">{salonName}</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* ONE single filter-pill row (S4): Salon/Team toggle, then , in the SAME row , the
            category pills (Salon tab) or stylist pills (Team tab). All pills share the one
            neutral filter-pill grammar; a hairline divider only groups the toggle from the
            sub-filter, it never stacks a second row. */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-s-border px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Pill active={tab === "salon"} onClick={() => setTab("salon")}>
            Salon ({venuePhotos.length})
          </Pill>
          {teamTotal > 0 && (
            <Pill active={tab === "team"} onClick={() => setTab("team")}>
              Team ({teamTotal})
            </Pill>
          )}

          {tab === "salon" && categories.length > 1 && (
            <>
              <span className="mx-1 h-5 w-px shrink-0 bg-s-border" aria-hidden />
              <Pill active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>
                All ({venuePhotos.length})
              </Pill>
              {categories.map((c) => (
                <Pill key={c.key} active={activeCategory === c.key} onClick={() => setActiveCategory(c.key)}>
                  {c.label} ({c.photos.length})
                </Pill>
              ))}
            </>
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
        </div>

        {/* Photo grid */}
        <div className="px-4 py-4">
          {tab === "salon" ? (
            categories.length > 1 ? (
              // NEW: dense 3-col square grid (copied grammar from the real
              // SalonPortfolio UniformGrid), scoped to the active category.
              <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
                {activeCategoryPhotos.map((u, i) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => openLb(activeCategoryPhotos, i)}
                    className="relative aspect-square overflow-hidden rounded-md bg-s-bg-sunken transition-transform hover:scale-[0.99] active:scale-[0.98] md:rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            ) : (
              // Single/no category , same 3-col grid, no tab row (spec: "don't show a
              // lone tab"), still replaces the old stacked 4:3 list.
              <div className="grid grid-cols-3 gap-1.5 md:gap-2.5">
                {venuePhotos.map((u, i) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => openLb(venuePhotos, i)}
                    className="relative aspect-square overflow-hidden rounded-md bg-s-bg-sunken transition-transform hover:scale-[0.99] active:scale-[0.98] md:rounded-lg"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={u} alt="" className="h-full w-full object-cover" loading="lazy" />
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {activePhotos.map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={u}
                  alt=""
                  onClick={() => openLb(activePhotos, i)}
                  className="aspect-square w-full cursor-pointer rounded-xl bg-s-bg-sunken object-cover object-top"
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
