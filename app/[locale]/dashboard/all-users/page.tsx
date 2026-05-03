"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Users, Search, ShieldCheck, Scissors, User, X, Ban, CheckCircle } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { containerVariants, itemVariants } from "@/lib/animations";
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

const ROLE_MAP: Record<UserRole, { label: string; icon: React.ElementType; cls: string }> = {
  customer:    { label: "Kunde",          icon: User,       cls: "bg-s-bg-sunken text-s-ink/50" },
  salon_owner: { label: "Salonbesitzer",  icon: Scissors,   cls: "bg-s-coral/10 text-s-coral" },
  admin:       { label: "Admin",          icon: ShieldCheck, cls: "bg-s-coral/10 text-s-coral" },
};

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "customer", label: "Kunde" },
  { value: "salon_owner", label: "Salonbesitzer" },
  { value: "admin", label: "Admin" },
];

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
      <div className="bg-white rounded-input shadow-v5-float w-full max-w-sm p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="font-heading text-base text-s-ink">{title}</h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30" /></button>
        </div>
        <p className="text-sm text-s-ink/50 mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 text-sm text-s-ink/60">
            Abbrechen
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
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, role: newRole }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
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
    } catch {
      // silently fail
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
          title={suspendTarget.is_suspended ? "Benutzer freigeben" : "Benutzer sperren"}
          message={
            suspendTarget.is_suspended
              ? `Benutzer "${suspendTarget.display_name ?? suspendTarget.email}" wieder freigeben?`
              : `Benutzer "${suspendTarget.display_name ?? suspendTarget.email}" sperren? Der Benutzer kann sich nicht mehr anmelden.`
          }
          confirmLabel={suspendTarget.is_suspended ? "Freigeben" : "Sperren"}
          confirmCls={suspendTarget.is_suspended ? "bg-s-coral" : "bg-s-coral"}
          onConfirm={handleSuspendToggle}
          onClose={() => setSuspendTarget(null)}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-heading text-2xl text-s-ink">Alle Nutzer</h1>
        <p className="text-sm text-s-ink/40 mt-0.5">Registrierte Benutzer verwalten</p>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
        <input
          type="text"
          placeholder="Name oder E-Mail suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-btn border border-s-ink/10 bg-white text-sm font-body text-s-ink placeholder-dark/30 focus:outline-none focus:border-s-coral transition-colors"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Keine Nutzer gefunden" message="Ändere deine Suche." />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {filtered.map((u) => {
            const { label, icon: RoleIcon, cls } = ROLE_MAP[u.role];
            return (
              <motion.div
                key={u.id}
                variants={itemVariants}
                className={`bg-white rounded-[12px] border shadow-warm-md p-4 ${
                  u.is_suspended ? "border-s-coral/30 bg-s-coral/[0.02]" : "border-s-ink/5"
                }`}
              >
                <div className="flex gap-3 items-start">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-s-coral/10 flex items-center justify-center shrink-0 text-xs font-bold text-s-coral overflow-hidden relative">
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
                        <span className="px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral text-[10px] font-bold">
                          GESPERRT
                        </span>
                      )}
                    </div>
                    {u.email && (
                      <p className="text-xs text-s-ink/40 truncate">{u.email}</p>
                    )}
                    <p className="text-[10px] text-s-ink/30 mt-0.5">
                      Registriert: {new Date(u.created_at).toLocaleDateString("de-CH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                {/* Bottom actions */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-s-ink/5 gap-2">
                  {/* Role pill */}
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold ${cls}`}>
                    <RoleIcon size={10} />
                    {label}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Role change dropdown */}
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                      className="px-2 py-1.5 rounded-btn border border-s-ink/10 text-xs text-s-ink/60 bg-white focus:outline-none focus:border-s-coral cursor-pointer"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>

                    {/* Suspend/unsuspend button */}
                    {u.is_suspended ? (
                      <button
                        onClick={() => setSuspendTarget(u)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-coral/30 text-s-coral text-xs font-medium hover:bg-s-coral/5 transition-colors"
                      >
                        <CheckCircle size={12} />
                        Freigeben
                      </button>
                    ) : (
                      <button
                        onClick={() => setSuspendTarget(u)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-coral/30 text-s-coral text-xs font-medium hover:bg-s-coral/5 transition-colors"
                      >
                        <Ban size={12} />
                        Sperren
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
