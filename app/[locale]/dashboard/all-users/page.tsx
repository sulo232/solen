"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, ShieldCheck, Scissors, User } from "lucide-react";
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
}

const ROLE_MAP: Record<UserRole, { label: string; icon: React.ElementType; cls: string }> = {
  customer:    { label: "Kunde",        icon: User,       cls: "bg-dark/5 text-dark/60" },
  salon_owner: { label: "Salon-Inhaber",icon: Scissors,   cls: "bg-teal/10 text-teal" },
  admin:       { label: "Admin",        icon: ShieldCheck, cls: "bg-coral/10 text-coral" },
};

export default function AllUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      (u.display_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-dark">Alle Nutzer</h1>
        <p className="text-sm text-dark/40 mt-0.5">{users.length} Nutzer registriert</p>
      </div>

      {/* Role summary pills */}
      {!loading && users.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {(["customer", "salon_owner", "admin"] as UserRole[]).map((role) => {
            const { label, icon: RoleIcon, cls } = ROLE_MAP[role];
            const count = roleCounts[role] ?? 0;
            return (
              <span key={role} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill text-xs font-semibold ${cls}`}>
                <RoleIcon size={12} />
                {label}: {count}
              </span>
            );
          })}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
        <input
          type="text"
          placeholder="Name oder E-Mail suchen…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-button border border-gray-200 bg-white text-sm font-body text-dark placeholder-dark/30 focus:outline-none focus:border-teal/60 transition-colors shadow-card"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="Keine Nutzer gefunden" message="Ändere deine Suche." />
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white rounded-card border border-gray-100 shadow-card overflow-hidden"
        >
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark/40 uppercase tracking-wide">Nutzer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark/40 uppercase tracking-wide">Rolle</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark/40 uppercase tracking-wide hidden sm:table-cell">Onboarding</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark/40 uppercase tracking-wide hidden md:table-cell">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => {
                const { label, icon: RoleIcon, cls } = ROLE_MAP[user.role];
                return (
                  <motion.tr
                    key={user.id}
                    variants={itemVariants}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center shrink-0 text-xs font-bold text-teal overflow-hidden">
                          {user.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            (user.display_name ?? user.email ?? "?")[0].toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-dark truncate">{user.display_name ?? "—"}</p>
                          {user.email && <p className="text-xs text-dark/40 truncate">{user.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold ${cls}`}>
                        <RoleIcon size={10} />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`text-xs font-medium ${user.onboarding_completed ? "text-teal" : "text-dark/30"}`}>
                        {user.onboarding_completed ? "Abgeschlossen" : "Ausstehend"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark/40 text-xs hidden md:table-cell">
                      {new Date(user.created_at).toLocaleDateString("de-CH")}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
