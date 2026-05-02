"use client";

import { Compass } from "lucide-react";
import { useTranslations } from "next-intl";
import EmptyState from "@/components/ui/EmptyState";

export default function DiscoveryEmptyState({ reset }: { reset?: () => void }) {
  const t = useTranslations("discovery");

  return (
    <EmptyState
      icon={Compass}
      title={t("emptyTitle")}
      message={t("emptyMessage")}
      action={
        reset ? (
          <button
            onClick={reset}
            className="mt-4 inline-flex items-center gap-2 border border-s-ink/15 text-s-ink/70 font-heading font-semibold text-sm px-5 py-2.5 rounded-btn hover:border-s-coral/40 hover:text-s-coral active:scale-[0.97] transition-[transform,border-color,color] duration-150"
          >
            {t("resetFilters")}
          </button>
        ) : null
      }
    />
  );
}
