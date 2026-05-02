"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const LOCALE_LABELS: Record<string, string> = {
  de: "DE",
  en: "EN",
  fr: "FR",
  it: "IT",
};

export default function LanguageSwitcher({ locale, variant = "header" }: { locale: string; variant?: "header" | "footer" | "menu" }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", clickHandler);
    document.addEventListener("keydown", keyHandler);
    return () => {
      document.removeEventListener("mousedown", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, []);

  const switchLocale = (newLocale: string) => {
    // Replace the locale segment in the pathname
    const segments = pathname.split("/");
    if (segments[1] && Object.keys(LOCALE_LABELS).includes(segments[1])) {
      segments[1] = newLocale;
    }
    const newPath = segments.join("/") || `/${newLocale}`;

    // Set cookie so middleware remembers the choice
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`;
    router.push(newPath);
    router.refresh();
    setOpen(false);
  };

  if (variant === "footer") {
    const LOCALE_ENTRIES = Object.entries(LOCALE_LABELS);
    return (
      <div className="flex items-center flex-wrap gap-y-1">
        {LOCALE_ENTRIES.map(([loc, label], idx) => (
          <span key={loc} className="flex items-center">
            <button
              onClick={() => switchLocale(loc)}
              className={`text-xs font-heading font-semibold tracking-wide transition-colors duration-150 ${
                locale === loc
                  ? "text-white"
                  : "text-white/50 hover:text-white/90"
              }`}
              aria-label={`Switch language to ${label}`}
            >
              {label}
            </button>
            {idx < LOCALE_ENTRIES.length - 1 && (
              <span aria-hidden="true" className="text-white/20 mx-1.5 select-none text-xs">·</span>
            )}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-0.5 px-2 py-1.5 min-h-10 rounded-pill text-[13px] font-medium text-s-ink/60 hover:text-s-ink transition-colors"
        aria-label="Sprache wählen"
        aria-expanded={open}
      >
        <span>{LOCALE_LABELS[locale] ?? "DE"}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-[12px] shadow-warm-md border border-s-ink/5 py-1 min-w-[120px] z-[100]">
          {Object.entries(LOCALE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                switchLocale(key);
              }}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                key === locale
                  ? "text-s-coral font-medium bg-s-coral/5"
                  : "text-s-ink/70 hover:bg-s-bg-surface:bg-white/5"
              }`}
            >
              <span>{label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
