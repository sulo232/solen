"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type SortOption = {
  key: string;
  labelDe: string;
  labelEn: string;
  labelFr: string;
  labelIt: string;
};

const SORT_OPTIONS: SortOption[] = [
  { key: "",         labelDe: "Empfohlen",    labelEn: "Recommended", labelFr: "Recommandé",   labelIt: "Consigliato" },
  { key: "rating",   labelDe: "Bewertung",    labelEn: "Top Rated",   labelFr: "Mieux noté",   labelIt: "Più votato" },
  { key: "price",    labelDe: "Preis",        labelEn: "Price",       labelFr: "Prix",          labelIt: "Prezzo" },
  { key: "distance", labelDe: "Distanz",      labelEn: "Distance",    labelFr: "Distance",      labelIt: "Distanza" },
];

interface SortDropdownProps {
  locale: string;
}

export default function SortDropdown({ locale }: SortDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [hasGPS, setHasGPS] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get("sort") ?? "";

  // Check GPS availability (non-blocking)
  useEffect(() => {
    if ("geolocation" in navigator) setHasGPS(true);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getLabel = (opt: SortOption) => {
    if (locale === "en") return opt.labelEn;
    if (locale === "fr") return opt.labelFr;
    if (locale === "it") return opt.labelIt;
    return opt.labelDe;
  };

  const activeOption = SORT_OPTIONS.find((o) => o.key === currentSort) ?? SORT_OPTIONS[0];
  const sortLabel = locale === "de" ? "Sortieren" : locale === "fr" ? "Trier" : locale === "it" ? "Ordina" : "Sort";

  const handleSelect = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key) {
      if (key === "distance") {
        // Request GPS then set params
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            params.set("sort", "distance");
            params.set("lat", String(pos.coords.latitude));
            params.set("lng", String(pos.coords.longitude));
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          },
          () => {
            // GPS denied — ignore
          }
        );
        setOpen(false);
        return;
      }
      params.set("sort", key);
    } else {
      params.delete("sort");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={`${sortLabel}: ${getLabel(activeOption)}`}
        aria-expanded={open}
        className="flex items-center gap-1 text-[12px] font-body font-medium text-s-ink/65 hover:text-s-ink transition-colors duration-150 whitespace-nowrap"
      >
        <span className="underline underline-offset-2">
          {sortLabel}: {getLabel(activeOption)}
        </span>
        <ChevronDown
          size={13}
          className={cn("transition-transform duration-150", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-[calc(100%+6px)] z-50 bg-[--raised] rounded-input border border-s-ink/[0.08] shadow-v5-float overflow-hidden min-w-[160px]"
          >
            {SORT_OPTIONS.map((opt) => {
              const isActive = opt.key === currentSort;
              const isDisabled = opt.key === "distance" && !hasGPS;
              return (
                <button
                  key={opt.key}
                  onClick={() => !isDisabled && handleSelect(opt.key)}
                  disabled={isDisabled}
                  aria-label={getLabel(opt)}
                  className={cn(
                    "flex items-center gap-2.5 w-full px-4 py-2.5 text-left text-[13px] font-body font-medium transition-colors duration-100",
                    isActive ? "text-s-coral font-semibold" : "text-s-ink/70",
                    isDisabled ? "opacity-40 cursor-not-allowed" : "hover:bg-s-ink/[0.04]"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", isActive ? "bg-s-coral" : "bg-transparent")} />
                  {getLabel(opt)}
                  {opt.key === "distance" && !hasGPS && (
                    <span className="ml-auto text-[10px] text-s-ink/40">GPS</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
