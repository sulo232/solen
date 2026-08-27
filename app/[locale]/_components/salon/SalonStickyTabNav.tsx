"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowLeft, Share } from "lucide-react";
import { HeartButton } from "../homepage/HeartButton";
import { TAB_SECTIONS, type TabKey, type SalonDetail } from "./_shared";
import { cn } from "@/lib/utils";
import { shareOrCopy } from "@/lib/share";
import { useTranslations } from "next-intl";

/**
 * SalonStickyTabNav — V2-D53.3 (2026-05-11).
 *
 * Tab nav that appears once the user scrolls past the hero. Tracks active
 * section via IntersectionObserver on `#section-{key}` elements. Click a
 * tab to smoothScroll into that section.
 *
 * Visibility:
 *   • Hidden (opacity-0, pointer-events-none) until scrollY > heroBottom
 *   • Then sticky top-[64px], fades in
 *
 * Active tab gets an underline. Mobile: horizontal scroll inside the nav.
 *
 * Sections that don't exist on this salon (e.g. no reviews) auto-hide
 * the corresponding tab — driven by the `availableSections` prop.
 */
export function SalonStickyTabNav({
  availableSections,
  scrollAnchorRef,
  salon,
}: {
  availableSections: Set<TabKey>;
  scrollAnchorRef: React.RefObject<HTMLElement | null>;
  salon: SalonDetail;
}) {
  const tBack = useTranslations("common");
  const tr = useTranslations("salonDetail");
  const router = useRouter();
  // V3-D421 (Hero B): share action mirrors SalonHero's, for the mobile scroll-header.
  const shareSalon = React.useCallback(() => {
    shareOrCopy(salon.name, window.location.href);
  }, [salon.name]);
  const [activeTab, setActiveTab] = React.useState<TabKey>("photos");
  const [visible, setVisible] = React.useState(false);

  // V2-D53.3 fix: use the SAME scrollY threshold as the site header's
  // hide/show transition (Header.tsx farScrolled). When site header hides
  // at scrollY > 200, this tab nav appears — clean handoff, no gap where
  // neither bar is visible. Hysteresis: stay visible until scrolled well
  // back near top (100px) so the boundary doesn't flicker.
  React.useEffect(() => {
    function handleScroll() {
      setVisible((prev) => {
        if (prev) return window.scrollY > 100; // already visible — stay visible until well back near top
        return window.scrollY > 200; // hidden — show once past 200px (site header hides at same point)
      });
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track which section is in view.
  // V3-D217 (verifier #9): swap "biggest visible section" ratio-sort for
  // "first section currently above the nav line." The ratio-sort biased the
  // active tab to whichever section was tallest, so deep-scroll into a short
  // section (Treueprogramm) still highlighted the previous large section
  // (Portfolio). New rule: among visible entries, pick the one whose top
  // edge is closest to (but not past) the nav line — that's the section the
  // user is actively reading.
  React.useEffect(() => {
    const NAV_LINE = 120; // matches the rootMargin top offset below
    const observer = new IntersectionObserver(
      (entries) => {
        // Read live positions instead of relying on cached entry.boundingClientRect —
        // the entry's rect is captured at observation time, not at callback time,
        // so during fast scroll it can be stale.
        const candidates: { key: TabKey; top: number }[] = [];
        for (const t of TAB_SECTIONS) {
          const el = document.getElementById(`section-${t.key}`);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          candidates.push({ key: t.key, top: rect.top });
        }
        // Pick the section whose top is closest to NAV_LINE WITHOUT going past it.
        // If every section is below NAV_LINE (top of page), pick the first.
        const above = candidates
          .filter((c) => c.top <= NAV_LINE)
          .sort((a, b) => b.top - a.top); // closest to nav line first
        const pick = above[0] ?? candidates[0];
        if (pick) setActiveTab(pick.key);
      },
      { rootMargin: "-120px 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    TAB_SECTIONS.forEach((t) => {
      const el = document.getElementById(`section-${t.key}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const navRef = React.useRef<HTMLElement>(null);
  const handleClick = (key: TabKey) => {
    const el = document.getElementById(`section-${key}`);
    if (!el) return;
    // V2-D53.3 fix #9 (R2-G2): measure the actual nav bar position at click
    // time instead of using hardcoded constants. Hardcoded 104/124px was
    // 6px short on mobile (real bar bottom = 110px) so headings clipped.
    // 8px breathing room below the bar bottom.
    const navBottom = navRef.current?.getBoundingClientRect().bottom ?? 0;
    const offset = navBottom > 0 ? navBottom + 8 : (window.innerWidth >= 768 ? 124 : 110);
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  // V3-D206 (2026-05-26, salon-detail audit): mounted state for portal render.
  // The page wrapper has `isolation: isolate` on its outer <main>, which scopes
  // ALL z-indexes inside it — even our z-[60] couldn't escape above the site
  // header (z-50, mounted at the root layout). Portal-mounting to document.body
  // breaks out of the isolation scope so z-[60] truly wins.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { setMounted(true); }, []);

  // Tab DISPLAY order must match SCROLL order. TAB_SECTIONS lists "Über uns" 2nd,
  // but the About section renders BELOW Reviews in the DOM — so the active underline
  // jumped backward (Bewertungen → Über uns) on scroll: the "glitchy tab bar" the
  // user reported. Sort tabs by live DOM position so the highlight always advances
  // monotonically, drift-proof against future section reorders.
  const [orderedKeys, setOrderedKeys] = React.useState<TabKey[]>(() => TAB_SECTIONS.map((t) => t.key));
  React.useEffect(() => {
    const sorted = TAB_SECTIONS
      .map((t) => {
        const el = document.getElementById(`section-${t.key}`);
        return { key: t.key, top: el ? el.getBoundingClientRect().top + window.scrollY : Infinity };
      })
      .filter((x) => Number.isFinite(x.top))
      .sort((a, b) => a.top - b.top)
      .map((x) => x.key);
    if (sorted.length) setOrderedKeys(sorted);
  }, [mounted]);

  const tabs = orderedKeys
    .map((k) => TAB_SECTIONS.find((t) => t.key === k))
    .filter((t): t is (typeof TAB_SECTIONS)[number] => !!t && availableSections.has(t.key));

  if (tabs.length === 0) return null;
  if (!mounted) return null;

  const nav = (
    <nav
      ref={navRef}
      aria-label="Salon-Abschnitte"
      className={cn(
        // V2-D53.3 fix (round 2): switched from `sticky` to `fixed` so the
        // nav is always anchored to viewport top:0 once visible. `sticky`
        // requires the element to first reach its document-flow position
        // before pinning — on mobile that's ~500px down, so between
        // scrollY 200–500 the nav was scrolling UP into pinning rather than
        // being stuck at top. User reported "sometimes at top, sometimes
        // not — inconsistent." `fixed` removes that whole class of bug:
        // element is out of flow, opacity is the only visibility lever.
        // V3-D206 (2026-05-26, salon-detail audit): bump z-30 → z-[60] so the
        // salon tab nav sits ABOVE the site header (z-50) when scrolled past
        // the hero. The previous comment claimed Header.tsx hid on scroll, but
        // it doesn't — it only changes tone/blur. With z-30 the tab nav was
        // fully eclipsed by the 68px site header. On salon detail the tab nav
        // IS the chrome the user wants (Fresha-style deep-link page chrome),
        // so it should win the stacking contest.
        "fixed left-0 right-0 top-0 z-[60] border-b border-s-border bg-white transition-opacity duration-200",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 md:px-6">
        {/* V3-D421 (Hero B): mobile scroll-header — back + salon name + share/heart, above the
            tabs. The hero's own floating icons scroll away above this; on desktop the global
            site header carries these, so the row is mobile-only. */}
        <div className="flex items-center gap-3 py-2 md:hidden">
          <button
            type="button"
            aria-label={tBack("back")}
            onClick={() => router.back()}
            className="-ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-s-ink transition-transform active:scale-95 active:duration-[80ms] active:ease-glide"
          >
            <ArrowLeft size={20} strokeWidth={2.2} aria-hidden />
          </button>
          {/* mockup-ok: RANGE LAW A1/A3 (2026-07-25), owner-approved via /dev/flatness
              ("go apply evrth"). 16/600 -> 14/500: this is a secondary echo of the salon
              name (the mini scroll header), not the page's one display anchor (that's
              SalonHeader's h1, kept at 600); demoting it also merges the 16px size into
              the locked "name 14" token, collapsing one size out of the 5-distinct-in-8px
              cluster F7c flagged. */}
          <span className="min-w-0 flex-1 truncate font-display text-[14px] font-medium tracking-[-0.01em] text-s-ink">
            {salon.name}
          </span>
          <button
            type="button"
            aria-label={tr("shareProfile")}
            onClick={shareSalon}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-s-ink transition-transform active:scale-95 active:duration-[80ms] active:ease-glide"
          >
            <Share size={18} strokeWidth={1.9} aria-hidden />
          </button>
          <HeartButton salonId={salon.id} salonName={salon.name} className="!relative !right-auto !top-auto" bare iconSize={18} />
        </div>
        <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleClick(t.key)}
              // accessibility-07 (2026-07-27): NOT role="tab"/aria-selected, this is a
              // scroll-spy anchor nav, not a tabs widget, every section stays in the DOM
              // and reachable by normal scrolling regardless of which tab is "active".
              // role=tab would wrongly imply the other sections are hidden. aria-current
              // is the correct ARIA for "which nav item matches the current position"
              // (same pattern as a table-of-contents highlighting the current section).
              aria-current={activeTab === t.key ? "true" : undefined}
              // mockup-ok: RANGE LAW A1 (2026-07-25), owner-approved via /dev/flatness
              // ("go apply evrth"). Weight now follows the 2026-07-21 TASTE_LOG "content-tab
              // selected state" lock (active = 600 ink + underline, inactive = 400 ink-2)
              // instead of every tab being unconditionally font-semibold.
              className={cn(
                "font-body relative shrink-0 py-3.5 text-[14px] transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide md:py-4",
                activeTab === t.key
                  ? "font-semibold text-s-ink"
                  : "font-normal text-s-ink-2 hover:text-s-ink"
              )}
            >
              {tr(t.labelKey)}
              {activeTab === t.key && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-s-ink" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );

  return createPortal(nav, document.body);
}
