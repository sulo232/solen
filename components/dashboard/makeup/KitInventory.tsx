"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Package, Plus, Minus, AlertTriangle, ShoppingCart, ChevronDown, X } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

const KIT_CATEGORIES = ["foundation", "eyes", "lips", "cheeks", "brushes", "other"] as const;

interface KitItem {
  id: string;
  brand: string;
  product_name: string;
  shade: string | null;
  category: string | null;
  quantity: number;
  expiry_date: string | null;
  cost_per_unit: number | null;
  is_active: boolean;
}

interface UsageLog {
  id: string;
  quantity_used: number;
  used_at: string;
  notes: string | null;
}

// UTC-normalised day difference to avoid timezone-related off-by-one errors
function daysDiff(expiryDateStr: string): number {
  const now = new Date();
  const nowUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = expiryDateStr.split("-").map(Number);
  const expiryUtc = Date.UTC(y, m - 1, d);
  return Math.floor((expiryUtc - nowUtc) / (1000 * 60 * 60 * 24));
}

export default function KitInventory({ salonId }: { salonId: string }) {
  const t = useTranslations("dashboardMakeup") as any;
  const [items, setItems] = useState<KitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkoutItem, setCheckoutItem] = useState<KitItem | null>(null);
  const [checkoutQty, setCheckoutQty] = useState("1");
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [checkoutSaving, setCheckoutSaving] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [usageLogs, setUsageLogs] = useState<Record<string, UsageLog[]>>({});
  const [formData, setFormData] = useState({
    brand: "",
    product_name: "",
    shade: "",
    category: "foundation" as string,
    quantity: "1",
    expiry_date: "",
    cost_per_unit: "",
  });

  useEffect(() => {
    fetch(`/api/dashboard/makeup/kit?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.data) setItems(d.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  const filtered = activeCategory
    ? items.filter((i) => i.category === activeCategory)
    : items;

  const handleAdd = async () => {
    if (!formData.brand || !formData.product_name) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/makeup/kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          brand: formData.brand,
          product_name: formData.product_name,
          shade: formData.shade || undefined,
          category: formData.category,
          quantity: parseInt(formData.quantity) || 1,
          expiry_date: formData.expiry_date || undefined,
          cost_per_unit: formData.cost_per_unit ? parseFloat(formData.cost_per_unit) : undefined,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.data) setItems((prev) => [...prev, d.data]);
        setFormData({ brand: "", product_name: "", shade: "", category: "foundation", quantity: "1", expiry_date: "", cost_per_unit: "" });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const adjustQuantity = async (itemId: string, delta: number) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity: newQty } : i));
    try {
      await fetch("/api/dashboard/makeup/kit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: itemId, quantity: newQty }),
      });
    } catch {
      setItems((prev) => prev.map((i) => i.id === itemId ? { ...i, quantity: item.quantity } : i));
    }
  };

  const handleCheckout = async () => {
    if (!checkoutItem) return;
    setCheckoutSaving(true);
    try {
      const res = await fetch("/api/dashboard/makeup/kit-usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          item_id: checkoutItem.id,
          quantity_used: parseInt(checkoutQty) || 1,
          notes: checkoutNotes || undefined,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.log) {
          setUsageLogs((prev) => ({
            ...prev,
            [checkoutItem.id]: [d.log, ...(prev[checkoutItem.id] ?? [])],
          }));
        }
        // Deduct from stock optimistically
        const qty = parseInt(checkoutQty) || 1;
        setItems((prev) =>
          prev.map((i) => i.id === checkoutItem.id ? { ...i, quantity: Math.max(0, i.quantity - qty) } : i)
        );
        setCheckoutItem(null);
        setCheckoutQty("1");
        setCheckoutNotes("");
      }
    } finally {
      setCheckoutSaving(false);
    }
  };

  const loadUsageLogs = async (itemId: string) => {
    if (usageLogs[itemId]) return; // already loaded
    const res = await fetch(`/api/dashboard/makeup/kit-usage?salon_id=${salonId}&item_id=${itemId}`);
    if (res.ok) {
      const d = await res.json();
      setUsageLogs((prev) => ({ ...prev, [itemId]: d.logs ?? [] }));
    }
  };

  const toggleLogs = (itemId: string) => {
    if (expandedLogs === itemId) {
      setExpandedLogs(null);
    } else {
      setExpandedLogs(itemId);
      loadUsageLogs(itemId);
    }
  };

  const expiringCount = items.filter((i) => i.expiry_date && daysDiff(i.expiry_date) <= 30 && daysDiff(i.expiry_date) >= 0).length;
  const lowStockCount = items.filter((i) => i.quantity <= 2).length;

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-s-coral" />
          <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">
            {t("kit_title")}
          </h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 min-h-[44px] rounded-[8px] text-[11px] font-heading font-bold uppercase tracking-[.06em] bg-s-coral text-white hover:brightness-[1.06] active:scale-[0.98] transition-all"
          aria-label={t("kit_add")}
        >
          <Plus size={12} />
          {t("kit_add")}
        </button>
      </div>

      {/* Alerts */}
      {(expiringCount > 0 || lowStockCount > 0) && (
        <div className="space-y-2">
          {expiringCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-[12px] bg-s-warning/10">
              <AlertTriangle size={14} className="text-s-warning shrink-0" />
              <span className="text-xs text-s-warning">
                {t("kit_expiring_alert", { count: expiringCount })}
              </span>
            </div>
          )}
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-[12px] bg-s-amber/10">
              <AlertTriangle size={14} className="text-s-amber shrink-0" />
              <span className="text-xs text-s-amber">
                {t("kit_low_stock_alert", { count: lowStockCount })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory(null)}
          className={`shrink-0 px-3 py-1.5 rounded-[8px] text-[10px] font-heading font-bold uppercase tracking-[.06em] transition-colors duration-150 ${
            activeCategory === null
              ? "bg-s-coral text-white"
              : "bg-s-ink/[0.05] dark:bg-s-dm-text/[0.05] text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-s-dm-text/[0.09]"
          }`}
          aria-label={t("kit_all")}
        >
          {t("kit_all")}
        </button>
        {KIT_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 px-3 py-1.5 rounded-[8px] text-[10px] font-heading font-bold uppercase tracking-[.06em] transition-colors duration-150 ${
              activeCategory === cat
                ? "bg-s-coral text-white"
                : "bg-s-ink/[0.05] dark:bg-s-dm-text/[0.05] text-s-ink/55 dark:text-s-dm-text/55 hover:bg-s-ink/[0.09] dark:hover:bg-s-dm-text/[0.09]"
            }`}
            aria-label={t(`kit_cat.${cat}` as any)}
          >
            {t(`kit_cat.${cat}` as any)}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-[12px] border border-s-ink/[0.06] dark:border-s-dm-text/[0.06] p-4 bg-white dark:bg-s-dm-surface space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder={t("kit_brand")}
              className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
              aria-label={t("kit_brand")}
            />
            <input
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              placeholder={t("kit_product_name")}
              className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
              aria-label={t("kit_product_name")}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <input
              value={formData.shade}
              onChange={(e) => setFormData({ ...formData, shade: e.target.value })}
              placeholder={t("kit_shade")}
              className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
              aria-label={t("kit_shade")}
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
              aria-label={t("kit_category")}
            >
              {KIT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{t(`kit_cat.${cat}` as any)}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder={t("kit_quantity")}
              className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
              aria-label={t("kit_quantity")}
            />
            <input
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              className="px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text"
              aria-label={t("kit_expiry")}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving || !formData.brand || !formData.product_name}
              className="px-4 py-2 min-h-[44px] rounded-[8px] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-all disabled:opacity-40"
              aria-label={saving ? t("saving") : t("add")}
            >
              {saving ? t("saving") : t("add")}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-[8px] text-xs text-s-ink/50 dark:text-s-dm-text/50"
              aria-label={t("cancel")}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Item list */}
      <div className="grid grid-cols-1 gap-2">
        {filtered.map((item) => {
          const isExpiringSoon = item.expiry_date && daysDiff(item.expiry_date) <= 30 && daysDiff(item.expiry_date) >= 0;
          const isExpired = item.expiry_date && daysDiff(item.expiry_date) < 0;
          const isLowStock = item.quantity <= 2;
          const logsOpen = expandedLogs === item.id;
          const logs = usageLogs[item.id] ?? [];

          return (
            <div
              key={item.id}
              className={`rounded-[12px] border bg-white dark:bg-s-dm-surface ${
                isExpired ? "border-s-error/30" : isExpiringSoon ? "border-s-warning/30" : "border-s-ink/[0.04] dark:border-s-dm-text/[0.04]"
              }`}
            >
              <div className="flex items-center gap-3 p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">
                    {item.brand} — {item.product_name}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {item.shade && (
                      <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">{item.shade}</span>
                    )}
                    {item.category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-[4px] bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] text-s-ink/50 dark:text-s-dm-text/50">
                        {t(`kit_cat.${item.category}` as any)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock adjustment */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => adjustQuantity(item.id, -1)}
                    disabled={item.quantity <= 0}
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] text-s-ink/50 dark:text-s-dm-text/50 hover:bg-s-ink/[0.08] dark:hover:bg-s-dm-text/[0.08] transition-colors duration-150 disabled:opacity-30"
                    aria-label={t("kit_minus")}
                  >
                    <Minus size={10} />
                  </button>
                  <span className={`text-xs data-text w-6 text-center font-bold ${isLowStock ? "text-s-amber" : "text-s-ink/50 dark:text-s-dm-text/50"}`}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => adjustQuantity(item.id, 1)}
                    className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] text-s-ink/50 dark:text-s-dm-text/50 hover:bg-s-ink/[0.08] dark:hover:bg-s-dm-text/[0.08] transition-colors duration-150"
                    aria-label={t("kit_plus")}
                  >
                    <Plus size={10} />
                  </button>
                </div>

                {/* Checkout button */}
                <button
                  onClick={() => { setCheckoutItem(item); setCheckoutQty("1"); setCheckoutNotes(""); }}
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-s-coral/[0.08] text-s-coral hover:bg-s-coral/[0.14] transition-colors duration-150"
                  aria-label={t("kit_checkout")}
                >
                  <ShoppingCart size={11} />
                </button>

                {/* Usage log toggle */}
                <button
                  onClick={() => toggleLogs(item.id)}
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-s-ink/[0.04] dark:bg-s-dm-text/[0.04] text-s-ink/40 dark:text-s-dm-text/40 hover:bg-s-ink/[0.08] dark:hover:bg-s-dm-text/[0.08] transition-colors duration-150"
                  aria-label={t("kit_history")}
                >
                  <ChevronDown size={11} className={`transition-transform duration-200 ${logsOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Expiry badge */}
                {isExpired && (
                  <span className="text-[9px] font-heading font-bold uppercase px-1.5 py-0.5 rounded-[4px] bg-s-error/10 text-s-error shrink-0">
                    {t("kit_expired")}
                  </span>
                )}
                {isExpiringSoon && !isExpired && (
                  <span className="text-[9px] font-heading font-bold uppercase px-1.5 py-0.5 rounded-[4px] bg-s-warning/10 text-s-warning shrink-0">
                    {t("kit_expiring")}
                  </span>
                )}
              </div>

              {/* Usage log accordion */}
              {logsOpen && (
                <div className="border-t border-s-ink/[0.04] dark:border-s-dm-text/[0.04] px-3 pb-3 pt-2">
                  <p className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">
                    {t("kit_history")}
                  </p>
                  {logs.length === 0 ? (
                    <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30">{t("kit_history_empty")}</p>
                  ) : (
                    <div className="space-y-1.5">
                      {logs.slice(0, 8).map((log) => (
                        <div key={log.id} className="flex items-center gap-2 text-[11px]">
                          <span className="text-s-ink/30 dark:text-s-dm-text/30 tabular-nums shrink-0">{log.used_at}</span>
                          <span className="text-s-coral font-semibold shrink-0">−{log.quantity_used}</span>
                          {log.notes && <span className="text-s-ink/50 dark:text-s-dm-text/50 truncate">{log.notes}</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-center text-xs text-s-ink/30 dark:text-s-dm-text/30 py-6">
            {t("kit_empty")}
          </p>
        )}
      </div>

      {/* Checkout modal */}
      {checkoutItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-s-ink/40">
          <div className="w-full max-w-sm rounded-[16px] bg-white dark:bg-s-dm-surface p-5 space-y-4 shadow-[0_8px_32px_rgba(26,18,9,0.18)]">
            <div className="flex items-center justify-between">
              <p className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text">
                {t("kit_checkout_title")}
              </p>
              <button
                onClick={() => setCheckoutItem(null)}
                className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-s-ink/[0.05] dark:bg-s-dm-text/[0.05] text-s-ink/50 dark:text-s-dm-text/50"
                aria-label={t("cancel")}
              >
                <X size={12} />
              </button>
            </div>
            <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60">
              {checkoutItem.brand} — {checkoutItem.product_name}
            </p>
            <div className="space-y-2">
              <label className="text-[9px] font-heading font-bold uppercase tracking-[.12em] text-s-ink/35 dark:text-s-dm-text/35">
                {t("kit_qty_used")}
              </label>
              <input
                type="number"
                min="1"
                value={checkoutQty}
                onChange={(e) => setCheckoutQty(e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-sm text-s-ink dark:text-s-dm-text"
                aria-label={t("kit_qty_used")}
              />
              <textarea
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                rows={2}
                placeholder={t("kit_checkout_notes_placeholder")}
                className="w-full px-3 py-2 rounded-[8px] border border-s-ink/[0.10] dark:border-s-dm-text/[0.10] bg-transparent text-xs text-s-ink dark:text-s-dm-text resize-none"
                aria-label={t("kit_checkout_notes_placeholder")}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCheckout}
                disabled={checkoutSaving}
                className="flex-1 py-2.5 min-h-[44px] rounded-[8px] bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.98] transition-all disabled:opacity-40"
                aria-label={checkoutSaving ? t("saving") : t("kit_checkout_confirm")}
              >
                {checkoutSaving ? t("saving") : t("kit_checkout_confirm")}
              </button>
              <button
                onClick={() => setCheckoutItem(null)}
                className="px-4 py-2 rounded-[8px] text-xs text-s-ink/50 dark:text-s-dm-text/50"
                aria-label={t("cancel")}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
