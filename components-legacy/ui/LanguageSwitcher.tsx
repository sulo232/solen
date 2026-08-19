"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Globe } from "lucide-react";
import { Sheet } from "@/app/[locale]/_components/primitives/Sheet";
import { useTranslations } from "next-intl";

const LOCALE_LABELS: Record<string, string> = {
  de: "DE",
  en: "EN",
  fr: "FR",
  it: "IT",
};

// Sheet variant: full names + 2-letter code discs (owner 2026-06-12: no emoji,
// real icons only; the 2-letter code is the app-wide language affordance).
const LOCALE_FULL: Record<string, { name: string; code: string }> = {
  de: { name: "Deutsch", code: "DE" },
  en: { name: "English", code: "EN" },
  fr: { name: "Français", code: "FR" },
  it: { name: "Italiano", code: "IT" },
};

export default function LanguageSwitcher({ locale, variant = "header" }: { locale: string; variant?: "header" | "footer" | "menu" | "sheet" }) {
  const tSD = useTranslations("salonDetail");
  const pathname = usePathname() ?? "/";
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

  if (variant === "sheet") {
    // Bottom sheet per the owner mockup: trigger shows the current language, the sheet
    // lists full names + code discs with a radio mark. Reuses the same switchLocale logic.
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={tSD("selectLanguage")}
          className="flex items-center gap-1.5 text-[14px] font-medium text-s-ink-2 transition-colors hover:text-s-ink"
        >
          <Globe size={16} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
          <span>{LOCALE_FULL[locale]?.name ?? "Deutsch"}</span>
          <ChevronRight size={15} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
        </button>
        <Sheet isOpen={open} onOpenChange={setOpen} height="auto" aria-label={tSD("selectLanguage")}>
          <div className="px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-1">
            <h2 className="font-heading text-[20px] font-bold tracking-[-0.01em] text-s-ink">{tSD("selectLanguage")}</h2>
            <div className="mt-2">
              {Object.entries(LOCALE_FULL).map(([key, v]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchLocale(key)}
                  className="flex w-full items-center justify-between border-b border-s-border py-4 text-left last:border-b-0"
                >
                  <span className="flex items-center gap-3 text-[16px] text-s-ink">
                    <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-s-bg-sunken font-heading text-[11.5px] font-semibold text-s-ink">
                      {v.code}
                    </span>
                    {v.name}
                  </span>
                  <span className={`grid h-5 w-5 place-items-center rounded-full border-2 ${key === locale ? "border-s-accent" : "border-s-border"}`}>
                    {key === locale && <span className="h-2.5 w-2.5 rounded-full bg-s-accent" />}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Sheet>
      </>
    );
  }

  if (variant === "footer") {
    const LOCALE_ENTRIES = Object.entries(LOCALE_LABELS);
    return (
      <div className="flex items-center flex-wrap gap-y-1">
        {LOCALE_ENTRIES.map(([loc, label], idx) => (
          <span key={loc} className="flex items-center">
            <button
              onClick={() => switchLocale(loc)}
              className={`text-xs font-heading tracking-wide transition-colors duration-150 ${
                locale === loc
                  ? "text-white"
                  : "text-white/50 hover:text-white/90"
              }`}
              aria-label={`Switch language to ${label}`}
            >
              {label}
            </button>
            {idx < LOCALE_ENTRIES.length - 1 && (
              <span aria-hidden="true" className="text-white/20 mx-1.5 select-none text-xs">|</span>
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
        className="flex items-center gap-0.5 px-2 py-1.5 min-h-10 rounded-pill text-[13px] font-medium text-s-ink-2 hover:text-s-ink transition-colors"
        aria-label={tSD("selectLanguage")}
        aria-expanded={open}
      >
        <span>{LOCALE_LABELS[locale] ?? "DE"}</span>
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-[12px] shadow-warm-md border border-s-border py-1 min-w-[120px] z-[100]">
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
                  ? "text-s-accent font-medium bg-s-ink/5"
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
