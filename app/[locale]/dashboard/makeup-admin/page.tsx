"use client";

import { useTranslations } from "next-intl";
import { Palette } from "lucide-react";

export default function MakeupAdminPage() {
  const t = useTranslations("dashboardMakeup");
  return (
    <div className="p-6">
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/30 dark:text-s-dm-text/30 mb-1">
        {t("eyebrow")}
      </p>
      <h1 className="font-heading font-bold text-[28px] text-s-ink dark:text-s-dm-text leading-none mb-8">
        {t("title")}
      </h1>
      <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] border-dashed p-8 text-center bg-white dark:bg-s-dm-surface">
        <Palette size={24} className="mx-auto mb-2 text-s-ink/20 dark:text-s-dm-text/20" />
        <p className="text-xs font-heading text-s-ink/30 dark:text-s-dm-text/30 uppercase tracking-[.10em]">
          {t("coming_soon")}
        </p>
      </div>
    </div>
  );
}
