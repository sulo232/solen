// registry-sync-ok: registry row added at _design-system/COMPONENT_REGISTRY.md ("HomeSearchPill")
// and doc written at _design-system/components/HomeSearchPill.md, both in this same turn.
// exists-check: `npm run exists homepage` run this turn, 32 existing homepage components listed,
// none named or shaped like a search pill. Net-new vs homepage/SearchBar.tsx (read in full before
// writing this file): SearchBar.tsx is the 3-field Service/Stadt/Zeit dynamic-island form this
// task's own brief explicitly says NOT to restyle into a pill ("rather than restyling the Hero's
// 3-field form into a pill"). This file instead copies the ALREADY-APPROVED pill markup/classes
// off search/SearchTemplate.tsx's `bigSearchRef` block (not exported as its own component, see
// this file's header comment + _design-system/components/HomeSearchPill.md for why a copy instead
// of an import). CategoryTabs.tsx / CategoryStack.tsx / SectionHeader.tsx are unrelated surfaces
// (category tab UI, section chrome), not a search pill.
"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { Link } from "next-view-transitions";
import { Heart, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// R1 (owner 2026-08-02, round 3, "it must open in place, the URL must not change on tap"):
// the SAME shared overlay SearchTemplate mounts, mounted here too so the home pill opens it
// OVER the home page instead of navigating to /search first. `ssr: false` + always-mounted
// (never conditionally rendered) is deliberate: the overlay's open/close morph reads its own
// `openT` motion value from 0 on the first frame after `open` flips, so a component that
// MOUNTS already-open would skip the morph entirely and just appear.
const SearchOverlay = dynamic(
  () => import("@/app/[locale]/_components/search/SearchOverlay").then((m) => m.SearchOverlay),
  { ssr: false },
);

/**
 * HomeSearchPill , V3-D (2026-08-01, owner "why is homepage still that bro"): the mobile
 * homepage now composes the SAME search-pill chrome the category/search routes render
 * (SearchTemplate.tsx's `bigSearchRef` pill, lines ~1246-1364 of that file), instead of the
 * Hero's old 3-field form. Every visual class below is copied 1:1 off that pill's RESTING
 * (unscrolled) state , same border, radius (`rounded-pill`), shadow, icon, text size, and
 * trailing 44px hamburger tile. Do not restyle; if the category-page pill's geometry ever
 * changes, mirror the change here too (FLOORS LAW 8, "the same thing looks the same
 * everywhere"). Full rationale: _design-system/components/HomeSearchPill.md.
 *
 * Two DELIBERATE differences from SearchTemplate's version, both behavioral, not visual
 * (the task asked to reuse the MARKUP, not the category-page interaction wiring, which is
 * tied to that component's own filter/city/query state):
 *   1. CORRECTED 2026-08-02 (owner, round 3): this pill used to be a real link to
 *      `/{locale}/search?compose=1`, so tapping it changed the URL and tore down the home
 *      document before anything opened. It now mounts the SAME shared SearchOverlay and opens
 *      it IN PLACE over the home page, exactly like SearchTemplate's own pill
 *      (`openSearchOverlay`). The URL only changes when the user actually submits a search
 *      (SearchOverlay's own `navigate`).
 *   2. A real `<button>` instead of SearchTemplate's `role="button"` divs , avoids
 *      nesting an interactive trailing button inside a div-as-button, and the native elements
 *      get Enter/Space handling for free instead of manual onKeyDown wiring. Neither carries an
 *      explicit `focus-visible:outline-*` class (unlike SearchTemplate's copy of this pattern,
 *      pre-dating 2026-07-27): a real `<a>`/`<button>` already picks up the current global
 *      keyboard-focus cue in `globals.css` (D1-focus-visible, a 3px ink inset-left-edge
 *      box-shadow, not an outline ring), so an explicit class here would be the double-cue
 *      V3-D449 already bans, and `no-focus-ring-gate.py` blocks the outline-ring form anyway.
 * FIX B (2026-08-01, owner "it should be search bar instead of category bar", supersedes the
 * "not sticky" call this comment used to make): the wrapping div in Hero.tsx is now
 * `sticky top-0 z-[55]`, matching SearchTemplate's own pill. Header.tsx's `categoryCollapsed`
 * fold is widened to `isHome` too, so the header + its category row fold away on scroll on the
 * home route exactly like they already did on category/search routes, and THIS pill takes the
 * top-chrome hand-off instead of the category row staying pinned.
 *
 * Copy: `tChrome("searchPlaceholder")` is the SAME `ui.searchChrome` key SearchTemplate.tsx
 * falls back to when no category/query is set (`[activeCategory, q].filter(Boolean).join(" ")
 * || tChrome("searchPlaceholder")`); home has neither, so it resolves to the identical string
 * ("Suchen" / "Search" / "Rechercher" / "Cerca") without any new i18n key.
 *
 * I8 (2026-08-01, search-a.html's Inspo tab, `setPillSlot("saved")`): two optional props let
 * `/inspo` compose this SAME pill instead of hand-rolling a second one (graveyard hit,
 * `npm run exists homepage`: the deleted `inspo-header.html` mockup page tried exactly that and
 * was rejected, "we already have another mockup page", REMOVED.md). `label` overrides the
 * placeholder text (Inspo passes the real `discover.searchPlaceholder` key, "Styles
 * suchen..."/"Search styles...", not a new string). `trailing="saved"` swaps the hamburger for a
 * heart linking to `/{locale}/inspo/saved`, matching the mockup's ONE surface with a saved
 * destination. `onActivate`, when provided, replaces the main body's `<Link href="/search">`
 * with a `<button>` (Inspo's own search lives in-page via `DiscoverySearchBar`, so tapping this
 * pill must not navigate away to the unrelated salon-search route; Home's own behavior is
 * unchanged when `onActivate` is omitted).
 */
export default function HomeSearchPill({
  locale,
  label,
  trailing = "menu",
  onActivate,
}: {
  locale: string;
  label?: string;
  trailing?: "menu" | "saved";
  onActivate?: () => void;
}) {
  const tChrome = useTranslations("ui.searchChrome");
  // common.savedLabel ("Gespeichert"/"Saved"/"Enregistré"/"Salvato") is the closest existing key
  // for the saved-heart's aria-label; discover's own namespace has no dedicated aria string, and
  // DiscoverPageContent's own heart button (page.tsx) hardcodes "Gespeichert" un-i18n'd, which
  // this does not copy.
  const tCommon = useTranslations("common");

  // R1: in-place open. `pillRef` is the pill's own visible box, so the overlay's open/close
  // morph grows out of THIS bar and shrinks back into it (the same `originRect` contract
  // SearchTemplate.tsx:766-776 already uses for its own pill).
  const pillRef = React.useRef<HTMLDivElement | null>(null);
  const [overlayOpen, setOverlayOpen] = React.useState(false);
  const [originRect, setOriginRect] = React.useState<
    { top: number; left: number; width: number; height: number } | null
  >(null);
  const openOverlay = React.useCallback(() => {
    const r = pillRef.current?.getBoundingClientRect();
    if (r) setOriginRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    setOverlayOpen(true);
  }, []);

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-1 pb-2">
      <div
        ref={pillRef}
        className={cn(
          "flex w-full items-center gap-3 rounded-pill border border-s-border bg-white px-3.5 py-2.5", // mockup-ok: RESTORED verbatim from his branch, see the block comment above
          "shadow-[0_2px_8px_0_rgba(0,0,0,0.07)]", // mockup-ok: SearchTemplate.tsx pill, resting state, copied 1:1
        )}
      >
        {/* R1: ONE tap handler for both callers. `/inspo` still passes its own `onActivate`
            (its search lives in-page via DiscoverySearchBar); home has none, so it opens the
            shared overlay mounted below. Neither path navigates. */}
        <button
          type="button"
          onClick={onActivate ?? openOverlay}
          aria-label={tChrome("editSearch")}
          aria-haspopup={onActivate ? undefined : "dialog"}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
                    <span className="block min-w-0 flex-1 truncate font-body text-[16px] font-medium text-s-ink">
            {label ?? tChrome("searchPlaceholder")}
          </span>
        </button>
        {trailing === "saved" ? (
          <Link
            href={`/${locale}/inspo/saved`}
            aria-label={tCommon("savedLabel")}
            // FIX D (2026-08-01, owner repeating the hamburger call: "the circle thingy is in
            // other categories"): the heart lives in the same search-bar trailing-slot family as
            // the hamburger below, bare treatment, no circle. mockup-ok, matches the already-
            // landed hamburger fix at this file's own menu button just below.
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center", // mockup-ok
              "text-s-ink transition-all duration-300 ease-glide hover:text-s-ink-2", // mockup-ok
            )}
          >
            <Heart size={16} strokeWidth={2} aria-hidden />
          </Link>
        ) : null}
        {/* mockup-ok , THE HAMBURGER IS GONE FROM HERE. Owner 2026-08-10: "I don't think this
            hamburger menu should be here because it's really inconsistent. Not really like it."
            He then picked option C off /dev/menu-placement.

            It could not simply be deleted last turn, and the reason was measured rather than
            assumed: on /de the header's own hamburger renders at width 0, hidden by
            `showCategoryChrome && "max-md:hidden"` (Header.tsx:706), which is true on home, on all
            four category routes and on /inspo. So this glyph was the ONLY visible trigger for
            MobileMenu across most of the customer surface, and MobileMenu carries the city
            selector and the language switcher.

            What made the deletion safe is `BottomNav.tsx`, mounted in layout.tsx this turn. Its
            fourth item fires the SAME `solen:open-menu` event this button used to, so the menu
            keeps its one trigger contract and simply moved to the thumb with a label on it.
            Nothing was rewired. */}
      </div>
      {/* R1: mounted ALWAYS (not gated on `overlayOpen`) so its open-morph animates from
          `openT = 0`; a conditionally-mounted copy would arrive already-open and skip the
          morph. Closed it renders nothing (portal returns null) and its data hooks stay idle,
          so the cost is the mount, not a fetch. `/inspo` (onActivate) drives its own in-page
          search, so it gets no second overlay. */}
      {!onActivate && (
        <SearchOverlay
          open={overlayOpen}
          onClose={() => setOverlayOpen(false)}
          locale={locale}
          originRect={originRect}
          // Same composer the results pill opens, so the two entry points are one surface.
          showCategoryPills
        />
      )}
    </div>
  );
}
