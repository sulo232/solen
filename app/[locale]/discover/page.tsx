"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import CategoryTabBar from "@/components-legacy/discovery/CategoryTabBar";
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
import DiscoveryErrorState from "@/components-legacy/discovery/DiscoveryErrorState";
import PostFromDiscover from "@/components-legacy/discovery/PostFromDiscover";
import ForYouSection from "@/components-legacy/discovery/ForYouSection";
import AISuggestionPills from "@/components-legacy/discovery/AISuggestionPills";
import DiscoveryAdmin from "@/components-legacy/discovery/DiscoveryAdmin";
import FilterBar from "@/components-legacy/ui/FilterBar";
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
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const [gridVisible, setGridVisible] = useState(true);

  // Derive filter values from activeFilters
  const gender = activeFilters.find((f) => f.pillId === "gender")?.subId as DiscoveryGender | undefined || "all";
  const texture = activeFilters.find((f) => f.pillId === "texture")?.subId || null;
  const style = activeFilters.find((f) => f.pillId === "style")?.subId || null;

  const handleCategoryChange = (key: string) => {
    setGridVisible(false);
    setTimeout(() => {
      setCategory(key as DiscoveryCategory | "all");
      setGridVisible(true);
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      if (key === "all") {
        params.delete("category");
      } else {
        params.set("category", key);
      }
      router.push(`?${params.toString()}`, { scroll: false });
    }, 80);
  };

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

  // Fetch items
  const fetchItems = useCallback(async (pageNum: number, append = false) => {
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
        {/* Header */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            {/* V3-D341 (W13): h1 tracking → H2 recipe §2.5. V3-D378 (2026-05-30): subtitle eyebrow dropped per §2.5 V3-D331
                (eyebrows preferred-dropped — it's the decorative "AI landing-page" tell the policy targets; reclaims ~24px so
                the feed surfaces higher). Title now stands alone. */}
            <h1 className="font-heading font-semibold text-[clamp(22px,2.8vw,26px)] leading-[1.05] tracking-[-0.015em] text-s-ink">
              {t("title")}
            </h1>
          </div>
          {/* Mobile filter drawer trigger */}
          <FilterDrawer
            category={category}
            gender={gender}
            texture={texture}
            style={style}
            onCategoryChange={setCategory}
            onGenderChange={(g) => {
              const newFilters = activeFilters.filter((f) => f.pillId !== "gender");
              if (g !== "all") {
                newFilters.push({ pillId: "gender", subId: g, label: g });
              }
              setActiveFilters(newFilters);
            }}
            onTextureChange={(t) => {
              const newFilters = activeFilters.filter((f) => f.pillId !== "texture");
              if (t) {
                newFilters.push({ pillId: "texture", subId: t, label: t });
              }
              setActiveFilters(newFilters);
            }}
            onStyleChange={(s) => {
              const newFilters = activeFilters.filter((f) => f.pillId !== "style");
              if (s) {
                newFilters.push({ pillId: "style", subId: s, label: s });
              }
              setActiveFilters(newFilters);
            }}
            onReset={resetFilters}
          />
        </div>

        {/* Category tab row */}
        <div className="mb-3">
          <CategoryTabBar
            activeCategory={category}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Secondary filters (gender / texture) — V3-D378 (2026-05-30): desktop-only inline. On mobile these live in the
            FILTER drawer (md:hidden trigger in the header), so the page no longer renders BOTH the drawer button AND the
            inline pills. Removes the redundant mobile control row + surfaces the feed higher. */}
        <div className="hidden md:block mb-3">
          <FilterBar
            pills={filterPills}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            zone={1}
          />
        </div>

        {/* Search — V3-D388 (2026-05-30): trending suggestions folded in here (council #4: removes the second
            always-visible pill row that mirrored the category pills). They drop down on focus, not as a standing row. */}
        <div className="relative mb-5">
          <DiscoverySearchBar
            value={search}
            onChange={setSearch}
            placeholder={t("searchPlaceholder")}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
          />
          {searchFocused && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 rounded-2xl border border-s-border bg-white p-3 shadow-elevation-2">
              <AISuggestionPills
                category={category}
                onSelect={(term) => { setSearch(term); setSearchFocused(false); }}
              />
            </div>
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
          <div
            className="transition-opacity duration-150"
            style={{ opacity: gridVisible ? 1 : 0 }}
          >
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
          </div>
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
