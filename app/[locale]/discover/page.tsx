"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import CategoryTabBar from "@/components/discovery/CategoryTabBar";
import MasonryGrid from "@/components/discovery/MasonryGrid";
import ItemCard from "@/components/discovery/ItemCard";
import VideoCard from "@/components/discovery/VideoCard";
import DiscoverySearchBar from "@/components/discovery/SearchBar";
import DiscoveryGridSkeleton from "@/components/discovery/DiscoveryGridSkeleton";
import DiscoveryEmptyState from "@/components/discovery/DiscoveryEmptyState";
import ProfileSetupModal from "@/components/discovery/ProfileSetupModal";
import InlinePrefsPanel from "@/components/discovery/InlinePrefsPanel";
import FeaturedBoards from "@/components/discovery/FeaturedBoards";
import FilterDrawer from "@/components/discovery/FilterDrawer";
import DiscoveryErrorState from "@/components/discovery/DiscoveryErrorState";
import PostFromDiscover from "@/components/discovery/PostFromDiscover";
import ForYouSection from "@/components/discovery/ForYouSection";
import DiscoveryAdmin from "@/components/discovery/DiscoveryAdmin";
import FilterBar from "@/components/ui/FilterBar";
import type { DiscoveryItem, DiscoveryCategory, DiscoveryGender, DiscoveryFilters, FilterPill, ActiveFilter } from "@/lib/types";

function DiscoverPageContent() {
  const locale = useLocale();
  const router = useRouter();
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
    fetch("/api/profile")
      .then((r) => {
        if (r.ok) {
          setIsAuthenticated(true);
          return r.json().then((p: any) => {
            if (p?.role === "admin") setIsAdmin(true);
            return p;
          });
        }
        return null;
      })
      .then((p) => {
        if (p && p.disc_profile_set === false) {
          setShowProfileSetup(true);
        }
        setProfileChecked(true);
      })
      .catch(() => setProfileChecked(true));
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
    } catch {
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
    router.push(`/${locale}/discover/${item.id}`);
  };

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

  // Build filter pills
  const filterPills: FilterPill[] = [
    {
      id: "gender",
      label: "Gender",
      subFilters: [
        { id: "all", label: "All" },
        { id: "female", label: "Women" },
        { id: "male", label: "Men" },
        { id: "unisex", label: "Unisex" },
      ],
    },
    {
      id: "texture",
      label: "Texture",
      subFilters: [
        { id: "straight", label: "Straight" },
        { id: "wavy", label: "Wavy" },
        { id: "curly", label: "Curly" },
        { id: "coily", label: "Coily" },
        { id: "protective", label: "Protective" },
        { id: "bald", label: "Bald" },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg pt-4 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-coral mb-2">
              solen discover
            </p>
            <h1 className="font-heading font-bold text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.02em] text-s-ink dark:text-s-dm-text">
              Discover
            </h1>
            <p className="text-xs font-heading uppercase tracking-[.12em] text-s-ink/40 dark:text-s-dm-text/40 mt-1.5">
              Dein nächster Look
            </p>
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
        <div className="mb-6">
          <CategoryTabBar
            activeCategory={category}
            onChange={handleCategoryChange}
          />
        </div>

        {/* Universal FilterBar (Zone 1) - placed BELOW CategoryTabBar */}
        <div className="mb-6">
          <FilterBar
            pills={filterPills}
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            zone={1}
            className="mb-4"
          />
          <DiscoverySearchBar value={search} onChange={setSearch} />
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
              items={items}
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
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-s-coral/50 animate-pulse"
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
