"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { Gift, ChevronRight, AlertCircle, CheckCircle, Clock, X } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";

interface Voucher {
  id: string;
  code: string;
  amount: number;
  remaining_amount: number;
  created_at: string;
  redeemed_at: string | null;
  expires_at: string | null;
  message?: string;
  recipient_email: string;
  recipient_name: string;
  salons: { id: string; name_de: string; name_en: string } | null;
}

interface VouchersData {
  active: Voucher[];
  used: Voucher[];
  expired: Voucher[];
  total: number;
}

export default function VouchersPage() {
  const locale = useLocale();
  const [data, setData] = useState<VouchersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile/vouchers")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch vouchers");
        return r.json();
      })
      .then(setData)
      .catch((err) => {
        console.error("[VouchersPage] failed to load vouchers:", err);
        setError("Fehler beim Laden der Gutscheine");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-s-bg-surface dark:bg-s-ink flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-s-bg-surface dark:bg-s-ink flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-s-coral/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-s-coral" />
          </div>
          <p className="text-s-coral text-sm font-heading font-bold mb-1">FEHLER</p>
          <p className="text-s-ink/60 dark:text-s-dm-text/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s-bg-surface dark:bg-s-ink py-8 px-4">
      {/* Breadcrumb */}
      <div className="max-w-lg mx-auto mb-4 text-xs text-s-ink/40 dark:text-s-dm-text/40 flex items-center gap-1">
        <Link href={`/${locale}/profile`} className="hover:text-s-coral transition-colors">
          Profil
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-s-ink/60 dark:text-s-dm-text/60">Meine Gutscheine</span>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-s-coral/10 to-s-coral/5 dark:from-s-coral/20 dark:to-s-coral/5 rounded-[12px] border border-s-coral/20 p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-s-coral/15 flex items-center justify-center mx-auto mb-3">
            <Gift className="w-7 h-7 text-s-coral" />
          </div>
          <h1 className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text mb-1">
            Meine Gutscheine
          </h1>
          <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 max-w-xs mx-auto">
            {data?.total ?? 0} {(data?.total ?? 0) === 1 ? "Gutschein" : "Gutscheine"} insgesamt
          </p>
        </div>

        {/* Active vouchers section */}
        {data?.active && data.active.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-heading font-bold uppercase tracking-[.12em] text-s-ink/40 dark:text-s-dm-text/40 px-2">
              Aktive Gutscheine ({data.active.length})
            </h2>
            {data.active.map((voucher) => (
              <VoucherCard key={voucher.id} voucher={voucher} locale={locale} status="active" />
            ))}
          </div>
        )}

        {/* Used vouchers section */}
        {data?.used && data.used.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-heading font-bold uppercase tracking-[.12em] text-s-ink/40 dark:text-s-dm-text/40 px-2">
              Verwendet ({data.used.length})
            </h2>
            {data.used.map((voucher) => (
              <VoucherCard key={voucher.id} voucher={voucher} locale={locale} status="used" />
            ))}
          </div>
        )}

        {/* Expired vouchers section */}
        {data?.expired && data.expired.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-heading font-bold uppercase tracking-[.12em] text-s-ink/40 dark:text-s-dm-text/40 px-2">
              Abgelaufen ({data.expired.length})
            </h2>
            {data.expired.map((voucher) => (
              <VoucherCard key={voucher.id} voucher={voucher} locale={locale} status="expired" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {(!data?.active || data.active.length === 0) &&
          (!data?.used || data.used.length === 0) &&
          (!data?.expired || data.expired.length === 0) && (
          <div className="text-center py-12">
            <div className="w-12 h-12 rounded-full bg-s-ink/5 dark:bg-white/5 flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6 text-s-ink/30 dark:text-s-dm-text/30" />
            </div>
            <p className="text-s-ink/60 dark:text-s-dm-text/60 text-sm">
              Du hast noch keine Gutscheine. Bestelle einen als Geschenk!
            </p>
            <Link
              href={`/${locale}/vouchers`}
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-btn bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-all"
            >
              Gutschein kaufen
            </Link>
          </div>
        )}

        {/* Action section */}
        {(data?.active || data?.used || data?.expired) && (
          <div className="mt-8 pt-6 border-t border-s-ink/5 dark:border-white/5">
            <Link
              href={`/${locale}/vouchers`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-btn border border-s-coral/20 dark:border-s-coral/40 bg-s-coral/5 dark:bg-s-coral/10 text-[11px] font-heading font-bold uppercase tracking-[.06em] text-s-coral hover:border-s-coral/40 dark:hover:border-s-coral/60 hover:bg-s-coral/10 dark:hover:bg-s-coral/20 transition-all"
            >
              Neuen Gutschein schenken
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function VoucherCard({
  voucher,
  locale,
  status,
}: {
  voucher: Voucher;
  locale: string;
  status: "active" | "used" | "expired";
}) {
  const salonName = locale === "de" ? voucher.salons?.name_de : voucher.salons?.name_en;
  const expiresAt = voucher.expires_at ? new Date(voucher.expires_at) : null;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  let statusIcon = null;
  let statusColor = "";
  let statusLabel = "";

  if (status === "active") {
    statusIcon = <Clock className="w-4 h-4" />;
    statusColor = "border-s-amber/20 bg-s-amber/5 dark:bg-s-amber/10";
    statusLabel = daysUntilExpiry ? `${daysUntilExpiry} Tage` : "Gültig";
  } else if (status === "used") {
    statusIcon = <CheckCircle className="w-4 h-4" />;
    statusColor = "border-s-success/20 bg-s-success/5 dark:bg-s-success/10";
    statusLabel = "Verwendet";
  } else {
    statusIcon = <X className="w-4 h-4" />;
    statusColor = "border-s-ink/10 dark:border-white/10 bg-s-ink/5 dark:bg-white/5";
    statusLabel = "Abgelaufen";
  }

  return (
    <div
      className={`rounded-[12px] border p-4 transition-all ${statusColor}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Recipient info */}
          <p className="text-xs font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mb-1">
            Für: {voucher.recipient_name}
          </p>

          {/* Salon name */}
          {salonName && (
            <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text mb-2">
              {salonName}
            </p>
          )}

          {/* Code and amount */}
          <div className="flex items-center justify-between mb-2">
            <code className="text-xs font-mono font-bold text-s-ink/60 dark:text-s-dm-text/60 tracking-[.06em]">
              {voucher.code}
            </code>
            <span className="text-sm font-heading font-bold text-s-ink dark:text-s-dm-text">
              {formatCurrency(voucher.amount, locale)}
            </span>
          </div>

          {/* Status badge */}
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px]"
            style={{
              background: status === "active" ? "rgba(212,135,10,.15)" : status === "used" ? "rgba(46,125,50,.15)" : "rgba(26,18,9,.08)",
            }}>
            {statusIcon && (
              <>
                {status === "active" && <Clock className="w-3 h-3 text-s-amber" />}
                {status === "used" && <CheckCircle className="w-3 h-3 text-s-success" />}
                {status === "expired" && <X className="w-3 h-3 text-s-ink/40 dark:text-s-dm-text/40" />}
              </>
            )}
            <span
              className="text-[9px] font-heading font-bold uppercase tracking-[.08em]"
              style={{
                color: status === "active" ? "#D4870A" : status === "used" ? "#2E7D32" : "rgba(26,18,9,.4)",
              }}
            >
              {statusLabel}
            </span>
          </div>

          {/* Message */}
          {voucher.message && (
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 italic mt-2 line-clamp-2">
              "{voucher.message}"
            </p>
          )}
        </div>

        {/* Remaining amount indicator */}
        {status === "used" && voucher.remaining_amount > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/40 dark:text-s-dm-text/40 mb-1">
              Verbleibend
            </p>
            <p className="text-sm font-heading font-bold text-s-ink dark:text-s-dm-text">
              {formatCurrency(voucher.remaining_amount, locale)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
