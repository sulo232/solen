"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Observes section elements and returns the ID of the section
 * currently most visible in the viewport.
 */
export function useSectionObserver(sectionIds: string[]) {
  const [activeSection, setActiveSection] = useState(sectionIds[0]);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const ratios: Record<string, number> = {};

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratios[entry.target.id] = entry.intersectionRatio;
        });
        // Find section with highest visibility
        const best = Object.entries(ratios).reduce((a, b) =>
          b[1] > a[1] ? b : a
        );
        if (best[1] > 0) setActiveSection(best[0]);
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: "-80px 0px -40% 0px" }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [sectionIds]);

  return activeSection;
}
