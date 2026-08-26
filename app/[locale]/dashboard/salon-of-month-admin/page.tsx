// exists-check: net-new. `npm run exists salon-of-month-admin` = 0 matches.
// Reuses app/api/admin/salon-of-month/route.ts (candidates + current winner
// + toggle state, POST to select) and the EXISTING generic
// /api/admin/feature-flags PATCH route for the on/off toggle (key
// "salon_of_month", seeded by 20260713140000_salon_of_month.sql) , no new
// flag mechanism. Loading/empty/error states reuse the locked registry
// components (Skeleton, EmptyState, ErrorState) per COMPONENT_REGISTRY.md,
// same pattern as commission-admin's fetch/save shape.
"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Check, Star, Crown } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import EmptyState from "@/components-legacy/ui/EmptyState";
import ErrorState from "@/components-legacy/ui/ErrorState";
import { Skeleton, Switch } from "@/app/[locale]/_components/primitives";

interface Candidate {
  id: string;
  name: string;
  slug: string;
  cover_photo_url: string | null;
  average_rating: number | null;
  review_count: number | null;
  quartier: string | null;
}

interface CurrentWinner {
  month: string;
  reason: string | null;
  salon_id: string;
  salons: { id: string; name: string; slug: string } | null;
}

function currentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export default function SalonOfMonthAdminPage() {
  const t = useTranslations("dashboard.salonOfMonthAdminPage");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [current, setCurrent] = useState<CurrentWinner | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [togglePending, setTogglePending] = useState(false);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectError, setSelectError] = useState(false);
  const [reason, setReason] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setLoadError(false);
    fetch("/api/admin/salon-of-month")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setCandidates(data.candidates ?? []);
        setCurrent(data.current ?? null);
        setEnabled(!!data.enabled);
      })
      .catch((err) => {
        console.error("[SalonOfMonthAdmin] failed to fetch candidates:", err);
        setLoadError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (next: boolean) => {
    const prev = enabled;
    setEnabled(next);
    setTogglePending(true);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "salon_of_month", enabled: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error("[SalonOfMonthAdmin] failed to toggle flag:", err);
      setEnabled(prev);
    } finally {
      setTogglePending(false);
    }
  };

  const handleSelect = async (salonId: string) => {
    setSelectingId(salonId);
    setSelectError(false);
    try {
      const res = await fetch("/api/admin/salon-of-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          month: currentMonthValue(),
          reason: reason.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setReason("");
      load();
    } catch (err) {
      console.error("[SalonOfMonthAdmin] failed to select winner:", err);
      setSelectError(true);
    } finally {
      setSelectingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-s-ink">{t("title")}</h1>
        <p className="mt-1 font-body text-sm text-s-ink-2">{t("subtitle")}</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* On/off toggle: reuses the generic feature_flags admin route */}
        <div className="rounded-[14px] border border-s-border bg-white p-2 px-4">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={togglePending}
            label={t("toggleLabel")}
          />
        </div>

        {/* Current winner */}
        <div className="rounded-[14px] border border-s-border bg-white p-6">
          <div className="text-[12px] font-semibold text-s-ink/40">
            {t("currentEyebrow")}
          </div>
          {current?.salons ? (
            <div className="mt-3 flex items-center gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink">
                <Crown size={20} strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-[15px] font-medium text-s-ink">
                  {current.salons.name}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 font-body text-[13px] text-s-ink-2">
                  <span>{t("currentMonth", { month: current.month })}</span>
                  {current.reason && <span>{current.reason}</span>}
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-2 font-body text-sm text-s-ink-2">{t("currentEmpty")}</p>
          )}
        </div>

        {/* Candidates picker */}
        <div className="rounded-[14px] border border-s-border bg-white p-6">
          <div className="text-[12px] font-semibold text-s-ink/40">
            {t("candidatesEyebrow")}
          </div>
          <p className="mt-1 font-body text-[13px] text-s-ink-2">{t("candidatesSubtitle")}</p>

          <div className="mt-4">
            <label htmlFor="som-reason" className="mb-1.5 block text-xs font-medium text-s-ink-2">
              {t("reasonLabel")}
            </label>
            <input
              id="som-reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("reasonPlaceholder")}
              className="w-full px-3.5 py-2.5 font-body text-sm text-s-ink" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
            />
          </div>

          <div className="mt-5">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton width={44} height={44} rounded={12} />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton height={14} width="40%" />
                      <Skeleton height={12} width="25%" />
                    </div>
                  </div>
                ))}
              </div>
            ) : loadError ? (
              <ErrorState
                title={t("errorTitle")}
                message={t("errorMessage")}
                onRetry={load}
                retryLabel={t("retry")}
              />
            ) : candidates.length === 0 ? (
              <EmptyState icon={Crown} title={t("emptyTitle")} message={t("emptyMessage")} />
            ) : (
              <ul className="space-y-1">
                {candidates.map((c) => {
                  const isCurrent = current?.salon_id === c.id;
                  return (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-3 border-b border-s-border py-3 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-body text-[14px] font-medium text-s-ink">
                          {c.name}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 font-body text-[12px] text-s-ink-2">
                          {c.average_rating != null && (
                            <span className="inline-flex items-center gap-1">
                              <Star size={11} className="text-s-star" fill="currentColor" aria-hidden />
                              {c.average_rating.toFixed(1)}
                              {c.review_count != null && ` (${c.review_count})`}
                            </span>
                          )}
                          {c.quartier && <span>{c.quartier}</span>}
                        </div>
                      </div>
                      {isCurrent ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-pill bg-s-success-bg px-3 py-1.5 font-body text-[12px] font-semibold text-s-success">
                          <Check size={13} strokeWidth={2.5} />
                          {t("selectedBadge")}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSelect(c.id)}
                          disabled={selectingId === c.id}
                          className="shrink-0 rounded-pill bg-s-ink px-4 py-1.5 font-body text-[13px] font-semibold text-white transition-[filter,transform] duration-150 active:scale-[0.97] active:duration-[80ms] active:ease-glide hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {selectingId === c.id ? (
                            <Loader2 size={14} strokeWidth={1.6} className="animate-spin" />
                          ) : (
                            t("selectButton")
                          )}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {selectError && (
            <p className="mt-3 font-body text-[12px] text-s-error">{t("selectError")}</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
