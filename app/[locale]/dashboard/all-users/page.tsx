"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion } from "motion/react";
import { Users, Search, ShieldCheck, Scissors, User, X, Ban, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import EmptyState from "@/components-legacy/ui/EmptyState";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { containerVariants, itemVariants } from "@/lib/animations";
import { resolveSwissLocale } from "@/lib/format";
import type { UserRole } from "@/lib/types";

interface AdminUser {
  id: string;
  display_name: string | null;
  email: string | null;
  role: UserRole;
  created_at: string;
  onboarding_completed: boolean;
  avatar_url: string | null;
  is_suspended: boolean;
}

const ROLE_MAP: Record<UserRole, { icon: React.ElementType; cls: string }> = {
  customer:    { icon: User,       cls: "bg-s-bg-sunken text-s-ink-2" },
  salon_owner: { icon: Scissors,   cls: "bg-s-bg-sunken text-s-ink" },
  admin:       { icon: ShieldCheck, cls: "bg-s-ink text-white" },
};

const ROLE_ORDER: UserRole[] = ["customer", "salon_owner", "admin"];

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
  const t = useTranslations("dashboard.allUsersPage");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-input shadow-v5-float w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading text-base text-s-ink">{title}</h3>
          <button onClick={onClose}><X size={18} strokeWidth={1.9} className="text-s-ink/30" /></button>
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
export default function AllUsersPage() {
  const t = useTranslations("dashboard.allUsersPage");
  const locale = useLocale();
  const roleLabel = (role: UserRole): string => {
    switch (role) {
      case "customer": return t("roleCustomer");
      case "salon_owner": return t("roleSalonOwner");
      case "admin": return t("roleAdmin");
    }
  };
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState<AdminUser | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch((err) => { console.error("[DashboardAllUsers] failed to fetch users:", err); setUsers([]); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error("[DashboardAllUsers] failed to change role:", err);
      toast.error(t("roleChangeError"));
    }
  };

  const handleSuspendToggle = async () => {
    if (!suspendTarget) return;
    setActionLoading(true);
    const newSuspended = !suspendTarget.is_suspended;
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: suspendTarget.id, is_suspended: newSuspended }),
      });
      setUsers((prev) =>
        prev.map((u) => u.id === suspendTarget.id ? { ...u, is_suspended: newSuspended } : u)
      );
      setSuspendTarget(null);
    } catch (err) {
      console.error("[DashboardAllUsers] suspend/unsuspend failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      (u.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      {/* Suspend/unsuspend modal */}
      {suspendTarget && (
        <ConfirmModal
          title={suspendTarget.is_suspended ? t("unsuspendTitle") : t("suspendTitle")}
          message={
            suspendTarget.is_suspended
              ? t("unsuspendMessage", { name: suspendTarget.display_name ?? suspendTarget.email ?? "" })
              : t("suspendMessage", { name: suspendTarget.display_name ?? suspendTarget.email ?? "" })
          }
          confirmLabel={suspendTarget.is_suspended ? t("unsuspendConfirm") : t("suspendConfirm")}
          confirmCls="bg-s-ink hover:bg-black"
          onConfirm={handleSuspendToggle}
          onClose={() => setSuspendTarget(null)}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">{t("title")}</h1>
        <p className="text-sm text-s-ink/40 mt-0.5">{t("subtitle")}</p>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} strokeWidth={1.9} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
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
        <EmptyState icon={Users} title={t("emptyTitle")} message={t("emptyMessage")} />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filtered.map((u) => {
            const { icon: RoleIcon, cls } = ROLE_MAP[u.role];
            return (
              <motion.div
                key={u.id}
                variants={itemVariants}
                className={`bg-white rounded-2xl border shadow-warm-md p-4 ${
                  u.is_suspended ? "border-s-error/30 bg-s-error-bg/40" : "border-s-border"
                }`}
              >
                <div className="flex gap-3 items-start">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-s-bg-sunken flex items-center justify-center shrink-0 text-xs font-bold text-s-ink overflow-hidden relative">
                    {u.avatar_url ? (
                      <Image src={u.avatar_url} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      (u.display_name ?? u.email ?? "?")[0].toUpperCase()
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-s-ink truncate">
                        {u.display_name ?? "—"}
                      </p>
                      {u.is_suspended && (
                        <DashStatusPill tone="error">{t("suspendedBadge")}</DashStatusPill>
                      )}
                    </div>
                    {u.email && (
                      <p className="text-xs text-s-ink/40 truncate">{u.email}</p>
                    )}
                    <p className="text-[12px] text-s-ink/30 mt-0.5">
                      {t("registeredOn", {
                        date: new Date(u.created_at).toLocaleDateString(resolveSwissLocale(locale), {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }),
                      })}
                    </p>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-s-border gap-2">
                  {/* Role pill */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-bold ${cls}`}>
                    <RoleIcon size={10} />
                    {roleLabel(u.role)}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Role change dropdown */}
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-2 py-1.5 text-xs text-s-ink-2 focus:outline-none cursor-pointer" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
                    >
                      {ROLE_ORDER.map((role) => (
                        <option key={role} value={role}>{roleLabel(role)}</option>
                      ))}
                    </select>

                    {/* Suspend/unsuspend button */}
                    {u.is_suspended ? (
                      <button
                        onClick={() => setSuspendTarget(u)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-ink text-s-ink text-xs font-medium hover:bg-s-bg-sunken transition-colors"
                      >
                        <CheckCircle size={12} />
                        {t("unsuspendConfirm")}
                      </button>
                    ) : (
                      <button
                        onClick={() => setSuspendTarget(u)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-error/40 text-s-error text-xs font-medium hover:bg-s-error-bg transition-colors"
                      >
                        <Ban size={12} />
                        {t("suspendConfirm")}
                      </button>
                    )}
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
