"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Wallet, FileText, Calendar, Clock } from "lucide-react";
import { useLocale } from "next-intl";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

function getStatusBadge(status: string) {
  switch (status) {
    case "paid": return <span className="px-2 py-1 rounded-pill bg-s-success-bg text-s-success text-xs font-medium dark:bg-s-success/20 dark:text-s-sage">Ausbezahlt</span>;
    case "pending": return <span className="px-2 py-1 rounded-pill bg-s-amber-subtle text-s-amber-text text-xs font-medium dark:bg-s-amber/20 dark:text-s-amber">In Bearbeitung</span>;
    case "recorded": return <span className="px-2 py-1 rounded-pill bg-s-blue-subtle text-s-blue-text text-xs font-medium dark:bg-s-blue/20 dark:text-s-blue">Offen (Hold)</span>;
    default: return <span className="px-2 py-1 rounded-pill bg-s-ink/10 text-s-ink/70 dark:bg-white/10 dark:text-s-dm-text/70 text-xs font-medium">{status}</span>;
  }
}

export default function SalonEarningsPage() {
  const locale = useLocale();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/salon/earnings")
      .then(res => res.json())
      .then(d => {
        if (!d.error) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">Guthaben & Auszahlungen</h1>
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/50 mt-0.5">Übersicht deiner Online-Zahlungen via Stripe</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : !data ? (
        <div className="text-center py-20 text-s-ink/30 text-sm">Keine Zahlungsdaten gefunden.</div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div variants={itemVariants} className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-button bg-s-coral/10 flex items-center justify-center shrink-0">
                <Wallet size={24} className="text-s-coral" />
              </div>
              <div>
                <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 uppercase tracking-widest mb-1">Verfügbares Guthaben</p>
                <p className="font-bold text-3xl text-s-ink dark:text-s-dm-text">{formatCurrency(data.pending_balance, locale)}</p>
                <p className="text-xs text-s-ink/40 mt-1">Wird gemäss deinem Payout Schedule überwiesen.</p>
              </div>
            </motion.div>
            
            <motion.div variants={itemVariants} className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 p-5 shadow-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-button bg-green-50 flex items-center justify-center shrink-0 dark:bg-green-500/10">
                <DollarSign size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs font-medium text-s-ink/50 dark:text-s-dm-text/50 uppercase tracking-widest mb-1">Total Ausbezahlt</p>
                <p className="font-bold text-3xl text-s-ink dark:text-s-dm-text">{formatCurrency(data.total_earnings, locale)}</p>
                <p className="text-xs text-s-ink/40 mt-1">Summe aller bisherigen Auszahlungen.</p>
              </div>
            </motion.div>
          </div>

          <motion.div variants={itemVariants} className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5 shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-s-ink/5 dark:border-white/5">
              <h2 className="font-heading font-semibold text-s-ink dark:text-s-dm-text text-sm">Transaktionen & Gutschriften</h2>
            </div>
            
            {data.payouts && data.payouts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-s-bg-surface/80 dark:bg-s-dm-bg/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-s-ink/40 dark:text-s-dm-text/40">Datum</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-s-ink/40 dark:text-s-dm-text/40">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40 dark:text-s-dm-text/40">Brutto</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40 dark:text-s-dm-text/40">Gebühr</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40 dark:text-s-dm-text/40">Netto</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-s-ink/40 dark:text-s-dm-text/40">Aktion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.payouts.map((p) => (
                      <tr key={p.id} className="border-t border-s-ink/5 dark:border-white/5 hover:bg-s-bg-surface/60 transition-colors">
                        <td className="px-5 py-4 text-s-ink dark:text-s-dm-text flex items-center gap-2">
                          <Calendar size={14} className="text-s-ink/30" />
                          {new Date(p.created_at).toLocaleDateString("de-CH")}
                        </td>
                        <td className="px-5 py-4">
                          {getStatusBadge(p.status)}
                        </td>
                        <td className="px-5 py-4 text-right text-s-ink/60 dark:text-s-dm-text/60">
                          {formatCurrency(p.gross_amount, locale)}
                        </td>
                        <td className="px-5 py-4 text-right text-s-coral/80">
                          -{formatCurrency(p.commission_amount, locale)}
                        </td>
                        <td className="px-5 py-4 text-right font-semibold text-s-ink dark:text-s-dm-text">
                          {formatCurrency(p.net_amount, locale)}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <a 
                            href={`/api/salon/invoices/${p.id}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 rounded-full hover:bg-s-coral/10 text-s-correo text-s-coral transition-colors"
                            title="Abrechnung drucken"
                          >
                            <FileText size={16} />
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
                <p>Bisher keine Transaktionen vorhanden.</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
