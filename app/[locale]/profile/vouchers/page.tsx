"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gift, Clock, Check, X, Wallet } from "lucide-react";
import Skeleton from "@/components-legacy/ui/Skeleton";
import EmptyState from "@/components-legacy/ui/EmptyState";
import ErrorState from "@/components-legacy/ui/ErrorState";
import { formatCurrency } from "@/lib/format-currency";

// #45 (2026-07-18): this page used to be a redirect-to-/profile no-op (owner-hidden
// 2026-06-14, same shelving as gift cards). Voucher SPEND is now wired into the real
// booking pay step (PayConfirmStep + booking-pay-intent), so a customer's vouchers are
// no longer a dead purchase receipt, they're real spendable balance, hence un-hidden here
// per the 2026-07-18 owner law. Restored from the pre-hide implementation (git show
// 0baf3c077:app/[locale]/profile/vouchers/page.tsx) and modernized onto the current locked
// components (Skeleton/EmptyState/ErrorState, rounded-card) rather than the 2026-06 ad hoc
// markup; the referral-credit balance (#52, a 2026-07-03+ feature that didn't exist when
// the old page was written) is net new, using the same card pattern already used in
// PayConfirmStep in this same change. Gift cards stay hidden (REMOVED.md, unrelated
// feature), this page is voucher-only, matching /api/profile/vouchers's own scope.
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
  salons: { id: string; name: string } | null;
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
  const t = useTranslations("vouchers.profile");

  const [data, setData] = useState<VouchersData | null>(null);
  // Credit (Guthaben) balance, CHF. Reuses GET /api/referral's total_earned, which is
  // already the LIVE spendable balance (sum of unexpired user_credits.remaining), the
  // same figure booking-pay-intent auto-applies at checkout (lib/credits/redeem.ts).
  const [creditChf, setCreditChf] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Guest-auth: /api/profile/vouchers 401s for a logged-out visitor. Keep the spinner up
  // while the redirect to login is in flight so the empty state never flashes first.
  const [redirecting, setRedirecting] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    Promise.all([fetch("/api/profile/vouchers"), fetch("/api/referral")])
      .then(async ([vRes, rRes]) => {
        if (cancelled) return;
        if (vRes.status === 401) {
          setRedirecting(true);
          const dest = `/${locale}/profile/vouchers`;
          router.replace(`/${locale}/auth/login?redirect=${encodeURIComponent(dest)}`);
          return;
        }
        if (!vRes.ok) throw new Error("vouchers fetch failed");
        const vJson = await vRes.json();
        if (cancelled) return;
        setData(vJson);
        // Credit is additive info, not required to render the voucher wallet: a failed
        // /api/referral read shows 0 rather than blocking the whole page.
        if (rRes.ok) {
          const rJson = await rRes.json();
          setCreditChf(typeof rJson.total_earned === "number" ? rJson.total_earned : 0);
        } else {
          setCreditChf(0);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[VouchersPage] failed to load wallet:", err);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [locale, router]);

  useEffect(() => load(), [load]);

  if (loading || redirecting) {
    return (
      <div className="min-h-screen bg-s-bg-surface px-4 py-8">
        <div className="mx-auto max-w-lg space-y-4">
          <Skeleton variant="text" className="h-[84px] w-full rounded-card" />
          <Skeleton variant="text" className="h-[92px] w-full rounded-card" />
          <Skeleton variant="text" className="h-[92px] w-full rounded-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-s-bg-surface">
        <ErrorState title={t("error")} onRetry={load} retryLabel={t("retry")} />
      </div>
    );
  }

  const hasVouchers = !!(data?.active?.length || data?.used?.length || data?.expired?.length);
  const hasCredit = (creditChf ?? 0) > 0;

  return (
    <div className="min-h-screen bg-s-bg-surface px-4 py-8">
      <div className="mx-auto max-w-lg space-y-5">
        {/* Guthaben (referral credit balance, #52): real money the customer already
            has, auto-applied at the next online-pay booking. Only rendered once loaded,
            never a placeholder figure. */}
        <div className="rounded-card border border-s-border bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-s-bg-sunken">
              <Wallet size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-s-ink-2">{t("creditLabel")}</p>
              <p className="font-heading text-[22px] font-bold tabular-nums text-s-ink">
                {formatCurrency(creditChf ?? 0, locale)}
              </p>
            </div>
          </div>
        </div>

        {!hasVouchers && !hasCredit ? (
          <EmptyState
            icon={Gift}
            title={t("title")}
            message={t("emptyBoth")}
            action={
              <Link
                href={`/${locale}/vouchers`}
                className="inline-flex items-center gap-2 rounded-full bg-s-ink px-5 py-3 text-[14px] font-semibold text-white transition-[filter,transform] duration-150 hover:brightness-[1.06] active:scale-[0.98] active:duration-[80ms] active:ease-glide"
              >
                {t("buyNew")}
              </Link>
            }
          />
        ) : (
          <>
            {!!data?.active?.length && (
              <div className="space-y-2.5">
                <h2 className="px-1 text-[13px] font-semibold text-s-ink">
                  {t("active")} ({data.active.length})
                </h2>
                {data.active.map((v) => (
                  <VoucherCard key={v.id} voucher={v} locale={locale} status="active" t={t} />
                ))}
              </div>
            )}
            {!!data?.used?.length && (
              <div className="space-y-2.5">
                <h2 className="px-1 text-[13px] font-semibold text-s-ink">
                  {t("used")} ({data.used.length})
                </h2>
                {data.used.map((v) => (
                  <VoucherCard key={v.id} voucher={v} locale={locale} status="used" t={t} />
                ))}
              </div>
            )}
            {!!data?.expired?.length && (
              <div className="space-y-2.5">
                <h2 className="px-1 text-[13px] font-semibold text-s-ink">
                  {t("expired")} ({data.expired.length})
                </h2>
                {data.expired.map((v) => (
                  <VoucherCard key={v.id} voucher={v} locale={locale} status="expired" t={t} />
                ))}
              </div>
            )}
            <Link
              href={`/${locale}/vouchers`}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-s-border bg-white px-5 py-3 text-[14px] font-semibold text-s-ink transition-colors duration-150 hover:bg-s-bg-sunken"
            >
              {t("buyNew")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

function VoucherCard({
  voucher,
  locale,
  status,
  t,
}: {
  voucher: Voucher;
  locale: string;
  status: "active" | "used" | "expired";
  t: ReturnType<typeof useTranslations>;
}) {
  const salonName = voucher.salons?.name;
  const expiresAt = voucher.expires_at ? new Date(voucher.expires_at) : null;
  const daysUntilExpiry = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const StatusIcon = status === "active" ? Clock : status === "used" ? Check : X;
  const statusColor = status === "active" ? "text-s-warning" : status === "used" ? "text-s-success" : "text-s-ink-2";
  const statusBg = status === "active" ? "bg-s-warning/15" : status === "used" ? "bg-s-success/15" : "bg-s-bg-sunken";
  const statusLabel =
    status === "active"
      ? daysUntilExpiry != null
        ? `${daysUntilExpiry} ${t("daysUntilExpiry")}`
        : t("statusActive")
      : status === "used"
        ? t("statusUsed")
        : t("statusExpired");

  return (
    <div className="rounded-card border border-s-border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] text-s-ink-2">
            {t("for")} {voucher.recipient_name}
          </p>
          {salonName && <p className="mt-0.5 font-heading text-[15px] font-semibold text-s-ink">{salonName}</p>}
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="data-text text-[13px] text-s-ink-2">{voucher.code}</span>
            <span className="font-heading text-[15px] font-semibold text-s-ink">{formatCurrency(voucher.amount, locale)}</span>
          </div>
          <div className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${statusBg}`}>
            <StatusIcon size={12} className={statusColor} aria-hidden />
            <span className={`text-[12px] font-semibold ${statusColor}`}>{statusLabel}</span>
          </div>
          {voucher.message && (
            <p className="mt-2 line-clamp-2 text-[12px] italic text-s-ink-2">&ldquo;{voucher.message}&rdquo;</p>
          )}
        </div>
        {status === "used" && voucher.remaining_amount > 0 && (
          <div className="shrink-0 text-right">
            <p className="text-[12px] text-s-ink-2">{t("remaining")}</p>
            <p className="font-heading text-[13px] font-semibold text-s-ink">{formatCurrency(voucher.remaining_amount, locale)}</p>
          </div>
        )}
      </div>
    </div>
  );
}
