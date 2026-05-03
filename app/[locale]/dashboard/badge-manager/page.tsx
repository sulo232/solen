"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Star, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal, CircleCheck,
  Bookmark, Eye, Gift, Target, X, Plus, Search, Trash2, Edit2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";
import EmptyState from "@/components/ui/EmptyState";
import { containerVariants, itemVariants } from "@/lib/animations";

/* ─── Icon map ─── */
const ICON_MAP: Record<string, LucideIcon> = {
  Star, TrendingUp, Sparkles, ShieldCheck, Award, Heart, Crown,
  Flame, Zap, ThumbsUp, BadgeCheck, Trophy, Gem, Medal, CircleCheck,
  Bookmark, Eye, Gift, Target,
};
const ICON_OPTIONS = Object.keys(ICON_MAP);
const getIcon = (name: string): LucideIcon => ICON_MAP[name] ?? Star;

/* ─── Color presets ─── */
const COLOR_PRESETS = [
  { value: "#D4AF77", label: "Gold" },
  { value: "#1B4D1B", label: "Coral" },
  { value: "#F3A864", label: "Amber" },
  { value: "#22C55E", label: "Green" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#F2C144", label: "Yellow" },
];

function hexToBgColor(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},0.1)`;
}

/* ─── Types ─── */
interface Badge {
  id: string;
  name_de: string;
  name_en: string;
  icon: string;
  color: string;
  bg_color: string;
  auto_rule: unknown;
  is_system: boolean;
  created_at: string;
}

interface SalonResult {
  id: string;
  name: string;
  slug: string;
}

/* ─── Create/Edit Modal ─── */
function BadgeModal({
  badge,
  onClose,
  onSave,
}: {
  badge: Partial<Badge> | null;
  onClose: () => void;
  onSave: (data: { name_de: string; name_en: string; icon: string; color: string; bg_color: string }) => Promise<void>;
}) {
  const [nameDe, setNameDe] = useState(badge?.name_de ?? "");
  const [nameEn, setNameEn] = useState(badge?.name_en ?? "");
  const [icon, setIcon] = useState(badge?.icon ?? "Star");
  const [color, setColor] = useState(badge?.color ?? "#1B4D1B");
  const [saving, setSaving] = useState(false);

  const IconPreview = getIcon(icon);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[12px] shadow-v5-float w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="font-heading text-base text-s-ink">
            {badge?.id ? "Badge bearbeiten" : "Neues Badge erstellen"}
          </h3>
          <button onClick={onClose}><X size={18} className="text-s-ink/30" /></button>
        </div>

        <div className="space-y-4">
          {/* Name DE */}
          <div>
            <label className="text-xs font-medium text-s-ink/60 mb-1 block">Name (DE)</label>
            <input
              value={nameDe}
              onChange={(e) => setNameDe(e.target.value)}
              className="w-full px-3 py-2.5 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
              placeholder="z.B. Beliebter Salon"
            />
          </div>
          {/* Name EN */}
          <div>
            <label className="text-xs font-medium text-s-ink/60 mb-1 block">Name (EN)</label>
            <input
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              className="w-full px-3 py-2.5 rounded-btn border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral"
              placeholder="e.g. Popular Salon"
            />
          </div>
          {/* Icon picker */}
          <div>
            <label className="text-xs font-medium text-s-ink/60 mb-1 block">Icon</label>
            <div className="grid grid-cols-5 gap-1.5">
              {ICON_OPTIONS.map((name) => {
                const Ic = ICON_MAP[name];
                return (
                  <button
                    key={name}
                    onClick={() => setIcon(name)}
                    className={`flex flex-col items-center gap-0.5 p-2 rounded-[8px] text-[9px] transition-colors ${
                      icon === name ? "bg-s-coral/10 text-s-coral ring-1 ring-s-coral" : "bg-s-bg-surface text-s-ink/40 hover:bg-s-bg-sunken"
                    }`}
                  >
                    <Ic size={16} />
                    {name}
                  </button>
                );
              })}
            </div>
          </div>
          {/* Color picker */}
          <div>
            <label className="text-xs font-medium text-s-ink/60 mb-1 block">Farbe</label>
            <div className="flex gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-[border-color,background-color] duration-150 ${
                    color === c.value ? "border-s-ink scale-110" : "border-transparent"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>
          {/* Preview */}
          <div>
            <label className="text-xs font-medium text-s-ink/60 mb-1 block">Vorschau</label>
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-pill text-xs font-bold"
              style={{ backgroundColor: hexToBgColor(color), color }}
            >
              <IconPreview size={12} />
              {nameDe || "Badge"}
            </span>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 text-sm text-s-ink/60">
            Abbrechen
          </button>
          <button
            onClick={async () => {
              if (!nameDe || !nameEn) return;
              setSaving(true);
              await onSave({ name_de: nameDe, name_en: nameEn, icon, color, bg_color: hexToBgColor(color) });
              setSaving(false);
            }}
            disabled={saving || !nameDe || !nameEn}
            className="flex-1 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Spinner size="sm" invert />}
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Delete Confirm Modal ─── */
function DeleteModal({
  name,
  onConfirm,
  onClose,
  loading,
}: {
  name: string;
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[12px] shadow-v5-float w-full max-w-sm p-6">
        <h3 className="font-heading text-base text-s-ink mb-2">Badge löschen</h3>
        <p className="text-sm text-s-ink/50 mb-5">
          Badge &quot;{name}&quot; löschen? Es wird von allen Salons entfernt.
        </p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn border border-s-ink/10 text-sm text-s-ink/60">
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Spinner size="sm" invert />}
            Löschen
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function BadgeManagerPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalBadge, setModalBadge] = useState<Partial<Badge> | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Badge | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Assignment section
  const [salonSearch, setSalonSearch] = useState("");
  const [salonResults, setSalonResults] = useState<SalonResult[]>([]);
  const [selectedSalon, setSelectedSalon] = useState<SalonResult | null>(null);
  const [salonBadges, setSalonBadges] = useState<Badge[]>([]);
  const [assignBadgeId, setAssignBadgeId] = useState("");
  const [overrideRemoval, setOverrideRemoval] = useState(false);

  const fetchBadges = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/badges")
      .then((r) => r.json())
      .then((d) => setBadges(d.badges ?? []))
      .catch(() => setBadges([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchBadges(); }, [fetchBadges]);

  // Search salons for assignment section
  useEffect(() => {
    if (salonSearch.length < 2) { setSalonResults([]); return; }
    const timer = setTimeout(() => {
      fetch(`/api/salons/search?q=${encodeURIComponent(salonSearch)}&limit=5`)
        .then((r) => r.json())
        .then((d) => setSalonResults(d.salons ?? []))
        .catch(() => setSalonResults([]));
    }, 300);
    return () => clearTimeout(timer);
  }, [salonSearch]);

  // Fetch salon's current badges
  useEffect(() => {
    if (!selectedSalon) { setSalonBadges([]); return; }
    fetch(`/api/salons/${selectedSalon.slug}/badges`)
      .then((r) => r.json())
      .then((d) => setSalonBadges(d.badges ?? []))
      .catch(() => setSalonBadges([]));
  }, [selectedSalon]);

  const handleSave = async (data: { name_de: string; name_en: string; icon: string; color: string; bg_color: string }) => {
    if (modalBadge && typeof modalBadge === "object" && modalBadge.id) {
      await fetch(`/api/admin/badges/${modalBadge.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setModalBadge(null);
    fetchBadges();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setActionLoading(true);
    await fetch(`/api/admin/badges/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    setActionLoading(false);
    fetchBadges();
  };

  const handleAssign = async () => {
    if (!selectedSalon || !assignBadgeId) return;
    await fetch("/api/admin/badges/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: selectedSalon.id, badge_id: assignBadgeId, action: "assign" }),
    });
    setAssignBadgeId("");
    // Refresh salon badges
    const r = await fetch(`/api/salons/${selectedSalon.slug}/badges`);
    const d = await r.json();
    setSalonBadges(d.badges ?? []);
  };

  const handleRemoveBadge = async (badgeId: string) => {
    if (!selectedSalon) return;
    await fetch("/api/admin/badges/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        salon_id: selectedSalon.id,
        badge_id: badgeId,
        action: overrideRemoval ? "override_removal" : "remove",
      }),
    });
    const r = await fetch(`/api/salons/${selectedSalon.slug}/badges`);
    const d = await r.json();
    setSalonBadges(d.badges ?? []);
  };

  return (
    <DashboardLayout>
      {/* Modals */}
      {modalBadge !== null && (
        <BadgeModal
          badge={modalBadge === "new" ? null : modalBadge}
          onClose={() => setModalBadge(null)}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name_de}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
          loading={actionLoading}
        />
      )}

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl text-s-ink">Badge-Verwaltung</h1>
          <p className="text-sm text-s-ink/40 mt-0.5">Salon-Badges erstellen, bearbeiten und zuweisen</p>
        </div>
        <button
          onClick={() => setModalBadge("new")}
          className="inline-flex items-center gap-1.5 bg-s-coral text-white rounded-btn px-4 py-2 text-sm font-medium hover:brightness-[1.06] transition-colors shrink-0"
        >
          <Plus size={15} />
          Neues Badge
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-8">
          {/* Section 1: All Badges */}
          <div>
            <h2 className="font-heading text-s-ink text-sm mb-3">Alle Badges</h2>
            {badges.length === 0 ? (
              <EmptyState icon={Award} title="Keine Badges" message="Erstelle dein erstes Badge." />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              >
                {badges.map((b) => {
                  const Ic = getIcon(b.icon);
                  return (
                    <motion.div
                      key={b.id}
                      variants={itemVariants}
                      className="bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: b.bg_color }}
                        >
                          <Ic size={18} style={{ color: b.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-s-ink truncate">{b.name_de}</p>
                          <p className="text-xs text-s-ink/40 truncate">{b.name_en}</p>
                          <span
                            className={`inline-block mt-1 px-1.5 py-0.5 rounded-pill text-[10px] font-bold ${
                              b.is_system ? "bg-s-bg-sunken text-s-ink/40" : "bg-s-coral/10 text-s-coral"
                            }`}
                          >
                            {b.is_system ? "System" : "Custom"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-s-ink/5">
                        <button
                          onClick={() => setModalBadge(b)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-ink/10 text-xs text-s-ink/60 hover:border-s-coral transition-colors"
                        >
                          <Edit2 size={11} />
                          Bearbeiten
                        </button>
                        {!b.is_system && (
                          <button
                            onClick={() => setDeleteTarget(b)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-btn border border-s-coral/30 text-xs text-s-coral hover:bg-s-coral/5 transition-colors"
                          >
                            <Trash2 size={11} />
                            Löschen
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Section 2: Badge Assignments */}
          <div>
            <h2 className="font-heading text-s-ink text-sm mb-3">Badge-Zuweisungen</h2>
            <div className="bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md p-5 space-y-4">
              {/* Salon search */}
              <div className="relative max-w-sm">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
                <input
                  type="text"
                  placeholder="Salon suchen..."
                  value={salonSearch}
                  onChange={(e) => { setSalonSearch(e.target.value); setSelectedSalon(null); }}
                  className="w-full pl-9 pr-4 py-2.5 rounded-btn border border-s-ink/10 bg-white text-sm text-s-ink placeholder-dark/30 focus:outline-none focus:border-s-coral transition-colors"
                />
                {salonResults.length > 0 && !selectedSalon && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-[12px] border border-s-ink/5 shadow-warm-md z-10 overflow-hidden">
                    {salonResults.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedSalon(s); setSalonSearch(s.name); setSalonResults([]); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-s-ink hover:bg-s-bg-surface transition-colors"
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedSalon && (
                <>
                  {/* Current badges */}
                  <div>
                    <p className="text-xs text-s-ink/50 mb-2">Aktuelle Badges für <strong>{selectedSalon.name}</strong>:</p>
                    {salonBadges.length === 0 ? (
                      <p className="text-xs text-s-ink/30">Keine Badges zugewiesen.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {salonBadges.map((b) => {
                          const Ic = getIcon(b.icon);
                          return (
                            <span
                              key={b.id}
                              className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-pill text-xs font-bold"
                              style={{ backgroundColor: b.bg_color, color: b.color }}
                            >
                              <Ic size={12} />
                              {b.name_de}
                              <button
                                onClick={() => handleRemoveBadge(b.id)}
                                className="ml-0.5 p-0.5 rounded-full hover:bg-s-ink/10 transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add badge */}
                  <div className="flex items-center gap-2">
                    <select
                      value={assignBadgeId}
                      onChange={(e) => setAssignBadgeId(e.target.value)}
                      className="flex-1 max-w-xs px-3 py-2 rounded-btn border border-s-ink/10 text-xs text-s-ink/60 bg-white focus:outline-none focus:border-s-coral"
                    >
                      <option value="">Badge auswählen...</option>
                      {badges
                        .filter((b) => !salonBadges.some((sb) => sb.id === b.id))
                        .map((b) => (
                          <option key={b.id} value={b.id}>{b.name_de}</option>
                        ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!assignBadgeId}
                      className="px-3 py-2 rounded-btn bg-s-coral text-white text-xs font-medium disabled:opacity-50"
                    >
                      Zuweisen
                    </button>
                  </div>

                  {/* Override removal checkbox */}
                  <label className="flex items-center gap-2 text-xs text-s-ink/50">
                    <input
                      type="checkbox"
                      checked={overrideRemoval}
                      onChange={(e) => setOverrideRemoval(e.target.checked)}
                      className="rounded border-s-ink/20"
                    />
                    Auto-Badge blockieren (verhindert automatische Neuzuweisung)
                  </label>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
