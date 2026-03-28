"use client";

import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import EmptyState from "@/components/ui/EmptyState";

export function MakeupAboveGrid() {
  return null;
}

export function MakeupBelowGrid() {
  const t = useTranslations("makeup") as any;
  return (
    <section className="py-16 px-4">
      <EmptyState
        icon={Sparkles}
        title={t("coming_soon_title")}
        message={t("coming_soon_message")}
        illustration="coming-soon"
      />
    </section>
  );
}
