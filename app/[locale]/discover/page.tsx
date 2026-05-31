"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import MasonryGrid from "@/components-legacy/discovery/MasonryGrid";
import ItemCard from "@/components-legacy/discovery/ItemCard";
import VideoCard from "@/components-legacy/discovery/VideoCard";
import DiscoverySearchBar from "@/components-legacy/discovery/SearchBar";
import DiscoveryGridSkeleton from "@/components-legacy/discovery/DiscoveryGridSkeleton";
import DiscoveryEmptyState from "@/components-legacy/discovery/DiscoveryEmptyState";
import ProfileSetupModal from "@/components-legacy/discovery/ProfileSetupModal";
import InlinePrefsPanel from "@/components-legacy/discovery/InlinePrefsPanel";
import FeaturedBoards from "@/components-legacy/discovery/FeaturedBoards";
import FilterDrawer from "@/components-legacy/discovery/FilterDrawer";
import PatternSelector from "@/components-legacy/discovery/PatternSelector";
import DiscoveryErrorState from "@/components-legacy/discovery/DiscoveryErrorState";
import PostFromDiscover from "@/components-legacy/discovery/PostFromDiscover";
import ForYouSection from "@/components-legacy/discovery/ForYouSection";
import AISuggestionPills from "@/components-legacy/discovery/AISuggestionPills";
import SearchAutocomplete from "@/components-legacy/discovery/SearchAutocomplete";
import DiscoveryAdmin from "@/components-legacy/discovery/DiscoveryAdmin";
import { ArrowLeft, ChevronDown } from "lucide-react";
import type { DiscoveryItem, DiscoveryCategory, DiscoveryGender, DiscoveryFilters, FilterPill, ActiveFilter } from "@/lib/types";

// PROOF (frontend-only, V3-D389): seeded salon-portfolio discovery items to preview how OPTED-IN salon photos would
// render in the feed — studio attribution + tap→salon + varied aspect ratios (900×650, 700×700, 640×860). Images are
// picsum placeholders; real salons + slugs. NO DB / NO sync. Remove this const + its prepend + the picsum allowlist in
// next.config when the real opt-in sync lands.
const PROOF_SALON_ITEMS = [
  { id: "proof-salon-1", source: "salon", content_type: "salon", media_type: "photo", category: "hair",
    image_url: "https://picsum.photos/seed/solensalon1/900/650", tiktok_url: null, tiktok_embed_html: null,
    author_name: "Muse Beauty Studio", salon_slug: "muse-beauty-studio", style_name: "Balayage",
    tags: ["balayage"], like_count: 0, alt_text: "Balayage — Muse Beauty Studio" },
  { id: "proof-salon-2", source: "salon", content_type: "salon", media_type: "photo", category: "nails",
    image_url: "https://picsum.photos/seed/solensalon2/700/700", tiktok_url: null, tiktok_embed_html: null,
    author_name: "Nail Studio Bliss", salon_slug: "nail-studio-bliss", style_name: "Gel Nails",
    tags: ["gel nails"], like_count: 0, alt_text: "Gel nails — Nail Studio Bliss" },
  { id: "proof-salon-3", source: "salon", content_type: "salon", media_type: "photo", category: "hair",
    image_url: "https://picsum.photos/seed/solensalon3/640/860", tiktok_url: null, tiktok_embed_html: null,
    author_name: "Old Town Barbers", salon_slug: "old-town-barbers", style_name: "Skin Fade",
    tags: ["skin fade"], like_count: 0, alt_text: "Skin fade — Old Town Barbers" },
] as unknown as DiscoveryItem[];

// V3-D404 (user): photo-backed quick chips — a feed thumbnail behind a style label, tap to search/filter. Same visual
// style as the original Kurz/Pflege chips, just more of them. The photo is the Nth loaded feed thumbnail (not a
// per-style image yet — a real per-style image library is a separate, data-dependent step).
const QUICK_CHIPS: { label: string; search: string }[] = [
  { label: "Kurz", search: "kurze Haare" },
  { label: "Pflege", search: "Pflege" },
  { label: "Wolf Cut", search: "Wolf Cut" },
  { label: "Buzz Cut", search: "Buzz Cut" },
  { label: "Skin Fade", search: "Skin Fade" },
  { label: "Bob", search: "Bob" },
  { label: "Balayage", search: "Balayage" },
  { label: "Curtain Bangs", search: "Curtain Bangs" },
  { label: "Layers", search: "Layers" },
];

function DiscoverPageContent() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("discover");
  const searchParams = useSearchParams();

  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  // Filters
  const [category, setCategory] = useState<DiscoveryCategory | "all">(
    (searchParams?.get("category") as DiscoveryCategory | "all") || "all"
  );
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [patternOpen, setPatternOpen] = useState(false); // V3-D397: Hair-pattern pill dropdown
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  // Derive filter values from activeFilters
  const gender = activeFilters.find((f) => f.pillId === "gender")?.subId as DiscoveryGender | undefined || "all";
  const texture = activeFilters.find((f) => f.pillId === "texture")?.subId || null;
  const style = activeFilters.find((f) => f.pillId === "style")?.subId || null;

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Profile setup
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // (MasonryGrid handles responsive columns internally)

  // Check if profile setup needed + auth state
  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile")
      .then((r) => {
        if (r.ok) {
          if (!cancelled) setIsAuthenticated(true);
          return r.json().then((p: any) => {
            if (!cancelled && p?.role === "admin") setIsAdmin(true);
            return p;
          });
        }
        return null;
      })
      .then((p) => {
        if (cancelled) return;
        if (p && p.disc_profile_set === false) {
          setShowProfileSetup(true);
        }
        setProfileChecked(true);
      })
      .catch(() => { if (!cancelled) setProfileChecked(true); });
    return () => { cancelled = true; };
  }, []);

  // Fetch items — V3-D402 (perf): session cache keyed by the filter signature. Re-tapping a filter combo you've
  // already loaded restores its page-1 results instantly (no network, no grid flash) instead of a ~700ms refetch.
  const feedCache = useRef<Map<string, { items: DiscoveryItem[]; hasMore: boolean }>>(new Map());
  const fetchItems = useCallback(async (pageNum: number, append = false) => {
    const sig = JSON.stringify({ category, gender, search, texture, style });
    // Cache-first for the initial page of a combo → instant repeat taps, no loading flash.
    if (pageNum === 1 && !append) {
      const cached = feedCache.current.get(sig);
      if (cached) {
        setItems(cached.items);
        setHasMore(cached.hasMore);
        setError(false);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "12" });
      if (category !== "all") params.set("category", category);
      if (gender !== "all") params.set("gender", gender);
      if (search) params.set("search", search);
      if (texture) params.set("texture", texture);
      if (style) params.set("style", style);

      const res = await fetch(`/api/discovery/feed?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();

      if (append) {
        setItems((prev) => [...prev, ...(data.items ?? [])]);
      } else {
        setItems(data.items ?? []);
        // Cache only the initial page of a combo (infinite-scroll pages stay live).
        feedCache.current.set(sig, { items: data.items ?? [], hasMore: data.has_more ?? false });
      }
      setHasMore(data.has_more ?? false);
    } catch (err) {
      // V3-D343 (W17, 2026-05-28): informative log added per CLAUDE.md error-handling rule.
      console.error("[Discover] feed fetch failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [category, gender, search, texture, style]);

  // Reset and fetch on filter change
  useEffect(() => {
    setPage(1);
    fetchItems(1);
  }, [fetchItems]);

  // Infinite scroll
  const observerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchItems(nextPage, true);
        }
      },
      { threshold: 0.1 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, fetchItems]);

  const handleItemClick = (item: DiscoveryItem) => {
    // V3-D389: salon-sourced items tap through to the salon page, not a discovery detail.
    if ((item.source === "salon" || item.content_type === "salon") && item.salon_slug) {
      router.push(`/${locale}/salon/${item.salon_slug}`);
      return;
    }
    router.push(`/${locale}/discover/${item.id}`);
  };

  // V3-D389 PROOF: prepend the seeded salon items in the default "all" feed only (contextual, not inside every filter).
  const feedItems = category === "all" ? [...PROOF_SALON_ITEMS, ...items] : items;

  // V3-D404 (user): photo-backed quick chips — one feed thumbnail per QUICK_CHIPS entry (was just 2: Kurz/Pflege).
  const chipPhotos = items.slice(0, QUICK_CHIPS.length).map((it) =>
    it.tiktok_url ? `/api/discovery/thumb/${it.id}` : (it.image_url || it.tiktok_thumbnail_url || null)
  );

  const handleProfileSave = async (prefs: Record<string, string | null>) => {
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disc_gender: prefs.disc_gender,
          disc_hair_texture: prefs.disc_hair_texture,
          disc_hair_length: prefs.disc_hair_length,
          disc_face_shape: prefs.disc_face_shape,
          disc_profile_set: true,
        }),
      });
    } catch { /* best effort */ }
  };

  const handleBoardSelect = (filters: Partial<DiscoveryFilters>) => {
    // V3-D346 (Move 1): boards carry a keyword in `search` — apply it so the tile filters the feed.
    if (filters.search !== undefined) setSearch(filters.search);
    if (filters.category) setCategory(filters.category);
    const newFilters: ActiveFilter[] = [];
    if (filters.gender && filters.gender !== "all") {
      newFilters.push({ pillId: "gender", subId: filters.gender, label: filters.gender });
    }
    if (filters.texture) {
      newFilters.push({ pillId: "texture", subId: filters.texture, label: filters.texture });
    }
    setActiveFilters(newFilters);
  };

  const hasActiveFilters = category !== "all" || activeFilters.length > 0;

  const resetFilters = () => {
    setCategory("all");
    setActiveFilters([]);
    setSearch("");
  };

  // Build filter pills — labels from translations (Issues C + D)
  const tGender = useTranslations("discover.gender");
  const filterPills: FilterPill[] = [
    {
      id: "gender",
      label: t("genderPill"),
      subFilters: [
        { id: "all",      label: tGender("all") },
        { id: "female",   label: tGender("women") },
        { id: "male",     label: tGender("men") },
        { id: "unisex",   label: tGender("unisex") },
      ],
    },
    {
      id: "texture",
      label: t("texturePill"),
      subFilters: [
        { id: "straight",   label: "Straight" },
        { id: "wavy",       label: "Wavy" },
        { id: "curly",      label: "Curly" },
        { id: "coily",      label: "Coily" },
        { id: "protective", label: "Protective" },
        { id: "bald",       label: "Bald" },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-white pt-4 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header — title only. V3-D392 (2026-05-30): V1 (Pinterest) layout — the filter moved to a sliders button on
            the category row, and search is promoted to the top of the filter zone. */}
        <div className="mb-3">
          <h1 className="font-heading font-semibold text-[clamp(22px,2.8vw,26px)] leading-[1.05] tracking-[-0.015em] text-s-ink">
            {t("title")}
          </h1>
        </div>

        {/* Search (V1: top of the filter zone). V4: a cancel-arrow appears left on focus (Pinterest), and the trending
            suggestions drop down. Tap the arrow to clear + exit search. */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2">
            {/* V3-D392: always rendered (toggle `hidden`, not presence) — a conditional sibling BEFORE the input would
                remount it on focus and drop focus, resetting searchFocused. */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); setSearch(""); setSearchFocused(false); (document.activeElement as HTMLElement | null)?.blur?.(); }}
              aria-label={t("clearSearch")}
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-s-border text-s-ink-2 transition-colors duration-150 hover:text-s-ink ${searchFocused ? "" : "hidden"}`}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
              <DiscoverySearchBar
                value={search}
                onChange={setSearch}
                placeholder={t("searchPlaceholder")}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              />
            </div>
            {/* V3-D399 (measured Pinterest): tune/filter icon BESIDE the search bar (not after the category pills). */}
            <FilterDrawer
              category={category}
              gender={gender}
              texture={texture}
              style={style}
              onCategoryChange={setCategory}
              onGenderChange={(g) => {
                const next = activeFilters.filter((f) => f.pillId !== "gender");
                if (g !== "all") next.push({ pillId: "gender", subId: g, label: g });
                setActiveFilters(next);
              }}
              onTextureChange={(tx) => {
                const next = activeFilters.filter((f) => f.pillId !== "texture");
                if (tx) next.push({ pillId: "texture", subId: tx, label: tx });
                setActiveFilters(next);
              }}
              onStyleChange={(s) => {
                const next = activeFilters.filter((f) => f.pillId !== "style");
                if (s) next.push({ pillId: "style", subId: s, label: s });
                setActiveFilters(next);
              }}
              onReset={resetFilters}
            />
          </div>
          {searchFocused && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-s-border bg-white p-3 shadow-elevation-2">
              {/* V3-D395: typed query → autocomplete suggestion list (matches the mockup); empty → trending pills. */}
              {search.trim() ? (
                <SearchAutocomplete
                  query={search}
                  onSelect={(term) => { setSearch(term); setSearchFocused(false); }}
                />
              ) : (
                <AISuggestionPills
                  category={category}
                  onSelect={(term) => { setSearch(term); setSearchFocused(false); }}
                />
              )}
            </div>
          )}
        </div>

        {/* V3-D401 (user): category tabs REMOVED; the texture chip row takes their slot as the primary filter row.
            Category is still switchable via the tune/filter sheet (FilterDrawer → CategoryPills). */}
        <div className="relative mb-5">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4">
              {/* texture chip — dark when a pattern is picked (shows the pattern name), grey "Textur" otherwise */}
              <button
                type="button"
                onClick={() => setPatternOpen((o) => !o)}
                aria-expanded={patternOpen}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-pill px-3.5 py-2 text-xs font-heading font-medium transition-colors duration-150 ${
                  texture
                    ? "bg-s-ink text-white"
                    : "bg-s-bg-sunken text-s-ink border border-s-border hover:bg-s-ink/[0.06]"
                }`}
              >
                {texture ? texture.charAt(0).toUpperCase() + texture.slice(1) : t("texture")}
                <ChevronDown size={14} className={`transition-transform duration-150 ${patternOpen ? "rotate-180" : ""}`} />
              </button>
              {/* V3-D404 (user): photo-backed quick chips — feed thumbnail + style label, tap to filter. Same visual
                  style as the original Kurz/Pflege, just more of them. Each renders only when a backing thumbnail exists. */}
              {QUICK_CHIPS.map((chip, i) => {
                const photo = chipPhotos[i];
                if (!photo) return null;
                return (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setSearch(chip.search)}
                    className="relative h-10 w-[94px] shrink-0 overflow-hidden rounded-[14px]"
                    aria-label={chip.label}
                  >
                    <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-b from-s-ink/10 to-s-ink/55" />
                    <span className="absolute bottom-1.5 left-2.5 z-10 font-heading text-[13px] font-semibold text-white" style={{ textShadow: "0 1px 3px rgba(0,0,0,.55)" }}>{chip.label}</span>
                  </button>
                );
              })}
            </div>
            {patternOpen && (
              <>
                {/* click-away */}
                <div className="fixed inset-0 z-20" onClick={() => setPatternOpen(false)} />
                <div className="absolute left-0 top-full z-30 mt-2 rounded-2xl border border-s-border bg-white p-3 shadow-elevation-2">
                  <PatternSelector
                    category="hair"
                    heading=""
                    selected={texture}
                    onSelect={(tx) => {
                      const next = activeFilters.filter((f) => f.pillId !== "texture");
                      if (tx) next.push({ pillId: "texture", subId: tx, label: tx });
                      setActiveFilters(next);
                      setPatternOpen(false);
                    }}
                  />
                </div>
              </>
            )}
        </div>

        {/* Inline preferences setup (shown when profile not configured) */}
        {profileChecked && showProfileSetup && (
          <div className="mb-6">
            <InlinePrefsPanel
              onSave={handleProfileSave}
              onDismiss={() => setShowProfileSetup(false)}
            />
          </div>
        )}

        {/* Admin panel (admin-only) */}
        {isAdmin && <DiscoveryAdmin />}

        {/* Featured boards (only when no filters active) */}
        {!hasActiveFilters && !search && (
          <FeaturedBoards onBoardSelect={handleBoardSelect} />
        )}

        {/* For You personalization (authenticated + no filters) */}
        {isAuthenticated && !hasActiveFilters && !search && (
          <ForYouSection />
        )}

        {/* Grid */}
        {error ? (
          <DiscoveryErrorState onRetry={() => fetchItems(1)} />
        ) : loading && items.length === 0 ? (
          <DiscoveryGridSkeleton />
        ) : items.length === 0 ? (
          <DiscoveryEmptyState />
        ) : (
          <MasonryGrid
            items={feedItems}
            renderItem={(item, width) =>
              item.media_type === "tiktok" ? (
                <VideoCard
                  item={item}
                  onClick={() => handleItemClick(item)}
                  isAuthenticated={isAuthenticated}
                />
              ) : (
                <ItemCard
                  item={item}
                  onClick={() => handleItemClick(item)}
                  isAuthenticated={isAuthenticated}
                />
              )
            }
          />
        )}

        {/* Infinite scroll trigger */}
        {hasMore && <div ref={observerRef} className="h-20" />}
        {loading && items.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 py-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-s-ink/50 animate-pulse"
                style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
        )}
      </div>

      {/* Floating post button */}
      <PostFromDiscover isAuthenticated={isAuthenticated} />

      {/* Profile setup modal on first visit */}
      <ProfileSetupModal
        open={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onSave={handleProfileSave}
      />
    </main>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoveryGridSkeleton />}>
      <DiscoverPageContent />
    </Suspense>
  );
}
