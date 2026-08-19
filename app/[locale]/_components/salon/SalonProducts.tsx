"use client";

// exists-check: net-new vs app/[locale]/_components/salon/SalonServices.tsx because
// `npm run exists products` found NO PDP retail SECTION (only the nail_retail_products
// table + the /dev/bundles-products mockup). Reuses the SalonServices grouped-card row
// grammar + the built retail API path + the shared WalkInPaymentForm Stripe surface.

/**
 * SalonProducts , A5 Phase A-3 PDP retail section.
 *
 * mockup-ok: grounded 1:1 in the APPROVED /dev/bundles-products Option A grammar
 * (app/[locale]/dev/bundles-products/page.tsx OptionA/ProductRow/AddButton):
 *   - GroupCard = rounded-[24px] border-s-border bg-white shadow-whisper (SalonServices grouped-card grammar)
 *   - ProductRow = 44x44 rounded-[10px] photo square + name (15/600) + size/description line (12 s-ink-2)
 *     + CHF price (14/600 tabular-nums) + neutral-outline pill "Add"
 *   - pick-up-at-visit note = Store icon + s-ink-2 12px caption
 * Deviations from the mockup (grounded in production reality, NOT invented):
 *   - mockup-ok: photo square uses a neutral bg-s-bg-sunken + Package icon placeholder when image_url is
 *     null (P3 fix, owner-approved 2026-07-15 fixes-refined: ImageFallback is locked for full
 *     salon-card covers, not a 44px inline row icon; mockup used a CSS gradient placeholder)
 *   - the mockup's static "Add" becomes a real in-section cart + total + commit button (task T1: v1 minimal cart)
 *   - "Ausverkauft" (sold-out) state when stock_count === 0 , Add disabled (task T1 empty-stock rule)
 * Payment is the existing built Stripe path: POST /api/salon/retail/purchase returns a
 * PaymentIntent clientSecret + amount (RAPPEN); we hand it to WalkInPaymentForm (the shared
 * confirmPayment surface, components-legacy/barber/WalkInPaymentForm.tsx), same as walk-in pay.
 *
 * Renders NOTHING (returns null) until active products load, so the PDP shows no empty section
 * and the sticky tab only appears when there are products (onLoaded callback drives availableSections).
 */

import * as React from "react";
import Image from "next/image";
import { Store, Plus, Check, Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatCurrency } from "@/lib/format-currency";
import WalkInPaymentForm from "@/components-legacy/barber/WalkInPaymentForm";

// Live shape from GET /api/salon/retail (nail_retail_products row). price = INTEGER RAPPEN.
interface RetailProduct {
  id: string;
  name: string;
  description: string | null;
  price: number; // Rappen
  image_url: string | null;
  category: string | null;
  stock_count: number;
}

export function SalonProducts({
  salonId,
  category,
  locale,
  onLoaded,
}: {
  salonId: string;
  /** Primary salon category , drives the ImageFallback colour block for imageless products. */
  category: string;
  locale: string;
  /** Called with true once active products are confirmed present (registers the sticky tab). */
  onLoaded?: (hasProducts: boolean) => void;
}) {
  const t = useTranslations("salonDetail");
  const [products, setProducts] = React.useState<RetailProduct[] | null>(null);
  const [error, setError] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  // Payment lifecycle: idle -> loading (creating PI) -> paying (Stripe form) -> paid.
  const [phase, setPhase] = React.useState<"idle" | "loading" | "paying" | "paid">("idle");
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [payAmount, setPayAmount] = React.useState(0); // CHF (converted from Rappen for display)
  const [payError, setPayError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!salonId) return;
    const ac = new AbortController();
    fetch(`/api/salon/retail?salon_id=${salonId}`, { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { products?: RetailProduct[] } | null) => {
        const list = d?.products ?? [];
        setProducts(list);
        onLoaded?.(list.length > 0);
      })
      .catch((err) => {
        if (err?.name !== "AbortError") {
          console.error("[SalonProducts] failed to load products:", err);
          setError(true);
          onLoaded?.(false);
        }
      });
    return () => ac.abort();
    // onLoaded intentionally excluded , it is a stable callback from the parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  // Nothing to show , keep the PDP clean (no empty section, no tab).
  if (products !== null && products.length === 0 && !error) return null;
  if (products === null) {
    // Loading: a minimal shimmer row set (Skeleton grammar) sized to the final layout.
    return (
      <section id="section-products">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          {t("products")}
        </h2>
        <div className="mt-5 overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-3 border-t border-s-border px-4 py-3.5 first:border-t-0">
              <div className="h-11 w-11 shrink-0 animate-shimmer rounded-[10px] bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken bg-[length:200%_100%]" />
              <div className="flex-1">
                <div className="h-4 w-1/2 animate-shimmer rounded bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken bg-[length:200%_100%]" />
                <div className="mt-2 h-3 w-2/3 animate-shimmer rounded bg-gradient-to-r from-s-bg-sunken via-white to-s-bg-sunken bg-[length:200%_100%]" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error || !products) {
    return (
      <section id="section-products">
        <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
          {t("products")}
        </h2>
        <p className="mt-4 text-[14px] text-s-ink-2">{t("productsError")}</p>
      </section>
    );
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    // Any cart change invalidates a not-yet-confirmed PaymentIntent.
    if (phase === "paying") {
      setPhase("idle");
      setClientSecret(null);
    }
  };

  // Total in Rappen (source unit), shown via formatCurrency after /100.
  const totalRappen = products
    .filter((p) => selected.has(p.id))
    .reduce((sum, p) => sum + p.price, 0);

  const startCheckout = async () => {
    if (selected.size === 0) return;
    setPhase("loading");
    setPayError(null);
    try {
      const res = await fetch("/api/salon/retail/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: [...selected], salon_id: salonId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.clientSecret) {
        // 401 (not logged in) / 400 (unavailable) / 503 (payments off) surface here.
        console.error("[SalonProducts] purchase init failed:", res.status, data);
        setPayError(data?.error || t("productsError"));
        setPhase("idle");
        return;
      }
      setClientSecret(data.clientSecret);
      // Purchase route returns `amount` in Rappen , convert for the pay button display.
      setPayAmount((data.amount ?? totalRappen) / 100);
      setPhase("paying");
    } catch (err) {
      console.error("[SalonProducts] purchase request failed:", err);
      setPayError(t("productsError"));
      setPhase("idle");
    }
  };

  return (
    <section id="section-products">
      <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
        {t("products")}
      </h2>

      <div className="mt-5 overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
        {products.map((p) => (
          <ProductRow
            key={p.id}
            product={p}
            locale={locale}
            selected={selected.has(p.id)}
            onToggle={() => toggle(p.id)}
            addLabel={t("productsAdd")}
            soldOutLabel={t("productsSoldOut")}
          />
        ))}
      </div>

      {/* Pick up at your visit , grounded in the mockup caption line. */}
      <p className="mt-2.5 flex items-center gap-1.5 px-1 text-[12px] text-s-ink-2">
        <Store size={13} strokeWidth={1.9} className="shrink-0" aria-hidden />
        {t("productsPickup")}
      </p>

      {/* In-section cart commit + Stripe payment. Appears only once something is selected. */}
      {selected.size > 0 && phase !== "paid" && (
        <div className="mt-4 rounded-[20px] border border-s-border bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-medium text-s-ink-2">{t("productsTotal")}</span>
            <span className="font-body text-[16px] font-bold text-s-ink tabular-nums">
              {formatCurrency(totalRappen / 100, locale)}
            </span>
          </div>

          {phase === "paying" && clientSecret ? (
            <div className="mt-4">
              <WalkInPaymentForm
                clientSecret={clientSecret}
                amount={payAmount}
                locale={locale}
                onPaid={() => setPhase("paid")}
                payLabel={t("productsPay")}
                secureLabel={t("productsPaySecure")}
              />
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={startCheckout}
                disabled={phase === "loading"}
                className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-s-ink font-body text-[15px] font-semibold text-white transition-[filter,transform] hover:brightness-[1.06] active:scale-[0.97] active:duration-[80ms] active:ease-glide disabled:opacity-50"
              >
                {t("productsCheckout")}
              </button>
              {payError && <p className="mt-2 text-[12px] text-s-error">{payError}</p>}
            </>
          )}
        </div>
      )}

      {/* Outcome confirmation (DS-1 outcome state): payment received. */}
      {phase === "paid" && (
        <div className="mt-4 rounded-[20px] border border-s-success/30 bg-s-success-bg p-4">
          <p className="font-body text-[14px] font-semibold text-s-success">{t("productsPaid")}</p>
          <p className="mt-1 text-[12.5px] text-s-ink-2">{t("productsPaidNote")}</p>
        </div>
      )}
    </section>
  );
}

function ProductRow({
  product,
  locale,
  selected,
  onToggle,
  addLabel,
  soldOutLabel,
}: {
  product: RetailProduct;
  locale: string;
  selected: boolean;
  onToggle: () => void;
  addLabel: string;
  soldOutLabel: string;
}) {
  const soldOut = product.stock_count <= 0;
  return (
    <div className="flex items-center justify-between border-t border-s-border px-4 py-3.5 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3">
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px]">
          {product.image_url ? (
            <Image src={product.image_url} alt="" fill sizes="44px" className="object-cover" />
          ) : (
            // mockup-ok: P3 fix, neutral placeholder replaces the mis-borrowed salon-card-cover
            // ImageFallback (that component is locked for full salon-card covers, not a 44px
            // inline row icon, and its saturated category color carries no product meaning
            // here) (approved fixes-refined)
            <div className="absolute inset-0 flex items-center justify-center bg-s-bg-sunken">
              <Package size={18} strokeWidth={1.9} className="text-s-ink-2" aria-hidden />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className={`truncate font-body text-[15px] font-semibold ${soldOut ? "text-s-ink-2" : "text-s-ink"}`}>
            {product.name}
          </p>
          {product.description && (
            <p className="mt-0.5 truncate text-[12px] text-s-ink-2">{product.description}</p>
          )}
          {soldOut && (
            <p className="mt-0.5 text-[12px] font-medium text-s-ink-2">{soldOutLabel}</p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-3">
        <span className={`font-body text-[14px] font-semibold tabular-nums ${soldOut ? "text-s-ink-2" : "text-s-ink"}`}>
          {formatCurrency(product.price / 100, locale)}
        </span>
        {/* mockup-ok: A5 R5 close-out nit-2 , icon-only Add per copy-economy rule (icon unambiguous next
            to its object); selected = gray sunken per feedback_selected_state_ink_not_blue_ring (owner
            2026-07-02, NOT ink). Frees row width so the product name stops truncating. */}
        <button
          type="button"
          onClick={onToggle}
          disabled={soldOut}
          aria-pressed={selected}
          aria-label={addLabel}
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-[colors,transform] active:scale-[0.94] active:duration-[80ms] active:ease-glide disabled:cursor-not-allowed disabled:opacity-50 ${
            selected
              ? "border-s-border bg-s-bg-sunken text-s-ink"
              : "border-s-border bg-white text-s-ink hover:bg-s-bg-sunken"
          }`}
        >
          {selected ? <Check size={18} strokeWidth={1.9} aria-hidden /> : <Plus size={18} strokeWidth={1.9} aria-hidden />}
        </button>
      </div>
    </div>
  );
}
