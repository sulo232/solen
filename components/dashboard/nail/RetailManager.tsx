"use client";

import { useState, useEffect } from "react";
import { Package, Plus, DollarSign } from "lucide-react";
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
          <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text">Retail Produkte</h3>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 px-3 py-1.5 rounded-button text-xs font-medium bg-s-coral text-white"
        >
          <Plus size={12} />
          Neues Produkt
        </button>
      </div>

      {/* Revenue summary */}
      <div className="flex items-center gap-2 p-3 rounded-card bg-s-bg-surface dark:bg-s-dm-bg">
        <DollarSign size={14} className="text-s-sage" />
        <span className="text-xs text-s-ink/60 dark:text-s-dm-text/60">{products.length} Produkte</span>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="p-3 rounded-card border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface space-y-3">
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Produktname"
            className="w-full px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder="Preis (CHF)"
              className="flex-1 px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm"
            />
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="flex-1 px-3 py-2 rounded-button border border-s-ink/10 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface text-sm"
            >
              <option value="nail_care">Nagelpflege</option>
              <option value="tools">Werkzeug</option>
              <option value="polish">Nagellack</option>
              <option value="accessories">Zubehör</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 rounded-button bg-s-coral text-white text-xs font-medium"
            >
              {saving ? "Speichern..." : "Hinzufügen"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-button text-xs text-s-ink/50 dark:text-s-dm-text/50">
              Abbrechen
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
              CHF {(product.price / 100).toFixed(2)}
            </span>
          </div>
        ))}
        {products.length === 0 && (
          <p className="text-center text-sm text-s-ink/30 dark:text-s-dm-text/30 py-6">Noch keine Produkte</p>
        )}
      </div>
    </div>
  );
}
