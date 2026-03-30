"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";

interface SearchCriteriaChipsProps {
  locale: string;
}

const PARAM_KEYS = ["category", "q", "date", "time"] as const;

export default function SearchCriteriaChips({ locale }: SearchCriteriaChipsProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("ui.search");
  const tNav = useTranslations("navigation");

  const removeParam = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const chips: { key: string; label: string }[] = [];

  for (const key of PARAM_KEYS) {
    const value = searchParams.get(key);
    if (!value) continue;

    let label: string;
    if (key === "category") {
      try { label = tNav(value as Parameters<typeof tNav>[0]); } catch { label = value; }
    } else if (key === "q") {
      label = `"${decodeURIComponent(value)}"`;
    } else if (key === "date") {
      label = value;
    } else if (key === "time") {
      try { label = t(`time.${value}` as Parameters<typeof t>[0]); } catch { label = value; }
    } else {
      label = value;
    }

    chips.push({ key, label });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      {chips.map(({ key, label }) => (
        <span
          key={key}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-s-ink/[0.06] dark:bg-white/[0.08] text-[12px] font-heading font-semibold text-s-ink dark:text-s-dm-text"
        >
          {label}
          <button
            onClick={() => removeParam(key)}
            className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-s-ink/10 dark:hover:bg-white/10 transition-colors"
            aria-label={`${t("removeFilter")} ${label}`}
          >
            <X size={10} aria-hidden="true" />
          </button>
        </span>
      ))}
      {chips.length > 1 && (
        <button
          onClick={() => {
            const params = new URLSearchParams();
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
          }}
          className="text-[11px] font-body text-s-ink/45 dark:text-s-dm-text/45 hover:text-s-coral underline underline-offset-2 transition-colors"
        >
          {t("clearAll")}
        </button>
      )}
    </div>
  );
}
