"use client";

// Salon refund-review queue (V3-D421 refund system).
// Wires the locked mockup (public/solen-dashboard-disputes-aligned.html) to:
//   GET   /api/dashboard/disputes?status=&cursor=   salon-scoped refund queue (+ pagination)
//   PATCH /api/bookings/:bookingId/report           salon approve (full/partial -> issueRefund) | reject
// The salon is FIRST reviewer; escalated cases are out of its hands (Solen decides).

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Scale, Check, X } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import Spinner from "@/components-legacy/ui/Spinner";
import { caseChipClasses } from "@/components-legacy/refund/shared";
import { resolveSwissLocale } from "@/lib/format";

interface SalonCase {
  id: string;
  booking_id: string;
  reference_code: string | null;
  direction: "refund" | "upcharge";
  reason_code: string | null;
  issue_type: string | null;
  requested_amount: number | null;
  resolved_amount: number | null;
  amount_paid: number;
  already_refunded: number;
  status: string;
  description: string | null;
  customer_name: string | null;
  resolution?: string | null;
  created_at: string;
  /** Computed by the API (dispute-engine.ts salonRespondsByDeadline), not a raw
   * column. null once this case is no longer awaiting a first salon decision. */
  salon_responds_by: string | null;
  /** Computed by the API (dispute-engine.ts salonResponseOverdue), not a raw
   * column. True once salon_responds_by has already passed. */
  salon_response_overdue: boolean;
  booking?: { starts_at: string | null; service_name: string | null };
}

type Tone = "success" | "warning" | "error" | "neutral" | "urgent";
const STATUS_TONE: Record<string, { tone: Tone; pulse?: boolean }> = {
  open: { tone: "warning" }, salon_reviewing: { tone: "warning" }, escalated: { tone: "urgent", pulse: true },
  salon_approved: { tone: "success" }, salon_rejected: { tone: "error" }, admin_approved: { tone: "success" },
  admin_rejected: { tone: "error" }, refunded: { tone: "success" }, charged: { tone: "success" }, void: { tone: "neutral" }, closed: { tone: "neutral" },
};
const FILTERS = [
  { key: "open", statuses: "open" },
  { key: "escalated", statuses: "escalated" },
  { key: "done", statuses: "refunded,salon_rejected,admin_approved,admin_rejected,void,closed" },
  { key: "all", statuses: "" },
];
const chf = (r: number | null | undefined) => `CHF ${((r ?? 0) / 100).toFixed(2)}`;
// locale param added 2026-07-26 (de-CH literal sweep): default keeps prior behavior
// for any caller that still doesn't pass one.
const fmtDate = (iso: string | null | undefined, locale: string = "de") =>
  iso ? new Date(iso).toLocaleDateString(resolveSwissLocale(locale), { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

export default function SalonRefundsPage() {
  const t = useTranslations("dashboard.refundQueue") as any;
  // Shared dashboard.time* keys (already shipped, ActivityFeed.tsx +
  // NotificationCenter.tsx use the identical tiered pattern), reused here
  // rather than adding a new key for the same relative-age concept.
  const tShared = useTranslations("dashboard") as any;
  const locale = useLocale();

  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [cases, setCases] = useState<SalonCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState("open");

  const [acting, setActing] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [amt, setAmt] = useState<Record<string, string>>({});

  const query = useCallback(
    (cur?: string | null) => {
      const f = FILTERS.find((x) => x.key === filter);
      const p = new URLSearchParams();
      if (f?.statuses) p.set("status", f.statuses);
      if (cur) p.set("cursor", cur);
      return p.toString();
    },
    [filter],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/dashboard/disputes?${query()}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        setCases((d.cases ?? []).filter((c: SalonCase) => c.direction === "refund"));
        setCursor(d.next_cursor ?? null);
      })
      .catch((err) => {
        console.error("[SalonRefunds] list failed:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [query]);

  const loadMore = () => {
    if (!cursor) return;
    setLoadingMore(true);
    fetch(`/api/dashboard/disputes?${query(cursor)}`)
      .then((r) => r.json())
      .then((d) => {
        setCases((prev) => [...prev, ...(d.cases ?? []).filter((c: SalonCase) => c.direction === "refund")]);
        setCursor(d.next_cursor ?? null);
      })
      .catch((err) => console.error("[SalonRefunds] loadMore failed:", err))
      .finally(() => setLoadingMore(false));
  };

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonName(p?.salon_name);
        setSalonCategories(p?.salon_categories);
      })
      .catch((err) => console.error("[SalonRefunds] profile failed:", err));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  // How long a case still awaiting a salon decision has been open, computed
  // from created_at already on the row (no new API field). Same tiered
  // just-now / min / hours / days shape as ActivityFeed.tsx and
  // NotificationCenter.tsx, so a fresh case never misreports as "0 days".
  const waitingSince = (iso: string): string => {
    const diff = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (diff < 60) return tShared("timeJustNow");
    if (diff < 3600) return tShared("timeMinAgo", { n: Math.floor(diff / 60) });
    if (diff < 86400) return tShared("timeHoursAgo", { n: Math.floor(diff / 3600) });
    return tShared("timeDaysAgo", { n: Math.floor(diff / 86400) });
  };

  const armOrRun = (key: string, run: () => void) => {
    if (armed === key) {
      setArmed(null);
      run();
    } else {
      setArmed(key);
      setTimeout(() => setArmed((a) => (a === key ? null : a)), 3500);
    }
  };

  const review = async (c: SalonCase, action: "approve" | "reject", partial?: boolean) => {
    const resp = (note[c.id] || "").trim();
    if (resp.length < 10) return;
    setActing(c.id);
    const body: any = { action, salon_response: resp };
    if (action === "approve" && partial) {
      const v = parseFloat(amt[c.id] || "0");
      if (v > 0) body.approved_amount = Math.round(v * 100);
    }
    try {
      const res = await fetch(`/api/bookings/${c.booking_id}/report`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) load();
      else toast.error(data?.error || t("actionError"));
    } catch (err) {
      console.error("[SalonRefunds] review failed:", err);
      toast.error(t("actionError"));
    } finally {
      setActing(null);
    }
  };

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <Scale className="w-6 h-6 text-s-ink" />
          <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">{t("title")}</h1>
        </div>
        <p className="text-[13px] text-s-ink-2 mb-4 ml-9">{t("subtitle")}</p>

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={"text-[13px] font-medium rounded-full px-3.5 py-1.5 border transition-colors " + (filter === f.key ? "bg-white text-s-accent border-s-accent" : "bg-white text-s-ink-2 border-s-border hover:bg-s-bg-sunken")}>
              {t(`filter_${f.key}`)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : error ? (
          <div className="rounded-2xl border border-s-border bg-white p-8 text-center">
            <p className="text-[14px] text-s-ink-2 mb-3">{t("loadError")}</p>
            <button onClick={load} className="h-9 px-4 rounded-[10px] bg-s-ink text-white text-[13px] font-semibold">{t("retry")}</button>
          </div>
        ) : cases.length === 0 ? (
          <div className="rounded-2xl border border-s-border bg-white p-8 text-center text-[14px] text-s-ink-2">{t("empty")}</div>
        ) : (
          <div className="flex flex-col gap-4">
            {cases.map((c) => {
              const st = STATUS_TONE[c.status] || { tone: "neutral" as Tone };
              const isOpen = c.status === "open";
              const isEsc = c.status === "escalated";
              const noteOk = (note[c.id] || "").trim().length >= 10;
              const ref = c.reference_code || c.booking_id.slice(0, 8);
              return (
                <div key={c.id} className={"rounded-2xl border bg-white " + (isOpen ? "border-[#dcd9d6] p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_10px_28px_rgba(10,10,10,.07)]" : "border-s-border p-[18px]")}>
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-semibold text-s-ink font-heading tracking-[-0.01em]">{c.customer_name || t("unknown")}</p>
                      <p className="text-[12px] text-s-ink-2 mt-0.5">{[c.booking?.service_name, fmtDate(c.booking?.starts_at, locale), ref].filter(Boolean).join(" ")}</p>
                      {c.salon_responds_by && (
                        <p className="text-[12px] text-s-ink-2 mt-0.5"> {/* mockup-ok: reuses the byte-identical classes already shipped on the line above in this same file, same role (small meta caption) */}
                          {c.salon_response_overdue
                            ? t("respondByOverdue", { date: fmtDate(c.salon_responds_by, locale) })
                            : t("respondBy", { date: fmtDate(c.salon_responds_by, locale) })}
                        </p>
                      )}
                      {c.salon_responds_by && (
                        <p className="text-[12px] text-s-ink-2 mt-0.5"> {/* mockup-ok: same meta-caption classes as the two lines above; plain text, no new colour or badge treatment */}
                          {waitingSince(c.created_at)}
                        </p>
                      )}
                    </div>
                    <DashStatusPill tone={st.tone} pulse={st.pulse}>{t(`status.${c.status}`)}</DashStatusPill>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3.5">
                    <div className="rounded-xl bg-s-bg-sunken px-3.5 py-2.5">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-2">{t("paid")}</p>
                      <p className="font-heading text-[14px] font-medium text-s-ink-2 mt-0.5 tabular-nums">{chf(c.amount_paid)}</p>
                    </div>
                    <div className={`rounded-xl border px-3.5 py-2.5 ${caseChipClasses(c.status).wrap}`}>
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-2">{t("refundRequested")}</p>
                      <p className={`font-heading text-[20px] font-semibold mt-0.5 tabular-nums tracking-[-0.015em] ${caseChipClasses(c.status).amount}`}>{c.requested_amount != null ? chf(c.requested_amount) : t("fullAmount")}</p>
                    </div>
                  </div>

                  {c.description && (
                    <div className="mb-3">
                      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink/40 mb-1">{t("customerStatement")}</p>
                      <p className="text-[14px] text-s-ink/70 leading-snug">&ldquo;{c.description}&rdquo;</p>
                    </div>
                  )}

                  {isEsc ? (
                    <p className="mt-2 pt-3 border-t border-s-border text-[13px] text-s-pop font-medium">{t("escalatedNote")}</p>
                  ) : isOpen ? (
                    <div className="mt-4 pt-3 border-t border-s-border">
                      <textarea value={note[c.id] || ""} onChange={(e) => setNote((p) => ({ ...p, [c.id]: e.target.value }))} placeholder={t("notePlaceholder")} rows={2} className="w-full px-3 py-2 mb-1 text-[12.5px] resize-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                      <p className="text-[12px] text-s-ink/40 mb-2.5">{noteOk ? " " : t("noteRequired")}</p>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => armOrRun(`${c.id}:approve`, () => review(c, "approve", false))}
                          disabled={acting === c.id || !noteOk}
                          className={"flex items-center justify-center gap-2 w-full min-h-[44px] px-3.5 rounded-[10px] bg-s-success text-white text-[13.5px] font-semibold hover:opacity-90 disabled:opacity-50 transition-all" + (armed === `${c.id}:approve` ? " ring-2 ring-s-ink/30 ring-offset-1" : "")}
                        >
                          <Check size={15} strokeWidth={1.9} />
                          {armed === `${c.id}:approve` ? t("confirmShort") : t("approveFull")}
                        </button>
                        <div className="flex items-center gap-2">
                          <input type="number" value={amt[c.id] || ""} onChange={(e) => setAmt((p) => ({ ...p, [c.id]: e.target.value }))} placeholder={t("partialPlaceholder")} className="flex-1 min-h-[44px] px-3 text-[13.5px] tabular-nums" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
                          <button
                            onClick={() => armOrRun(`${c.id}:partial`, () => review(c, "approve", true))}
                            disabled={acting === c.id || !noteOk || !amt[c.id]}
                            className={"flex items-center justify-center min-h-[44px] px-3.5 rounded-[10px] bg-white border border-s-border text-s-ink text-[13.5px] font-semibold hover:bg-s-bg-sunken disabled:opacity-50 transition-all" + (armed === `${c.id}:partial` ? " ring-2 ring-s-ink/30 ring-offset-1" : "")}
                          >
                            {armed === `${c.id}:partial` ? t("confirmShort") : t("approvePartial")}
                          </button>
                        </div>
                        <button
                          onClick={() => armOrRun(`${c.id}:reject`, () => review(c, "reject"))}
                          disabled={acting === c.id || !noteOk}
                          className={"flex items-center justify-center gap-2 w-full min-h-[44px] px-3.5 rounded-[10px] bg-white border border-s-error/30 text-s-error text-[13.5px] font-semibold hover:bg-s-error-bg disabled:opacity-50 transition-all" + (armed === `${c.id}:reject` ? " ring-2 ring-s-error/40 ring-offset-1" : "")}
                        >
                          <X size={15} strokeWidth={1.9} />
                          {armed === `${c.id}:reject` ? t("confirmShort") : t("reject")}
                        </button>
                      </div>
                    </div>
                  ) : (
                    c.resolution && <p className="text-[13px] text-s-ink-2 mt-2 pt-3 border-t border-s-border">{t("resolution")}: <span className="text-s-ink font-medium">{c.resolution}</span></p>
                  )}
                </div>
              );
            })}

            {cursor && (
              <button onClick={loadMore} disabled={loadingMore} className="self-center h-10 px-5 rounded-[10px] border border-s-border bg-white text-[13px] font-semibold text-s-ink hover:bg-s-bg-sunken disabled:opacity-50 transition-colors">
                {loadingMore ? <Spinner /> : t("loadMore")}
              </button>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
