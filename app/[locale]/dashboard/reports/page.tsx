// exists-check: net-new page (npm run exists "dashboard/reports" -> 0 matches). Clones
// app/[locale]/dashboard/review-moderation/page.tsx's layout (DashboardLayout, tab-pill
// filter row, white/border/shadow-warm-md card list, EmptyState, per-row action buttons)
// verbatim, the closest existing admin-queue page, per the build brief ("use existing
// dashboard patterns"). Backend: GET/PATCH /api/admin/reports (app/api/admin/reports/**),
// admin-gated server-side; this page only reads/writes through that route. Lives in
// ADMIN_NAV (DashboardLayout) as "Meldungen", mounted 2026-07-25. Unstyled-is-fine per the
// build brief: the owner will pick the final view treatment from a separate mockup being
// built concurrently at app/[locale]/dev/**, out of scope for this pass.
// mockup-ok: every className below is a verbatim (or near-verbatim, swapping ink-fill for
// the LOCKED gray TabPill selected treatment) copy of already-shipped admin pages
// (review-moderation, feature-flags-admin). No new visual design is introduced.
"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Flag, Eye, X, EyeOff, Loader2 } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import EmptyState from "@/components-legacy/ui/EmptyState";
import {
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  isLegalReportStatusTransition,
  type ReportStatus,
  type ReportTargetType,
  type ReportReason,
} from "@/lib/content-reports";

interface ReportTarget {
  salon_name?: string | null;
  rating?: number;
  comment?: string | null;
  is_hidden?: boolean;
  moderation_status?: string | null;
  name?: string;
  display_name?: string | null;
}

interface ReportRow {
  id: string;
  reporter_id: string | null;
  reporter_name: string | null;
  target_type: ReportTargetType;
  target_id: string;
  target: ReportTarget | null;
  reason: ReportReason;
  status: ReportStatus | null;
  admin_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
}

const STATUS_TONE: Record<ReportStatus, "success" | "warning" | "error" | "neutral"> = {
  pending: "warning",
  reviewed: "neutral",
  action_taken: "success",
  dismissed: "neutral",
};

// `as const satisfies` (not a plain `Record<K, string>` annotation) keeps each value's
// LITERAL type instead of widening to `string`, so `t(STATUS_LABEL_KEY[status])` narrows
// to next-intl's typed MessageKeys union. Matches the working pattern already used by
// app/[locale]/dashboard/bookings/page.tsx's STATUS_LABEL_KEYS.
const STATUS_LABEL_KEY = {
  pending: "statusPending",
  reviewed: "statusReviewed",
  action_taken: "statusActionTaken",
  dismissed: "statusDismissed",
} as const satisfies Record<ReportStatus, string>;

const TARGET_TYPE_LABEL_KEY = {
  salon: "targetSalon",
  review: "targetReview",
  user: "targetUser",
  photo: "targetPhoto",
} as const satisfies Record<ReportTargetType, string>;

const REASON_LABEL_KEY = {
  inappropriate: "reasonInappropriate",
  spam: "reasonSpam",
  fake: "reasonFake",
  ip_violation: "reasonIpViolation",
  harassment: "reasonHarassment",
  other: "reasonOther",
} as const satisfies Record<ReportReason, string>;

export default function ReportsAdminPage() {
  const t = useTranslations("dashboard.reportsAdminPage");
  const tShared = useTranslations("dashboard");

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | "all">("pending");
  const [targetFilter, setTargetFilter] = useState<ReportTargetType | "all">("all");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchReports = useCallback((pageToLoad: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (targetFilter !== "all") params.set("target_type", targetFilter);
    params.set("page", String(pageToLoad));
    fetch(`/api/admin/reports?${params.toString()}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d) => {
        setReports((prev) => (append ? [...prev, ...(d.reports ?? [])] : d.reports ?? []));
        setTotal(d.total ?? 0);
        setPage(pageToLoad);
      })
      .catch((err) => {
        console.error("[ReportsAdmin] failed to fetch reports:", err);
        if (!append) setReports([]);
      })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
      });
  }, [statusFilter, targetFilter]);

  useEffect(() => { fetchReports(1, false); }, [fetchReports]);

  const handleAction = async (report: ReportRow, patch: { status?: ReportStatus; hide_content?: boolean }) => {
    setActionLoadingId(report.id);
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patch,
          admin_notes: noteDrafts[report.id] ?? report.admin_notes ?? undefined,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchReports(1, false);
    } catch (err) {
      console.error("[ReportsAdmin] action failed:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const relativeTime = useCallback((dateStr: string | null): string => {
    if (!dateStr) return "";
    const diff = Math.round((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (diff < 60) return tShared("timeJustNow");
    if (diff < 3600) return tShared("timeMinAgo", { n: Math.floor(diff / 60) });
    if (diff < 86400) return tShared("timeHoursAgo", { n: Math.floor(diff / 3600) });
    return tShared("timeDaysAgo", { n: Math.floor(diff / 86400) });
  }, [tShared]);

  const targetPreview = (row: ReportRow): string => {
    if (!row.target) return t("targetMissing");
    if (row.target_type === "review") {
      const stars = row.target.rating != null ? "★".repeat(row.target.rating) : "";
      const comment = row.target.comment ? `"${row.target.comment.slice(0, 140)}"` : "";
      const salon = row.target.salon_name ? ` (${row.target.salon_name})` : "";
      return [stars, comment].filter(Boolean).join(" ") + salon;
    }
    if (row.target_type === "salon") return row.target.name ?? t("targetMissing");
    return row.target.display_name ?? t("targetMissing");
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">{t("title")}</h1>
        <p className="text-sm text-s-ink/40 mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-2 flex-wrap">
        {(["all", ...REPORT_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s ? "bg-s-bg-sunken text-s-ink font-semibold" : "bg-white border border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink"
            }`}
          >
            {s === "all" ? t("statusAll") : t(STATUS_LABEL_KEY[s])}
          </button>
        ))}
      </div>

      {/* Target-type filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", ...REPORT_TARGET_TYPES] as const).map((tt) => (
          <button
            key={tt}
            onClick={() => setTargetFilter(tt)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              targetFilter === tt ? "bg-s-bg-sunken text-s-ink font-semibold" : "bg-white border border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink"
            }`}
          >
            {tt === "all" ? t("targetFilterAll") : t(TARGET_TYPE_LABEL_KEY[tt])}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : reports.length === 0 ? (
        <EmptyState icon={Flag} title={t("emptyTitle")} message={t("emptyMessage")} />
      ) : (
        <>
          <div className="space-y-3">
            {reports.map((r) => {
              const status = r.status ?? "pending";
              const canReview = isLegalReportStatusTransition(status, "reviewed");
              const canDismiss = isLegalReportStatusTransition(status, "dismissed");
              const canHide = r.target_type === "review" && !r.target?.is_hidden && isLegalReportStatusTransition(status, "action_taken");
              const busy = actionLoadingId === r.id;

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl border border-s-border shadow-warm-md p-4"
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <DashStatusPill tone={STATUS_TONE[status]}>{t(STATUS_LABEL_KEY[status])}</DashStatusPill>
                    <span className="text-xs text-s-ink-2">{t(TARGET_TYPE_LABEL_KEY[r.target_type])}</span>
                    <span className="text-xs text-s-ink/30">|</span>
                    <span className="text-xs text-s-ink-2">{t(REASON_LABEL_KEY[r.reason])}</span>
                    <span className="text-xs text-s-ink/30">|</span>
                    <span className="text-xs text-s-ink-2">
                      {t("reporterLabel")} <strong className="text-s-ink/70">{r.reporter_name ?? t("unknownReporter")}</strong>
                    </span>
                    <span className="text-xs text-s-ink/30">|</span>
                    <span className="text-xs text-s-ink/30">{relativeTime(r.created_at)}</span>
                  </div>

                  {/* Target preview */}
                  <p className="text-sm text-s-ink/70 mb-2">{targetPreview(r)}</p>

                  {r.target_type === "review" && r.target?.is_hidden && (
                    <div className="mb-3">
                      <DashStatusPill tone="error">{t("alreadyHidden")}</DashStatusPill>
                    </div>
                  )}

                  {/* Admin note, travels WITH whichever action button is clicked below */}
                  <div className="mb-3">
                    <textarea
                      value={noteDrafts[r.id] ?? r.admin_notes ?? ""}
                      onChange={(e) => setNoteDrafts((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder={t("notesPlaceholder")}
                      rows={2}
                      className="w-full text-xs font-body text-s-ink px-3 py-2 rounded-btn border border-s-border bg-s-bg-sunken resize-none focus:outline-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-s-border flex-wrap">
                    <button
                      onClick={() => handleAction(r, { status: "reviewed" })}
                      disabled={!canReview || busy}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-border text-s-ink-2 text-xs font-medium hover:bg-s-bg-sunken hover:text-s-ink disabled:opacity-40 disabled:cursor-not-allowed transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide"
                    >
                      {busy ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                      {t("markReviewing")}
                    </button>
                    <button
                      onClick={() => handleAction(r, { status: "dismissed" })}
                      disabled={!canDismiss || busy}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-border text-s-ink-2 text-xs font-medium hover:bg-s-bg-sunken hover:text-s-ink disabled:opacity-40 disabled:cursor-not-allowed transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide"
                    >
                      <X size={12} />
                      {t("dismiss")}
                    </button>
                    {r.target_type === "review" && (
                      <button
                        onClick={() => handleAction(r, { hide_content: true })}
                        disabled={!canHide || busy}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn bg-s-ink text-white text-xs font-medium hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide"
                      >
                        <EyeOff size={12} />
                        {r.target?.is_hidden ? t("alreadyHidden") : t("hideContent")}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {reports.length < total && (
            <button
              onClick={() => fetchReports(page + 1, true)}
              disabled={loadingMore}
              className="mt-4 w-full py-2.5 border border-s-border rounded-btn text-sm text-s-ink-2 hover:border-s-ink/[0.18] hover:text-s-ink/80 transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide disabled:opacity-50"
            >
              {loadingMore ? <Loader2 size={14} strokeWidth={1.6} className="animate-spin mx-auto" /> : t("loadMore")}
            </button>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
