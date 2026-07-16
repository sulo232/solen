"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import dynamic from "next/dynamic";
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
import FilterDrawer from "@/components-legacy/discovery/FilterDrawer";
import { DISCOVERY_CATEGORIES } from "@/components-legacy/discovery/CategoryTabBar";
import DiscoveryErrorState from "@/components-legacy/discovery/DiscoveryErrorState";
import PostFromDiscover from "@/components-legacy/discovery/PostFromDiscover";
import AISuggestionPills from "@/components-legacy/discovery/AISuggestionPills";
import SearchAutocomplete from "@/components-legacy/discovery/SearchAutocomplete";
import RecentSearches from "@/components-legacy/discovery/RecentSearches";
import { Heart } from "lucide-react";
import type { DiscoveryItem, DiscoveryCategory, DiscoveryGender, FilterPill, ActiveFilter } from "@/lib/types";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

// B4 load audit (2026-07-04, finding #5): admin-only panel, render-gated by isAdmin already ,
// dynamic-import so its 15.3KB never ships to the non-admin cohort (same dynamic() pattern as
// SalonTeam.tsx:12 / MapView).
const DiscoveryAdmin = dynamic(() => import("@/components-legacy/discovery/DiscoveryAdmin"), { ssr: false });

// (Removed PROOF_SALON_ITEMS , the 3 hardcoded picsum salon previews. Real content now fills the feed, and the fake
//  salon names/images were the "wrong images / wrong names" the owner flagged. Salon opt-in sync is the real path.)

// V3-D407 (#22): quick-chip labels are now DATA-DRIVEN — fetched from /api/discovery/chip-terms (the top style
// tags in the actual content), so chips always lead to populated results and self-update as content grows. This
// replaces the hardcoded list (Skin Fade / Buzz / Bob) that matched zero items. Photo backing is still the Nth
// feed thumbnail (same approved visual; a real per-style image library is a separate, data-dependent step).
// formatChip turns a raw tag ("textured-crop") into a display label ("Textured Crop").
const formatChip = (term: string): string =>
  term.split(/[-\s]+/).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

function DiscoverPageContent() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("discover");
  const tTabs = useTranslations("discover.tabs") as any; // category-pill labels (dynamic key)
  const searchParams = useSearchParams() ?? new URLSearchParams();

  const [items, setItems] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  // ig3 (2026-07-16): keyset cursor from the general browse branch's response (discovery_feed_v2).
  // Branches that don't return one yet (search / logged-in for-you) leave this null and the
  // observer falls back to the page/offset increment below, unaffected.
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState(false);

  // Filters
  const [category, setCategory] = useState<DiscoveryCategory | "all">(
    (searchParams?.get("category") as DiscoveryCategory | "all") || "all"
  );
  // `?search=` deep-link (e.g. from the global search overlay's Looks strip) seeds a committed
  // query so the feed lands pre-filtered, same pattern as `category` above. Empty when absent.
  const initialSearch = (searchParams?.get("search")?.trim() || "").slice(0, 100);
  const [search, setSearch] = useState(initialSearch);       // committed query: drives the feed + search logging
  const [searchInput, setSearchInput] = useState(initialSearch);  // V3-D414: live text drives ONLY the dropdown; typing no longer auto-searches/logs
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);
  // V3-D407/408 (#22): data-driven quick chips — top style tags from real content, each with a representative
  // photo OF that style (not a generic feed thumbnail). Fetched once; stable across filter taps.
  const [chipTerms, setChipTerms] = useState<{ term: string; thumb: string }[]>([]);
  // Owner 2026-06-23 (Option C, inventory-aware): each category pill shows a REAL look photo from that category's
  // own content (via the persisted /api/discovery/thumb proxy), NOT an illustration. A category with zero looks
  // (nails/lashes/brows today) gets NO photo , it falls back to a plain text pill until real content lands, when
  // its cover appears automatically. count + cover are fetched once below. No illustrations, no mismatched photos.
  const [categoryMeta, setCategoryMeta] = useState<Record<string, { count: number; cover: string | null }>>({});
  // Owner 2026-06-23: order the category pills by the viewer's CATEGORY affinity (the DNA point system) , the
  // category they engage with most slides left. "Alle" stays first; cold / logged-out keeps the default order.
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const orderedCategories = [...DISCOVERY_CATEGORIES].sort((a, b) => {
    if (a.key === "all") return -1;
    if (b.key === "all") return 1;
    const ra = categoryOrder.indexOf(a.key), rb = categoryOrder.indexOf(b.key);
    return (ra === -1 ? Infinity : ra) - (rb === -1 ? Infinity : rb);
  });

  // Derive filter values from activeFilters
  const gender = activeFilters.find((f) => f.pillId === "gender")?.subId as DiscoveryGender | undefined || "all";
  const texture = activeFilters.find((f) => f.pillId === "texture")?.subId || null;
  const style = activeFilters.find((f) => f.pillId === "style")?.subId || null;

  // Progressive drill-down cut TAGS (drill.html L2): selected discovery_items.tags values, threaded into the feed
  // as the `tags` param → discovery_feed(p_tags_any). Multi-select; an array, so it lives in its own state rather
  // than activeFilters (which is single-value-per-pill).
  const [cuts, setCuts] = useState<string[]>([]);

  // DNA pre-select source (mockup E): the viewer's saved profile values, used to seed the gender/hair-type pills the
  // first time the sheet opens (only when those filters are still unset, never overrides a manual choice).
  const [dnaGender, setDnaGender] = useState<DiscoveryGender | null>(null);
  const [dnaTexture, setDnaTexture] = useState<string | null>(null);
  const [dnaLength, setDnaLength] = useState<string | null>(null);

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Save-to-lookbook gesture (feed-save mockup): tapping a tile's heart opens the picker for THAT item.
  // `savedIds` fills the heart for looks the user saved THIS session (a real action just taken, never fabricated).
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  // Profile setup
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // (MasonryGrid handles responsive columns internally)

  // Check if profile setup needed + auth state.
  // Gate /api/profile behind a client-side session check: a guest (no session) has no profile, so firing the
  // auth-only request just 401s and logs a console error on every Discover visit. getSession() reads the
  // locally-stored session (no network, no 401); only attempt the profile load when a session exists.
  useEffect(() => {
    let cancelled = false;
    createBrowserSupabaseClient().auth.getSession().then(({ data: { session } }) => {
      if (cancelled) return;
      if (!session) { setProfileChecked(true); return; }
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
          // DNA pre-select source for the filter sheet (mockup E): seed pills from the saved profile.
          if (p) {
            if (p.disc_gender) setDnaGender(p.disc_gender as DiscoveryGender);
            if (p.disc_hair_texture) setDnaTexture(p.disc_hair_texture as string);
            if (p.disc_hair_length) setDnaLength(p.disc_hair_length as string);
          }
          setProfileChecked(true);
        })
        .catch(() => { if (!cancelled) setProfileChecked(true); });
    });
    return () => { cancelled = true; };
  }, []);

  // Data-driven quick-chip terms, now PER CATEGORY (owner 2026-06-23): refetch when the selected category changes,
  // so Haare shows hair tags and Nägel shows nail finishes (not one global mixed list). "all" -> global top tags.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/discovery/chip-terms?category=${encodeURIComponent(category)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && Array.isArray(d?.terms)) setChipTerms(d.terms.slice(0, 9)); })
      .catch((err) => console.error("[Discover] chip-terms load failed:", err));
    return () => { cancelled = true; };
  }, [category]);

  // Owner 2026-06-23 (Option C, inventory-aware): fetch each category's real count + cover ONCE.
  // Perf fix: replaced 5 parallel discovery_feed RPC calls (each running window count(*)) with a
  // single /api/discovery/category-meta call that does 4 lightweight indexed .limit(1) selects
  // + 1 six-row global select in parallel on the server, then returns the full {key:{count,cover}}
  // map in one response. "Alle" = unfiltered pool (3rd item to avoid twinning the Haare tile).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/discovery/category-meta")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d?.meta && typeof d.meta === "object") {
          setCategoryMeta(d.meta);
        }
      })
      .catch((err) => console.error("[Discover] category-meta load failed:", err));
    return () => { cancelled = true; };
  }, []);

  // Viewer's DNA category order (empty for logged-out / cold -> pills keep default order).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/discovery/category-order")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && Array.isArray(d?.order)) setCategoryOrder(d.order); })
      .catch((err) => console.error("[Discover] category order load failed:", err));
    return () => { cancelled = true; };
  }, []);

  // Fetch items — V3-D402 (perf): session cache keyed by the filter signature. Re-tapping a filter combo you've
  // already loaded restores its page-1 results instantly (no network, no grid flash) instead of a ~700ms refetch.
  const feedCache = useRef<Map<string, { items: DiscoveryItem[]; hasMore: boolean; nextCursor: string | null }>>(new Map());
  // ig3 (2026-07-16): fetchItems still takes pageNum (unchanged first-load / legacy-branch shape),
  // plus an optional cursor. When a cursor is passed, the route pages the general browse branch by
  // KEYSET instead of the page's OFFSET, so a mid-scroll ingest-cron insert can't shift the offset
  // and repeat the last card. `page` param still rides along for branches without a cursor yet
  // (search / logged-in for-you); the route ignores it whenever a cursor is present.
  const fetchItems = useCallback(async (pageNum: number, append = false, cursor: string | null = null) => {
    const sig = JSON.stringify({ category, gender, search, texture, style, cuts });
    // Cache-first for the initial page of a combo → instant repeat taps, no loading flash.
    if (pageNum === 1 && !append) {
      const cached = feedCache.current.get(sig);
      if (cached) {
        setItems(cached.items);
        setHasMore(cached.hasMore);
        setNextCursor(cached.nextCursor);
        setError(false);
        setLoading(false);
        return;
      }
    }
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({ page: String(pageNum), limit: "12" });
      if (cursor) params.set("cursor", cursor);
      if (category !== "all") params.set("category", category);
      if (gender !== "all") params.set("gender", gender);
      if (search) params.set("search", search);
      if (texture) params.set("texture", texture);
      if (style) params.set("style", style);
      // Progressive drill-down cuts → tag overlap filter. The route forwards `tags` to discovery_feed(p_tags_any),
      // which filters by di.tags && p_tags_any (a look matches if it has ANY selected cut tag). Comma-joined.
      if (cuts.length) params.set("tags", cuts.join(","));

      const res = await fetch(`/api/discovery/feed?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();

      if (append) {
        // De-dupe by id: when new looks are inserted (e.g. live imports), offset-paged results overlap, which made
        // the SAME look appear twice ("multiple same picture"). Drop any incoming look we already have.
        setItems((prev) => {
          const seen = new Set(prev.map((i) => i.id));
          return [...prev, ...((data.items ?? []) as DiscoveryItem[]).filter((i) => !seen.has(i.id))];
        });
      } else {
        setItems(data.items ?? []);
        // Cache only the initial page of a combo (infinite-scroll pages stay live).
        feedCache.current.set(sig, { items: data.items ?? [], hasMore: data.has_more ?? false, nextCursor: data.next_cursor ?? null });
      }
      setHasMore(data.has_more ?? false);
      setNextCursor(data.next_cursor ?? null);
    } catch (err) {
      // V3-D343 (W17, 2026-05-28): informative log added per CLAUDE.md error-handling rule.
      console.error("[Discover] feed fetch failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [category, gender, search, texture, style, cuts]);

  // Reset and fetch on filter change
  useEffect(() => {
    setPage(1);
    setNextCursor(null);
    fetchItems(1);
  }, [fetchItems]);

  // Infinite scroll. ig3 (2026-07-16): prefer the keyset cursor from the previous response over
  // incrementing page (avoids the offset-shift-under-concurrent-insert bug). Branches that don't
  // hand back a cursor keep the page/offset fallback, unchanged.
  const observerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchItems(nextPage, true, nextCursor);
        }
      },
      { threshold: 0.1 }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, page, nextCursor, fetchItems]);

  const handleItemClick = (item: DiscoveryItem) => {
    // V3-D389: salon-sourced items tap through to the salon page, not a discovery detail.
    if ((item.source === "salon" || item.content_type === "salon") && item.salon_slug) {
      router.push(`/${locale}/salon/${item.salon_slug}`);
      return;
    }
    router.push(`/${locale}/inspo/${item.id}`);
  };

  // Heart tapped while signed in → plain save toggle (no board picker; collections ditched 2026-06-23).
  // Optimistic, then reconcile to the server's authoritative state from the toggle RPC.
  const handleSave = async (itemId: string) => {
    const wasSaved = savedIds.has(itemId);
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (wasSaved) next.delete(itemId); else next.add(itemId);
      return next;
    });
    try {
      const res = await fetch("/api/discovery/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });
      if (!res.ok) throw new Error(`save ${res.status}`);
      const json = await res.json().catch(() => null);
      if (json && typeof json.saved === "boolean") {
        setSavedIds((prev) => {
          const next = new Set(prev);
          if (json.saved) next.add(itemId); else next.delete(itemId);
          return next;
        });
      }
    } catch (err) {
      console.error("[inspo] save toggle failed:", err);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.add(itemId); else next.delete(itemId);
        return next;
      });
    }
  };
  // Heart tapped while signed out → send to login (saving requires an account).
  const handleAuthRequired = () => router.push(`/${locale}/auth/login`);

  // Commit a real (non-empty) search: drive the feed + close the dropdown AND persist the term to localStorage so
  // recent-searches work logged-OUT too (the DB history is per-user/logged-in only). Dedup case-insensitively,
  // most-recent-first, cap 8. SSR-guarded. The chip-row tag refine does NOT route through here (owner: a tag must
  // not land in the search bar), so only typed/picked searches are remembered.
  const commitSearch = (raw: string) => {
    // Cap length to mirror the API's max(100): a crafted ?search=<huge> deep-link would
    // otherwise write an unbounded string into localStorage (local storage-quota abuse).
    const term = raw.trim().slice(0, 100);
    setSearch(term);
    setSearchInput(term);
    setSearchFocused(false);
    // FIX 3: search and cuts are mutually exclusive (the search path has no tag param, so an active cut would be
    // silently dropped). Committing a real search clears the cut selection.
    if (term) setCuts([]);
    if (!term || typeof window === "undefined") return;
    try {
      const prev: string[] = JSON.parse(window.localStorage.getItem("inspo:recent-searches") || "[]");
      const next = [term, ...prev.filter((t) => t.toLowerCase() !== term.toLowerCase())].slice(0, 8);
      window.localStorage.setItem("inspo:recent-searches", JSON.stringify(next));
    } catch (err) {
      console.error("[inspo] recent-searches localStorage write failed:", err);
    }
  };

  // V3-D389 PROOF: prepend the seeded salon items in the default "all" feed only (contextual, not inside every filter).
  const feedItems = items;

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

  // Category is a SELECTOR, not a filter (owner 2026-06-23): picking Haare scopes the feed but is NOT an "active
  // filter". hasActiveFilters reflects only the filter sheet (gender) + chip-row refinements, never the category.
  const hasActiveFilters = activeFilters.length > 0;

  const resetFilters = () => {
    setCategory("all");
    setActiveFilters([]);
    setCuts([]);
    setSearch("");
    setSearchInput("");
  };

  return (
    <main className="min-h-screen bg-white pt-1.5 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        {/* V3-D410 (user): the page title ("Entdecken") + a "Solen › Entdecken" breadcrumb now live in the global
            header's logo slot (see Header.tsx, route-gated to /inspo) — so the standalone h1 here is removed to
            stop the title stacking under the wordmark. */}

        {/* Search (V1: top of the filter zone). V4: a cancel-arrow appears left on focus (Pinterest), and the trending
            suggestions drop down. Tap the arrow to clear + exit search. */}
        <div className="relative mb-3">
          <div className="flex items-center gap-2">
            {/* No back/cancel button (owner 2026-06-23): tap outside to dismiss (onBlur closes), iOS-style. */}
            <div className="min-w-0 flex-1">
              <DiscoverySearchBar
                value={searchInput}
                /* typing only updates the live text (→ dropdown). Clearing to empty also resets the feed to browse. */
                onChange={(v) => { setSearchInput(v); if (!v.trim()) setSearch(""); }}
                /* Enter commits → the feed actually searches + logs once + remembers the term (commitSearch). */
                onSubmit={(v) => commitSearch(v)}
                placeholder={t("searchPlaceholder")}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              />
            </div>
            {/* Saved heart fades + collapses when the search is focused (owner 2026-06-23) so the input expands.
                The filter moved OFF the search row to the refine row below the category tabs. */}
            <div className={`flex items-center transition-all duration-300 ease-[cubic-bezier(.34,1.56,.64,1)] ${searchFocused ? "pointer-events-none w-0 overflow-hidden opacity-0" : ""}`}>
            <button
              type="button"
              onClick={() => router.push(`/${locale}/inspo/saved`)}
              aria-label="Gespeichert"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-s-border text-s-ink-2 transition-colors duration-150 hover:text-s-ink"
            >
              <Heart size={18} />
            </button>
            </div>
          </div>
          {searchFocused && (
            <div className="absolute inset-x-0 top-full z-30 mt-2 animate-[inspo-panel-in_.34s_cubic-bezier(.34,1.56,.64,1)] rounded-2xl border border-s-border bg-white p-3 shadow-elevation-2">
              {/* V3-D395: typed query → autocomplete suggestion list (matches the mockup); empty → trending pills. */}
              {searchInput.trim() ? (
                <SearchAutocomplete
                  query={searchInput}
                  onSelect={(term) => commitSearch(term)}
                  onSalonSelect={(slug) => { setSearchFocused(false); router.push(`/${locale}/salon/${slug}`); }}
                />
              ) : (
                <>
                  {/* V3-D413: recent searches (per-user history, photo · term · remove) above the trending row.
                      RecentSearches renders nothing when there's no history → only Trending shows (fallback ladder). */}
                  <RecentSearches onSelect={(term) => commitSearch(term)} />
                  <AISuggestionPills
                    category={category}
                    onSelect={(term) => commitSearch(term)}
                  />
                </>
              )}
            </div>
          )}
        </div>

        {/* MOCKUP (owner direction 2026-06-20): category pills are the FIRST control, in the rounded-box (rounded-card)
            pill shape. "Alle" = the blended For You default (boards + personalized + all looks below). Tapping a
            category scopes the feed AND expands that category's sub-style pills (the row beneath). Reuses the canonical
            DISCOVERY_CATEGORIES list + discover.tabs labels. Selected = a soft grey pill behind the label (the "lil
            grey" the owner asked back, 2026-06-24); photos stay full brightness; NO ring/border/dim, no blue. */}
        <div className="mb-3 flex items-start gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
          {orderedCategories.map(({ key }) => {
            const sel = category === key;
            const meta = categoryMeta[key];
            const cover = meta && meta.count > 0 ? meta.cover : null;
            // Tapping the already-selected category again toggles back to "Alle" (owner 2026-06-23: a second tap
            // should deselect, not no-op). "Alle" itself doesn't toggle off.
            const pick = () => {
              const next = category === key && key !== "all" ? "all" : key;
              // FIX 1(a): also clear the L2 cut tags. Cuts are a HAIR-only taxonomy; without this they stay stuck
              // and the new category's feed (e.g. Nägel) gets a `tags` overlap filter no item satisfies → empty.
              setCategory(next as DiscoveryCategory | "all"); setActiveFilters([]); setCuts([]); setSearch(""); setSearchInput("");
            };
            // Owner 2026-06-23 (Option C): EVERY category is the SAME tile + label-chip unit, so the row is uniform.
            // A category with looks shows its own top look as the tile; an empty one (no content yet) shows a neutral
            // sunken tile , same shape/size, never an illustration / sparkle / mismatched photo. It fills with a real
            // look automatically once that category has content. Selected = a soft grey pill on the LABEL only.
            return (
              <button key={key} type="button" aria-pressed={sel} aria-label={tTabs(key)} onClick={pick}
                className="flex w-[80px] shrink-0 flex-col items-center gap-1.5">
                {/* Photos stay full brightness (no dim/spotlight) and get NO ring/border/outline , owner reads any of
                    those as the banned focus ring. The selected cue is the soft grey pill on the label below. */}
                <span className="grid h-[66px] w-full place-items-center overflow-hidden rounded-card">
                  {cover
                    ? <img src={cover} alt="" className="h-full w-full object-cover" />
                    : <span className="h-full w-full bg-s-bg-sunken" />}
                </span>
                <span className={`w-full text-center font-heading text-[12px] transition-colors duration-150 ${
                  sel ? "rounded-pill bg-s-bg-sunken py-1 font-semibold text-s-ink" : "font-medium text-s-ink-2"
                }`}>
                  {tTabs(key)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Refine row (owner 2026-06-23): the filter sheet trigger (icon-only) lives here now, OFF the search bar and
            always available. The quick pills are PER-CATEGORY (hair tags under Haare, nail finishes under Nägel,
            driven by /api/discovery/chip-terms?category=) and show once a category is picked; "Alle" stays clean
            (just the filter). Selected pill = ink fill, no ring (owner: no focus ring on selected pills). */}
        <div className="relative mb-5">
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none -mx-4 px-4">
              <FilterDrawer
                category={category}
                gender={gender}
                texture={texture}
                style={style}
                cuts={cuts}
                onCutsChange={(tags) => {
                  // FIX 3: selecting a cut while a search is active clears the search (mutually exclusive, the
                  // search path has no tag param, so they cannot both apply). Deselecting all cuts touches nothing.
                  if (tags.length && search) { setSearch(""); setSearchInput(""); }
                  setCuts(tags);
                }}
                onGenderChange={(g) => {
                  // Functional update: a DNA pre-select fires gender + texture in one tick, so reading the
                  // stale activeFilters closure made the second call clobber the first (gender was lost).
                  setActiveFilters((prev) => {
                    const next = prev.filter((f) => f.pillId !== "gender");
                    if (g !== "all") next.push({ pillId: "gender", subId: g, label: g });
                    return next;
                  });
                }}
                onTextureChange={(tx) => {
                  // Same pattern as gender: write the texture into activeFilters (pillId "texture"); the feed already
                  // reads `texture` from there and passes p_texture to the RPC. null clears it. Functional update so
                  // a gender + texture DNA pre-select (both in one tick) do not clobber each other.
                  setActiveFilters((prev) => {
                    const next = prev.filter((f) => f.pillId !== "texture");
                    if (tx) next.push({ pillId: "texture", subId: tx, label: tx });
                    return next;
                  });
                }}
                dnaGender={dnaGender}
                dnaTexture={dnaTexture}
                dnaLength={dnaLength}
                onReset={resetFilters}
              />
              {chipTerms.map(({ term }) => {
                const label = formatChip(term);
                // A pill narrows the feed by its tag. The feed RPC has NO tag filter (p_style matches style_name
                // exactly = 0 results), so we route the tag through the committed SEARCH query (search_discovery
                // FTS-matches tags) but DROP setSearchInput , the feed filters, yet the term never shows in the
                // search bar (owner 2026-06-24: "what's the reason to have it in the search bar"). Tap again clears.
                const sel = !!search && search.trim().toLowerCase() === term.toLowerCase();
                return (
                  <button
                    key={term}
                    type="button"
                    aria-pressed={sel}
                    onClick={() => { const next = sel ? "" : term; setSearch(next); if (next) setCuts([]); /* FIX 3: a chip-search drops cuts (mutually exclusive) */ }}
                    className={`inline-flex h-10 shrink-0 items-center rounded-card px-3.5 text-xs font-heading font-medium transition-colors duration-150 ${
                      sel
                        ? "relative z-10 border border-s-ink bg-s-ink text-white"
                        : "border border-s-border bg-white text-s-ink-2 hover:text-s-ink"
                    } ${sel ? "animate-[inspo-pillpop_.24s_cubic-bezier(.34,1.56,.64,1)]" : ""}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
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

        {/* Grid */}
        {error ? (
          <DiscoveryErrorState onRetry={() => fetchItems(1)} />
        ) : loading && items.length === 0 ? (
          <DiscoveryGridSkeleton />
        ) : items.length === 0 ? (
          // Over-filtered 0-result state: when ANY filter is active, offer a one-tap clear instead of the
          // "be the first to share" new-creator copy (which is wrong when the catalogue just got filtered to empty).
          <DiscoveryEmptyState
            reset={
              gender !== "all" || !!texture || cuts.length > 0 || !!search
                ? resetFilters
                : undefined
            }
          />
        ) : (
          /* V3-D412 (user): the look-feed breaks out of the page's px-4 to span (near) edge-to-edge — Pinterest
             immersion. -mx-4 cancels the container padding, px-1.5 leaves a 6px edge gutter matching the masonry. */
          <div className="-mx-4 px-1.5">
            <MasonryGrid
              items={feedItems}
              renderItem={(item, width) =>
                item.media_type === "tiktok" ? (
                  <VideoCard
                    item={item}
                    onClick={() => handleItemClick(item)}
                    isAuthenticated={isAuthenticated}
                    onAuthRequired={handleAuthRequired}
                    onSave={handleSave}
                    saved={savedIds.has(item.id)}
                    canSave={!item.id.startsWith("proof-")}
                  />
                ) : (
                  <ItemCard
                    item={item}
                    onClick={() => handleItemClick(item)}
                    isAuthenticated={isAuthenticated}
                    onAuthRequired={handleAuthRequired}
                    onSave={handleSave}
                    saved={savedIds.has(item.id)}
                    canSave={!item.id.startsWith("proof-")}
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
