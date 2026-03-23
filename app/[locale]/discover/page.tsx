"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import MasonryGrid from "@/components/discovery/MasonryGrid";
import ItemCard from "@/components/discovery/ItemCard";
import VideoCard from "@/components/discovery/VideoCard";
import CategoryPills from "@/components/discovery/CategoryPills";
import GenderToggle from "@/components/discovery/GenderToggle";
import DiscoverySearchBar from "@/components/discovery/SearchBar";
import DiscoveryGridSkeleton from "@/components/discovery/DiscoveryGridSkeleton";
import DiscoveryEmptyState from "@/components/discovery/DiscoveryEmptyState";
import ProfileSetupModal from "@/components/discovery/ProfileSetupModal";
import PatternSelector from "@/components/discovery/PatternSelector";
import StyleNamePills from "@/components/discovery/StyleNamePills";
import FeaturedBoards from "@/components/discovery/FeaturedBoards";
import FilterDrawer from "@/components/discovery/FilterDrawer";
import DiscoveryErrorState from "@/components/discovery/DiscoveryErrorState";
import PostFromDiscover from "@/components/discovery/PostFromDiscover";
import ForYouSection from "@/components/discovery/ForYouSection";
import DiscoveryAdmin from "@/components/discovery/DiscoveryAdmin";
import type { DiscoveryItem, DiscoveryCategory, DiscoveryGender, DiscoveryFilters } from "@/lib/types";

export default function DiscoverPage() {
  const locale = useLocale();
  const router = useRouter();

  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(false);

  // Filters
  const [category, setCategory] = useState<DiscoveryCategory | "all">("all");
  const [gender, setGender] = useState<DiscoveryGender | "all">("all");
  const [search, setSearch] = useState("");
  const [texture, setTexture] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);

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
    if (filters.gender) setGender(filters.gender);
    if (filters.texture) setTexture(filters.texture);
  };

  const hasActiveFilters = category !== "all" || gender !== "all" || texture || style;

  const resetFilters = () => {
    setCategory("all");
    setGender("all");
    setTexture(null);
    setStyle(null);
    setSearch("");
  };

  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg pt-4 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-s-ink dark:text-s-dm-text mb-1">Discover</h1>
            <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40">Find your next look</p>
          </div>
          {/* Mobile filter drawer trigger */}
          <FilterDrawer
            category={category}
            gender={gender}
            texture={texture}
            style={style}
            onCategoryChange={setCategory}
            onGenderChange={setGender}
            onTextureChange={setTexture}
            onStyleChange={setStyle}
            onReset={resetFilters}
          />
        </div>

        {/* Desktop filters */}
        <div className="hidden md:block space-y-3 mb-6">
          <DiscoverySearchBar value={search} onChange={setSearch} />
          <div className="flex items-center gap-3 flex-wrap">
            <CategoryPills selected={category} onSelect={setCategory} />
            <GenderToggle selected={gender} onSelect={setGender} />
          </div>
          <PatternSelector
            category={category === "all" ? null : category}
            selected={texture}
            onSelect={setTexture}
          />
          <StyleNamePills selected={style} onSelect={setStyle} />
        </div>

        {/* Mobile search (visible on mobile, above grid) */}
        <div className="md:hidden mb-4">
          <DiscoverySearchBar value={search} onChange={setSearch} />
        </div>

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
        )}

        {/* Infinite scroll trigger */}
        {hasMore && <div ref={observerRef} className="h-20" />}
        {loading && items.length > 0 && (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-s-coral border-t-transparent rounded-full animate-spin" />
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
