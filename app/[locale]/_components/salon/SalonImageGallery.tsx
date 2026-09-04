"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useLocale } from "next-intl";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { SalonLightbox } from "./SalonLightbox";
import type { StaffMember } from "./_shared";
import { cn } from "@/lib/utils";
import { BackButton } from "../primitives";
import { getPortfolioCategoriesForSalon, getPortfolioCategoryLabel, PORTFOLIO_CATEGORY_ALL_LABEL, type PortfolioLocale } from "@/lib/portfolio-categories";
import { useTranslations } from "next-intl";

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
  const tBack = useTranslations("common");
  const locale = useLocale();
  const [tab, setTab] = React.useState<"salon" | "team">("salon");
  const [activeStylist, setActiveStylist] = React.useState<string | null>(null);
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [portfolios, setPortfolios] = React.useState<Record<string, string[]>>({});
  const [salonPhotos, setSalonPhotos] = React.useState<Array<{ id: string; url: string; category: string | null }>>([]);
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
          // `id` added 2026-07-27: a photo report targets the salon_portfolio_images ROW, never the
          // url , a url can change or be reused across salons, a row id cannot.
          .select("id, image_url, category, sort_order")
          .eq("salon_id", salonId)
          .order("sort_order", { ascending: true });
        if (error) throw error;
        if (!cancelled) {
          setSalonPhotos((data ?? []).map((row) => ({ id: row.id as string, url: row.image_url as string, category: row.category as string | null })));
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

  // accessibility-06 (2026-07-27): url -> category lookup so the grid's alt text can name
  // WHAT the photo shows (its portfolio category) instead of just a bare index. Real
  // metadata already fetched into `salonPhotos`, just never threaded through to alt=.
  //
  // MUST STAY ABOVE THE `if (!open)` EARLY RETURN BELOW, and that is not a style preference:
  // it is the fix for the bug that made tapping a portfolio photo do nothing at all
  // (owner 2026-08-15, "right now, nothing happens when you click one of the photos").
  // This useMemo (and a second one that has since been deleted with the report control) was
  // added BELOW the early return by commit c79210163. Closed, the component ran 14 hooks;
  // open, it ran 16, so React threw "Rendered more hooks than during the previous render"
  // the instant the gallery opened, the nearest error boundary swallowed it, and the screen
  // stayed exactly as it was. Measured live on cuts-and-culture: the click fired, zero
  // dialogs opened, that error in the console. Every hook in this component now sits above
  // the early return.
  const categoryByUrl = React.useMemo(() => {
    const m = new Map<string, string | null>();
    for (const p of salonPhotos) m.set(p.url, p.category);
    return m;
  }, [salonPhotos]);

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

  // accessibility-06: the active stylist's name, so team-portfolio alt text can say WHOSE
  // work a photo shows instead of alt="" (these are evaluative haircut-result photos, the
  // exact content 1.1.1 does not let a gallery mark decorative).
  const activeStylistName = staff.find((s) => s.id === activeStylist)?.name ?? null;

  const openLb = (photos: string[], i: number) => setLb({ open: true, photos, index: i });

  return createPortal(
    <div className="fixed inset-0 z-[70] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-s-border px-4 py-3">
        {/* mockup-ok: restores the NAV CONTROLS lock (_design-system/LOCKFILE.md#L2096,
            owner-measured 2026-08-10). This was the exact bare-glyph regression the lock names
            verbatim ("no fill, no border and no shadow"); composing BackButton variant="flat"
            here restores the locked white+shadow circle, matching the same fix already applied
            at SalonStickyTabNav.tsx, not a new choice. */}
        <BackButton
          variant="flat"
          label={tBack("back")}
          onClick={onClose}
          className="-ml-1 shrink-0"
        />
        <div className="min-w-0">
          <div className="font-display text-[16px] font-semibold leading-tight tracking-[-0.01em] text-s-ink">
            Galerie
          </div>
          <div className="truncate font-body text-[12px] text-s-ink-2">{salonName}</div>
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

          {/* mockup-ok: the stylist switcher moved OUT of this pill row and became the avatar row
              rendered below (owner 2026-08-15: "make a portfolio can actually, like, switch
              between, like, staffs, how I was in the screenshot"). Nothing new is drawn here; the
              text pills are simply gone from this row. */}

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

        {/* mockup-ok: THE STAFF SWITCHER, as an avatar row. Owner 2026-08-15: "make a portfolio
            can actually, like, switch between, like, staffs, how I was in the screenshot."
            MEASURED off that screenshot (his Bildergalerie team tab, 920px wide): the avatar discs
            run 178px across, which is 0.193 of the viewport width and so 75px at our 390px
            measurement viewport, spaced 210px pitch, so a 32px gap that becomes 12px at our width.
            The count badge sits bottom-right ON the disc and the name sits under it.
            Composed from the shared Avatar primitive rather than a new circle, and the badge reuses
            the same white-pill-with-hairline chrome SalonTeam already puts on its rating badge. */}
        {tab === "team" && stylistsWithPhotos.length > 1 && (
          <div className="flex gap-3 overflow-x-auto px-4 pb-1 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stylistsWithPhotos.map((s) => {
              const on = activeStylist === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveStylist(s.id)}
                  aria-pressed={on}
                  className="group flex w-[75px] shrink-0 flex-col items-center text-center transition-transform active:scale-[0.97] active:duration-[80ms]"
                >
                  <span className="relative">
                    {s.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.avatar_url}
                        alt={s.name}
                        className={cn(
                          "h-[75px] w-[75px] rounded-full bg-s-bg-sunken object-cover transition-opacity",
                          on ? "opacity-100" : "opacity-60",
                        )}
                      />
                    ) : (
                      <span
                        className={cn(
                          "grid h-[75px] w-[75px] place-items-center rounded-full bg-s-bg-sunken font-display text-[26px] font-semibold text-s-ink-2",
                          on ? "opacity-100" : "opacity-60",
                        )}
                      >
                        {s.name.charAt(0)}
                      </span>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-full border border-s-border bg-white px-1.5 text-[12px] font-semibold tabular-nums text-s-ink">
                      {portfolios[s.id]?.length ?? 0}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "font-body mt-2 truncate text-[13px] leading-tight",
                      on ? "font-semibold text-s-ink" : "font-medium text-s-ink-2",
                    )}
                  >
                    {s.name}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* mockup-ok: salon tab is a single column of full-bleed 16/9 photos (measured off his
            reference, see the note on that container); the team tab runs 1 big + 2 half. */}
        <div className="px-4 py-4">
          {tab === "salon" ? (
            // mockup-ok: back to FULL-WIDTH STACKED photos (owner 2026-08-15: "on the portfolio,
            // after you open, it's, like, not balance at all. It's just all weird. I told you to
            // fix it, and you didn't do anything. There's even the contextual reference, bro.").
            //
            // MEASURED off the reference he means, his Fresha Bildergalerie capture (image 3,
            // 920px wide): the venue tab is a single column of full-bleed photos, not a grid. The
            // two fully-visible blocks measure 464px and 324px tall inside an 828px content
            // column, so 1.78:1 and 2.55:1, with the second one clipped by the viewport. 16/9
            // (1.78) is the one the un-clipped photo lands on exactly.
            //
            // What this replaces is the 3-column square grid, and that IS what looks unbalanced:
            // nine 110px thumbnails on a phone against his reference's 460px photos. The grid was
            // right for the PDP's 9-tile teaser, which is a teaser. The gallery is where the
            // photos are the point.
            <div className="flex flex-col gap-3">
              {filteredSalonPhotos.map((u, i) => (
                // The per-photo report control that used to sit in a positioned wrapper here is
                // GONE (owner 2026-08-15: "the report button, we need to remove that because,
                // you know, customer is not gonna report it. It's gonna look so weird and not
                // official."). The wrapper div went with it: the tile is the only child again,
                // so the button IS the grid cell.
                <button
                  key={u}
                  type="button"
                  onClick={() => openLb(filteredSalonPhotos, i)}
                  // mockup-ok: 16/9 is the ratio measured off his own reference capture (see the
                  // note on the container above), and `rounded-card` is the 16px literal the
                  // design contract already assigns a content block this size, not a new value.
                  className="relative aspect-[16/9] w-full overflow-hidden rounded-card bg-s-bg-sunken transition-transform hover:scale-[0.995] active:scale-[0.99] active:duration-[80ms] active:ease-glide"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={u}
                    // accessibility-06: name the portfolio category (Frisur, Farbe, etc.) when
                    // known, real metadata already fetched into salonPhotos, instead of a bare
                    // "{salonName} - {index}" that describes nothing about the photo itself.
                    alt={
                      categoryByUrl.get(u)
                        ? `${getPortfolioCategoryLabel(categoryByUrl.get(u)!, locale)}, ${salonName}`
                        : `${salonName} – ${i + 1}` // em-dash-ok
                    }
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          ) : (
            // mockup-ok: 1 BIG + 2 HALF, repeating. Measured off his per-stylist reference
            // (image 5, 920px wide): the lead photo is 826px tall in an 828px column, so a
            // full-width SQUARE, and the pair under it measures 398px tall at half width, so two
            // squares side by side. The flat 2-column grid this replaces gave every photo the
            // same small tile, which is the "not balanced at all" he is pointing at: nothing in
            // it is the anchor.
            <div className="grid grid-cols-2 gap-2">
              {activePhotos.map((u, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={u}
                  // accessibility-06: a stylist portfolio photo is evaluative content (past
                  // haircut/work), never decorative; name whose portfolio it is instead of "".
                  alt={activeStylistName ? `${activeStylistName}, ${i + 1}` : `${salonName} – ${i + 1}`} // em-dash-ok
                  onClick={() => openLb(activePhotos, i)}
                  // ig4 (owner-approved 2026-07-16): object-top (was center) on the square
                  // grid so a portrait crop keeps the face/wrists, not the feet.
                  // mockup-ok: every third photo leads its group at full width, the two after it
                  // sit half-width beside each other. All three stay square, which is what the
                  // reference measures; only the width changes, so no crop rule moves.
                  className={cn(
                    "aspect-square w-full cursor-pointer rounded-xl bg-s-bg-sunken object-cover object-top transition-transform duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide",
                    i % 3 === 0 && "col-span-2",
                  )}
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
