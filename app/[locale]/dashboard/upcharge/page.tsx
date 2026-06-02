"use client";

// Salon upcharge request page (V3-D421). Wires the locked mockup
// (public/solen-dashboard-upcharge.html) to:
//   GET  /api/bookings?status=completed          completed bookings (picker source, RLS-scoped to the salon)
//   POST /api/bookings/:bookingId/dispute        create upcharge request { requested_amount(Rappen), salon_reason }
//   GET  /api/dashboard/disputes?direction=upcharge   the salon's sent requests
// Contract: requested_amount = the EXTRA (new total - already paid), > 0 and <= 50% of paid_amount.

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { TrendingUp, Send } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";

interface BookingItem {
  id: string;
  reference_code: string | null;
  starts_at: string | null;
  paid_amount: number; // Rappen
  guest_name: string | null;
  services?: { name_de: string | null; name_en: string | null } | null;
}

interface UpchargeCase {
  id: string;
  booking_id: string;
  direction: "refund" | "upcharge";
  reference_code: string | null;
  requested_amount: number | null; // Rappen (the extra)
  status: string;
  customer_name: string | null;
  created_at: string;
}

type Tone = "success" | "warning" | "error" | "neutral" | "urgent";

const UP_STATUS_TONE: Record<string, Tone> = {
  open: "warning", // awaiting customer
  salon_approved: "warning", // customer approved, charge deferred
  charged: "success",
  void: "neutral",
  closed: "neutral",
  salon_rejected: "error",
};

const chf = (rappen: number | null | undefined) => `CHF ${((rappen ?? 0) / 100).toFixed(2)}`;
const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

export default function SalonUpchargePage() {
  const t = useTranslations("dashboard.upcharge") as any;

  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [sent, setSent] = useState<UpchargeCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedId, setSelectedId] = useState("");
  const [newTotal, setNewTotal] = useState("");
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const selected = bookings.find((b) => b.id === selectedId) || null;
  const paid = selected?.paid_amount ?? 0;
  const newTotalRappen = newTotal ? Math.round(parseFloat(newTotal) * 100) : 0;
  const difference = newTotalRappen - paid; // the extra (Rappen)
  const cap = Math.floor(paid * 0.5); // contract: <= 50% of paid
  const valid =
    !!selected && difference > 0 && difference <= cap && reason.trim().length >= 3 && !Number.isNaN(newTotalRappen);

  const loadSent = useCallback(() => {
    // NB: this endpoint ignores ?direction and its default status set excludes
    // charged/void — so request the upcharge-relevant statuses, then filter by direction.
    fetch("/api/dashboard/disputes?status=open,salon_approved,charged,void,closed,salon_rejected")
      .then((r) => r.json())
      .then((d) => setSent((d.cases ?? []).filter((c: UpchargeCase) => c.direction === "upcharge")))
      .catch((err) => console.error("[Upcharge] sent list failed:", err));
  }, []);

  const loadAll = useCallback(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      fetch("/api/profile").then((r) => r.json()),
      fetch("/api/bookings?status=completed").then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      }),
    ])
      .then(([profile, bk]) => {
        setSalonName(profile?.salon_name);
        setSalonCategories(profile?.salon_categories);
        setBookings(bk?.items ?? []);
      })
      .catch((err) => {
        console.error("[Upcharge] init failed:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
    loadSent();
  }, [loadSent]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const submit = async () => {
    if (!valid || !selected) return;
    setSending(true);
    try {
      const res = await fetch(`/api/bookings/${selected.id}/dispute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requested_amount: difference, salon_reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSelectedId("");
        setNewTotal("");
        setReason("");
        loadSent();
      } else {
        alert(data?.error || t("actionError"));
      }
    } catch (err) {
      console.error("[Upcharge] submit failed:", err);
      alert(t("actionError"));
    } finally {
      setSending(false);
    }
  };

  const svcName = (b: BookingItem) => b.services?.name_de || b.services?.name_en || "";
  const bookingLabel = (b: BookingItem) =>
    [b.guest_name || b.reference_code || b.id.slice(0, 8), svcName(b), fmtDate(b.starts_at), chf(b.paid_amount)]
      .filter(Boolean)
      .join(" · ");

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="w-6 h-6 text-s-ink" />
          <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">{t("title")}</h1>
        </div>
        <p className="text-[13px] text-s-ink/50 mb-5 ml-9">{t("subtitle")}</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-s-border bg-white p-8 text-center">
            <p className="text-[14px] text-s-ink-2 mb-3">{t("loadError")}</p>
            <button onClick={loadAll} className="h-9 px-4 rounded-[10px] bg-s-ink text-white text-[13px] font-semibold">{t("retry")}</button>
          </div>
        ) : (
          <>
            {/* create form (elevated primary card) */}
            <div className="rounded-2xl border border-[#dcd9d6] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_10px_28px_rgba(10,10,10,.07)] mb-7">
              {/* booking picker */}
              <label className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-s-ink/40 mb-1.5">
                {t("selectBooking")}
              </label>
              {bookings.length === 0 ? (
                <p className="text-[13px] text-s-ink-2 mb-4">{t("noBookings")}</p>
              ) : (
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="w-full h-11 px-3 mb-4 rounded-[10px] border border-s-border text-[13.5px] text-s-ink bg-white focus:outline-none focus:border-s-accent"
                >
                  <option value="">{t("selectPlaceholder")}</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {bookingLabel(b)}
                    </option>
                  ))}
                </select>
              )}

              {selected && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-s-ink/40 mb-1.5">
                        {t("original")}
                      </label>
                      <p className="h-11 flex items-center font-heading text-[15px] font-medium text-s-ink-2 tabular-nums">
                        {chf(paid)}
                      </p>
                    </div>
                    <div>
                      <label className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-s-ink/40 mb-1.5">
                        {t("newTotal")}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-s-ink-2">CHF</span>
                        <input
                          type="number"
                          value={newTotal}
                          onChange={(e) => setNewTotal(e.target.value)}
                          className="w-full h-11 pl-11 pr-3 rounded-[10px] border border-s-border font-heading text-[15px] font-semibold tabular-nums text-s-ink focus:outline-none focus:border-s-accent"
                        />
                      </div>
                    </div>
                  </div>

                  {/* computed difference (focal) + cap note */}
                  <div className="flex items-baseline justify-between gap-3 px-3.5 py-3 rounded-xl bg-s-warning-bg mb-1.5">
                    <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-s-warning-text">
                      {t("difference")}
                    </span>
                    <span className="font-heading text-[22px] font-bold text-s-warning-text tabular-nums tracking-[-0.015em]">
                      {difference > 0 ? `+ ${chf(difference)}` : chf(0)}
                    </span>
                  </div>
                  <p className={"text-[11px] mb-4 " + (difference > cap ? "text-s-error font-medium" : "text-s-ink/40")}>
                    {difference > cap ? t("capExceeded", { max: chf(cap) }) : t("capNote", { max: chf(cap) })}
                  </p>

                  <label className="block text-[10.5px] font-semibold uppercase tracking-[0.06em] text-s-ink/40 mb-1.5">
                    {t("reasonLabel")}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("reasonPlaceholder")}
                    rows={2}
                    maxLength={500}
                    className="w-full px-3 py-2 mb-4 rounded-[10px] border border-s-border text-[13px] resize-none focus:outline-none focus:border-s-accent"
                  />

                  <button
                    onClick={submit}
                    disabled={!valid || sending}
                    className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] bg-s-accent-bright text-white text-[13px] font-semibold hover:bg-s-accent disabled:opacity-50 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? t("sending") : t("send")}
                  </button>
                </>
              )}
            </div>

            {/* sent requests */}
            <h2 className="text-[15px] font-semibold text-s-ink mb-3">{t("sentTitle")}</h2>
            {sent.length === 0 ? (
              <div className="rounded-2xl border border-s-border bg-white p-6 text-center text-[14px] text-s-ink-2">
                {t("empty")}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {sent.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-s-border bg-white p-[18px] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-s-ink font-heading">{c.customer_name || t("unknown")}</p>
                      <p className="text-[12px] text-s-ink-2 mt-0.5">
                        {c.reference_code || c.booking_id.slice(0, 8)} · {fmtDate(c.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="font-heading text-[16px] font-semibold text-s-warning-text tabular-nums">
                        + {chf(c.requested_amount)}
                      </span>
                      <DashStatusPill tone={UP_STATUS_TONE[c.status] || "neutral"}>
                        {t(`status.${c.status}`)}
                      </DashStatusPill>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
