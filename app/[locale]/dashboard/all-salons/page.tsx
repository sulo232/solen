"use client";

import { useEffect, useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Search, X, ExternalLink } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { containerVariants, itemVariants } from "@/lib/animations";

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

const TABS: { label: string; value: StatusFilter }[] = [
  { label: "Aktiv", value: "active" },
  { label: "Ausstehend", value: "pending" },
  { label: "Eingefroren", value: "frozen" },
];

function getStatusPill(salon: AdminSalon) {
  if (salon.is_active) return { label: "Aktiv", cls: "bg-s-coral/10 text-s-coral" };
  if (!salon.approved_at) return { label: "Ausstehend", cls: "bg-amber-100 text-amber-700" };
  return { label: "Eingefroren", cls: "bg-s-coral/10 text-s-coral" };
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
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading font-bold text-base text-s-ink">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30" /></button>
        </div>
        <p className="text-sm text-s-ink/50 mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-button border border-s-ink/10 text-sm text-s-ink/60">
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-button text-sm font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2 ${confirmCls}`}
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
      .catch(() => setSalons([]))
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
          body: JSON.stringify({ reason: "Vom Admin eingefroren" }),
        });
      }
      setConfirmTarget(null);
      fetchSalons(tab);
    } catch {
      // silently fail
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
          title={confirmTarget.action === "activate" ? "Salon aktivieren" : "Salon einfrieren"}
          message={
            confirmTarget.action === "activate"
              ? `Salon "${confirmTarget.salon.name}" aktivieren? Der Salon wird für Kunden sichtbar.`
              : `Bist du sicher? Der Salon "${confirmTarget.salon.name}" wird für Kunden nicht mehr sichtbar.`
          }
          confirmLabel={confirmTarget.action === "activate" ? "Aktivieren" : "Einfrieren"}
          confirmCls={confirmTarget.action === "activate" ? "bg-s-coral" : "bg-s-coral"}
          onConfirm={handleToggle}
          onClose={() => setConfirmTarget(null)}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-s-ink">Alle Salons</h1>
        <p className="text-sm text-s-ink/40 mt-0.5">Alle registrierten Salons verwalten</p>
      </div>

      {/* Tab filters */}
      <div className="flex gap-2 mb-5 overflow-x-auto no-scrollbar pb-1">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={[
              "px-3 py-1.5 rounded-pill text-sm font-medium whitespace-nowrap transition-colors",
              tab === t.value
                ? "bg-s-coral text-white"
                : "bg-white border border-s-ink/10 text-s-ink/60 hover:border-s-coral",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
        <input
          type="text"
          placeholder="Salon suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-button border border-s-ink/10 bg-white text-sm font-body text-s-ink placeholder-dark/30 focus:outline-none focus:border-s-coral transition-colors"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Store} title="Keine Salons gefunden" message="Ändere deinen Filter oder deine Suche." />
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
                className="bg-white rounded-card border border-s-ink/5 shadow-card p-4"
              >
                <div className="flex gap-3">
                  {/* Cover thumbnail */}
                  <div className="w-10 h-10 rounded-lg bg-s-bg-sunken overflow-hidden shrink-0 flex items-center justify-center">
                    {salon.cover_photo_url ? (
                      <img src={salon.cover_photo_url} alt="" className="w-full h-full object-cover" />
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
                            className="px-2 py-0.5 bg-s-coral/10 text-s-coral text-[10px] rounded-pill font-medium"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Right: date */}
                  <div className="text-right shrink-0">
                    <p className="text-[10px] text-s-ink/30">
                      {new Date(salon.created_at).toLocaleDateString("de-CH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Bottom row: status + actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-s-ink/5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-pill text-[10px] font-bold ${status.cls}`}>
                    {status.label}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Toggle active */}
                    {salon.is_active ? (
                      <button
                        onClick={() => setConfirmTarget({ salon, action: "deactivate" })}
                        className="px-3 py-1.5 rounded-button border border-s-coral/30 text-s-coral text-xs font-medium hover:bg-s-coral/5 transition-colors"
                      >
                        Einfrieren
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmTarget({ salon, action: "activate" })}
                        className="px-3 py-1.5 rounded-button border border-s-coral/30 text-s-coral text-xs font-medium hover:bg-s-coral/5 transition-colors"
                      >
                        Aktivieren
                      </button>
                    )}

                    {/* Edit link */}
                    <a
                      href={`/${locale}/dashboard/settings`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-button bg-s-bg-surface text-s-ink/50 text-xs font-medium hover:bg-s-bg-sunken transition-colors"
                    >
                      Bearbeiten <ExternalLink size={10} />
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
