"use client";

import * as React from "react";
import { TAB_SECTIONS, type TabKey } from "./_shared";
import { cn } from "@/lib/utils";

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
}: {
  availableSections: Set<TabKey>;
  scrollAnchorRef: React.RefObject<HTMLElement | null>;
}) {
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

  // Track which section is in view
  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visibleEntries.length > 0) {
          const id = visibleEntries[0].target.id.replace("section-", "") as TabKey;
          if (TAB_SECTIONS.some((t) => t.key === id)) {
            setActiveTab(id);
          }
        }
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

  const tabs = TAB_SECTIONS.filter((t) => availableSections.has(t.key));
  if (tabs.length === 0) return null;

  return (
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
        // Site header slides away on the same scroll threshold (Header.tsx
        // farScrolled) so they never collide.
        "fixed left-0 right-0 top-0 z-30 border-b border-s-border bg-white transition-opacity duration-200",
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      )}
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 md:px-6">
        <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => handleClick(t.key)}
              className={cn(
                "font-body relative shrink-0 py-3.5 text-[14px] font-semibold transition-colors md:py-4",
                activeTab === t.key
                  ? "text-s-ink"
                  : "text-s-ink-3 hover:text-s-ink"
              )}
            >
              {t.label}
              {activeTab === t.key && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-s-ink" />
              )}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}
