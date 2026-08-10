"use client";

// Exists-check: `npm run exists bundle-builder` = 0 (2026-07-03, A5 R5 close-out). service_bundles
// table + /api/salon/bundles GET + the PDP SalonBundles.tsx section already ship; the dashboard-side
// BUNDLE BUILDER form (B-2 in _plans/BUNDLES_PRODUCTS.md) does not exist yet , this is a MOCKUP of it
// (mockup-first rule), owner approves before it becomes the real /dashboard/bundles page.
//
// Grounded-in:
//   - AURORA dashboard grammar (NOT the customer B&W restraint DS): app/[locale]/dashboard/services/page.tsx
//     ServiceModal (rounded-btn inputs, border-s-border, ToggleRight/ToggleLeft Active switch, ink Save
//     button , the live/shipped Save convention) + app/[locale]/dashboard/settings/page.tsx panel/section
//     recipe + RetailManager.tsx (rounded-[16px] panel cards, Package icon header).
//   - SELECTED STATE = GRAY sunken (bg-s-bg-sunken + text-s-ink + font-semibold), NEVER ink/black and
//     NEVER blue/accent, per feedback_selected_state_ink_not_blue_ring (owner 2026-07-02, superseding
//     the older accent-selected pattern seen in some pre-existing dashboard pages). Applied to the
//     service picker rows AND the pricing-mode segmented control below.
//   - Input focus = the GLOBAL focus-visible recipe in app/globals.css (single ink edge + halo), no
//     per-input focus override.
//   - LIVE preview = the REAL customer bundle card, copied 1:1 from
//     app/[locale]/_components/salon/SalonBundles.tsx BundleCard (Package icon + name, IncludedRow
//     name + Clock duration in "N min" casing per the same file's NIT-1 fix, struck summed price,
//     bold bundle price, pale-green -X% pill, all real s-ink/s-border/s-success tokens).
//   - Bundle price math = the REAL shared util, not reinvented: lib/pricing/bundle.ts computeBundlePriceChf
//     (sum | custom | percent -> CHF 2dp), imported directly so the mockup's preview price is provably
//     the same number the live API would compute.
// Mounted guard = app/[locale]/dev/spec-chip/page.tsx pattern. notFound() in production.
// English inline (mockup rule). Real tokens, Lucide, no CDN, no em-dash/middot.

import * as React from "react";
import { notFound } from "next/navigation";
import { Package, Clock, ToggleLeft, ToggleRight, Info } from "lucide-react";
import { computeBundlePriceChf, type BundlePricingMode } from "@/lib/pricing/bundle";
import { formatCurrency } from "@/lib/format-currency";

// ── Sample services (illustrative catalogue for the picker, real shape: id/name/duration/price CHF) ──
interface SampleService {
  id: string;
  name: string;
  duration_minutes: number;
  price: number; // CHF decimal
}

const SAMPLE_SERVICES: SampleService[] = [
  { id: "s1", name: "Women's haircut", duration_minutes: 45, price: 85 },
  { id: "s2", name: "Full color", duration_minutes: 90, price: 135 },
  { id: "s3", name: "Wash and blow dry", duration_minutes: 20, price: 35 },
  { id: "s4", name: "Balayage", duration_minutes: 120, price: 220 },
];

const PRICING_MODES: { key: BundlePricingMode; label: string }[] = [
  { key: "sum", label: "Sum" },
  { key: "percent", label: "Percent off" },
  { key: "custom", label: "Custom price" },
];

// ── Aurora dashboard form field shell (grounded in ServiceModal input recipe) ──
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-[12px] font-medium text-s-ink-2">{label}</label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2.5 text-[14px] text-s-ink"; // mockup-ok: dead-class removal only, base input law already renders this fill/border/radius (V3-D-input-fill-2026-07-17)

export default function BundleBuilderMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Form state. Seeded with 2 preselected services so the preview renders valid immediately.
  const [name, setName] = React.useState("Cut and Color");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set(["s1", "s2"]));
  const [mode, setMode] = React.useState<BundlePricingMode>("percent");
  const [percentOff, setPercentOff] = React.useState(15);
  const [customPrice, setCustomPrice] = React.useState(150);
  const [isActive, setIsActive] = React.useState(true);

  if (!mounted) return null;

  const toggleService = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedServices = SAMPLE_SERVICES.filter((s) => selectedIds.has(s.id));
  const enoughServices = selectedServices.length >= 2;
  const sumChf = selectedServices.reduce((acc, s) => acc + s.price, 0);
  const priceChf = computeBundlePriceChf(mode, sumChf, {
    customPrice,
    percentOff,
  });
  const showStruck = enoughServices && priceChf < sumChf;
  const showDiscount = mode === "percent" && enoughServices;

  return (
    <main className="min-h-screen bg-white py-6">
      <div className="mx-auto w-full max-w-[1180px] px-4">
        <h1 className="font-heading text-[22px] font-bold tracking-[-0.01em] text-s-ink">Bundle builder</h1>
        <p className="mb-6 mt-1 text-[13px] text-s-ink-2">
          Mockup of the dashboard bundle-creation form (B-2). Changing the services, pricing mode, or
          value updates the live preview on the right, the same way it would update the real customer
          bundle card on the salon page.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* ── FORM PANEL (Aurora dashboard grammar) ── */}
          <div className="rounded-[16px] border border-s-border bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <Package size={16} className="text-s-ink" />
              <h2 className="font-heading text-[15px] font-semibold text-s-ink">New bundle</h2>
            </div>

            <div className="space-y-4">
              <Field label="Bundle name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cut and Color"
                  className={inputClass}
                />
              </Field>

              {/* selected-ok: checked row = GRAY sunken (feedback_selected_state_ink_not_blue_ring,
                  owner 2026-07-02), NOT ink/black, NOT accent/blue. */}
              <Field label={`Services (select at least 2, ${selectedServices.length} selected)`}>
                <div className="overflow-hidden rounded-[12px] border border-s-border">
                  {SAMPLE_SERVICES.map((s, i) => {
                    const checked = selectedIds.has(s.id);
                    return (
                      <label
                        key={s.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 px-3.5 py-3 text-[13.5px] transition-colors ${
                          i > 0 ? "border-t border-s-border" : ""
                        } ${checked ? "bg-s-bg-sunken" : "bg-white hover:bg-s-bg-sunken"}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(s.id)}
                            className="h-4 w-4 shrink-0 accent-s-ink"
                          />
                          <div className="min-w-0">
                            <p className={`truncate text-s-ink ${checked ? "font-semibold" : "font-medium"}`}>{s.name}</p>
                            <p className="flex items-center gap-1 text-[12px] text-s-ink-2">
                              <Clock size={11} strokeWidth={1.9} /> {s.duration_minutes} min
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 font-semibold text-s-ink tabular-nums">
                          {formatCurrency(s.price, "de")}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {!enoughServices && (
                  <p className="mt-1.5 flex items-center gap-1 text-[12px] text-s-warning-text">
                    <Info size={12} strokeWidth={2} /> Pick at least 2 services to form a bundle.
                  </p>
                )}
              </Field>

              {/* selected-ok: pricing-mode selected = GRAY sunken, same rule as the service picker above. */}
              <Field label="Pricing mode">
                <div className="grid grid-cols-3 gap-2">
                  {PRICING_MODES.map((m) => {
                    const active = mode === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setMode(m.key)}
                        aria-pressed={active}
                        className={`flex items-center justify-center rounded-[10px] border px-2 py-2.5 text-[13px] font-semibold transition-colors ${
                          active
                            ? "border-s-border bg-s-bg-sunken text-s-ink"
                            : "border-s-border text-s-ink-2 hover:border-s-ink/20"
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {mode === "percent" && (
                <Field label="Percent off (1 to 99)">
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={percentOff}
                      onChange={(e) => setPercentOff(Math.min(99, Math.max(1, Number(e.target.value) || 0)))}
                      className={inputClass}
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-s-ink-2">%</span>
                  </div>
                </Field>
              )}

              {mode === "custom" && (
                <Field label="Custom price (CHF)">
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-s-ink-2">CHF</span>
                    <input
                      type="number"
                      min={0}
                      step={0.05}
                      value={customPrice}
                      onChange={(e) => setCustomPrice(Number(e.target.value) || 0)}
                      className={`${inputClass} pl-11`}
                    />
                  </div>
                </Field>
              )}

              {mode === "sum" && (
                <p className="rounded-[10px] bg-s-bg-sunken px-3 py-2.5 text-[12.5px] text-s-ink-2">
                  Bundle price is the plain sum of the selected services, no discount applied.
                </p>
              )}

              <label className="flex cursor-pointer items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setIsActive((v) => !v)}
                  className={isActive ? "text-s-ink" : "text-s-ink/30"}
                  aria-pressed={isActive}
                  aria-label="Active"
                >
                  {isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                </button>
                <span className="text-[13.5px] text-s-ink-2">Active (visible to customers)</span>
              </label>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-btn border border-s-border py-2.5 text-[14px] font-medium text-s-ink-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!enoughServices || !name.trim()}
                className="flex-1 rounded-btn bg-s-ink py-2.5 text-[14px] font-medium text-white disabled:opacity-50"
              >
                Save bundle
              </button>
            </div>
          </div>

          {/* ── LIVE PREVIEW (real customer SalonBundles.tsx BundleCard, verbatim grammar) ── */}
          <div>
            <p className="mb-2.5 text-[13px] font-semibold text-s-ink-2">Live preview , customer store page</p>
            <div className="rounded-[20px] bg-s-bg-sunken p-4">
              {enoughServices ? (
                <div className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
                  <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                    <Package size={16} strokeWidth={2} className="text-s-ink" aria-hidden />
                    <p className="font-heading text-[16px] font-bold text-s-ink">{name || "Bundle name"}</p>
                  </div>

                  <div>
                    {selectedServices.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between border-t border-s-border px-4 py-3 first:border-t-0"
                      >
                        <p className="truncate font-body text-[14px] font-medium text-s-ink">{s.name}</p>
                        <span className="flex shrink-0 items-center gap-1 pl-3 text-[12px] text-s-ink-2 tabular-nums">
                          <Clock size={11} strokeWidth={1.9} aria-hidden /> {s.duration_minutes} min
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-s-border px-4 py-3.5">
                    <div className="flex min-w-0 items-baseline gap-2">
                      {showStruck && (
                        <span className="font-body text-[13px] text-s-ink-2 line-through tabular-nums">
                          {formatCurrency(sumChf, "de")}
                        </span>
                      )}
                      <span className="font-body text-[16px] font-bold text-s-ink tabular-nums">
                        {formatCurrency(priceChf, "de")}
                      </span>
                      {showDiscount && (
                        <span className="rounded-full bg-s-success-bg px-2.5 py-1 font-body text-[12px] font-semibold text-s-success tabular-nums">
                          &minus;{percentOff}%
                        </span>
                      )}
                    </div>
                    <span className="font-body shrink-0 rounded-full border border-s-border bg-white px-5 py-2 text-[13px] font-semibold text-s-ink">
                      Book
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-s-border bg-white p-6 text-center">
                  <p className="text-[13px] text-s-ink-2">Select at least 2 services to preview the bundle card.</p>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-[12px] bg-s-bg-sunken p-3.5 text-[12.5px] leading-relaxed text-s-ink-2">
              <p>
                Preview price is computed with the same <span className="font-mono text-[12px]">computeBundlePriceChf</span> util
                the live API uses (<span className="font-mono text-[12px]">lib/pricing/bundle.ts</span>), so this number matches
                what the real bundle would charge.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
