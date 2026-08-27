"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Check, Save, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import ErrorState from "@/components-legacy/ui/ErrorState";
import { formatCurrency } from "@/lib/format-currency";

/**
 * Admin: platform-commission editor. The single rate Solen keeps on every booking
 * (Stripe Connect application fee), stored in platform_settings.commission.rate_percent
 * via GET/PUT /api/admin/commission (admin-gated server-side; this page only reads/writes
 * through that route — the API enforces the admin role).
 *
 * Matches the approved mockup public/solen-admin-commission-variants.html: rate input +
 * live impact preview (the money split on a representative booking) + a save control that
 * follows the outcome-colour convention V3-D426 — INK ready ▸ BLUE saving ▸ GREEN saved ▸
 * RED failed. Applies to NEW bookings only (a booking keeps the rate it was created with).
 *
 * Lives in ADMIN_NAV (DashboardLayout) as "Provision" — integrated into the admin dashboard,
 * not a standalone island. German copy to match its sibling admin pages (homepage-admin etc.).
 */

// Representative booking for the live impact preview (CHF). Illustrative only — labelled as
// an example; it is NOT real data, just shows how the rate splits a typical booking.
const PREVIEW_BASE_CHF = 45;

type SaveState = "idle" | "saving" | "saved" | "error";

export default function CommissionAdminPage() {
  const t = useTranslations("dashboard.commissionAdminPage");
  const locale = useLocale();
  const [rate, setRate] = useState<number>(15);
  const [loadedRate, setLoadedRate] = useState<number>(15);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [state, setState] = useState<SaveState>("idle");

  const fetchRate = () => {
    setLoading(true);
    setLoadError(false);
    fetch("/api/admin/commission")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => {
        const r = Number(data.rate_percent ?? 15);
        setRate(r);
        setLoadedRate(r);
      })
      .catch((err) => {
        console.error("[CommissionAdmin] failed to fetch commission rate:", err);
        // Frontend audit 2026-07-08 (FRONTEND_AUDIT_2026-07-08.md, dash-money bucket):
        // this used to silently keep the 15% default with no error UI, so an admin
        // could edit and PUT a new platform-wide rate off a false, unloaded baseline.
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRate();
  }, []);

  const dirty = rate !== loadedRate;
  // Impact split, CHF. rate% of the example base = Solen's cut; the rest goes to the salon.
  const commission = Math.round(PREVIEW_BASE_CHF * rate) / 100;
  const salonGets = PREVIEW_BASE_CHF - commission;

  const handleSave = async () => {
    setState("saving");
    try {
      const res = await fetch("/api/admin/commission", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLoadedRate(Number(data.rate_percent ?? rate));
      setState("saved");
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      console.error("[CommissionAdmin] failed to save commission rate:", err);
      setState("error");
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-s-ink">{t("title")}</h1>
        <p className="mt-1 font-body text-sm text-s-ink-2">
          {t("subtitle")}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          {/* mockup-ok: WCAG 2.2.2 conformance, page-load spinner bounded (see tailwind.config.js spin-bounded) */}
          <Loader2 size={24} strokeWidth={2.4} className="animate-spin-bounded text-s-ink/40" />
        </div>
      ) : loadError ? (
        <ErrorState
          title={t("loadErrorTitle")}
          message={t("loadErrorMessage")}
          onRetry={fetchRate}
          retryLabel={t("retry")}
        />
      ) : (
        <div className="max-w-md rounded-[14px] border border-s-border bg-white p-6 shadow-warm-md">
          <div className="text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink/40">
            {t("platformFeeEyebrow")}
          </div>

          {/* Rate input */}
          <div className="mt-4">
            <label htmlFor="commission-rate" className="mb-2 block text-xs font-medium text-s-ink-2">
              {t("rateLabel")}
            </label>
            <div className="flex h-[62px] items-center rounded-[13px] border-[1.5px] border-s-ink px-4">
              <input
                id="commission-rate"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={rate}
                onChange={(e) => {
                  setRate(Math.min(100, Math.max(0, Number(e.target.value))));
                  if (state !== "idle") setState("idle");
                }}
                className="w-full flex-1 font-heading text-[30px] font-bold tabular-nums tracking-[-0.02em] text-s-ink outline-none" // mockup-ok: dead-class removal only, type=number already caught before this change (V3-D-input-fill-2026-07-17)
              />
              <span className="font-heading text-[20px] font-semibold text-s-ink-2">%</span>
            </div>
          </div>

          {/* Live impact preview */}
          <div className="mt-4 overflow-hidden rounded-[13px] border border-s-border">
            <div className="bg-[#fcfcfc] px-4 pb-2 pt-2.5 text-[12px] text-s-ink/40">
              {t("exampleBooking", { amount: formatCurrency(PREVIEW_BASE_CHF, locale) })}
            </div>
            <div className="flex items-center justify-between border-t border-s-border px-4 py-2.5 text-[13.5px]">
              <span className="text-s-ink">{t("solenCommission")}</span>
              <span className="font-heading font-bold tabular-nums text-s-ink">{formatCurrency(commission, locale)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-s-border px-4 py-2.5 text-[13.5px]">
              <span className="text-s-ink">{t("salonReceives")}</span>
              <span className="font-heading font-bold tabular-nums text-s-ink">{formatCurrency(salonGets, locale)}</span>
            </div>
            <div className="px-4 pb-2.5 pt-1 text-[12px] leading-[1.4] text-s-ink/40">
              {t("feeNote")}
            </div>
          </div>

          {/* Saved banner */}
          {state === "saved" && (
            <div className="mt-4 flex items-center gap-2.5 rounded-[11px] bg-s-success-bg px-3.5 py-3">
              <Check size={18} strokeWidth={1.9} className="shrink-0 text-s-success" />
              <div>
                <div className="font-heading text-[13px] font-semibold text-s-success">{t("savedTitle")}</div>
                <div className="mt-0.5 text-[12px] text-s-ink-2">{t("savedDescription", { rate: loadedRate })}</div>
              </div>
            </div>
          )}

          {/* Error banner */}
          {state === "error" && (
            <div className="mt-4 flex items-center gap-2.5 rounded-[11px] bg-s-error-bg px-3.5 py-3">
              <AlertTriangle size={17} strokeWidth={1.9} className="shrink-0 text-s-error" />
              <div className="text-[12px] text-s-error">{t("errorMessage")}</div>
            </div>
          )}

          {/* Save — outcome colour (V3-D426): ink ready ▸ blue saving ▸ green saved ▸ red error */}
          <button
            type="button"
            onClick={handleSave}
            disabled={state === "saving" || (!dirty && state !== "error")}
            className={[
              "mt-5 flex h-[50px] w-full items-center justify-center gap-2 rounded-pill font-body text-[14px] font-semibold text-white transition-[filter,background-color,transform] duration-150 active:scale-[0.97] active:duration-[80ms] active:ease-glide disabled:cursor-not-allowed disabled:opacity-50",
              state === "saving"
                ? "bg-s-accent"
                : state === "saved"
                  ? "bg-s-success"
                  : state === "error"
                    ? "bg-s-error"
                    : "bg-s-ink hover:brightness-[1.06]",
            ].join(" ")}
          >
            {state === "saving" ? (
              <>
                <Loader2 size={16} strokeWidth={1.9} className="animate-spin" />
                {t("saving")}
              </>
            ) : state === "saved" ? (
              <>
                <Check size={16} strokeWidth={1.9} />
                {t("saved")}
              </>
            ) : state === "error" ? (
              <>
                <AlertTriangle size={16} strokeWidth={1.9} />
                {t("retry")}
              </>
            ) : (
              <>
                <Save size={16} strokeWidth={1.9} />
                {t("save")}
              </>
            )}
          </button>
        </div>
      )}
    </DashboardLayout>
  );
}
