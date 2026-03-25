"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Plus, Package, ToggleLeft, ToggleRight } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";

interface ServicePackage {
  id: string;
  name: string;
  service_name: string;
  sessions: number;
  bonus_sessions: number;
  price: number;
  is_active: boolean;
  purchases_count: number;
}

interface PackagePurchase {
  id: string;
  customer_name: string;
  package_name: string;
  sessions_used: number;
  sessions_total: number;
  purchased_at: string;
}

const pkgLabels = {
  de: { title: "Service-Pakete", newPkg: "Neues Paket", namePlaceholder: "Paketname (z.B. '5er Karte Haarschnitt')", selectService: "Service wählen...", sessions: "Sitzungen", bonus: "Bonus", price: "Preis (CHF)", cancel: "Abbrechen", saving: "Speichern...", create: "Erstellen", empty: "Noch keine Pakete erstellt", sold: "verkauft", recentPurchases: "Letzte Käufe" },
  en: { title: "Service Packages", newPkg: "New Package", namePlaceholder: "Package name (e.g. '5-pack Haircut')", selectService: "Select service...", sessions: "Sessions", bonus: "Bonus", price: "Price (CHF)", cancel: "Cancel", saving: "Saving...", create: "Create", empty: "No packages created yet", sold: "sold", recentPurchases: "Recent Purchases" },
  fr: { title: "Forfaits", newPkg: "Nouveau forfait", namePlaceholder: "Nom du forfait (p.ex. 'Carte 5 coupes')", selectService: "Choisir un service...", sessions: "Séances", bonus: "Bonus", price: "Prix (CHF)", cancel: "Annuler", saving: "Enregistrement...", create: "Créer", empty: "Aucun forfait créé", sold: "vendu(s)", recentPurchases: "Derniers achats" },
  it: { title: "Pacchetti servizi", newPkg: "Nuovo pacchetto", namePlaceholder: "Nome pacchetto (es. 'Carta 5 tagli')", selectService: "Scegli servizio...", sessions: "Sessioni", bonus: "Bonus", price: "Prezzo (CHF)", cancel: "Annulla", saving: "Salvataggio...", create: "Crea", empty: "Nessun pacchetto creato", sold: "venduto/i", recentPurchases: "Acquisti recenti" },
};

interface PackageManagerProps {
  salonId: string;
}

export default function PackageManager({ salonId }: PackageManagerProps) {
  const locale = useLocale();
  const pl = pkgLabels[locale as keyof typeof pkgLabels] ?? pkgLabels.de;
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [purchases, setPurchases] = useState<PackagePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  // Form state
  const [form, setForm] = useState({ name: "", service_id: "", sessions: 5, bonus_sessions: 1, price: 0 });

  useEffect(() => {
    Promise.all([
      fetch(`/api/packages?salon_id=${salonId}`).then((r) => r.json()),
      fetch(`/api/packages/purchases?salon_id=${salonId}`).then((r) => r.json()),
      fetch(`/api/salon/services?salon_id=${salonId}`).then((r) => r.json()),
    ])
      .then(([pkgData, purchaseData, svcData]) => {
        setPackages(pkgData.packages ?? pkgData.items ?? []);
        setPurchases(purchaseData.purchases ?? purchaseData.items ?? []);
        setServices((svcData.services ?? svcData.items ?? []).map((s: { id: string; name_de?: string; name?: string }) => ({
          id: s.id,
          name: s.name_de ?? s.name ?? "",
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, ...form }),
      });
      if (res.ok) {
        const newPkg = await res.json();
        setPackages((prev) => [...prev, newPkg]);
        setShowForm(false);
        setForm({ name: "", service_id: "", sessions: 5, bonus_sessions: 1, price: 0 });
      }
    } catch {}
    setSaving(false);
  };

  const toggleActive = async (pkg: ServicePackage) => {
    await fetch(`/api/packages/${pkg.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !pkg.is_active }),
    });
    setPackages((prev) => prev.map((p) => (p.id === pkg.id ? { ...p, is_active: !p.is_active } : p)));
  };

  if (loading) return <div className="flex justify-center py-6"><Spinner size="md" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text flex items-center gap-2">
          <Package size={14} className="text-s-coral" /> {pl.title}
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] transition-all"
        >
          <Plus size={12} /> {pl.newPkg}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-s-bg-surface dark:bg-s-dm-bg rounded-[16px] border border-s-ink/5 dark:border-white/5 p-4 mb-4 space-y-3">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder={pl.namePlaceholder}
            className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
          />
          <select
            value={form.service_id}
            onChange={(e) => setForm({ ...form, service_id: e.target.value })}
            className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
          >
            <option value="">{pl.selectService}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{pl.sessions}</label>
              <input
                type="number"
                min={1}
                value={form.sessions}
                onChange={(e) => setForm({ ...form, sessions: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
              />
            </div>
            <div>
              <label className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{pl.bonus}</label>
              <input
                type="number"
                min={0}
                value={form.bonus_sessions}
                onChange={(e) => setForm({ ...form, bonus_sessions: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
              />
            </div>
            <div>
              <label className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{pl.price}</label>
              <input
                type="number"
                min={0}
                step={5}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-surface text-sm text-s-ink dark:text-s-dm-text"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-s-ink/50 dark:text-s-dm-text/50">{pl.cancel}</button>
            <button
              onClick={handleCreate}
              disabled={saving || !form.name || !form.service_id}
              className="px-4 py-1.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] disabled:opacity-50 transition-all"
            >
              {saving ? pl.saving : pl.create}
            </button>
          </div>
        </div>
      )}

      {/* Package list */}
      {packages.length === 0 ? (
        <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30 text-center py-6">{pl.empty}</p>
      ) : (
        <div className="space-y-2 mb-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="flex items-center justify-between bg-s-bg-surface/50 dark:bg-s-dm-bg/50 rounded-[16px] border border-s-ink/5 dark:border-white/5 p-3">
              <div>
                <p className="text-sm font-medium text-s-ink dark:text-s-dm-text">{pkg.name}</p>
                <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
                  {pkg.sessions} + {pkg.bonus_sessions} {pl.bonus} · {pkg.service_name} · {pkg.purchases_count} {pl.sold}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="data-text text-sm font-semibold text-s-ink dark:text-s-dm-text">{formatCurrency(pkg.price, locale)}</span>
                <button onClick={() => toggleActive(pkg)} aria-label={pkg.is_active ? "Deactivate" : "Activate"} className="text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral transition-colors">
                  {pkg.is_active ? <ToggleRight size={20} className="text-s-coral" /> : <ToggleLeft size={20} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchases */}
      {purchases.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-wide mb-2">{pl.recentPurchases}</h4>
          <div className="space-y-1">
            {purchases.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center justify-between text-xs py-1.5 border-b border-s-ink/5 dark:border-white/5 last:border-0">
                <span className="text-s-ink dark:text-s-dm-text font-medium">{p.customer_name}</span>
                <span className="text-s-ink/40 dark:text-s-dm-text/40">{p.package_name}</span>
                <span className="data-text text-s-ink dark:text-s-dm-text">
                  {p.sessions_used}/{p.sessions_total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
