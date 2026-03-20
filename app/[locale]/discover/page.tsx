"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import DiscoveryGrid from "@/components/discovery/DiscoveryGrid";
import CategoryPills from "@/components/discovery/CategoryPills";
import GenderToggle from "@/components/discovery/GenderToggle";
import DiscoverySearchBar from "@/components/discovery/SearchBar";
import DiscoveryGridSkeleton from "@/components/discovery/DiscoveryGridSkeleton";
import DiscoveryEmptyState from "@/components/discovery/DiscoveryEmptyState";
import ProfileSetupModal from "@/components/discovery/ProfileSetupModal";
import type { DiscoveryItem, DiscoveryCategory, DiscoveryGender } from "@/lib/types";

export default function DiscoverPage() {
  const locale = useLocale();
  const router = useRouter();

  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Filters
  const [category, setCategory] = useState<DiscoveryCategory | "all">("all");
  const [gender, setGender] = useState<DiscoveryGender | "all">("all");
  const [search, setSearch] = useState("");

  // Profile setup
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // Responsive columns
  const [columns, setColumns] = useState(3);
  useEffect(() => {
    const updateCols = () => {
      const w = window.innerWidth;
      setColumns(w < 640 ? 2 : w < 1024 ? 3 : 4);
    };
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);

  // Check if profile setup needed
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
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
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "20" });
      if (category !== "all") params.set("category", category);
      if (gender !== "all") params.set("gender", gender);
      if (search) params.set("search", search);

      const res = await fetch(`/api/discovery/feed?${params}`);
      const data = await res.json();

      if (append) {
        setItems((prev) => [...prev, ...(data.items ?? [])]);
      } else {
        setItems(data.items ?? []);
      }
      setHasMore(data.has_more ?? false);
    } finally {
      setLoading(false);
    }
  }, [category, gender, search]);

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

  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg pt-4 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-heading font-bold text-s-ink dark:text-s-dm-text mb-1">Discover</h1>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40">Find your next look</p>
        </div>

        {/* Filters */}
        <div className="space-y-3 mb-6">
          <DiscoverySearchBar value={search} onChange={setSearch} />
          <div className="flex items-center gap-3 flex-wrap">
            <CategoryPills selected={category} onSelect={setCategory} />
            <GenderToggle selected={gender} onSelect={setGender} />
          </div>
        </div>

        {/* Grid */}
        {loading && items.length === 0 ? (
          <DiscoveryGridSkeleton />
        ) : items.length === 0 ? (
          <DiscoveryEmptyState />
        ) : (
          <DiscoveryGrid
            items={items}
            columns={columns}
            onItemClick={handleItemClick}
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

      {/* Profile setup modal on first visit */}
      <ProfileSetupModal
        open={showProfileSetup}
        onClose={() => setShowProfileSetup(false)}
        onSave={handleProfileSave}
      />
    </main>
  );
}
