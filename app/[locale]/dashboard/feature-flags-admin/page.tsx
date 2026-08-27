// exists-check: net-new page (npm run exists feature-flags-admin -> 0 matches). Clones
// app/[locale]/dashboard/cities-admin/page.tsx (layout + Switch-list + optimistic toggle +
// revert-on-error pattern) verbatim. Backend already exists and is untouched:
// app/api/admin/feature-flags/route.ts (GET returns {flags} from feature_flags ordered by
// key; PATCH {key, enabled} toggles + audit-logs "feature_flag.toggle").
// mockup-ok: every className below is a verbatim copy of the approved, already-shipped
// cities-admin/page.tsx layout (h1/p header, Skeleton-loading spinner, white card,
// error banner) , no new visual design is introduced, only the Switch-list body content.
"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, Loader2 } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { Switch } from "@/app/[locale]/_components/primitives";

/**
 * Admin: global feature-flag on/off panel. Toggles `feature_flags.enabled` via GET/PATCH
 * /api/admin/feature-flags (admin-gated server-side; this page only reads/writes through
 * that route , the API enforces the admin role, same pattern as cities-admin).
 *
 * Lives in ADMIN_NAV (DashboardLayout) as "Feature Flags" , integrated into the admin
 * dashboard, not a standalone island. Optimistic toggle with revert-on-error, matching the
 * Switch primitive's controlled-checked contract.
 *
 * HIDDEN_DEAD_KEYS below is a static list, not a live check (silent-no-op audit done by
 * grepping every checkFeatureEnabled() call site and every .from("feature_flags") read in
 * the repo, first pass 2026-07-12, re-verified 2026-07-13 after wiring `referral` below).
 * Each of these keys has NOTHING behind it: no gate reads it, and toggling it in the DB
 * changes a row nobody consults, so showing it as a working switch would be a lie (owner
 * call 2026-07-13: "make the switches actually work, kill the fake ones"). The row itself
 * is NOT deleted from `feature_flags`, only hidden from THIS toggle list:
 *   - credits        not a valid FeatureKey in lib/feature-flags.ts at all (never wired).
 *                     The live user_credits balance (referral payouts, checkout redemption)
 *                     is unconditional and not gated by this row.
 *   - messaging       DMs are fully off product-wide; no send path exists left to gate.
 *   - twint           TWINT is off pending Stripe capability review; checkout's payment
 *                     methods are not flag-driven yet.
 *   - last_minute     the "Last Minute" feature is driven entirely by the per-salon
 *                     last_minute_discount_percent COLUMN (search sort/filter/badges), not
 *                     a global switch. No checkFeatureEnabled("last_minute") call exists
 *                     anywhere despite the key sitting in the FeatureKey union.
 *   - salon_of_month  a KV row abused by the admin salon-of-month picker
 *                     (app/api/admin/salon-of-month/route.ts upserts it with `enabled`
 *                     forced to true on every pick), not a boolean feature switch. Nothing
 *                     displays it anywhere.
 * `referral` was in this set until 2026-07-13: it is now wired into
 * lib/referral/complete-referral.ts (the single referral-completion chokepoint) and shows
 * as a normal working switch below.
 * If a flag here later gets wired up (or an existing gate is removed), update this list,
 * it is not derived automatically.
 */

const HIDDEN_DEAD_KEYS = new Set([
  "credits",
  "last_minute",
  "messaging",
  "salon_of_month",
  "twint",
]);

interface FeatureFlagRow {
  key: string;
  enabled: boolean;
  description: string | null;
  updated_at: string | null;
  updated_by: string | null;
}

function humanizeKey(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function FeatureFlagsAdminPage() {
  const t = useTranslations("dashboard.featureFlagsAdminPage");
  const [flags, setFlags] = useState<FeatureFlagRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/feature-flags")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => setFlags(data.flags ?? []))
      .catch((err) => {
        console.error("[FeatureFlagsAdmin] failed to fetch flags:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (flag: FeatureFlagRow, nextEnabled: boolean) => {
    setError(false);
    setPendingKey(flag.key);
    // Optimistic update
    setFlags((prev) => prev.map((f) => (f.key === flag.key ? { ...f, enabled: nextEnabled } : f)));

    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: flag.key, enabled: nextEnabled }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? { ...f, enabled: data.flag.enabled } : f)));
    } catch (err) {
      console.error("[FeatureFlagsAdmin] failed to toggle flag:", err);
      // Revert on error
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? { ...f, enabled: !nextEnabled } : f)));
      setError(true);
    } finally {
      setPendingKey(null);
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
          {flags
            .filter((flag) => !HIDDEN_DEAD_KEYS.has(flag.key))
            .map((flag) => (
              <Switch
                key={flag.key}
                id={`flag-${flag.key}`}
                checked={flag.enabled}
                disabled={pendingKey === flag.key}
                onCheckedChange={(next) => handleToggle(flag, next)}
                label={humanizeKey(flag.key)}
                subLabel={flag.description ?? flag.key}
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
