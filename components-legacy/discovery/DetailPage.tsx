"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, CalendarDays, Star, ChevronDown, Play, X } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";
import ItemCard from "./ItemCard";
import VideoCard from "./VideoCard";
import TikTokPlayer from "./TikTokPlayer";
import DiscoveryGridSkeleton from "./DiscoveryGridSkeleton";
import { formatCreator } from "./format";
import { FROST_GLASS } from "@/lib/frost-glass";

/** Salon offering this style's category — the soft, honest "book this look" list (real salons, real ratings/prices). */
export interface SalonLite {
  id: string;
  name: string;
  slug: string;
  rating: number | null;
  /** B15 (PSYCHOLOGY law 6): backs `rating`. A star never renders without its review count. */
  reviewCount: number | null;
  priceFrom: number | null;
  serviceId: string | null;
}

interface DetailPageProps {
  item: DiscoveryItem;
  locale: string;
  isAuthenticated: boolean;
  salons: SalonLite[];
  salonTotal: number;
  categoryRoute: string;
}

// Chrome labels. Body copy (description, script) comes already-localized off the item fields.
const L: Record<string, Record<string, string>> = {
  de: { back: "Zurück", play: "Auf TikTok abspielen", more: "Mehr lesen", less: "Weniger", save: "Speichern", saved: "Gespeichert", book: "Buchen", bookThis: "Diesen Look buchen", moreLikeThis: "Ähnliche Looks", seeAll: "Alle ansehen", details: "Details", upkeep: "Pflege", faces: "Gesichtsformen", products: "Produkte", cutGuide: "Schnittanleitung", noMedia: "Kein Medium" },
  en: { back: "Back", play: "Play on TikTok", more: "Read more", less: "Read less", save: "Save", saved: "Saved", book: "Book", bookThis: "Book this look", moreLikeThis: "More like this", seeAll: "See all", details: "Details", upkeep: "Upkeep", faces: "Face shapes", products: "Products", cutGuide: "Cut guide", noMedia: "No media" },
  fr: { back: "Retour", play: "Lire sur TikTok", more: "Lire plus", less: "Réduire", save: "Enregistrer", saved: "Enregistré", book: "Réserver", bookThis: "Réserver ce look", moreLikeThis: "Looks similaires", seeAll: "Tout voir", details: "Détails", upkeep: "Entretien", faces: "Formes de visage", products: "Produits", cutGuide: "Guide de coupe", noMedia: "Aucun média" },
  it: { back: "Indietro", play: "Riproduci su TikTok", more: "Leggi altro", less: "Riduci", save: "Salva", saved: "Salvato", book: "Prenota", bookThis: "Prenota questo look", moreLikeThis: "Look simili", seeAll: "Vedi tutti", details: "Dettagli", upkeep: "Manutenzione", faces: "Forme del viso", products: "Prodotti", cutGuide: "Guida al taglio", noMedia: "Nessun media" },
};

const MAINTENANCE: Record<string, Record<string, string>> = {
  de: { low: "Niedrig", medium: "Mittel", high: "Hoch" },
  en: { low: "Low", medium: "Medium", high: "High" },
  fr: { low: "Faible", medium: "Moyen", high: "Élevé" },
  it: { low: "Basso", medium: "Medio", high: "Alto" },
};

// Face shapes are a fixed enum, so they're translated in the UI (not stored per-locale) — full multi-lang support
// without a per-locale column (owner 2026-06-14: "full support everything"). Unknown values fall back to capitalized.
const FACE_SHAPES: Record<string, Record<string, string>> = {
  de: { oval: "Oval", round: "Rund", square: "Eckig", heart: "Herzförmig", diamond: "Rautenförmig", long: "Lang", oblong: "Länglich" },
  en: { oval: "Oval", round: "Round", square: "Square", heart: "Heart", diamond: "Diamond", long: "Long", oblong: "Oblong" },
  fr: { oval: "Ovale", round: "Rond", square: "Carré", heart: "Cœur", diamond: "Losange", long: "Allongé", oblong: "Oblong" },
  it: { oval: "Ovale", round: "Tondo", square: "Quadrato", heart: "Cuore", diamond: "Romboidale", long: "Lungo", oblong: "Oblungo" },
};

function localized(item: DiscoveryItem, prefix: string, locale: string): string | null {
  const key = `${prefix}_${locale}` as keyof DiscoveryItem;
  return (item[key] as string | null) ?? null;
}

function formatDate(dateStr: string, locale: string): string {
  try {
    const d = new Date(dateStr);
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    // Add the year when it's NOT the current year, so an old (e.g. last-year) post doesn't read as recent.
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = "numeric";
    return d.toLocaleDateString(locale === "de" ? "de-CH" : locale, opts);
  } catch {
    return "";
  }
}

// Two-letter monogram for the salon avatar ("Cuts & Culture" -> "CC").
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => /[a-zA-Z0-9]/.test(w[0] ?? ""));
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function DetailPage({ item, locale, isAuthenticated, salons, salonTotal, categoryRoute }: DetailPageProps) {
  const router = useRouter();
  const t = L[locale] ?? L.en;

  const [descOpen, setDescOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Save gesture (consistent with the feed): hero heart + "more like this" hearts open the Kollektion picker.
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [videoAspect, setVideoAspect] = useState<string | null>(null);
  // The cover IMAGE is the look (from TikTok — allowed via oEmbed; clean, no cookie wall, never opens TikTok). The
  // video plays INLINE in our page only when the user taps play (never opens TikTok; TikTok's cookie wall only
  // appears on that intentional tap, never on load).
  // NOTE (owner 2026-06-24): true autoplay-on-open is NOT possible for a TikTok cross-origin EMBED on iOS. Safari
  // blocks autoplay without a tap gesture (even muted), and TikTok's URL `autoplay=1` errors. So it stays tap-to-play.
  const [playing, setPlaying] = useState(false);
  // TEMP interaction switch (owner deciding the play interaction): ?play=inline (current) | sheet | fullscreen.
  // Client-only read; the play surfaces only appear after a tap, so no hydration mismatch. Default = current inline.
  const [playVariant] = useState<"inline" | "sheet" | "fullscreen">(() => {
    if (typeof window === "undefined") return "inline";
    const v = new URLSearchParams(window.location.search).get("play");
    return v === "sheet" || v === "fullscreen" ? v : "inline";
  });
  // Plain save toggle (no board picker; collections ditched 2026-06-23). Optimistic, then reconcile to the
  // server's authoritative saved state from the toggle RPC.
  const handleSave = async (id: string) => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    const wasSaved = savedIds.has(id);
    setSavedIds((prev) => { const next = new Set(prev); if (wasSaved) next.delete(id); else next.add(id); return next; });
    try {
      const res = await fetch("/api/discovery/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: id }),
      });
      if (!res.ok) throw new Error(`save ${res.status}`);
      const json = await res.json().catch(() => null);
      if (json && typeof json.saved === "boolean") {
        setSavedIds((prev) => { const next = new Set(prev); if (json.saved) next.add(id); else next.delete(id); return next; });
      }
    } catch (err) {
      console.error("[discovery detail] save toggle failed:", err);
      setSavedIds((prev) => { const next = new Set(prev); if (wasSaved) next.add(id); else next.delete(id); return next; });
    }
  };

  // "More like this" — fetched client-side (below the fold; shimmer while loading).
  const [similar, setSimilar] = useState<DiscoveryItem[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/discovery/similar?item_id=${item.id}&limit=12`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setSimilar(Array.isArray(d?.items) ? d.items : []); })
      .catch((err) => console.error("[DetailPage] similar load failed:", err))
      .finally(() => { if (!cancelled) setSimilarLoading(false); });
    return () => { cancelled = true; };
  }, [item.id]);

  // Log a 'view' once per look open , feeds the for-you style-affinity points (the DNA point system). Fire-and-forget.
  useEffect(() => {
    fetch("/api/discovery/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ item_id: item.id, type: "view" }),
    }).catch((err) => console.error("[DetailPage] view log failed:", err));
  }, [item.id]);

  const isVideo = item.media_type === "tiktok" || !!item.tiktok_url || !!item.tiktok_embed_html;
  const heroSrc = item.tiktok_url ? `/api/discovery/thumb/${item.id}` : item.image_url || item.tiktok_thumbnail_url;
  const creator = formatCreator(item.author_name);
  const description = localized(item, "description", locale) ?? item.description ?? item.alt_text ?? null;
  const script = localized(item, "salon_script", locale) ?? item.salon_script_de ?? item.salon_script ?? null;
  const heroSaved = savedIds.has(item.id);
  // In-web TikTok embed (owner: never open TikTok — play in our page). videoId from the stored oEmbed html.
  const videoId =
    item.tiktok_embed_html?.match(/data-video-id="(\d+)"/)?.[1] ??
    item.tiktok_embed_html?.match(/\/video\/(\d+)/)?.[1] ??
    item.tiktok_url?.match(/\/video\/(\d+)/)?.[1] ??
    null;
  const closePlayer = () => setPlaying(false);
  // Shape the frame to the real video ratio (probed from the thumbnail; the iframe is cross-origin) so the embed
  // fills cleanly instead of a one-size 9/16 guess.
  useEffect(() => {
    if (!videoId || !heroSrc) return;
    let alive = true;
    const probe = new window.Image();
    probe.onload = () => { if (alive && probe.naturalWidth && probe.naturalHeight) setVideoAspect(`${probe.naturalWidth} / ${probe.naturalHeight}`); };
    probe.src = heroSrc;
    return () => { alive = false; };
  }, [videoId, heroSrc]);

  const maintenanceLabel = item.maintenance ? (MAINTENANCE[locale] ?? MAINTENANCE.en)[item.maintenance] ?? null : null;
  const faceMap = FACE_SHAPES[locale] ?? FACE_SHAPES.en;
  const faceShapes = (item.face_shapes ?? [])
    .map((f) => faceMap[f.toLowerCase()] ?? f.charAt(0).toUpperCase() + f.slice(1))
    .join(", ");
  const localizedProducts = (item[`products_${locale}` as keyof DiscoveryItem] as string[] | null) ?? null;
  const products = (localizedProducts && localizedProducts.length ? localizedProducts : item.products_needed ?? []).join(", ");
  const hasDetails = !!(maintenanceLabel || faceShapes || products || item.cut_guide);

  // The AI cut-instruction (salon_script) no longer shows as a card; it auto-fills the booking note when the user
  // books a salon from this look (owner 2026-06-14: "how you want the staff to cut your hair auto transfers to the
  // booking note section"). Passed via ?note= and seeded into the booking wizard's customerNote.
  // Pre-select the matched service (so booking opens ON it, not an empty picker) + seed the cut note.
  const bookHref = (slug: string, serviceId: string | null) => {
    const params = new URLSearchParams();
    if (serviceId) params.set("service", serviceId);
    if (script) params.set("note", script);
    const qs = params.toString();
    return `/${locale}/salon/${slug}/booking${qs ? `?${qs}` : ""}`;
  };

  // See-all goes to the category's salon search (already category-scoped by the route). We deliberately do NOT pass
  // the look's style_name as a query , it's a long descriptive name that matches zero salons and would empty the page
  // ("nothing in the background"). The route's category filter is the right scope.
  const seeAllSalonsHref = `/${locale}/${categoryRoute}`;
  const moreLikeThisHref = `/${locale}/inspo?search=${encodeURIComponent(item.style_name || item.tags?.[0] || "")}`;

  const thumbEl: ReactNode = heroSrc ? (
    <Image
      src={heroSrc}
      alt={item.alt_text || item.style_name || ""}
      fill
      priority
      sizes="(max-width: 480px) 100vw, 480px"
      className="object-cover animate-in fade-in duration-500"
    />
  ) : (
    <div className="absolute inset-0 grid place-items-center text-sm text-white/30">{t.noMedia}</div>
  );

  return (
    <div className="mx-auto max-w-[480px] bg-white">
      {/* ─── Hero — the cover IMAGE is the look (clean: no cookie wall, never opens TikTok). Tapping play loads the
           TikTok embed INLINE in our page (in-web; TikTok's cookie wall only appears on that intentional tap). ─── */}
      {/* Fixed height (not the video's aspect) so EVERY look — any aspect ratio — gets the same hero size with a
          consistent peek of the content below (scroll affordance). The cover image + player both cover-fill + crop
          to this box, so it never pillarboxes. (Owner 2026-06-18.) */}
      <div className="relative w-full overflow-hidden rounded-b-[26px] bg-s-ink" style={{ height: "80vh" }}>
        {playing && videoId && playVariant === "inline" ? (
          <TikTokPlayer videoId={videoId} title={item.style_name ?? undefined} aspect={videoAspect ?? undefined} tiktokUrl={item.tiktok_url ?? undefined} />
        ) : (
          thumbEl
        )}

        {/* Tap to play the video INLINE (in-web — never opens TikTok). Shown on the cover image, before playing. */}
        {!playing && videoId && (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={t.play}
            className="absolute inset-0 z-[3] grid place-items-center"
          >
            <span style={FROST_GLASS} className="grid h-[64px] w-[64px] place-items-center rounded-full transition-transform duration-150 active:scale-95">
              <Play size={28} className="ml-0.5 text-s-ink" fill="currentColor" />
            </span>
          </button>
        )}

        {/* Top controls — frosted back (left) + heart (right). */}
        <div className="absolute left-[18px] right-[18px] z-10 flex items-start justify-between" style={{ top: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
          <button
            type="button"
            // Owner 2026-06-24: back goes EXPLICITLY to the feed, never router.back(). router.back() walked browser
            // history, so look -> similar look -> look made "back" unwind the detail chain instead of returning to
            // discovery (the "loop loop loop"). Always /inspo = one tap back to the feed, no loop.
            onClick={() => router.push(`/${locale}/inspo`)}
            aria-label={t.back}
            style={FROST_GLASS}
            className="grid h-11 w-11 place-items-center rounded-full text-s-ink transition-transform duration-150 active:scale-95"
          >
            <ArrowLeft size={18} strokeWidth={1.9} />
          </button>
          <button
            type="button"
            onClick={() => handleSave(item.id)}
            aria-label={heroSaved ? t.saved : t.save}
            aria-pressed={heroSaved}
            style={FROST_GLASS}
            className="grid h-11 w-11 place-items-center rounded-full transition-transform duration-150 active:scale-95"
          >
            <Heart
              key={String(heroSaved)}
              size={18}
              fill={heroSaved ? "#FF3366" : "none"}
              stroke={heroSaved ? "none" : "var(--color-heading)"}
              className={heroSaved ? "animate-heart-pop" : "text-s-ink"}
            />
          </button>
        </div>

      </div>

      {/* SHEET player variant (?play=sheet) — video rises in a bottom sheet over the dimmed look; the hero stays the
          clean image. Mirrors the locked sheet physics (backdrop blur + rounded-t + slide-in-from-bottom). */}
      {playing && videoId && playVariant === "sheet" && (
        <div className="fixed inset-0 z-[60] flex items-end" role="dialog" aria-modal="true" aria-label={item.style_name || "TikTok"}>
          <div className="absolute inset-0 bg-s-ink/60 backdrop-blur-[6px] animate-in fade-in duration-200" onClick={closePlayer} />
          <div className="relative w-full overflow-hidden rounded-t-[22px] bg-black shadow-elevation-3 animate-in slide-in-from-bottom duration-300">
            <button type="button" onClick={closePlayer} aria-label={t.back} style={FROST_GLASS} className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full text-s-ink transition-transform duration-150 active:scale-95">
              <X size={18} strokeWidth={1.9} />
            </button>
            <div className="relative w-full" style={{ aspectRatio: videoAspect ?? "9 / 16", maxHeight: "82vh" }}>
              <TikTokPlayer videoId={videoId} title={item.style_name ?? undefined} aspect={videoAspect ?? undefined} tiktokUrl={item.tiktok_url ?? undefined} />
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN player variant (?play=fullscreen) — takes over the screen like opening a reel; tap X to return. */}
      {playing && videoId && playVariant === "fullscreen" && (
        <div className="fixed inset-0 z-[60] bg-black animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label={item.style_name || "TikTok"}>
          <button type="button" onClick={closePlayer} aria-label={t.back} style={{ ...FROST_GLASS, top: "calc(env(safe-area-inset-top, 0px) + 14px)" }} className="absolute right-4 z-10 grid h-10 w-10 place-items-center rounded-full text-s-ink transition-transform duration-150 active:scale-95">
            <X size={18} strokeWidth={1.9} />
          </button>
          <TikTokPlayer videoId={videoId} title={item.style_name ?? undefined} aspect={videoAspect ?? undefined} tiktokUrl={item.tiktok_url ?? undefined} />
        </div>
      )}

      {/* ─── Sheet (pulled over the hero, App-Store style) ─── */}
      <div className="relative z-[5] mt-0 bg-white px-[18px] pt-5 pb-9 animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Creator pill (owner: "username as a pill under the video") + date. The pill links to the creator's TikTok
            (attribution); neutral chip styling per the design system, not a blue text link. */}
        <div className="flex items-center gap-2">
          {creator && (
            item.author_url ? (
              <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full bg-s-bg-sunken px-3 py-1 text-[12.5px] font-semibold tracking-[-0.01em] text-s-ink no-underline transition-colors hover:bg-s-border">@{creator}</a>
            ) : (
              <span className="inline-flex items-center rounded-full bg-s-bg-sunken px-3 py-1 text-[12.5px] font-semibold tracking-[-0.01em] text-s-ink">{item.source === "tiktok" ? `@${creator}` : `Foto: ${creator}`}</span>
            )
          )}
          <span className="inline-flex items-center gap-1.5 text-[12px] text-s-ink-2">
            <CalendarDays size={13} /> {formatDate(item.created_at, locale)}
          </span>
        </div>

        {/* Title */}
        {item.style_name && (
          <h1 className="mt-2.5 font-heading text-[25px] font-bold leading-[1.16] tracking-[-0.022em] text-s-ink">{item.style_name}</h1>
        )}

        {/* Tags , tappable: each jumps into the searched feed (owner: "search based on this look"). */}
        {item.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 6).map((tag) => (
              <Link
                key={tag}
                href={`/${locale}/inspo?search=${encodeURIComponent(tag)}`}
                className="rounded-full bg-s-bg-sunken px-2.5 py-1 text-[12px] text-s-ink-2 transition-colors duration-150 hover:bg-s-border hover:text-s-ink"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Description — clamps to 2 lines + "Mehr lesen" */}
        {description && (
          <div className="mt-[18px]">
            <p className={`m-0 text-[14.5px] leading-[1.62] text-s-ink-2 ${descOpen ? "" : "line-clamp-2"}`}>{description}</p>
            <button
              type="button"
              onClick={() => setDescOpen((o) => !o)}
              className="mt-2 inline-flex items-center gap-1 text-[13.5px] font-medium text-s-accent"
            >
              {descOpen ? t.less : t.more}
              <ChevronDown size={15} strokeWidth={1.9} className={`transition-transform duration-200 ${descOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}

        {/* Details — dropdown (moved up: the look's attributes sit right under the description, before the booking CTA) */}
        {hasDetails && (
          <div className="mt-7 border-t border-s-border">
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              aria-expanded={detailsOpen}
              className="flex w-full items-center justify-between px-0.5 py-4"
            >
              <span className="font-heading text-[15px] font-semibold tracking-[-0.01em] text-s-ink">{t.details}</span>
              <ChevronDown size={18} strokeWidth={1.9} className={`text-s-ink-2 transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`} />
            </button>
            {detailsOpen && (
              <div className="pb-2">
                {maintenanceLabel && <DetailRow k={t.upkeep} v={maintenanceLabel} />}
                {faceShapes && <DetailRow k={t.faces} v={faceShapes} />}
                {products && <DetailRow k={t.products} v={products} />}
                {item.cut_guide && (
                  <div className="border-t border-s-border py-2.5">
                    <p className="mb-1.5 text-[13.5px] text-s-ink-2">{t.cutGuide}</p>
                    <p className="m-0 whitespace-pre-line font-mono text-[12.5px] leading-relaxed text-s-ink-2">{item.cut_guide}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Book this look — soft, honest salon list */}
        {salons.length > 0 && (
          <section className="mt-[30px]">
            <h2 className="mb-1.5 font-heading text-[17px] font-semibold tracking-[-0.01em] text-s-ink">{t.bookThis}</h2>
            <div>
              {salons.map((s) => (
                <Link
                  key={s.id}
                  href={bookHref(s.slug, s.serviceId)}
                  className="flex items-center gap-3 border-t border-s-border py-3 first:border-t-0"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-s-bg-sunken font-heading text-[14px] font-bold tracking-[-0.02em] text-s-ink-2">{initials(s.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">{s.name}</span>
                    {/* B15: star+count, the same locked "(N)" review-count pattern used everywhere else. mockup-ok */}
                    {s.rating != null && s.reviewCount != null && s.reviewCount > 0 && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-s-ink-2">
                        <Star size={13} className="text-s-star" fill="currentColor" /> {s.rating.toFixed(2)}
                        <span className="text-s-accent">({s.reviewCount})</span>
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3">
                    {s.priceFrom != null && <span className="font-heading text-[14.5px] font-bold tracking-[-0.01em] text-s-ink">ab CHF {s.priceFrom}</span>}
                    <span className="rounded-full border border-s-border bg-s-bg-sunken px-4 py-2 text-[13px] font-semibold text-s-ink">{t.book}</span>
                  </span>
                </Link>
              ))}
            </div>
            {salonTotal > salons.length && (
              <Link
                href={seeAllSalonsHref}
                className="mt-3.5 block w-full rounded-full border border-s-border bg-white py-3 text-center text-[14.5px] font-semibold text-s-ink"
              >
                {t.seeAll} {salonTotal} Stores
              </Link>
            )}
          </section>
        )}

        {/* More like this — feed-card grammar (one product), save-enabled hearts */}
        {(similarLoading || similar.length > 0) && (
          <section className="mt-[30px]">
            <div className="mb-1.5 flex items-center justify-between">
              <h2 className="font-heading text-[17px] font-semibold tracking-[-0.01em] text-s-ink">{t.moreLikeThis}</h2>
              {similar.length > 0 && (
                <Link href={moreLikeThisHref} className="text-[13px] font-semibold text-s-accent">{t.seeAll}</Link>
              )}
            </div>
            {similarLoading ? (
              <DiscoveryGridSkeleton fixed2col />
            ) : (
              // ALWAYS 2 columns (the page is capped at 480px, so the shared grid's md/lg→3/4 columns made tiny cards
              // on desktop). Fixed `columns-2` masonry: varied aspect ratios, big half-width cards, on any screen.
              <div className="-mx-[18px] columns-2 gap-1.5 px-1.5 [column-fill:balance]">
                {similar.map((s) => (
                  <div key={s.id} className="mb-1.5 break-inside-avoid animate-in fade-in duration-300">
                    {s.media_type === "tiktok" ? (
                      <VideoCard item={s} minimal onClick={() => router.push(`/${locale}/inspo/${s.id}`)} isAuthenticated={isAuthenticated} onAuthRequired={() => router.push(`/${locale}/auth/login`)} onSave={handleSave} saved={savedIds.has(s.id)} />
                    ) : (
                      <ItemCard item={s} minimal onClick={() => router.push(`/${locale}/inspo/${s.id}`)} isAuthenticated={isAuthenticated} onAuthRequired={() => router.push(`/${locale}/auth/login`)} onSave={handleSave} saved={savedIds.has(s.id)} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  );
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3.5 border-t border-s-border py-2.5 text-[13.5px]">
      <span className="w-[108px] shrink-0 text-s-ink-2">{k}</span>
      <span className="flex-1 text-s-ink">{v}</span>
    </div>
  );
}
