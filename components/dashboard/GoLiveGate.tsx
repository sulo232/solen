"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Rocket, CheckCircle2, ExternalLink, Image, CreditCard, Scissors } from "lucide-react";
import { useLocale } from "next-intl";
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
  const [status, setStatus] = useState<GoLiveStatus | null>(null);
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/salon/go-live")
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setStatus(d);
      })
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
        setError(data.error ?? "Fehler beim Aktivieren");
      }
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setActivating(false);
    }
  };

  const requirements = [
    {
      key: "services",
      label: "Mindestens 1 Service",
      done: status.has_services,
      href: `/${locale}/dashboard/services`,
      Icon: Scissors,
    },
    {
      key: "photo",
      label: "Titelbild hochgeladen",
      done: status.has_cover_photo,
      href: `/${locale}/dashboard/settings?tab=profile`,
      Icon: Image,
    },
    {
      key: "stripe",
      label: "Stripe Connect verknüpft",
      done: status.has_stripe,
      href: `/${locale}/dashboard/settings?tab=payments`,
      Icon: CreditCard,
    },
  ];

  const doneCount = requirements.filter((r) => r.done).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/8 dark:border-white/8 shadow-warm-sm mb-6 overflow-hidden"
    >
      {/* Header bar */}
      <div className="bg-gradient-to-r from-s-coral/8 to-s-amber/8 dark:from-s-coral/15 dark:to-s-amber/15 px-5 py-4 border-b border-s-ink/5 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-s-coral/10 flex items-center justify-center">
              <Rocket size={18} className="text-s-coral" />
            </div>
            <div>
              <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">Salon noch nicht live</p>
              <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
                {doneCount} von {requirements.length} Anforderungen erfüllt
              </p>
            </div>
          </div>
          {/* Mini progress pills */}
          <div className="flex gap-1">
            {requirements.map((r) => (
              <div
                key={r.key}
                className={`w-2 h-2 rounded-full transition-colors ${r.done ? "bg-s-coral" : "bg-s-ink/10 dark:bg-white/10"}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Checklist */}
      <div className="px-5 py-4 space-y-2">
        {requirements.map(({ key, label, done, href, Icon }) => (
          <div key={key} className="flex items-center gap-3">
            {done ? (
              <CheckCircle2 size={16} className="text-s-coral shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-s-ink/15 dark:border-white/15 shrink-0" />
            )}
            <div className="flex-1 flex items-center gap-2">
              <Icon size={13} className={done ? "text-s-coral" : "text-s-ink/30 dark:text-s-dm-text/30"} />
              <span className={`text-sm ${done ? "text-s-ink dark:text-s-dm-text" : "text-s-ink/50 dark:text-s-dm-text/50"}`}>
                {label}
              </span>
            </div>
            {!done && (
              <a
                href={href}
                className="flex items-center gap-1 text-xs text-s-coral hover:underline shrink-0"
              >
                Einrichten <ExternalLink size={10} />
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Go Live button */}
      <div className="px-5 pb-5">
        {error && <p className="text-xs text-s-coral mb-2">{error}</p>}
        <button
          onClick={status.can_go_live ? handleGoLive : undefined}
          disabled={!status.can_go_live || activating}
          className={[
            "w-full py-3 rounded-button text-sm font-medium flex items-center justify-center gap-2 transition-colors",
            status.can_go_live
              ? "bg-s-coral text-white hover:bg-s-coral/90 cursor-pointer"
              : "bg-s-ink/5 dark:bg-white/5 text-s-ink/30 dark:text-s-dm-text/30 cursor-not-allowed",
          ].join(" ")}
        >
          {activating ? (
            <Spinner size="sm" invert={status.can_go_live} />
          ) : (
            <Rocket size={15} />
          )}
          {status.can_go_live ? "Salon jetzt live schalten" : "Noch nicht bereit für Go Live"}
        </button>
      </div>
    </motion.div>
  );
}
