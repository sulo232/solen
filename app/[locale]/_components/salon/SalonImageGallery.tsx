"use client";

import * as React from "react";
import { ArrowLeft } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { SalonLightbox } from "./SalonLightbox";
import type { StaffMember } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * SalonImageGallery — full-screen photo browser (Fresha "Image gallery" pattern,
 * 2026-06-09). Opened from the hero photo-counter + the Portfolio section. Two modes:
 *   • Salon: the salon's gallery_urls, full-width stacked.
 *   • Team: per-stylist sub-tabs (each with its photo count) + that stylist's grid.
 * Tapping any photo opens the shared SalonLightbox to zoom/swipe within the current set.
 * Per-stylist photos come from staff_portfolio_images (public-read RLS), fetched lazily
 * the first time the gallery opens.
 */
export function SalonImageGallery({
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
  const [activeStylist, setActiveStylist] = React.useState<string | null>(null);
  const [portfolios, setPortfolios] = React.useState<Record<string, string[]>>({});
  const [loaded, setLoaded] = React.useState(false);
  const [lb, setLb] = React.useState<{ open: boolean; photos: string[]; index: number }>({
    open: false,
    photos: [],
    index: 0,
  });

  // Lazy-fetch per-stylist portfolios the first time the gallery opens.
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
        console.error("[SalonImageGallery] portfolio fetch failed:", err);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, loaded, staff]);

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
  const activePhotos =
    tab === "salon" ? venuePhotos : activeStylist ? portfolios[activeStylist] ?? [] : [];

  const openLb = (photos: string[], i: number) => setLb({ open: true, photos, index: i });

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-s-border px-4 py-3">
        <button
          type="button"
          aria-label="Zurück"
          onClick={onClose}
          className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-s-ink transition-transform active:scale-95"
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
        {/* Salon / Team pills */}
        <div className="flex gap-2 px-4 py-3">
          <Pill active={tab === "salon"} onClick={() => setTab("salon")}>
            Salon ({venuePhotos.length})
          </Pill>
          {teamTotal > 0 && (
            <Pill active={tab === "team"} onClick={() => setTab("team")}>
              Team ({teamTotal})
            </Pill>
          )}
        </div>

        {/* Team: per-stylist sub-tabs */}
        {tab === "team" && stylistsWithPhotos.length > 0 && (
          <div className="flex gap-5 overflow-x-auto border-b border-s-border px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stylistsWithPhotos.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveStylist(s.id)}
                className={cn(
                  "font-body relative shrink-0 py-3 text-[14px] font-semibold transition-colors",
                  activeStylist === s.id ? "text-s-ink" : "text-s-ink-3 hover:text-s-ink",
                )}
              >
                {s.name}{" "}
                <span className="font-normal text-s-ink-3">{portfolios[s.id]?.length ?? 0}</span>
                {activeStylist === s.id && (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-s-ink" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Photo grid */}
        <div className="px-4 py-4">
          {tab === "salon" ? (
            <div className="flex flex-col gap-3">
              {venuePhotos.map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={u}
                  alt={`${salonName} – ${i + 1}`}
                  onClick={() => openLb(venuePhotos, i)}
                  className="aspect-[4/3] w-full cursor-pointer rounded-xl bg-s-bg-sunken object-cover"
                  loading="lazy"
                />
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
                  className="aspect-square w-full cursor-pointer rounded-xl bg-s-bg-sunken object-cover"
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
    </div>
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
          ? "bg-s-ink text-white"
          : "border border-s-border bg-white text-s-ink hover:bg-s-bg-sunken",
      )}
    >
      {children}
    </button>
  );
}
