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

  // B AT REST, C ONCE HE SCROLLS DOWN A BIT (owner 2026-08-10). `shrunk` is the whole state: false
  // is B, true is C. The threshold is deliberately LOW at 24px, because his words were "scrolled
  // down a bit", not "scrolled past the hero". Hysteresis (24 down, 8 up) so a pill sitting exactly
  // on the boundary cannot flicker between the two treatments on a jittery scroll, which is the
  // failure mode of a single threshold.
  const [shrunk, setShrunk] = React.useState(false);
  React.useEffect(() => {
    let raf = 0;
    const read = () => {
      raf = 0;
      const y = window.scrollY || 0;
      setShrunk((was) => (was ? y > 8 : y > 24));
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  // BALANCE PASS 2026-08-11. Owner: "search is too small and category pills are too big, look at
  // balance of airbnb."
  //
  // MEASURED BOTH SIDES FIRST, and the surprise is that the raw numbers already matched:
  //     search height   theirs 56   ours 56
  //     pill height     theirs 40   ours 40
  //     height ratio    theirs 1.40 ours 1.40
  //     icon ratio      theirs 0.43 ours 0.43
  // So it was never the sizes. Two other things differ, and both are exactly what he described:
  //
  //   1. OUR BAR IS FLATTER. Their pill is 342 wide, ours is 358, because their page runs on a
  //      24px gutter and ours on 16. Same height across a wider box is a lower aspect: theirs
  //      6.11:1, ours 6.39:1. A flatter bar reads smaller. Rather than break our own column again
  //      (that was last turn's mistake), the height moves to hold THEIR aspect at OUR width:
  //      358 / 6.11 = 58.6, so 59.
  //   2. OUR LABEL IS LIGHTER. Theirs is 14px/500, ours had dropped to 400. A lighter word in a
  //      big bar leaves it looking emptier, which is the other half of "too small". Back to 500.
  //
  // And the pills: same 40px as theirs, but sitting in a 64px row against their 80, so the same
  // pill fills more of its own row and dominates. The row gets their 20/20 padding in
  // CategoryPillRow.tsx, which is the "too big" half.
  // BACK TO px-4, AND THIS IS THE BALANCE FIX. Owner 2026-08-10: "can u balance evrth on the top
  // search category."
  //
  // MEASURED before touching anything, at 390 wide:
  //     search bar    left edge 24
  //     category pill left edge 16
  //     section head  left edge 16
  // Three elements stacked vertically, two of them on one column and the search bar 8px off it.
  // That misalignment IS the thing he can see. Nothing else in the top area was wrong.
  //
  // How it got there, named because it was my own trade and it was the wrong one: I set px-6 last
  // turn so our pill would measure 342 wide, matching Airbnb's exactly. But their whole page runs
  // on a 24px gutter, so 342 keeps THEIR column. Ours runs on 16, so copying their absolute width
  // broke our own. Matching an absolute number from another product beat aligning with our own
  // content, which is backwards: the pill is 358 again and it sits on the same left edge as
  // everything under it.
  //
  // pb-1 rather than pb-2: with the pill row's own mt-3 that makes the search-to-pills gap 16
  // exactly, instead of the 20 it measured, so the vertical rhythm reads 16 / 32 rather than
  // 20 / 31.
  return (
    <div className="mx-auto w-full max-w-[680px] px-4 pt-3 pb-0">
      {/* B AT REST, C ONCE HE SCROLLS. Owner 2026-08-10, correcting my first read of his "c":
          "b normal state or scrolled up, c once scrolled down a bit, you know, gets smaller."

          So it is not one of the two, it is a morph between them, driven by scroll:
            at the top / scrolled back up   B, their measurement exactly, black ring, 54 tall
            after a little downward scroll  C, smaller and calmer, our hairline and lift

          C is Airbnb's MEASURED shape with our ink. Their bar was read live off airbnb.ch at a real
          390-wide mobile viewport with getComputedStyle, not judged off a screenshot:
              340 x 54, top 13, radius 40px, border 1px BLACK, shadow 0 6px 20px rgba(0,0,0,0.10),
              padding 19 a side, justify-content CENTER, label 14px/500, icon 12x12, 8px gap
          Ours before this change, same method: 358 x 46, top 4, hairline, 0 2px 8px 7%, padding 14,
          LEFT aligned, label 16px/500, icon 18 with a 12px gap.

          Both hold the same anatomy, so only weight and size move: centred content, 40px radius,
          12px icon, 14px/500 label. Keeping the anatomy fixed is what makes it read as ONE control
          settling rather than two controls swapping.

          Worth naming because I got this wrong twice earlier the same day. First I decided the
          problem was height and made ours taller, which moved almost nothing: the look is carried
          by the ring, the centring and the icon size, and I had touched none of them. Then, when he
          pushed back, I reverted the whole thing and threw away the look he wanted along with the
          invention. */}
      <div
        ref={pillRef}
        // A LIGHT GREY HAIRLINE, which is what theirs actually is. Owner 2026-08-10, pointing at
        // their bar: "u see the outline gray thing make it like this."
        //
        // AND HERE IS THE MISTAKE THAT CAUSED THREE ROUNDS OF THIS. I first read their border as
        // `1px rgb(0,0,0)` and shipped a black ring. That value is real in their CSS, but it sits
        // on an element whose `border-width` is 0, so it NEVER PAINTS. I read a border colour
        // without checking whether the border was drawn, which is measuring the stylesheet instead
        // of the screen.
        //
        // Re-measured properly, walking their button and its ancestors and keeping only elements
        // that actually paint: exactly ONE does, the button itself, and it reads
        //   342 x 56, radius 40px, border 1px solid rgb(221,221,221), shadow 0 6px 20px at 10%
        // #DDDDDD is 1.36:1 on white. Our own `s-border` is #E4E4E7 at 1.27:1, the same light
        // hairline, so no new hex is needed and the token does the job.
        //
        // Both states now carry that hairline. What separates them is HEIGHT and LIFT: 54 tall and
        // floating at rest, 44 and settled once he scrolls.
        style={shrunk ? undefined : { boxShadow: "0 6px 20px rgba(0,0,0,0.10)" }} // mockup-ok: variant B lift, measured off airbnb.ch live at 390 wide, 2026-08-10
        className={cn(
          "flex w-full items-center justify-center gap-2 rounded-[40px] bg-white overflow-hidden", // mockup-ok: padding moved onto the button so the whole bar is tappable, 2026-08-11
          // The morph. Height and weight are the only things that move.
          "transition-[height,box-shadow,border-color] duration-200 ease-glide", // mockup-ok
          "border border-s-border", // mockup-ok: the light grey hairline, their measured painted #DDDDDD, ours #E4E4E7
          // 2026-08-12, owner: "scrolled down why is the search bat collapsed in homepage yk". It
          // shrank to 44 once he scrolled past 24px, which was HIS OWN ask on 2026-08-10 ("once
          // scrolled down a bit yk gets smaller"), and he has now looked at it and does not want
          // it. The later word wins. One height, 64, whatever the scroll position.
          // `shrunk` is kept and still drives the shadow below, because the lift-at-rest versus
          // settled-on-scroll half of that decision was never the part he objected to.
          "h-[64px]", // mockup-ok: one height, owner 2026-08-12
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
          // w-full and the outer flex-1. Owner 2026-08-11: "search bar i cant click on the side
          // i have to rlly click on the search bar."
          //
          // MEASURED before the fix: the bar is 358 wide and only the middle 71px opened the
          // search. 144px dead on each side, which is most of the control. Tapping 8px in from
          // either end hit a plain div and did nothing.
          //
          // Cause, and it was mine: when the content was centred for the Airbnb look, this
          // button stopped filling the bar and shrank to fit its own text. The centring is
          // right; the button just has to be the whole bar and centre its contents INSIDE.
          className="flex min-w-0 flex-1 items-center justify-center gap-2 self-stretch px-[19px]"
        >
          <Search size={12} strokeWidth={2.4} className="shrink-0 text-s-ink" aria-hidden />
          {/* mockup-ok: font-medium = 500, their measured label weight. Balance pass 2026-08-11. */}
          <span className="block min-w-0 truncate font-body text-[14px] font-medium text-s-ink">
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
            <Heart size={16} strokeWidth={1.9} aria-hidden />
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
          // TWO TAPS, NOT ONE, and this reverses a change made earlier the same day.
          //
          // Owner 2026-08-11, second pass: "i dont like when u click once yk from home search bar
          // yk once u click its alrdy keyboard mode." Earlier that day I had passed
          // `autoFocusService` here, because the field genuinely never took focus and typing into
          // it did nothing. That was a real bug and it is fixed elsewhere (the step that had just
          // opened was being marked inert). Auto-focus was the wrong cure for it.
          //
          // What the reference actually does, captured off real Airbnb screens this day rather
          // than recalled: tapping the search bar opens a sheet where the field is NOT focused and
          // no keyboard comes up. Tapping the FIELD is a separate, second step that raises the
          // keyboard. Two levels, not one.
          //
          // It also fixes something measured and never reported: with the keyboard up on open, the
          // composer folds away, so Wo?, Wann? and the Suchen button sat below the bottom of a
          // 390x844 screen and the only reachable submit was the keyboard's return key. Opening
          // unfocused puts all three back on screen.
          //
          // No prop is passed now: `autoFocusService` defaults to false, which is what the category
          // routes have always used and what this bar should have used all along.
          // Same composer the results pill opens, so the two entry points are one surface.
          // NO category pills inside the panel. Owner 2026-08-11: "remove category bar from
          // search bar." The home page already carries that exact row directly under the
          // search bar, so opening the panel showed him the same four categories a second
          // time, one on top of the other. The results view keeps its own pills; this is the
          // home entry point only.
        />
      )}
    </div>
  );
}
