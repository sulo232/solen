"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, Search, CheckCircle, XCircle, Clock } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { containerVariants, itemVariants } from "@/lib/animations";

interface AdminSalon {
  id: string;
  name: string;
  slug: string;
  owner_email: string | null;
  categories: string[];
  quartier: string | null;
  is_active: boolean;
  created_at: string;
  review_count: number;
  average_rating: number;
}

const STATUS_MAP = {
  true:  { label: "Aktiv",    icon: CheckCircle, cls: "bg-teal/10 text-teal" },
  false: { label: "Inaktiv",  icon: XCircle,     cls: "bg-coral/10 text-coral" },
} as const;

export default function AllSalonsPage() {
  const [salons, setSalons] = useState<AdminSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/salons?status=all")
      .then((r) => r.json())
      .then((d) => setSalons(d.salons ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = salons.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.owner_email ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.quartier ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-dark">Alle Salons</h1>
        <p className="text-sm text-dark/40 mt-0.5">{salons.length} Salons registriert</p>
      </div>

      {/* Search */}
      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark/30" />
        <input
          type="text"
          placeholder="Name, E-Mail oder Quartier…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-button border border-gray-200 bg-white text-sm font-body text-dark placeholder-dark/30 focus:outline-none focus:border-teal/60 transition-colors shadow-card"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Store} title="Keine Salons gefunden" message="Ändere deine Suche." />
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark/40 uppercase tracking-wide">Salon</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark/40 uppercase tracking-wide hidden sm:table-cell">Kategorie</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark/40 uppercase tracking-wide hidden md:table-cell">Quartier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark/40 uppercase tracking-wide hidden lg:table-cell">Bewertung</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark/40 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-dark/40 uppercase tracking-wide hidden md:table-cell">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((salon) => {
                const statusKey = String(salon.is_active) as "true" | "false";
                const { label, icon: StatusIcon, cls } = STATUS_MAP[statusKey];
                return (
                  <motion.tr
                    key={salon.id}
                    variants={itemVariants}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-dark truncate max-w-[160px]">{salon.name}</p>
                      {salon.owner_email && (
                        <p className="text-xs text-dark/40 truncate max-w-[160px]">{salon.owner_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(salon.categories ?? []).slice(0, 2).map((c) => (
                          <span key={c} className="px-2 py-0.5 bg-teal/10 text-teal text-[10px] rounded-pill font-medium">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-dark/60 hidden md:table-cell">{salon.quartier ?? "—"}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-data text-sm font-semibold text-dark">
                        {salon.average_rating > 0 ? salon.average_rating.toFixed(1) : "—"}
                      </span>
                      {salon.review_count > 0 && (
                        <span className="text-xs text-dark/30 ml-1">({salon.review_count})</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-pill text-[10px] font-bold ${cls}`}>
                        <StatusIcon size={10} />
                        {label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-dark/40 text-xs hidden md:table-cell">
                      {new Date(salon.created_at).toLocaleDateString("de-CH")}
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
