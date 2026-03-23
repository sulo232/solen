"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Menu } from "lucide-react";

export const sections = [
  { id: "section-1", title: "1. Geltungsbereich / Scope" },
  { id: "section-2", title: "2. Konten / Accounts" },
  { id: "section-3", title: "3. Buchungen / Bookings" },
  { id: "section-4", title: "4. Stornierung / Cancellation" },
  { id: "section-5", title: "5. Zahlungen / Payments" },
  { id: "section-6", title: "6. Salonpartner / Salon Partners" },
  { id: "section-7", title: "7. Kunden / Customers" },
  { id: "section-8", title: "8. Geistiges Eigentum / IP" },
  { id: "section-9", title: "9. Datenschutz / Privacy" },
  { id: "section-10", title: "10. Haftung / Liability" },
  { id: "section-11", title: "11. Änderungen / Amendments" },
  { id: "section-12", title: "12. Kündigung / Termination" },
  { id: "section-13", title: "13. Streitbeilegung / Disputes" },
  { id: "section-14", title: "14. Treueprogramm / Loyalty" },
  { id: "section-15", title: "15. Schlussbestimmungen / Final" },
];

export default function TermsSidebar() {
  const [activeSection, setActiveSection] = useState("section-1");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible section
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by intersection ratio to get the most visible one
          visibleEntries.sort(
            (a, b) => b.intersectionRatio - a.intersectionRatio
          );
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px", // triggers when section is in the top 40% of viewport
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    sections.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      // Offset for sticky header if needed
      const yOffset = -100; 
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden mb-6 print:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center justify-between w-full p-4 bg-white dark:bg-s-dm-bg border border-s-ink/10 dark:border-s-dm-text/10 rounded-xl"
        >
          <span className="font-semibold text-s-ink dark:text-s-dm-text flex items-center gap-2">
            <Menu className="w-5 h-5" /> Inhaltsverzeichnis / Table of Contents
          </span>
          <ChevronDown
            className={`w-5 h-5 text-s-ink/50 dark:text-s-dm-text/50 transition-transform ${
              isMobileMenuOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isMobileMenuOpen && (
          <div className="mt-2 p-2 bg-white dark:bg-s-dm-bg border border-s-ink/10 dark:border-s-dm-text/10 rounded-xl shadow-lg absolute z-10 w-[calc(100%-2rem)] max-h-[60vh] overflow-y-auto max-w-[720px]">
            <nav className="flex flex-col gap-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`text-left px-4 py-3 rounded-lg text-sm transition-colors ${
                    activeSection === section.id
                      ? "bg-s-coral/10 text-s-coral font-medium"
                      : "text-s-ink/70 dark:text-s-dm-text/70 hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block print:hidden w-64 shrink-0">
        <div className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-4">
          <h3 className="font-heading font-semibold text-s-ink dark:text-s-dm-text mb-4 text-sm tracking-wider uppercase opacity-70">
            Inhalt / Contents
          </h3>
          <nav className="flex flex-col gap-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 border-l-2 ${
                  activeSection === section.id
                    ? "border-s-coral bg-s-coral/5 text-s-coral font-medium pl-4"
                    : "border-transparent text-s-ink/70 dark:text-s-dm-text/70 hover:bg-black/5 dark:hover:bg-white/5 hover:border-black/20 dark:hover:border-white/20"
                }`}
              >
                {section.title}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
