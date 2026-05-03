"use client";

import { useState } from "react";
import { ShoppingBag, Plus, Minus, CreditCard } from "lucide-react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";

interface RetailProduct {
  id: string;
  name: string;
  price: number;
}

interface CartItem extends RetailProduct {
  quantity: number;
}

interface RetailCheckoutProps {
  salonId: string;
  products: RetailProduct[];
  onClose?: () => void;
}

export default function RetailCheckout({ salonId, products, onClose }: RetailCheckoutProps) {
  const t = useTranslations("nail_dashboard") as any;
  const locale = useLocale();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const addToCart = (product: RetailProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => i.id === productId ? { ...i, quantity: i.quantity + delta } : i)
        .filter((i) => i.quantity > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/nail/retail/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          items: cart.map((i) => ({ product_id: i.id, quantity: i.quantity })),
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setCart([]);
      }
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <ShoppingBag size={32} className="text-s-sage mx-auto mb-3" />
        <p className="text-sm font-medium text-s-ink">{t("checkout_success")}</p>
        <button onClick={() => { setSuccess(false); onClose?.(); }}
          className="mt-3 text-xs text-s-coral underline">{t("close")}</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <ShoppingBag size={16} className="text-s-coral" />
        <h3 className="font-heading text-sm text-s-ink">{t("checkout_title")}</h3>
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-2">
        {products.map((product) => (
          <button
            key={product.id}
            onClick={() => addToCart(product)}
            className="p-3 rounded-[16px] border border-s-ink/10 bg-[--raised] text-left hover:border-s-coral/20 transition-colors duration-150"
          >
            <p className="text-xs font-medium text-s-ink truncate">{product.name}</p>
            <p className="text-xs text-s-ink/50 mt-0.5">{formatCurrency(product.price / 100, locale)}</p>
          </button>
        ))}
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="rounded-[16px] border border-s-ink/10 bg-[--raised] divide-y divide-s-ink/5">
          {cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-s-ink truncate">{item.name}</p>
                <p className="text-[10px] text-s-ink/40">
                  {formatCurrency(item.price / 100, locale)} × {item.quantity}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQuantity(item.id, -1)}
                  aria-label={`${t("decrease")} ${item.name}`}
                  className="w-6 h-6 rounded-full bg-s-ink/5 flex items-center justify-center">
                  <Minus size={10} className="text-s-ink/50" />
                </button>
                <span className="text-xs font-medium text-s-ink w-4 text-center">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)}
                  aria-label={`${t("increase")} ${item.name}`}
                  className="w-6 h-6 rounded-full bg-s-ink/5 flex items-center justify-center">
                  <Plus size={10} className="text-s-ink/50" />
                </button>
              </div>
            </div>
          ))}

          {/* Total + pay */}
          <div className="p-3">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-s-ink">{t("checkout_total")}</span>
              <span className="text-sm font-bold text-s-ink">{formatCurrency(total / 100, locale)}</span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={processing}
              className="w-full min-h-12 flex items-center justify-center gap-2 px-4 py-2.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-[11px] font-heading uppercase tracking-[.06em] hover:brightness-[1.06] transition-[transform,filter] duration-150 disabled:opacity-50 shadow-elevation-2"
            >
              <CreditCard size={14} />
              {processing ? t("checkout_processing") : t("checkout_pay")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
