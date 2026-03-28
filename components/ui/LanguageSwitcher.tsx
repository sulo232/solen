"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";

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
    return (
      <div className="flex gap-2 flex-wrap">
        {Object.entries(LOCALE_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => switchLocale(key)}
            aria-label={`Switch to ${label}`}
            className={`px-5 py-2.5 min-h-[44px] min-w-[44px] rounded-pill text-sm font-heading font-bold transition-colors ${
              key === locale
                ? "bg-white/15 text-white border border-white/20"
                : "bg-transparent text-white/50 hover:text-white/90 hover:bg-white/10 border border-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 min-h-12 min-w-12 justify-center rounded-btn text-sm font-medium text-s-ink/70 hover:text-s-ink dark:text-s-dm-text/70 dark:hover:text-s-dm-text transition-colors"
        aria-label="Sprache wählen"
        aria-expanded={open}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{LOCALE_LABELS[locale] ?? "DE"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-s-dm-surface rounded-[12px] shadow-warm-md border border-s-ink/5 dark:border-white/10 py-1 min-w-[120px] z-50">
          {Object.entries(LOCALE_LABELS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => switchLocale(key)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                key === locale
                  ? "text-s-coral font-medium bg-s-coral/5"
                  : "text-s-ink/70 hover:bg-s-bg-surface dark:text-s-dm-text/70 dark:hover:bg-white/5"
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
