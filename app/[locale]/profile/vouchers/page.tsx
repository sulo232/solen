"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gift, ChevronRight, AlertCircle, CheckCircle, Clock, X } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
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
  const router = useRouter();
  const [data, setData] = useState<VouchersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // V3 guest-auth fix (2026-06-05): true while the client redirect to login is in
  // flight — keeps the spinner up so the empty state never flashes for a guest.
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile/vouchers")
      .then((r) => {
        // V3 guest-auth fix (2026-06-05): /api/profile/vouchers 401s for guests.
        // Send them to login (same /auth/login?redirect= convention SignIn reads)
        // instead of rendering the generic red "FEHLER" state. Keep the spinner
        // up while the redirect happens (return null below skips setData/error).
        if (r.status === 401) {
          if (!cancelled) {
            setRedirecting(true);
            const dest = `/${locale}/profile/vouchers`;
            router.replace(`/${locale}/auth/login?redirect=${encodeURIComponent(dest)}`);
          }
          return null;
        }
        if (!r.ok) throw new Error("Failed to fetch vouchers");
        return r.json();
      })
      .then((d) => {
        if (!cancelled && d) setData(d);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[VouchersPage] failed to load vouchers:", err);
        setError("Fehler beim Laden der Gutscheine");
      })
      .finally(() => {
        // On a 401 we keep the spinner (don't drop into the empty state mid-redirect).
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-s-bg-surface flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    // V3-D290: error state — retired s-coral → s-error per LOCKFILE §1 universal-color (error=red)
    return (
      <div className="min-h-screen bg-s-bg-surface flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-s-error/10 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-s-error" />
          </div>
          <p className="text-s-error text-sm font-heading mb-1">FEHLER</p>
          <p className="text-s-ink-2 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s-bg-surface py-8 px-4">
      {/* Breadcrumb — V3-D290: hover color s-coral → s-ink */}
      <div className="max-w-lg mx-auto mb-4 text-xs text-s-ink/40 flex items-center gap-1">
        <Link href={`/${locale}/profile`} className="hover:text-s-ink transition-colors">
          Profil
        </Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-s-ink-2">Meine Gutscheine</span>
      </div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* Hero card — V3-D290: retired s-coral gradient/border → neutral sunken wash + s-border (Layer 1 chrome) */}
        <div className="bg-s-bg-sunken rounded-[12px] border border-s-border p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center mx-auto mb-3 border border-s-border">
            <Gift className="w-7 h-7 text-s-ink" />
          </div>
          <h1 className="font-heading text-xl text-s-ink mb-1">
            Meine Gutscheine
          </h1>
          <p className="text-sm text-s-ink-2 max-w-xs mx-auto">
            {data?.total ?? 0} {(data?.total ?? 0) === 1 ? "Gutschein" : "Gutscheine"} insgesamt
          </p>
        </div>

        {/* Active vouchers section */}
        {data?.active && data.active.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-heading uppercase tracking-[.12em] text-s-ink/40 px-2">
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
            <h2 className="text-xs font-heading uppercase tracking-[.12em] text-s-ink/40 px-2">
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
            <h2 className="text-xs font-heading uppercase tracking-[.12em] text-s-ink/40 px-2">
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
            <div className="w-12 h-12 rounded-full bg-s-ink/5 flex items-center justify-center mx-auto mb-3">
              <Gift className="w-6 h-6 text-s-ink/30" />
            </div>
            <p className="text-s-ink-2 text-sm">
              Du hast noch keine Gutscheine. Bestelle einen als Geschenk!
            </p>
            <Link
              href={`/${locale}/vouchers`}
              // V3-D290: empty-state CTA — s-coral → s-ink primary (LOCKFILE §0 rule 2)
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-btn bg-s-ink text-white text-[12px] font-heading uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150"
            >
              Gutschein kaufen
            </Link>
          </div>
        )}

        {/* Action section — V3-D290: secondary CTA — retired s-coral + corrupted dark-mode hover → s-ink outline */}
        {(data?.active || data?.used || data?.expired) && (
          <div className="mt-8 pt-6 border-t border-s-border">
            <Link
              href={`/${locale}/vouchers`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-btn border border-s-border bg-white text-[12px] font-heading uppercase tracking-[.06em] text-s-ink hover:bg-s-bg-sunken transition-[transform,filter] duration-150"
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

  // V3-D290: status colors — undefined s-amber → s-warning (LOCKFILE §1: warning=#F59E0B amber)
  if (status === "active") {
    statusIcon = <Clock className="w-4 h-4" />;
    statusColor = "border-s-warning/20 bg-s-warning/5";
    statusLabel = daysUntilExpiry ? `${daysUntilExpiry} Tage` : "Gültig";
  } else if (status === "used") {
    statusIcon = <CheckCircle className="w-4 h-4" />;
    statusColor = "border-s-success/20 bg-s-success/5";
    statusLabel = "Verwendet";
  } else {
    statusIcon = <X className="w-4 h-4" />;
    statusColor = "border-s-border bg-s-ink/5";
    statusLabel = "Abgelaufen";
  }

  return (
    <div
      className={`rounded-[12px] border p-4 transition-[border-color,background-color] duration-150 ${statusColor}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Recipient info */}
          <p className="text-xs font-heading uppercase tracking-[.08em] text-s-ink/40 mb-1">
            Für: {voucher.recipient_name}
          </p>

          {/* Salon name */}
          {salonName && (
            <p className="text-sm font-heading text-s-ink mb-2">
              {salonName}
            </p>
          )}

          {/* Code and amount */}
          <div className="flex items-center justify-between mb-2">
            <code className="text-xs font-mono font-bold text-s-ink-2 tracking-[.06em]">
              {voucher.code}
            </code>
            <span className="text-sm font-heading text-s-ink">
              {formatCurrency(voucher.amount, locale)}
            </span>
          </div>

          {/* Status badge — V3-D290: hardcoded rgba + s-amber → tokens (LOCKFILE §1 warning=#F59E0B, success=#16A34A, disabled=ink-2) */}
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-[6px] ${
            status === "active" ? "bg-s-warning/15" : status === "used" ? "bg-s-success/15" : "bg-s-bg-sunken"
          }`}>
            {statusIcon && (
              <>
                {status === "active" && <Clock className="w-3 h-3 text-s-warning" />}
                {status === "used" && <CheckCircle className="w-3 h-3 text-s-success" />}
                {status === "expired" && <X className="w-3 h-3 text-s-ink/40" />}
              </>
            )}
            <span
              className={`text-[12px] font-heading uppercase tracking-[.08em] ${
                status === "active" ? "text-s-warning" : status === "used" ? "text-s-success" : "text-s-ink-2"
              }`}
            >
              {statusLabel}
            </span>
          </div>

          {/* Message */}
          {voucher.message && (
            <p className="text-xs text-s-ink-2 italic mt-2 line-clamp-2">
              "{voucher.message}"
            </p>
          )}
        </div>

        {/* Remaining amount indicator */}
        {status === "used" && voucher.remaining_amount > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[12px] font-heading uppercase tracking-[.08em] text-s-ink/40 mb-1">
              Verbleibend
            </p>
            <p className="text-sm font-heading text-s-ink">
              {formatCurrency(voucher.remaining_amount, locale)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
