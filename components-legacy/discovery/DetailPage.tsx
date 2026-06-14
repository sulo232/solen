"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, CalendarDays, Scissors, Copy, Check, Star, ChevronDown } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";
import MasonryGrid from "./MasonryGrid";
import ItemCard from "./ItemCard";
import VideoCard from "./VideoCard";
import SaveToBoardSheet from "./SaveToBoardSheet";
import DiscoveryGridSkeleton from "./DiscoveryGridSkeleton";
import { formatCreator } from "./format";
import { FROST_GLASS } from "@/lib/frost-glass";

/** Salon offering this style's category — the soft, honest "book this look" list (real salons, real ratings/prices). */
export interface SalonLite {
  id: string;
  name: string;
  slug: string;
  rating: number | null;
  priceFrom: number | null;
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
  de: { back: "Zurück", more: "Mehr lesen", less: "Weniger", tellStylist: "Was dem Friseur sagen", copy: "Kopieren", save: "Speichern", saved: "Gespeichert", book: "Buchen", bookThis: "Diesen Look buchen", moreLikeThis: "Ähnliche Looks", seeAll: "Alle ansehen", details: "Details", upkeep: "Pflege", faces: "Gesichtsformen", products: "Produkte", cutGuide: "Schnittanleitung", noMedia: "Kein Medium" },
  en: { back: "Back", more: "Read more", less: "Read less", tellStylist: "Tell your stylist", copy: "Copy", save: "Save", saved: "Saved", book: "Book", bookThis: "Book this look", moreLikeThis: "More like this", seeAll: "See all", details: "Details", upkeep: "Upkeep", faces: "Face shapes", products: "Products", cutGuide: "Cut guide", noMedia: "No media" },
  fr: { back: "Retour", more: "Lire plus", less: "Réduire", tellStylist: "À dire au coiffeur", copy: "Copier", save: "Enregistrer", saved: "Enregistré", book: "Réserver", bookThis: "Réserver ce look", moreLikeThis: "Looks similaires", seeAll: "Tout voir", details: "Détails", upkeep: "Entretien", faces: "Formes de visage", products: "Produits", cutGuide: "Guide de coupe", noMedia: "Aucun média" },
  it: { back: "Indietro", more: "Leggi altro", less: "Riduci", tellStylist: "Cosa dire al parrucchiere", copy: "Copia", save: "Salva", saved: "Salvato", book: "Prenota", bookThis: "Prenota questo look", moreLikeThis: "Look simili", seeAll: "Vedi tutti", details: "Dettagli", upkeep: "Manutenzione", faces: "Forme del viso", products: "Prodotti", cutGuide: "Guida al taglio", noMedia: "Nessun media" },
};

const MAINTENANCE: Record<string, Record<string, string>> = {
  de: { low: "Niedrig", medium: "Mittel", high: "Hoch" },
  en: { low: "Low", medium: "Medium", high: "High" },
  fr: { low: "Faible", medium: "Moyen", high: "Élevé" },
  it: { low: "Basso", medium: "Medio", high: "Alto" },
};

function localized(item: DiscoveryItem, prefix: string, locale: string): string | null {
  const key = `${prefix}_${locale}` as keyof DiscoveryItem;
  return (item[key] as string | null) ?? null;
}

function formatDate(dateStr: string, locale: string): string {
  try {
    return new Date(dateStr).toLocaleDateString(locale === "de" ? "de-CH" : locale, { day: "numeric", month: "short" });
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

  const [aspect, setAspect] = useState("9 / 16");
  const [descOpen, setDescOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Save gesture (consistent with the feed): hero heart + "more like this" hearts open the Kollektion picker.
  const [saveItemId, setSaveItemId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const handleSave = (id: string) => {
    if (!isAuthenticated) { router.push(`/${locale}/auth/login`); return; }
    setSaveItemId(id);
  };

  // "More like this" — fetched client-side (below the fold; shimmer while loading).
  const [similar, setSimilar] = useState<DiscoveryItem[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/discovery/similar?item_id=${item.id}&limit=8`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setSimilar(Array.isArray(d?.items) ? d.items : []); })
      .catch((err) => console.error("[DetailPage] similar load failed:", err))
      .finally(() => { if (!cancelled) setSimilarLoading(false); });
    return () => { cancelled = true; };
  }, [item.id]);

  const isVideo = item.media_type === "tiktok" || !!item.tiktok_url || !!item.tiktok_embed_html;
  const heroSrc = item.tiktok_url ? `/api/discovery/thumb/${item.id}` : item.image_url || item.tiktok_thumbnail_url;
  const creator = formatCreator(item.author_name);
  const description = localized(item, "description", locale) ?? item.description ?? item.alt_text ?? null;
  const script = localized(item, "salon_script", locale) ?? item.salon_script ?? null;
  const heroSaved = savedIds.has(item.id);

  const maintenanceLabel = item.maintenance ? (MAINTENANCE[locale] ?? MAINTENANCE.en)[item.maintenance] ?? null : null;
  const faceShapes = (item.face_shapes ?? []).join(", ");
  const products = (item.products_needed ?? []).join(", ");
  const hasDetails = !!(maintenanceLabel || faceShapes || products || item.cut_guide);

  const handleCopy = async () => {
    if (!script) return;
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[DetailPage] copy failed:", err);
    }
  };

  const seeAllSalonsHref = `/${locale}/${categoryRoute}?from=discovery${item.style_name ? `&style=${encodeURIComponent(item.style_name)}` : ""}`;
  const moreLikeThisHref = `/${locale}/discover?search=${encodeURIComponent(item.style_name || item.tags?.[0] || "")}`;

  return (
    <div className="mx-auto max-w-[480px] bg-white">
      {/* ─── Hero (static full frame; TikTok opens in a new tab) ─── */}
      <div className="relative w-full overflow-hidden bg-s-ink" style={{ aspectRatio: aspect }}>
        {heroSrc ? (
          <Image
            src={heroSrc}
            alt={item.alt_text || item.style_name || ""}
            fill
            priority
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-cover animate-in fade-in duration-500"
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth && img.naturalHeight) setAspect(`${img.naturalWidth} / ${img.naturalHeight}`);
            }}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-white/30">{t.noMedia}</div>
        )}

        {/* Top controls — frosted back (left) + heart (right) */}
        <div className="absolute left-[18px] right-[18px] z-10 flex items-start justify-between" style={{ top: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={t.back}
            style={FROST_GLASS}
            className="grid h-9 w-9 place-items-center rounded-full text-s-ink transition-transform duration-150 active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => handleSave(item.id)}
            aria-label={heroSaved ? t.saved : t.save}
            aria-pressed={heroSaved}
            style={FROST_GLASS}
            className="grid h-9 w-9 place-items-center rounded-full transition-transform duration-150 active:scale-95"
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

        {/* TikTok source pill — opens the original video (referential link-back, no inline embed) */}
        {isVideo && item.tiktok_url && (
          <a
            href={item.tiktok_url}
            target="_blank"
            rel="noopener noreferrer"
            style={FROST_GLASS}
            className="absolute left-[18px] bottom-[42px] z-10 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-s-ink no-underline"
          >
            TikTok
          </a>
        )}
      </div>

      {/* ─── Sheet (pulled over the hero, App-Store style) ─── */}
      <div className="relative z-[5] -mt-[26px] rounded-t-[28px] bg-white px-[18px] pt-6 pb-9 shadow-[0_-10px_28px_-16px_rgba(0,0,0,0.22)] animate-in fade-in slide-in-from-bottom-4 duration-500">

        {/* Creator + date */}
        <div className="flex items-center gap-2">
          {creator && (
            item.author_url ? (
              <a href={item.author_url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-s-accent no-underline hover:underline">@{creator}</a>
            ) : (
              <span className="text-[13px] font-medium text-s-accent">@{creator}</span>
            )
          )}
          <span className="inline-flex items-center gap-1.5 text-[12px] text-s-ink-3">
            <CalendarDays size={13} /> {formatDate(item.created_at, locale)}
          </span>
        </div>

        {/* Title */}
        {item.style_name && (
          <h1 className="mt-2.5 font-heading text-[25px] font-bold leading-[1.16] tracking-[-0.022em] text-s-ink">{item.style_name}</h1>
        )}

        {/* Tags */}
        {item.tags?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.tags.slice(0, 6).map((tag) => (
              <span key={tag} className="rounded-full bg-s-bg-sunken px-2.5 py-1 text-[12px] text-s-ink-2">{tag}</span>
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
              <ChevronDown size={15} className={`transition-transform duration-200 ${descOpen ? "rotate-180" : ""}`} />
            </button>
          </div>
        )}

        {/* "Tell your stylist" script — copy icon only */}
        {script && (
          <div className="mt-6 rounded-card bg-s-bg-sunken p-4">
            <div className="mb-2.5 flex items-center gap-2 text-[14px] font-semibold tracking-[-0.01em] text-s-ink">
              <Scissors size={15} /> {t.tellStylist}
            </div>
            <p className="m-0 text-[13.5px] leading-[1.58] text-s-ink-2">{script}</p>
            <div className="mt-3.5 flex">
              <button
                type="button"
                onClick={handleCopy}
                aria-label={t.copy}
                className="grid h-[42px] w-[42px] place-items-center rounded-full border border-s-border bg-white text-s-ink transition-transform duration-150 active:scale-95"
              >
                {copied ? <Check size={17} className="text-s-success" /> : <Copy size={17} />}
              </button>
            </div>
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
                  href={`/${locale}/salon/${s.slug}`}
                  className="flex items-center gap-3 border-t border-s-border py-3 first:border-t-0"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-s-bg-sunken font-heading text-[14px] font-bold tracking-[-0.02em] text-s-ink-2">{initials(s.name)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">{s.name}</span>
                    {s.rating != null && (
                      <span className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-s-ink-2">
                        <Star size={13} className="text-s-star" fill="currentColor" /> {s.rating.toFixed(2)}
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
                {t.seeAll} {salonTotal} Salons
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
              <DiscoveryGridSkeleton />
            ) : (
              <div className="-mx-[18px] px-1.5">
                <MasonryGrid
                  items={similar}
                  renderItem={(s) =>
                    s.media_type === "tiktok" ? (
                      <VideoCard item={s} onClick={() => router.push(`/${locale}/discover/${s.id}`)} isAuthenticated={isAuthenticated} onAuthRequired={() => router.push(`/${locale}/auth/login`)} onSave={handleSave} saved={savedIds.has(s.id)} />
                    ) : (
                      <ItemCard item={s} onClick={() => router.push(`/${locale}/discover/${s.id}`)} isAuthenticated={isAuthenticated} onAuthRequired={() => router.push(`/${locale}/auth/login`)} onSave={handleSave} saved={savedIds.has(s.id)} />
                    )
                  }
                />
              </div>
            )}
          </section>
        )}

        {/* Details — dropdown */}
        {hasDetails && (
          <div className="mt-7 border-t border-s-border">
            <button
              type="button"
              onClick={() => setDetailsOpen((o) => !o)}
              aria-expanded={detailsOpen}
              className="flex w-full items-center justify-between px-0.5 py-4"
            >
              <span className="font-heading text-[15px] font-semibold tracking-[-0.01em] text-s-ink">{t.details}</span>
              <ChevronDown size={18} className={`text-s-ink-3 transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`} />
            </button>
            {detailsOpen && (
              <div className="pb-2">
                {maintenanceLabel && <DetailRow k={t.upkeep} v={maintenanceLabel} />}
                {faceShapes && <DetailRow k={t.faces} v={faceShapes} />}
                {products && <DetailRow k={t.products} v={products} />}
                {item.cut_guide && (
                  <div className="border-t border-s-border py-2.5">
                    <p className="mb-1.5 text-[13.5px] text-s-ink-3">{t.cutGuide}</p>
                    <p className="m-0 whitespace-pre-line font-mono text-[12.5px] leading-relaxed text-s-ink-2">{item.cut_guide}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save-to-Kollektion picker — opened by the hero heart + the "more like this" hearts. */}
      <SaveToBoardSheet
        itemId={saveItemId ?? ""}
        open={!!saveItemId}
        onClose={() => setSaveItemId(null)}
        onSaved={() => { if (saveItemId) setSavedIds((prev) => new Set(prev).add(saveItemId)); }}
      />
    </div>
  );
}

function DetailRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3.5 border-t border-s-border py-2.5 text-[13.5px]">
      <span className="w-[108px] shrink-0 text-s-ink-3">{k}</span>
      <span className="flex-1 text-s-ink">{v}</span>
    </div>
  );
}
