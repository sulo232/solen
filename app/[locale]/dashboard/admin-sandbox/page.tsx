"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FlaskConical, Plus, Trash2, RefreshCw, Users, Calendar,
  Star, Clock, ExternalLink, ChevronDown, ChevronUp, Loader2,
  Scissors, Tag,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";

interface TestSalon {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  address: string | null;
  is_active: boolean;
  created_at: string;
}

const SEED_FEATURES = [
  { key: "walkin_queue", labelKey: "seedWalkin", icon: Users, color: "text-s-amber bg-s-amber/10" },
  { key: "bookings",     labelKey: "seedBookings", icon: Calendar, color: "text-s-blue bg-s-blue/10" },
  { key: "reviews",      labelKey: "seedReviews", icon: Star, color: "text-s-sage bg-s-sage/10" },
  { key: "last_minute",  labelKey: "seedLastMinute", icon: Clock, color: "text-s-coral bg-s-coral/10" },
] as const;

const FEATURE_LINKS = [
  { labelKey: "linkDashboard", href: "/dashboard" },
  { labelKey: "linkBookings", href: "/dashboard/bookings" },
  { labelKey: "linkCalendar", href: "/dashboard/calendar" },
  { labelKey: "linkBarber", href: "/dashboard/barber-ops" },
  { labelKey: "linkNail", href: "/dashboard/nail-admin" },
  { labelKey: "linkSpa", href: "/dashboard/spa-admin" },
  { labelKey: "linkMakeup", href: "/dashboard/makeup-admin" },
  { labelKey: "linkWaxing", href: "/dashboard/waxing-admin" },
  { labelKey: "linkCoiffeur", href: "/dashboard/coiffeur-crm" },
  { labelKey: "linkLastMinute", href: "/last-minute" },
  { labelKey: "linkPublicPage", href: "/salon/{slug}" },
] as const;

export default function AdminSandboxPage() {
  const t = useTranslations("adminSandbox") as any;
  const locale = useLocale();
  const [salonName, setSalonName] = useState<string | undefined>();
  const [salonCategories, setSalonCategories] = useState<string[] | undefined>();
  const [salons, setSalons] = useState<TestSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [seedingState, setSeedingState] = useState<Record<string, string | null>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("hair");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Platform test-salon seeding
  const [seedCities, setSeedCities] = useState<string[]>(["basel", "zuerich", "bern"]);
  const [platformSeeding, setPlatformSeeding] = useState<"idle" | "seeding" | "deleting" | "done" | "error">("idle");
  const [platformSeedResult, setPlatformSeedResult] = useState<{ seeded?: string[]; errors?: string[] } | null>(null);
  const [realCounts, setRealCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonName(p?.salon_name);
        setSalonCategories(p?.salon_categories);
      })
      .catch((err) => console.error("[DashboardAdminSandbox] failed to fetch profile:", err));
  }, []);

  const loadSalons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/test-salon");
      if (res.ok) {
        const d = await res.json();
        setSalons(d.salons ?? []);
      }
      // Also fetch real counts from the seeding endpoint
      const countsRes = await fetch("/api/admin/seed-test-salons");
      if (countsRes.ok) {
        const cd = await countsRes.json();
        setRealCounts(cd.realSalonCounts ?? {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const platformSeed = useCallback(async () => {
    setPlatformSeeding("seeding");
    setPlatformSeedResult(null);
    try {
      const res = await fetch("/api/admin/seed-test-salons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cities: seedCities }),
      });
      const d = await res.json();
      setPlatformSeedResult(d);
      setPlatformSeeding("done");
      await loadSalons();
    } catch {
      setPlatformSeeding("error");
    }
  }, [seedCities, loadSalons]);

  const platformDelete = useCallback(async () => {
    if (!confirm("Alle Test-Salons aus der Datenbank löschen?")) return;
    setPlatformSeeding("deleting");
    try {
      await fetch("/api/admin/seed-test-salons", { method: "DELETE" });
      setPlatformSeeding("idle");
      setSalons([]);
      await loadSalons();
    } catch {
      setPlatformSeeding("error");
    }
  }, [loadSalons]);

  useEffect(() => { loadSalons(); }, [loadSalons]);

  const createSalon = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/admin/test-salon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: [newCategory] }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.salon) setSalons((prev) => [d.salon, ...prev]);
        setShowCreateForm(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const deleteSalon = async (salonId: string) => {
    setDeletingId(salonId);
    try {
      const res = await fetch(`/api/admin/test-salon?salon_id=${salonId}`, { method: "DELETE" });
      if (res.ok) setSalons((prev) => prev.filter((s) => s.id !== salonId));
    } finally {
      setDeletingId(null);
    }
  };

  const seedFeature = async (salonId: string, feature: string) => {
    const key = `${salonId}_${feature}`;
    setSeedingState((prev) => ({ ...prev, [key]: "loading" }));
    try {
      const res = await fetch("/api/admin/test-salon/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, feature }),
      });
      const d = await res.json();
      setSeedingState((prev) => ({ ...prev, [key]: res.ok ? "done" : "error" }));
      if (!res.ok) console.error(d);
    } catch {
      setSeedingState((prev) => ({ ...prev, [key]: "error" }));
    }
    setTimeout(() => setSeedingState((prev) => ({ ...prev, [key]: null })), 3000);
  };

  const resetSalon = async (salonId: string) => {
    setResettingId(salonId);
    try {
      await fetch("/api/admin/test-salon/seed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, feature: "reset" }),
      });
    } finally {
      setResettingId(null);
    }
  };

  const resolveLink = (href: string, slug: string) =>
    `/${locale}${href.replace("{slug}", slug)}`;

  return (
    <DashboardLayout salonName={salonName} salonCategories={salonCategories}>

      {/* ── Platform Test-Salon Seeder ────────────────────────────── */}
      <div className="mb-6 rounded-[14px] border border-s-amber/30 bg-s-amber/[0.05] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <FlaskConical size={14} className="text-s-amber" />
          <p className="text-[10px] font-heading uppercase tracking-[.18em] text-s-amber">
            Platform Test-Salons
          </p>
        </div>
        <p className="text-[11px] text-s-ink/50">
          Seeded salons appear on the public site only when no real salons exist for that city+category.
          They include services &amp; availability and are fully editable.
        </p>

        {/* City selector */}
        <div className="flex flex-wrap gap-2">
          {["basel", "zuerich", "bern"].map((citySlug) => (
            <button
              key={citySlug}
              onClick={() => setSeedCities((prev) =>
                prev.includes(citySlug) ? prev.filter((c) => c !== citySlug) : [...prev, citySlug]
              )}
              className={`px-3 py-1.5 rounded-pill text-xs font-heading transition-[transform,filter,border-color,background-color] duration-150 ${
                seedCities.includes(citySlug)
                  ? "bg-s-amber text-white shadow-elevation-2"
                  : "bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]"
              }`}
            >
              {citySlug === "zuerich" ? "Zürich" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={platformSeed}
            disabled={platformSeeding === "seeding" || seedCities.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-s-amber text-white text-[11px] font-heading uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-40"
          >
            {platformSeeding === "seeding" ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
            Seed Test-Salons
          </button>
          <button
            onClick={platformDelete}
            disabled={platformSeeding === "deleting"}
            className="flex items-center gap-1.5 px-3 py-2 rounded-[8px] bg-red-50 text-red-500 text-[11px] font-heading uppercase tracking-[.06em] hover:bg-red-100 active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-40"
          >
            {platformSeeding === "deleting" ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
            Alle löschen
          </button>
        </div>

        {/* Result */}
        {platformSeedResult && (
          <div className="text-[11px] space-y-1">
            {(platformSeedResult.seeded?.length ?? 0) > 0 && (
              <p className="text-s-sage font-medium">✓ {platformSeedResult.seeded?.length} Salons geseedet</p>
            )}
            {(platformSeedResult.errors?.length ?? 0) > 0 && (
              <p className="text-red-500">{platformSeedResult.errors?.length} Fehler — siehe Konsole</p>
            )}
          </div>
        )}
        {platformSeeding === "error" && (
          <p className="text-[11px] text-red-500">Fehler beim Seeden — Console prüfen</p>
        )}
      </div>

      {/* Header */}
      <div className="mb-6">
        <p className="text-[9px] font-heading uppercase tracking-[.20em] text-s-ink/50 mb-1">Admin</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical size={20} className="text-s-coral" />
            <h1 className="font-heading text-[28px] text-s-ink leading-none">
              {t("pageTitle")}
            </h1>
          </div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-[8px] bg-s-coral text-white text-xs font-heading uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150"
            aria-label={t("createNew")}
          >
            <Plus size={13} />
            {t("createNew")}
          </button>
        </div>
        <p className="text-xs text-s-ink/40 mt-1.5 max-w-lg">
          {t("subtitle")}
        </p>
      </div>

      {/* Create form */}
      {showCreateForm && (
        <div className="rounded-[12px] border border-s-ink/[0.06] p-4 mb-5 bg-white space-y-3">
          <p className="text-[9px] font-heading uppercase tracking-[.15em] text-s-ink/45">
            {t("categoryLabel")}
          </p>
          <div className="flex flex-wrap gap-2">
            {["hair", "nail", "barbershop", "spa", "makeup", "waxing"].map((cat) => (
              <button
                key={cat}
                onClick={() => setNewCategory(cat)}
                className={`px-3 py-1.5 rounded-pill text-xs font-heading transition-[transform,filter,border-color,background-color] duration-150 ${
                  newCategory === cat
                    ? "bg-s-coral text-white shadow-elevation-2"
                    : "bg-s-ink/[0.05] text-s-ink/55 hover:bg-s-ink/[0.09]"
                }`}
                aria-label={cat}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={createSalon}
              disabled={creating}
              className="flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-[8px] bg-s-coral text-white text-xs font-heading uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150 disabled:opacity-40"
              aria-label={creating ? t("creating") : t("confirmCreate")}
            >
              {creating ? <Loader2 size={12} className="animate-spin" /> : <FlaskConical size={12} />}
              {creating ? t("creating") : t("confirmCreate")}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-2 text-xs text-s-ink/50"
              aria-label={t("cancel")}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Salons list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-[12px] bg-s-ink/[0.04] animate-pulse" />
          ))}
        </div>
      ) : salons.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-s-ink/[0.08] p-12 text-center">
          <FlaskConical size={24} className="mx-auto mb-3 text-s-ink/20" />
          <p className="text-xs font-heading text-s-ink/50 uppercase tracking-[.10em]">
            {t("noSalons")}
          </p>
          <p className="text-[11px] text-s-ink/25 mt-1">{t("noSalonsHint")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {salons.map((salon) => {
            const isExpanded = expandedId === salon.id;
            return (
              <div
                key={salon.id}
                className="rounded-[12px] border border-s-ink/[0.06] bg-white overflow-hidden"
              >
                {/* Salon header row */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-[10px] bg-s-coral/10 flex items-center justify-center shrink-0">
                    <FlaskConical size={16} className="text-s-coral" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-heading text-s-ink truncate">
                      {salon.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {salon.categories.map((cat) => (
                        <span key={cat} className="text-[9px] font-heading uppercase tracking-[.10em] px-1.5 py-0.5 rounded-[4px] bg-s-ink/[0.05] text-s-ink/50">
                          {cat}
                        </span>
                      ))}
                      <span className="text-[10px] text-s-ink/25 tabular-nums">
                        {salon.id.slice(0, 8)}…
                      </span>
                    </div>
                  </div>

                  {/* Reset */}
                  <button
                    onClick={() => resetSalon(salon.id)}
                    disabled={resettingId === salon.id}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-s-ink/[0.04] text-s-ink/40 hover:bg-s-amber/10 hover:text-s-amber transition-colors duration-150"
                    aria-label={t("reset")}
                    title={t("reset")}
                  >
                    {resettingId === salon.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <RefreshCw size={13} />}
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteSalon(salon.id)}
                    disabled={deletingId === salon.id}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-s-ink/[0.04] text-s-ink/40 hover:bg-red-50 hover:text-red-500 transition-colors duration-150"
                    aria-label={t("delete")}
                    title={t("delete")}
                  >
                    {deletingId === salon.id
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Trash2 size={13} />}
                  </button>

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : salon.id)}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-s-ink/[0.04] text-s-ink/40 hover:bg-s-ink/[0.08] transition-colors duration-150"
                    aria-label={isExpanded ? t("collapse") : t("expand")}
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-s-ink/[0.04] p-4 space-y-4">
                    {/* Seed data section */}
                    <div>
                      <p className="text-[9px] font-heading uppercase tracking-[.15em] text-s-ink/50 mb-2">
                        {t("seedTitle")}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {SEED_FEATURES.map(({ key, labelKey, icon: Icon, color }) => {
                          const stateKey = `${salon.id}_${key}`;
                          const state = seedingState[stateKey];
                          return (
                            <button
                              key={key}
                              onClick={() => seedFeature(salon.id, key)}
                              disabled={state === "loading"}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-heading transition-[transform,filter,border-color,background-color] duration-150 ${
                                state === "done" ? "bg-s-sage/10 text-s-sage" :
                                state === "error" ? "bg-red-50 text-red-500" :
                                `${color} hover:brightness-[0.94]`
                              } disabled:opacity-60`}
                              aria-label={t(labelKey)}
                            >
                              {state === "loading"
                                ? <Loader2 size={11} className="animate-spin" />
                                : <Icon size={11} />}
                              {state === "done" ? `✓ ${t(labelKey)}` :
                               state === "error" ? `✗ ${t(labelKey)}` :
                               t(labelKey)}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Feature links section */}
                    <div>
                      <p className="text-[9px] font-heading uppercase tracking-[.15em] text-s-ink/50 mb-2">
                        {t("linksTitle")}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {FEATURE_LINKS.map(({ labelKey, href }) => {
                          const resolvedHref = href.includes("{slug}")
                            ? resolveLink(href, salon.slug)
                            : resolveLink(href, salon.slug);
                          return (
                            <a
                              key={labelKey}
                              href={resolvedHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[11px] font-heading bg-s-ink/[0.04] text-s-ink/60 hover:bg-s-ink/[0.08] hover:text-s-coral:text-s-coral transition-colors duration-150"
                            >
                              <ExternalLink size={10} />
                              {t(labelKey)}
                            </a>
                          );
                        })}
                      </div>
                    </div>

                    {/* Salon metadata */}
                    <div className="flex flex-wrap gap-3 text-[10px] text-s-ink/45">
                      <span className="flex items-center gap-1">
                        <Tag size={10} />
                        {salon.id}
                      </span>
                      <span className="flex items-center gap-1">
                        <Scissors size={10} />
                        {salon.slug}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Warning banner */}
      <div className="mt-6 flex items-start gap-2 p-3 rounded-[10px] bg-s-amber/[0.08] border border-s-amber/20">
        <FlaskConical size={13} className="text-s-amber shrink-0 mt-0.5" />
        <p className="text-[11px] text-s-amber/80 leading-relaxed">
          {t("warning")}
        </p>
      </div>
    </DashboardLayout>
  );
}
