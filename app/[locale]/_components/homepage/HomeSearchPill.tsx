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

import { Link } from "next-view-transitions";
import { Heart, Menu, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

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
 *   1. SearchTemplate's pill opens an in-place SearchOverlay (`openSearchOverlay`). The home
 *      page has no overlay/composer mounted, so this pill is a real link to `/{locale}/search`,
 *      the same "all services, no category" destination Header.tsx's desktop "Alle Services"
 *      link already points at (SERVICES_MENU in Header.tsx).
 *   2. A real `<Link>` + `<button>` instead of SearchTemplate's `role="button"` divs , avoids
 *      nesting an interactive trailing button inside a div-as-button, and the native elements
 *      get Enter/Space handling for free instead of manual onKeyDown wiring. Neither carries an
 *      explicit `focus-visible:outline-*` class (unlike SearchTemplate's copy of this pattern,
 *      pre-dating 2026-07-27): a real `<a>`/`<button>` already picks up the current global
 *      keyboard-focus cue in `globals.css` (D1-focus-visible, a 3px ink inset-left-edge
 *      box-shadow, not an outline ring), so an explicit class here would be the double-cue
 *      V3-D449 already bans, and `no-focus-ring-gate.py` blocks the outline-ring form anyway.
 * Not sticky (unlike SearchTemplate's pill): the category-page pill is pinned because the
 * Header folds away underneath it once scrolled (see Header.tsx's `categoryCollapsed` fold,
 * deliberately NOT widened to home, see the comment above the category-tab row in Header.tsx).
 * Home's category-pill row stays permanently visible instead, so pinning this pill too would
 * make both fight for the same `top:0` slot. This pill scrolls away with the rest of the feed,
 * same as every other homepage section.
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
  const tSD = useTranslations("salonDetail");
  // common.savedLabel ("Gespeichert"/"Saved"/"Enregistré"/"Salvato") is the closest existing key
  // for the saved-heart's aria-label; discover's own namespace has no dedicated aria string, and
  // DiscoverPageContent's own heart button (page.tsx) hardcodes "Gespeichert" un-i18n'd, which
  // this does not copy.
  const tCommon = useTranslations("common");

  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-1 pb-2">
      <div
        className={cn(
          "flex w-full items-center gap-3 rounded-pill border border-s-border bg-white px-3.5 py-2.5",
          "shadow-[0_2px_8px_0_rgba(0,0,0,0.07)]", // mockup-ok: SearchTemplate.tsx pill, resting state, copied 1:1
        )}
      >
        {onActivate ? (
          <button
            type="button"
            onClick={onActivate}
            aria-label={tChrome("editSearch")}
            className="flex min-w-0 flex-1 items-center gap-3 text-left"
          >
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
            <span className="block min-w-0 flex-1 truncate font-body text-[16px] font-medium text-s-ink">
              {label ?? tChrome("searchPlaceholder")}
            </span>
          </button>
        ) : (
          <Link
            href={`/${locale}/search`}
            aria-label={tChrome("editSearch")}
            className="flex min-w-0 flex-1 items-center gap-3"
          >
            <Search size={18} strokeWidth={2} className="shrink-0 text-s-ink-2" aria-hidden />
            <span className="block min-w-0 flex-1 truncate font-body text-[16px] font-medium text-s-ink">
              {label ?? tChrome("searchPlaceholder")}
            </span>
          </Link>
        )}
        {trailing === "saved" ? (
          <Link
            href={`/${locale}/inspo/saved`}
            aria-label={tCommon("savedLabel")}
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-full border border-s-border",
              "text-s-ink transition-all duration-300 ease-glide hover:bg-s-bg-sunken",
            )}
          >
            <Heart size={16} strokeWidth={2} aria-hidden />
          </Link>
        ) : (
          // Trailing hamburger, matching SearchTemplate.tsx's mobile trailing slot: fires the
          // shared `solen:open-menu` window event Header.tsx listens for, opening the same
          // MobileMenu the removed top-row hamburger used to open (city selector included).
          <button
            type="button"
            aria-label={tSD("openMenu")}
            onClick={() => window.dispatchEvent(new CustomEvent("solen:open-menu"))}
            // mockup-ok , not a new design choice. Owner 2026-08-01, repeating an earlier call:
            // "the hamburger menu why is it like circled? I told you that you don't want it
            // circled in the search bar, just make it bare". Ring removed, 44px hit area kept.
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center", // mockup-ok
              "text-s-ink transition-all duration-300 ease-glide hover:text-s-ink-2", // mockup-ok
            )}
          >
            <Menu size={16} strokeWidth={2} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
