"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { DollarSign, Wallet, FileText, Calendar, Clock, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import { resolveSwissLocale } from "@/lib/format";

interface Payout {
  id: string;
  created_at: string;
  gross_amount: number;
  commission_percent: number;
  commission_amount: number;
  net_amount: number;
  status: "recorded" | "pending" | "paid";
  stripe_payment_intent_id?: string;
}

interface EarningsData {
  total_earnings: number;
  pending_balance: number;
  payouts: Payout[];
}

interface StaffEarning {
  id: string;
  name: string;
  avatar_url: string | null;
  commission_rate: number;
  gross: number;
  staff_share: number;
  house_share: number;
}

function getStatusBadge(status: string, t: (key: "statusPaid" | "statusPending" | "statusRecorded") => string) {
  switch (status) {
    case "paid": return <span className="px-2 py-1 rounded-pill bg-s-success-bg text-s-success text-xs font-medium">{t("statusPaid")}</span>;
    case "pending": return <span className="px-2 py-1 rounded-pill bg-s-amber-subtle text-s-star-text text-xs font-medium">{t("statusPending")}</span>;
    case "recorded": return <span className="px-2 py-1 rounded-pill bg-s-blue-subtle text-s-blue-text text-xs font-medium">{t("statusRecorded")}</span>;
    default: return <span className="px-2 py-1 rounded-pill bg-s-ink/10 text-s-ink/70 text-xs font-medium">{status}</span>;
  }
}

export default function SalonEarningsPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.earningsPage");
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffEarnings, setStaffEarnings] = useState<StaffEarning[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [salonId, setSalonId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(r => r.json())
      .then(p => {
        const sid = p?.salon_id ?? null;
        setSalonId(sid);
        return fetch("/api/salon/earnings").then(res => res.json());
      })
      .then(d => {
        if (!d.error) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!salonId) return;
    fetch(`/api/earnings/staff?salon_id=${salonId}`)
      .then(r => r.json())
      .then(d => setStaffEarnings(d.staff ?? []))
      .catch((err) => console.error("[DashboardEarnings] failed to fetch staff earnings:", err))
      .finally(() => setStaffLoading(false));
  }, [salonId]);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-s-ink">{t("title")}</h1>
          <p className="text-sm text-s-ink/40 mt-0.5">{t("subtitle")}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !data ? (
        <div className="text-center py-20 text-s-ink/30 text-sm">{t("noPaymentData")}</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-[12px] border border-s-ink/5 p-5 shadow-warm-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-btn bg-s-coral/10 flex items-center justify-center shrink-0">
                <Wallet size={24} strokeWidth={2.4} className="text-s-coral" />
              </div>
              <div>
                <p className="text-xs font-medium text-s-ink-2 uppercase tracking-widest mb-1">{t("availableBalance")}</p>
                <p className="data-text font-bold text-3xl text-s-ink">{formatCurrency(data.pending_balance, locale)}</p>
                <p className="text-xs text-s-ink/40 mt-1">{t("availableBalanceHint")}</p>
              </div>
            </div>

            <div className="bg-white rounded-[12px] border border-s-ink/5 p-5 shadow-warm-md flex items-center gap-4">
              <div className="w-12 h-12 rounded-btn bg-green-50 flex items-center justify-center shrink-0">
                <DollarSign size={24} strokeWidth={2.4} className="text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-s-ink-2 uppercase tracking-widest mb-1">{t("totalPaidOut")}</p>
                <p className="data-text font-bold text-3xl text-s-ink">{formatCurrency(data.total_earnings, locale)}</p>
                <p className="text-xs text-s-ink/40 mt-1">{t("totalPaidOutHint")}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md overflow-hidden">
            <div className="px-5 py-4 border-b border-s-ink/5">
              <h2 className="font-heading text-s-ink text-sm">{t("transactionsTitle")}</h2>
            </div>
            
            {data.payouts && data.payouts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-s-bg-surface/80">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colDate")}</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colStatus")}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colGross")}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colFee")}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colNet")}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colAction")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payouts.map((p) => (
                      <tr key={p.id} className="border-t border-s-ink/5 hover:bg-s-bg-surface/60 transition-colors">
                        <td className="px-5 py-4 text-s-ink flex items-center gap-2">
                          <Calendar size={14} strokeWidth={1.6} className="text-s-ink/30" />
                          {new Date(p.created_at).toLocaleDateString(resolveSwissLocale(locale))}
                        </td>
                        <td className="px-5 py-4">
                          {getStatusBadge(p.status, t)}
                        </td>
                        <td className="px-5 py-4 text-right text-s-ink-2">
                          {formatCurrency(p.gross_amount, locale)}
                        </td>
                        <td className="px-5 py-4 text-right text-s-coral/80">
                          -{formatCurrency(p.commission_amount, locale)}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-s-ink">
                          {formatCurrency(p.net_amount, locale)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <a 
                            href={`/api/salon/invoices/${p.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-s-coral/10 text-s-coral transition-[colors,transform] active:scale-[0.94] active:duration-[80ms] active:ease-glide"
                            title={t("printInvoice")}
                          >
                            <FileText size={16} strokeWidth={1.9} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-s-ink/40">
                <Clock size={32} className="mx-auto mb-3 opacity-20" />
                <p>{t("noTransactions")}</p>
              </div>
            )}
          </div>

          {/* Staff Payout Table */}
          <div className="bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md overflow-hidden">
            <div className="px-5 py-4 border-b border-s-ink/5 flex items-center gap-2">
              <Users size={16} strokeWidth={1.9} className="text-s-coral" />
              <h2 className="font-heading text-s-ink text-sm">{t("staffPayoutTitle")}</h2>
            </div>
            {staffLoading ? (
              <div className="flex justify-center py-8"><Spinner size="md" /></div>
            ) : staffEarnings.length === 0 ? (
              <div className="p-8 text-center text-s-ink/40 text-sm">
                {t("noStaffCommission")}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-s-bg-surface/80">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colStaff")}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colCommission")}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colGross")}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colStaffShare")}</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40">{t("colHouseShare")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffEarnings.map((s) => (
                      <tr key={s.id} className="border-t border-s-ink/5 hover:bg-s-bg-surface/60 transition-colors">
                        <td className="px-5 py-4 text-s-ink">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-s-coral/10 flex items-center justify-center text-[12px] font-bold text-s-coral shrink-0 overflow-hidden relative">
                              {s.avatar_url ? <Image src={s.avatar_url} alt="" fill className="object-cover" unoptimized /> : s.name[0]}
                            </div>
                            <span className="font-medium">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right data-text text-s-ink-2">{s.commission_rate}%</td>
                        <td className="px-5 py-4 text-right data-text text-s-ink">{formatCurrency(s.gross, locale)}</td>
                        <td className="px-5 py-4 text-right data-text font-medium text-s-coral">{formatCurrency(s.staff_share, locale)}</td>
                        <td className="px-5 py-4 text-right data-text font-semibold text-s-ink">{formatCurrency(s.house_share, locale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
