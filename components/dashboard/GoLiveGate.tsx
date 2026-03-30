"use client";

import { useEffect, useState } from "react";
import { Rocket, CheckCircle2, Image, CreditCard, Scissors } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import Spinner from "@/components/ui/Spinner";

interface GoLiveStatus {
  is_active: boolean;
  has_stripe: boolean;
  has_cover_photo: boolean;
  has_services: boolean;
  can_go_live: boolean;
}

export default function GoLiveGate() {
  const locale = useLocale();
  const t = useTranslations("dashboard.goLive") as any;
  const [status, setStatus] = useState<GoLiveStatus | null>(null);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/salon/go-live")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d && !d.error) setStatus(d); })
      .catch(() => {});
  };

  useEffect(() => { load(); }, []);

  // Don't show the gate once the salon is live
  if (!status || status.is_active) return null;

  const handleGoLive = async () => {
    setActivating(true);
    setError("");
    try {
      const res = await fetch("/api/salon/go-live", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus((prev) => prev ? { ...prev, is_active: true } : prev);
        // Reload page to refresh dashboard data
        window.location.reload();
      } else {
        setError(data.error ?? t("activationError"));
      }
    } catch {
      setError(t("networkError"));
    } finally {
      setActivating(false);
    }
  };

  const requirements = [
    {
      key: "services",
      label: t("minService"),
      done: status.has_services,
      href: `/${locale}/dashboard/services`,
      Icon: Scissors,
    },
    {
      key: "photo",
      label: t("coverPhoto"),
      done: status.has_cover_photo,
      href: `/${locale}/dashboard/settings?tab=profile`,
      Icon: Image,
    },
    {
      key: "stripe",
      label: t("stripeConnected"),
      done: status.has_stripe,
      href: `/${locale}/dashboard/settings?tab=payments`,
      Icon: CreditCard,
    },
  ];

  const doneCount = requirements.filter((r) => r.done).length;

  return (
    <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-white/[0.06] mb-6 bg-white dark:bg-s-dm-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-4 border-b border-s-ink/[0.04]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-s-coral/10 flex items-center justify-center">
              <Rocket size={18} className="text-s-coral" />
            </div>
            <div>
              <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-amber mb-0.5">{t("setup")}</p>
              <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">{t("notLive")}</p>
            </div>
          </div>
          <p className="text-xs data-text font-medium text-s-ink/40">{doneCount}/{requirements.length}</p>
        </div>
      </div>

      {/* Checklist */}
      <div className="px-4 py-4 space-y-2">
        {requirements.map(({ key, label, done, href, Icon }) => (
          <div key={key} className={`flex items-center gap-3 ${done ? "opacity-50" : ""}`}>
            <div className={`w-5 h-5 rounded-[6px] flex items-center justify-center shrink-0 ${done ? "bg-[#4CAF6F]" : "border border-s-ink/15"}`}>
              {done && <CheckCircle2 size={11} className="text-white" />}
            </div>
            <div className="flex-1 flex items-center gap-2">
              <Icon size={13} className={done ? "text-s-coral" : "text-s-ink/30 dark:text-s-dm-text/30"} />
              <span className={`text-xs font-heading font-semibold ${done ? "text-s-ink dark:text-s-dm-text" : "text-s-ink/50 dark:text-s-dm-text/50"}`}>
                {label}
              </span>
            </div>
            {!done && (
              <Link href={href} className="text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-coral shrink-0">
                {t("configure")}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Go Live button */}
      <div className="px-4 pb-4">
        {error && <p className="text-xs text-s-coral mb-2">{error}</p>}
        <button
          onClick={status.can_go_live ? handleGoLive : undefined}
          disabled={!status.can_go_live || activating}
          className={[
            "w-full py-3 rounded-[8px] text-xs font-heading font-bold uppercase tracking-[.04em] flex items-center justify-center gap-2 transition-colors",
            status.can_go_live
              ? "bg-s-coral text-white hover:brightness-[1.06] cursor-pointer"
              : "bg-s-ink/5 dark:bg-white/5 text-s-ink/30 dark:text-s-dm-text/30 cursor-not-allowed",
          ].join(" ")}
        >
          {activating ? <Spinner size="sm" invert={status.can_go_live} /> : <Rocket size={15} />}
          {status.can_go_live ? t("goLiveNow") : t("notReady")}
        </button>
      </div>
    </div>
  );
}
