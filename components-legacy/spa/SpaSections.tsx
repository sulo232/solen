"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import EmptyState from "@/components-legacy/ui/EmptyState";

export function SpaBelowGrid() {
  const t = useTranslations("common");

  return (
    <section className="py-16 px-4">
      <EmptyState
        icon={Sparkles}
        title={t("comingSoon")}
        message={t("comingSoonMessage")}
        illustration="coming-soon"
      />
    </section>
  );
}
