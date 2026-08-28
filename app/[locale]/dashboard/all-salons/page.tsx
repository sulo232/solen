"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "motion/react";
import { Store, Search, X, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { containerVariants, itemVariants } from "@/lib/animations";
import { resolveSwissLocale } from "@/lib/format";

type StatusFilter = "active" | "pending" | "frozen";

interface AdminSalon {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  categories: string[];
  phone: string | null;
  cover_photo_url: string | null;
  is_active: boolean;
  registration_completed: boolean;
  approved_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  owner_id: string;
  owner_email: string | null;
}

const TAB_VALUES: StatusFilter[] = ["active", "pending", "frozen"];

const TAB_LABEL_KEYS = {
  active: "tabActive",
  pending: "tabPending",
  frozen: "tabFrozen",
} as const satisfies Record<StatusFilter, string>;

function getStatusPill(salon: AdminSalon): {
  labelKey: "statusActive" | "statusPending" | "statusFrozen";
  tone: "success" | "warning" | "error" | "neutral";
} {
  if (salon.is_active) return { labelKey: "statusActive", tone: "success" };
  if (!salon.approved_at) return { labelKey: "statusPending", tone: "warning" };
  return { labelKey: "statusFrozen", tone: "error" };
}

/* ─── Confirmation Modal ─── */
function ConfirmModal({
  title,
  message,
  confirmLabel,
  confirmCls,
  onConfirm,
  onClose,
  loading,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  confirmCls: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  const t = useTranslations("dashboard.allSalonsPage");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-input shadow-v5-float w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading text-base text-s-ink">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30" /></button>
        </div>
        <p className="text-sm text-s-ink-2 mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-border text-sm text-s-ink-2 hover:bg-s-bg-sunken transition-colors">
            {t("cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-btn text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2 ${confirmCls}`}
          >
            {loading && <Spinner size="sm" invert />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function AllSalonsPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.allSalonsPage");
  const [salons, setSalons] = useState<AdminSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<StatusFilter>("active");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<{ salon: AdminSalon; action: "activate" | "deactivate" } | null>(null);

  const fetchSalons = useCallback((status: StatusFilter) => {
    setLoading(true);
    fetch(`/api/admin/salons?status=${status}`)
      .then((r) => r.json())
      .then((d) => setSalons(d.salons ?? []))
      .catch((err) => { console.error("[DashboardAllSalons] failed to fetch salons:", err); setSalons([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchSalons(tab);
  }, [tab, fetchSalons]);

  const handleToggle = async () => {
    if (!confirmTarget) return;
    setActionLoading(true);
    const { salon, action } = confirmTarget;
    try {
      if (action === "activate") {
        await fetch(`/api/admin/salons/${salon.id}/approve`, { method: "PATCH" });
      } else {
        // Deactivate: use the reject route with a freeze reason
        await fetch(`/api/admin/salons/${salon.id}/reject`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // Was the hardcoded German "Vom Admin eingefroren". This string is not internal:
          // it lands in salons.rejection_reason and is shown back to the salon owner, so it
          // was rendering German to a French or Italian operator. (council hardcode lens,
          // 2026-07-27)
          body: JSON.stringify({ reason: t("adminFreezeReason") }),
        });
      }
      setConfirmTarget(null);
      fetchSalons(tab);
    } catch (err) {
      console.error("[DashboardAllSalons] salon activate/freeze failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = salons.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.owner_email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Confirm modal */}
      {confirmTarget && (
        <ConfirmModal
          title={confirmTarget.action === "activate" ? t("activateTitle") : t("freezeTitle")}
          message={
            confirmTarget.action === "activate"
              ? t("activateMessage", { name: confirmTarget.salon.name })
              : t("freezeMessage", { name: confirmTarget.salon.name })
          }
          confirmLabel={confirmTarget.action === "activate" ? t("activate") : t("freeze")}
          confirmCls="bg-s-ink hover:bg-black"
          onConfirm={handleToggle}
          onClose={() => setConfirmTarget(null)}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">{t("title")}</h1>
        <p className="text-sm text-s-ink/40 mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto scrollbar-hide pb-1">
        {TAB_VALUES.map((value) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={[
              "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              tab === value
                ? "bg-s-ink text-white hover:bg-black"
                : "bg-white border border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink",
            ].join(" ")}
          >
            {t(TAB_LABEL_KEYS[value])}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
        <input
          type="text"
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full !pl-9 pr-4 py-2.5 text-sm font-body text-s-ink placeholder-dark/30 focus:outline-none transition-colors" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Store} title={t("emptyTitle")} message={t("emptyMessage")} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
          key={tab}
        >
          {filtered.map((salon) => {
            const status = getStatusPill(salon);
            return (
              <motion.div
                key={salon.id}
                variants={itemVariants}
                className="bg-white rounded-2xl border border-s-border shadow-warm-md p-4"
              >
                <div className="flex gap-3">
                  {/* Cover thumbnail */}
                  <div className="w-10 h-10 rounded-[8px] bg-s-bg-sunken overflow-hidden shrink-0 flex items-center justify-center relative">
                    {salon.cover_photo_url ? (
                      <Image src={salon.cover_photo_url} alt="" fill className="object-cover" />
                    ) : (
                      <Store size={16} className="text-s-ink/20" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-s-ink truncate">{salon.name}</p>
                    {salon.owner_email && (
                      <p className="text-xs text-s-ink/40 truncate">{salon.owner_email}</p>
                    )}
                    {salon.address && (
                      <p className="text-xs text-s-ink/30 truncate mt-0.5">{salon.address}</p>
                    )}

                    {/* Category pills */}
                    {salon.categories && salon.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {salon.categories.slice(0, 3).map((c) => (
                          <span
                            key={c}
                            className="px-2 py-0.5 bg-s-bg-sunken text-s-ink text-[12px] rounded-full font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: date */}
                  <div className="text-right shrink-0">
                    <p className="text-[12px] text-s-ink/30">
                      {new Date(salon.created_at).toLocaleDateString(resolveSwissLocale(locale), {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Bottom row: status + actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-s-border">
                  <DashStatusPill tone={status.tone}>{t(status.labelKey)}</DashStatusPill>

                  <div className="flex items-center gap-2">
                    {/* Toggle active */}
                    {salon.is_active ? (
                      <button
                        onClick={() => setConfirmTarget({ salon, action: "deactivate" })}
                        className="px-3 py-1.5 rounded-btn border border-s-ink text-s-ink text-xs font-medium hover:bg-s-bg-sunken transition-colors"
                      >
                        {t("freeze")}
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmTarget({ salon, action: "activate" })}
                        className="px-3 py-1.5 rounded-btn border border-s-ink text-s-ink text-xs font-medium hover:bg-s-bg-sunken transition-colors"
                      >
                        {t("activate")}
                      </button>
                    )}

                    {/* Open the salon's public storefront. Until 2026-07-27 this linked to
                        `/${locale}/dashboard/settings` with no salon identifier, so an admin
                        clicking "Edit" on ANY row landed on their OWN salon's settings page ,
                        a silent no-op that looked like a working per-row control. There is no
                        admin-scoped salon editor to link to, so this now goes where the admin
                        actually needs to look when judging a salon: the storefront itself. */}
                    <a
                      href={`/${locale}/salon/${salon.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn bg-s-bg-sunken text-s-ink-2 text-xs font-medium hover:bg-s-border transition-colors"
                    >
                      {t("viewStorefront")} <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </DashboardLayout>
  );
}
