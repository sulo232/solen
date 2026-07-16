"use client";

// Admin unified case queue (V3-D421 refund/upcharge system).
// Wires the locked mockup (public/solen-dashboard-admin-cases.html) to the real
// SP-5 endpoints:
//   GET  /api/admin/booking-disputes?code=&status=&direction=&cursor=   list + search + pagination
//   GET  /api/admin/booking-disputes/:id                                case detail + case_events timeline
//   POST /api/admin/booking-disputes/:id/action                         all 8 admin actions
// Admin-only: the endpoint is role-gated (403); this page also reflects the gate.

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Scale, Search, X, ChevronDown } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import { caseChipClasses } from "@/components-legacy/refund/shared";

interface AdminCase {
  id: string;
  booking_id: string;
  direction: "refund" | "upcharge";
  issue_type: string;
  reason_code: string | null;
  requested_amount: number;
  resolved_amount: number | null;
  status: string;
  description: string | null;
  salon_response: string | null;
  resolution: string | null;
  created_at: string;
  reference_code: string | null;
  amount_paid: number;
  already_refunded: number;
  bookings?: { reference_code: string | null; starts_at: string | null; salons?: { name: string } | null };
  reporter?: { display_name: string | null } | null;
}
interface CaseEvent {
  id: string;
  action: string;
  actor_type: string;
  actor_name: string | null;
  from_status: string | null;
  to_status: string | null;
  amount: number | null;
  note: string | null;
  at: string;
}

type Tone = "success" | "warning" | "error" | "neutral" | "urgent";
const STATUS_TONE: Record<string, { tone: Tone; pulse?: boolean }> = {
  open: { tone: "warning" }, salon_reviewing: { tone: "warning" }, escalated: { tone: "urgent", pulse: true },
  salon_approved: { tone: "success" }, salon_rejected: { tone: "error" },
  admin_approved: { tone: "success" }, admin_rejected: { tone: "error" },
  refunded: { tone: "success" }, charged: { tone: "success" }, void: { tone: "neutral" }, closed: { tone: "neutral" },
};
const TERMINAL = new Set(["admin_approved", "admin_rejected", "refunded", "charged", "void", "closed"]);
const chf = (r: number | null | undefined) => `CHF ${((r ?? 0) / 100).toFixed(2)}`;
const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";
const fmtWhen = (iso: string) =>
  new Date(iso).toLocaleString("de-CH", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export default function AdminCasesPage() {
  const t = useTranslations("admin.cases") as any;

  const [salonName, setSalonName] = useState<string | undefined>();
  const [role, setRole] = useState<string | null>(null);
  const [cases, setCases] = useState<AdminCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [codeInput, setCodeInput] = useState("");
  const [activeCode, setActiveCode] = useState("");
  const [status, setStatus] = useState<string>("escalated");
  const [direction, setDirection] = useState<"refund" | "upcharge">("refund");

  const [acting, setActing] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});
  const [refundAmt, setRefundAmt] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<CaseEvent[] | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const buildQuery = useCallback(
    (cur?: string | null) => {
      const p = new URLSearchParams();
      const code = activeCode.trim().toUpperCase();
      if (code) p.set("code", code);
      else {
        if (status) p.set("status", status);
        p.set("direction", direction);
      }
      if (cur) p.set("cursor", cur);
      return p.toString();
    },
    [activeCode, status, direction],
  );

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/admin/booking-disputes?${buildQuery()}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d) => {
        setCases(d.disputes ?? []);
        setCursor(d.next_cursor ?? null);
      })
      .catch((err) => {
        console.error("[AdminCases] list failed:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, [buildQuery]);

  const loadMore = () => {
    if (!cursor) return;
    setLoadingMore(true);
    fetch(`/api/admin/booking-disputes?${buildQuery(cursor)}`)
      .then((r) => r.json())
      .then((d) => {
        setCases((prev) => [...prev, ...(d.disputes ?? [])]);
        setCursor(d.next_cursor ?? null);
      })
      .catch((err) => console.error("[AdminCases] loadMore failed:", err))
      .finally(() => setLoadingMore(false));
  };

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonName(p?.salon_name);
        setRole(p?.role ?? null);
      })
      .catch((err) => console.error("[AdminCases] profile failed:", err));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const toggleTimeline = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
      setTimeline(null);
      return;
    }
    setExpandedId(id);
    setTimeline(null);
    setDetailLoading(true);
    fetch(`/api/admin/booking-disputes/${id}`)
      .then((r) => r.json())
      .then((d) => setTimeline(d.timeline ?? []))
      .catch((err) => console.error("[AdminCases] detail failed:", err))
      .finally(() => setDetailLoading(false));
  };

  // two-step confirm: first click arms (auto-disarms in 3.5s), second click runs.
  const armOrRun = (key: string, run: () => void) => {
    if (armed === key) {
      setArmed(null);
      run();
    } else {
      setArmed(key);
      setTimeout(() => setArmed((a) => (a === key ? null : a)), 3500);
    }
  };

  const act = async (c: AdminCase, action: string) => {
    setActing(c.id);
    const body: any = { dispute_id: c.id, action, resolution_note: note[c.id] || undefined };
    if (action === "refund" || action === "admin_approve") {
      const v = parseFloat(refundAmt[c.id] || "0");
      if (v > 0) body.refund_amount = Math.round(v * 100);
    }
    try {
      const res = await fetch(`/api/admin/booking-disputes/${c.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) load();
      else alert(data?.error || t("actionError"));
    } catch (err) {
      console.error("[AdminCases] action failed:", err);
      alert(t("actionError"));
    } finally {
      setActing(null);
    }
  };

  // an action button with the two-step confirm baked in
  const ActBtn = ({ c, action, label, className }: { c: AdminCase; action: string; label: string; className: string }) => {
    const key = `${c.id}:${action}`;
    const isArmed = armed === key;
    return (
      <button
        onClick={() => armOrRun(key, () => act(c, action))}
        disabled={acting === c.id}
        className={className + (isArmed ? " ring-2 ring-s-ink/30 ring-offset-1" : "") + " disabled:opacity-50 transition-all"}
      >
        {isArmed ? t("confirmShort") : label}
      </button>
    );
  };

  return (
    <DashboardLayout salonName={salonName}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <Scale className="w-6 h-6 text-s-ink" />
          <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">{t("title")}</h1>
        </div>
        <p className="text-[13px] text-s-ink-2 mb-4 ml-9">{t("subtitle")}</p>

        {role && role !== "admin" ? (
          <div className="rounded-2xl border border-s-border bg-white p-6 text-[14px] text-s-ink-2">{t("adminOnly")}</div>
        ) : (
          <>
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-s-ink/40" />
              <input
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setActiveCode(codeInput.trim())}
                placeholder={t("searchPlaceholder")}
                aria-label={t("searchPlaceholder")}
                className="w-full h-11 !pl-10 !pr-10 rounded-full bg-white border border-s-border text-[13.5px] text-s-ink placeholder:text-s-ink/40"
              />
              {activeCode && (
                <button onClick={() => { setCodeInput(""); setActiveCode(""); }} aria-label={t("clear")} className="absolute right-3 top-1/2 -translate-y-1/2 text-s-ink/40 hover:text-s-ink">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!activeCode && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {[{ k: "escalated", label: t("filterEscalated") }, { k: "salon_reviewing", label: t("filterReviewing") }, { k: "", label: t("filterAll") }].map((f) => (
                  <button key={f.k || "all"} onClick={() => setStatus(f.k)} className={"text-[13px] font-medium rounded-full px-3.5 py-1.5 border transition-colors " + (status === f.k ? "bg-white text-s-accent border-s-accent" : "bg-white text-s-ink-2 border-s-border hover:bg-s-bg-sunken")}>
                    {f.label}
                  </button>
                ))}
                <div className="ml-auto inline-flex bg-s-bg-sunken border border-s-border rounded-full p-[3px]">
                  {(["refund", "upcharge"] as const).map((d) => (
                    <button key={d} onClick={() => setDirection(d)} className={"text-[12px] font-semibold rounded-full px-3 py-1 transition-colors " + (direction === d ? "bg-white text-s-ink shadow-sm" : "text-s-ink-2")}>
                      {d === "refund" ? t("dirRefund") : t("dirUpcharge")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-16"><Spinner /></div>
            ) : error ? (
              <div className="rounded-2xl border border-s-border bg-white p-8 text-center">
                <p className="text-[14px] text-s-ink-2 mb-3">{t("loadError")}</p>
                <button onClick={load} className="h-9 px-4 rounded-[10px] bg-s-ink text-white text-[13px] font-semibold">{t("retry")}</button>
              </div>
            ) : cases.length === 0 ? (
              <div className="rounded-2xl border border-s-border bg-white p-8 text-center text-[14px] text-s-ink-2">
                {activeCode ? t("noResults", { code: activeCode.toUpperCase() }) : t("empty")}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {cases.map((c) => {
                  const st = STATUS_TONE[c.status] || { tone: "neutral" as Tone };
                  const isEsc = c.status === "escalated";
                  const isUpcharge = c.direction === "upcharge";
                  const ref = c.reference_code || c.bookings?.reference_code || c.booking_id.slice(0, 8);
                  const terminal = TERMINAL.has(c.status);
                  const expanded = expandedId === c.id;
                  return (
                    <div key={c.id} className={"rounded-2xl border bg-white " + (isEsc ? "border-[#dcd9d6] p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_10px_28px_rgba(10,10,10,.07)]" : "border-s-border p-[18px]")}>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-s-ink font-heading">{c.bookings?.salons?.name || t("unknownSalon")}</p>
                          <p className="text-[16px] font-semibold text-s-ink font-heading tracking-[-0.01em] mt-0.5">{c.reporter?.display_name || t("unknown")}</p>
                          <p className="text-[12px] text-s-ink-2 mt-0.5">{fmtDate(c.bookings?.starts_at)} {ref}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <span className="text-[12px] font-bold uppercase tracking-[0.05em] rounded-full px-2.5 py-1 bg-s-bg-sunken text-s-ink-2">{isUpcharge ? t("dirUpcharge") : t("dirRefund")}</span>
                          <DashStatusPill tone={st.tone} pulse={st.pulse}>{t(`status.${c.status}`)}</DashStatusPill>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-3.5">
                        <div className="rounded-xl bg-s-bg-sunken px-3.5 py-2.5">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-2">{t("paid")}</p>
                          <p className="font-heading text-[14px] font-medium text-s-ink-2 mt-0.5 tabular-nums">{chf(c.amount_paid)}</p>
                        </div>
                        <div className={`rounded-xl border px-3.5 py-2.5 ${caseChipClasses(c.status).wrap}`}>
                          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink-2">{isUpcharge ? t("disputedCharge") : t("refundRequested")}</p>
                          <p className={`font-heading text-[20px] font-semibold mt-0.5 tabular-nums tracking-[-0.015em] ${caseChipClasses(c.status).amount}`}>{chf(c.requested_amount)}</p>
                        </div>
                      </div>

                      {c.description && (
                        <div className="mb-3">
                          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-s-ink/40 mb-1">{t("customerStatement")}</p>
                          <p className="text-[14px] text-s-ink/70 leading-snug">&ldquo;{c.description}&rdquo;</p>
                        </div>
                      )}

                      {/* timeline drill-in */}
                      <button onClick={() => toggleTimeline(c.id)} className="inline-flex items-center gap-1 text-[12px] font-medium text-s-ink-2 hover:text-s-ink mt-1">
                        {t("timeline")} <ChevronDown className={"w-3.5 h-3.5 transition-transform " + (expanded ? "rotate-180" : "")} />
                      </button>
                      {expanded && (
                        <div className="mt-2.5 mb-1">
                          {detailLoading ? (
                            <div className="py-3"><Spinner /></div>
                          ) : timeline && timeline.length > 0 ? (
                            <div className="relative pl-[22px]">
                              <div className="absolute left-[5px] top-1 bottom-1 w-0.5 bg-s-border" />
                              {timeline.map((ev, i) => {
                                const pulse = i === timeline.length - 1 && (c.status === "escalated" || c.status === "open");
                                return (
                                  <div key={ev.id} className="relative pb-3 last:pb-0">
                                    <span className="absolute -left-[22px] top-0.5 w-3 h-3">
                                      {pulse && <span className="absolute inset-0 rounded-full bg-s-accent opacity-50 motion-reduce:hidden" style={{ animation: "ping 2.6s cubic-bezier(0,0,.2,1) infinite" }} />}
                                      <span className={"absolute inset-0 rounded-full border-2 " + (pulse ? "bg-s-accent border-s-accent" : "bg-white border-[#BBB8B5]")} />
                                    </span>
                                    <p className="text-[13px] font-medium text-s-ink">{ev.to_status ? t(`status.${ev.to_status}`) : ev.action}</p>
                                    <p className="text-[12px] text-s-ink-2 mt-0.5">{[ev.actor_name || ev.actor_type, fmtWhen(ev.at)].filter(Boolean).join(" ")}</p>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-[13px] text-s-ink-2">—</p>
                          )}
                        </div>
                      )}

                      {terminal ? (
                        c.resolution && <p className="text-[13px] text-s-ink-2 mt-2 pt-3 border-t border-s-border">{t("resolution")}: <span className="text-s-ink font-medium">{c.resolution}</span></p>
                      ) : (
                        <div className="mt-4 pt-3 border-t border-s-border">
                          <input value={note[c.id] || ""} onChange={(e) => setNote((p) => ({ ...p, [c.id]: e.target.value }))} placeholder={t("resolutionNote")} className="w-full h-9 px-3 mb-2.5 rounded-[10px] border border-s-border text-[12.5px]" />
                          <div className="flex items-center gap-2 flex-wrap">
                            {isEsc ? (
                              <>
                                <ActBtn c={c} action="admin_approve" label={refundAmt[c.id] ? t("approvePartial") : t("approveFull")} className="h-9 px-3.5 rounded-[10px] bg-s-accent-bright text-white text-[12.5px] font-semibold hover:bg-s-accent" />
                                <ActBtn c={c} action="admin_reject" label={t("reject")} className="h-9 px-3.5 rounded-[10px] border border-s-error/40 text-s-error text-[12.5px] font-semibold hover:bg-s-error-bg" />
                                <div className="ml-auto flex items-center gap-1.5">
                                  <input type="number" value={refundAmt[c.id] || ""} onChange={(e) => setRefundAmt((p) => ({ ...p, [c.id]: e.target.value }))} placeholder={t("partialPlaceholder")} className="w-24 h-9 px-3 rounded-[10px] border border-s-border text-[12.5px] tabular-nums" />
                                </div>
                              </>
                            ) : (
                              <>
                                <ActBtn c={c} action="dismiss" label={t("dismiss")} className="h-9 px-3.5 rounded-[10px] bg-s-bg-sunken text-s-ink text-[12.5px] font-semibold hover:bg-s-border" />
                                <ActBtn c={c} action="escalate" label={t("escalate")} className="h-9 px-3.5 rounded-[10px] border border-s-border text-s-ink-2 text-[12.5px] font-semibold hover:bg-s-bg-sunken" />
                                <div className="ml-auto flex items-center gap-1.5">
                                  <input type="number" value={refundAmt[c.id] || ""} onChange={(e) => setRefundAmt((p) => ({ ...p, [c.id]: e.target.value }))} placeholder={t("refundPlaceholder")} className="w-24 h-9 px-3 rounded-[10px] border border-s-border text-[12.5px] tabular-nums" />
                                  <ActBtn c={c} action="refund" label={t("refund")} className="h-9 px-3.5 rounded-[10px] bg-s-accent-bright text-white text-[12.5px] font-semibold hover:bg-s-accent" />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
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
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
