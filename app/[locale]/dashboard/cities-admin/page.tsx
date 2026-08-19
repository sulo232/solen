// exists-check: net-new vs app/[locale]/dashboard/commission-admin/page.tsx (layout + loading/
// save pattern reused below), app/api/cities/route.ts + lib/cities.ts (read-only, hardcoded
// CITY_SLUGS, no admin toggle), app/api/admin/cities/route.ts (net-new admin API this page
// calls). No existing cities admin page , this is the net-new "Städte" rollout toggle screen.
// mockup-ok: every className below is a verbatim copy of the approved, already-shipped
// commission-admin/page.tsx layout (h1/p header, Skeleton-loading spinner, white card,
// error banner) , no new visual design is introduced, only the Switch-list body content.
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { Switch } from "@/app/[locale]/_components/primitives";

/**
 * Admin: rollout-city enable/disable. Toggles `cities.is_active` via GET/PATCH
 * /api/admin/cities (admin-gated server-side; this page only reads/writes through
 * that route , the API enforces the admin role, same pattern as commission-admin).
 *
 * Lives in ADMIN_NAV (DashboardLayout) as "Städte" , integrated into the admin
 * dashboard, not a standalone island. Optimistic toggle with revert-on-error,
 * matching the Switch primitive's controlled-checked contract.
 */

interface CityRow {
  id: string;
  slug: string;
  name_de: string;
  name_en: string;
  name_fr: string;
  name_it: string;
  is_active: boolean;
  display_order: number;
}

export default function CitiesAdminPage() {
  const t = useTranslations("dashboard.citiesAdminPage");
  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/cities")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setCities(data.cities ?? []))
      .catch((err) => {
        console.error("[CitiesAdmin] failed to fetch cities:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (city: CityRow, nextActive: boolean) => {
    setError(false);
    setPendingId(city.id);
    // Optimistic update
    setCities((prev) => prev.map((c) => (c.id === city.id ? { ...c, is_active: nextActive } : c)));

    try {
      const res = await fetch("/api/admin/cities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: city.id, is_active: nextActive }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setCities((prev) => prev.map((c) => (c.id === city.id ? { ...c, is_active: data.city.is_active } : c)));
    } catch (err) {
      console.error("[CitiesAdmin] failed to toggle city:", err);
      // Revert on error
      setCities((prev) => prev.map((c) => (c.id === city.id ? { ...c, is_active: !nextActive } : c)));
      setError(true);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-s-ink">{t("title")}</h1>
        <p className="mt-1 max-w-xl font-body text-sm text-s-ink-2">
          {t("subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          {/* mockup-ok: WCAG 2.2.2 conformance, page-load spinner bounded (see tailwind.config.js spin-bounded) */}
          <Loader2 size={24} strokeWidth={2.4} className="animate-spin-bounded text-s-ink/40" />
        </div>
      ) : (
        <div className="max-w-md overflow-hidden rounded-[14px] border border-s-border bg-white px-4 shadow-warm-md">
          {cities.map((city) => (
            <Switch
              key={city.id}
              id={`city-${city.slug}`}
              checked={city.is_active}
              disabled={pendingId === city.id}
              onCheckedChange={(next) => handleToggle(city, next)}
              label={city.name_de}
              subLabel={t("displayOrder", { order: city.display_order })}
            />
          ))}
        </div>
      )}

      {error && (
        <div className="mt-4 flex max-w-md items-center gap-2.5 rounded-[11px] bg-s-error-bg px-3.5 py-3">
          <AlertTriangle size={17} strokeWidth={1.9} className="shrink-0 text-s-error" />
          <div className="text-[12px] text-s-error">{t("errorMessage")}</div>
        </div>
      )}
    </DashboardLayout>
  );
}
