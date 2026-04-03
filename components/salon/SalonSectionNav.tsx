"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
}

interface SalonSectionNavProps {
  sections: Section[];
}

export default function SalonSectionNav({ sections }: SalonSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
  const [isSticky, setIsSticky] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver to detect which section is in view
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(id);
          }
        },
        { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
      );

      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  // Detect sticky state via sentinel
  useEffect(() => {
    if (!navRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsSticky(!entry.isIntersecting);
      },
      { threshold: 1 }
    );

    observer.observe(navRef.current);
    return () => observer.disconnect();
  }, []);

  // Slide active indicator to match active tab
  useEffect(() => {
    if (!navRef.current || !indicatorRef.current) return;
    const activeButton = navRef.current.querySelector(`[data-section="${activeId}"]`) as HTMLButtonElement | null;
    if (!activeButton) return;

    const navRect = navRef.current.getBoundingClientRect();
    const btnRect = activeButton.getBoundingClientRect();
    indicatorRef.current.style.width = `${btnRect.width}px`;
    indicatorRef.current.style.transform = `translateX(${btnRect.left - navRect.left + navRef.current.scrollLeft}px)`;
  }, [activeId]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    const yOffset = -100; // account for sticky header height
    const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  if (sections.length === 0) return null;

  return (
    <div
      ref={navRef}
      className={cn(
        "sticky top-[72px] z-30 bg-white border-b border-s-ink/[0.08] transition-shadow duration-200",
        isSticky && "shadow-sm"
      )}
    >
      <div className="max-w-[2520px] mx-auto px-5 md:px-6 lg:px-10 xl:px-20 relative">
        <nav
          className="flex gap-0 overflow-x-auto scrollbar-hide -mb-px"
          role="tablist"
          aria-label="Salon Sektionen"
        >
          {sections.map(({ id, label }) => (
            <button
              key={id}
              data-section={id}
              role="tab"
              aria-selected={activeId === id}
              onClick={() => scrollToSection(id)}
              className={cn(
                "relative shrink-0 px-4 py-4 text-[14px] font-body font-medium whitespace-nowrap transition-colors duration-150",
                activeId === id
                  ? "text-s-ink font-semibold"
                  : "text-[#6A6A6A] hover:text-s-ink"
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Sliding active indicator */}
        <div
          ref={indicatorRef}
          className="absolute bottom-0 left-0 h-[2px] bg-s-ink transition-[transform,width] duration-200 ease-out"
          style={{ width: 0 }}
        />
      </div>
    </div>
  );
}
