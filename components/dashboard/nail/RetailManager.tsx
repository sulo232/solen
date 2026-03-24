"use client";

import { useState, useEffect } from "react";
import { Package, Plus, DollarSign } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";

interface RetailProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  image_url: string | null;
  stock_count: number;
}

export default function RetailManager({ salonId }: { salonId: string }) {
  const t = useTranslations("nail_dashboard");
  const locale = useLocale();
  const [products, setProducts] = useState<RetailProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", price: "", category: "nail_care" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/nail/retail?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.products) setProducts(d.products); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId]);

  const handleAdd = async () => {
    if (!formData.name || !formData.price) return;
    setSaving(true);
    try {
      const res = await fetch("/api/nail/retail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          name: formData.name,
          price: Math.round(parseFloat(formData.price) * 100),
          category: formData.category,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.product) setProducts((prev) => [...prev, d.product]);
        setFormData({ name: "", price: "", category: "nail_care" });
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const totalRevenue = products.reduce((sum, p) => sum + p.price, 0);

  if (loading) return <div className="flex justify-center py-6"><Spinner /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-s-coral" />
          <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">{t("retail_title")}</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 min-h-12 rounded-button text-xs font-medium bg-s-coral text-white"
          aria-label={t("retail_new")}
        >
          <Plus size={12} />
          {t("retail_new")}
        </button>
      </div>

      {/* Revenue summary */}
      <div className="flex items-center gap-2 p-3 rounded-card bg-s-bg-surface dark:bg-s-dm-bg">
        <DollarSign size={14} className="text-s-sage" />
        <span className="text-xs text-s-ink/60 dark:text-s-dm-text/60">{t("retail_products_count", { count: products.length })}</span>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-3 rounded-card border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface space-y-3">
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t("retail_name_placeholder")}
            className="w-full px-3 py-2 rounded-input border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder={t("retail_price_placeholder")}
              className="flex-1 px-3 py-2 rounded-input border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="flex-1 px-3 py-2 rounded-input border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm"
              aria-label={t("retail_cat_nail_care")}
            >
              <option value="nail_care">{t("retail_cat_nail_care")}</option>
              <option value="tools">{t("retail_cat_tools")}</option>
              <option value="polish">{t("retail_cat_polish")}</option>
              <option value="accessories">{t("retail_cat_accessories")}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 min-h-12 rounded-btn bg-s-coral text-white text-xs font-medium"
              aria-label={saving ? t("saving") : t("add")}
            >
              {saving ? t("saving") : t("add")}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-button text-xs text-s-ink/50 dark:text-s-dm-text/50"
              aria-label={t("cancel")}
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="space-y-2">
        {products.map((product) => (
          <div key={product.id} className="flex items-center gap-3 p-3 rounded-card border border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface">
            <div className="w-10 h-10 rounded-button bg-s-ink/5 dark:bg-s-dm-text/10 flex items-center justify-center shrink-0">
              <Package size={16} className="text-s-ink/30 dark:text-s-dm-text/30" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">{product.name}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-s-ink/5 dark:bg-s-dm-text/10 text-s-ink/50 dark:text-s-dm-text/50">
                {product.category}
              </span>
            </div>
            <span className="text-sm font-medium text-s-ink dark:text-s-dm-text">
              {formatCurrency(product.price / 100, locale)}
            </span>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-center text-sm text-s-ink/30 dark:text-s-dm-text/30 py-6">{t("retail_empty")}</p>
        )}
      </div>
    </div>
  );
}
