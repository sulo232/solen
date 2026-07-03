"use client";

/**
 * /dev/bundles-products , A5 SCOPE DECISION MOCKUP (owner wants to PICK the bundles/products
 * scope visually, not from a text pick). Three options, each rendered as a section in the REAL
 * salon store-page (PDP) grammar so the owner judges it at real phone size.
 *
 * Exists-check: npm run exists bundles-products = 0; grounded in SalonServices.tsx row grammar +
 * ServicesStaffStep variants/addons + _plans/SEARCH_MAP_OVERHAUL.md A5 research; service_packages
 * GRAVEYARDED 2026-06-11 (REMOVED.md) , shown here ONLY as an owner-driven scope option.
 *
 * Grounded-in: SalonServices.tsx (row: name + Clock duration + formatCurrency CHF price, py-3.5 px-3
 * rounded-[12px], divide-y hairlines) · ServicesStaffStep.tsx (service_options variants = single-select
 * tier list, gray selected; service_addons = optional +price +duration extras) · SalonCard.tsx
 * DiscountBadge (pale −X% pill) · TabPill gray-selected treatment · _plans/SEARCH_MAP_OVERHAUL.md
 * A5.1/A5.2 backend map.
 * Not-a-salon-card: every option is a PDP store-page SECTION in service-row grammar, not a search
 * result / salon card. No photo-feed card, no rating row, no "View store" link.
 * reinvent-ok: the "Products" / "Bundles" section headings + illustrative product/service names +
 * CHF prices are placeholder decision content, not a real category taxonomy.
 *
 * Real tokens (s-ink / s-bg-sunken / s-border / s-accent / s-star), Lucide only, no CDN. English
 * (mockup rule). Client component, notFound() in production, mounted guard (spec-chip pattern).
 */
import { useEffect, useState } from "react";
import { Clock, ShoppingBag, Store, Check, Plus, Package } from "lucide-react";
import { notFound } from "next/navigation";

// photo placeholder for the small retail product square (CSS only , mockup stand-in for the real product photo)
const PRODUCT_PHOTO = [
  "linear-gradient(135deg,#c9b8a6 0%,#a08a72 55%,#7a6450 100%)", // drift-ok: mockup photo placeholder gradient
  "linear-gradient(135deg,#b8c2c9 0%,#8a97a0 55%,#5f6c74 100%)", // drift-ok: mockup photo placeholder gradient
  "linear-gradient(135deg,#c7bdd0 0%,#9a8fae 55%,#6f6488 100%)", // drift-ok: mockup photo placeholder gradient
];

// ── Small shared pieces (all in real PDP service-row grammar) ─────────────────

// Section header in the real SalonServices h2 grammar.
function SectionHead({ icon: Icon, title }: { icon: typeof Store; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon size={17} strokeWidth={2} className="text-s-ink" />
      <h2 className="font-heading text-base font-bold text-s-ink">{title}</h2>
    </div>
  );
}

// A neutral-outline "Add" button (CONTROL_ELEVATION: calm control on white = flat, no shadow;
// buttons never solid black on a mockup control). Icon + label, real grammar.
function AddButton() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-s-border bg-white px-3.5 py-1.5 font-body text-[13px] font-semibold text-s-ink">
      <Plus size={14} strokeWidth={2.2} /> Add
    </span>
  );
}

// A card wrapper matching the ServicesStaffStep grouped card (rounded-24, hairline, whisper shadow).
function GroupCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
      {children}
    </div>
  );
}

// A caption block explaining an option + its backend flag.
function Caption({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 rounded-xl bg-white p-3 text-[12.5px] leading-relaxed text-s-ink-2">{children}</p>;
}

// ── OPTION A , Products (retail section on the PDP) ───────────────────────────

function ProductRow({ name, size, price, photo }: { name: string; size: string; price: string; photo: string }) {
  return (
    <div className="flex items-center justify-between border-t border-s-border px-4 py-3.5 first:border-t-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-11 w-11 shrink-0 overflow-hidden rounded-[10px]" style={{ backgroundImage: photo }} aria-hidden />
        <div className="min-w-0">
          <p className="truncate font-body text-[15px] font-semibold text-s-ink">{name}</p>
          <p className="mt-0.5 truncate text-[12px] text-s-ink-2">{size}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-3">
        <span className="font-body text-[14px] font-semibold text-s-ink tabular-nums">{price}</span>
        <AddButton />
      </div>
    </div>
  );
}

function OptionA() {
  return (
    <section>
      <SectionHead icon={ShoppingBag} title="Products" />
      <GroupCard>
        <ProductRow name="Repair shampoo" size="250 ml" price="CHF 28" photo={PRODUCT_PHOTO[0]} />
        <ProductRow name="Curl cream" size="150 ml" price="CHF 24" photo={PRODUCT_PHOTO[1]} />
        <ProductRow name="Heat protect spray" size="200 ml" price="CHF 22" photo={PRODUCT_PHOTO[2]} />
      </GroupCard>
      <p className="mt-2.5 flex items-center gap-1.5 px-1 text-[12px] text-s-ink-2">
        <Store size={13} strokeWidth={1.9} className="shrink-0" /> Pick up at your visit
      </p>
    </section>
  );
}

// ── OPTION B , Bundles (>=2 services grouped at a package price) ──────────────

function IncludedRow({ name, mins }: { name: string; mins: number }) {
  return (
    <div className="flex items-center justify-between border-t border-s-border px-4 py-3 first:border-t-0">
      <p className="truncate font-body text-[14px] font-medium text-s-ink">{name}</p>
      <span className="flex shrink-0 items-center gap-1 pl-3 text-[12px] text-s-ink-2">
        <Clock size={11} strokeWidth={1.9} /> {mins} Min
      </span>
    </div>
  );
}

function BundleCard({
  name,
  services,
  oldPrice,
  bundlePrice,
  percent,
}: {
  name: string;
  services: { name: string; mins: number }[];
  oldPrice: string;
  bundlePrice: string;
  percent: number;
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Package size={16} strokeWidth={2} className="text-s-ink" />
        <p className="font-heading text-[16px] font-bold text-s-ink">{name}</p>
      </div>
      <div>
        {services.map((s) => (
          <IncludedRow key={s.name} name={s.name} mins={s.mins} />
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-s-border px-4 py-3.5">
        <div className="flex items-baseline gap-2">
          <span className="font-body text-[13px] text-s-ink-3 line-through tabular-nums">{oldPrice}</span>
          <span className="font-body text-[16px] font-bold text-s-ink tabular-nums">{bundlePrice}</span>
        </div>
        {/* pale-green −X% pill , DiscountBadge / project_card_badges grammar */}
        <span className="rounded-full bg-s-success-bg px-2.5 py-1 font-body text-[12px] font-semibold text-s-success tabular-nums">
          −{percent}%
        </span>
      </div>
    </div>
  );
}

function OptionB() {
  return (
    <section>
      <SectionHead icon={Package} title="Bundles" />
      <div className="space-y-4">
        <BundleCard
          name="Cut + Color"
          services={[
            { name: "Women's haircut", mins: 45 },
            { name: "Full color", mins: 90 },
          ]}
          oldPrice="CHF 165"
          bundlePrice="CHF 140"
          percent={15}
        />
        <BundleCard
          name="Wash + Cut + Style"
          services={[
            { name: "Wash and blow dry", mins: 20 },
            { name: "Men's haircut", mins: 30 },
            { name: "Styling finish", mins: 15 },
          ]}
          oldPrice="CHF 95"
          bundlePrice="CHF 80"
          percent={16}
        />
      </div>
    </section>
  );
}

// ── OPTION C , Already live today (variants + add-ons in booking) ─────────────

function VariantRow({ label, price, selected }: { label: string; price: string; selected: boolean }) {
  // Single-select tier list. Selected = calm GRAY wash + gray-filled check circle (TabPill treatment,
  // NOT ink/blue) , owner rule "selected = grayed" (ServicesStaffStep options grammar).
  return (
    <div
      className={`flex items-center justify-between border-t border-s-border px-4 py-3 first:border-t-0 ${
        selected ? "bg-s-bg-sunken" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${
            selected ? "bg-s-border text-s-ink" : "border border-s-border text-transparent"
          }`}
          aria-hidden
        >
          <Check size={13} strokeWidth={2.5} />
        </span>
        <p className={`font-body text-[14px] text-s-ink ${selected ? "font-semibold" : "font-medium"}`}>{label}</p>
      </div>
      <span className="font-body text-[14px] font-semibold text-s-ink tabular-nums">{price}</span>
    </div>
  );
}

function OptionC() {
  return (
    <section>
      <SectionHead icon={Check} title="Already live today" />
      <div className="space-y-4">
        {/* Service with variants (service_options) , single-select tiers, gray selected */}
        <div>
          <p className="mb-2 px-1 font-body text-[13px] font-semibold text-s-ink">Haircut , pick a length</p>
          <GroupCard>
            <VariantRow label="Short hair" price="CHF 60" selected={false} />
            <VariantRow label="Medium hair" price="CHF 75" selected />
            <VariantRow label="Long hair" price="CHF 90" selected={false} />
          </GroupCard>
        </div>

        {/* Add-ons suggestion (service_addons) , optional +price +duration extras */}
        <div>
          <p className="mb-2 px-1 font-body text-[13px] font-semibold text-s-ink">Add-ons</p>
          <GroupCard>
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="min-w-0">
                <p className="truncate font-body text-[14px] font-medium text-s-ink">Olaplex treatment</p>
                <p className="mt-0.5 flex items-center gap-1 text-[12px] text-s-ink-2">
                  <Clock size={11} strokeWidth={1.9} /> +15 Min
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3 pl-3">
                <span className="font-body text-[14px] font-semibold text-s-ink tabular-nums">+CHF 30</span>
                <AddButton />
              </div>
            </div>
          </GroupCard>
        </div>
      </div>
    </section>
  );
}

// ── Option shell (label + the section + caption) ──────────────────────────────

function Option({
  letter,
  title,
  recommended,
  children,
  caption,
}: {
  letter: string;
  title: string;
  recommended?: boolean;
  children: React.ReactNode;
  caption: React.ReactNode;
}) {
  return (
    <div className="mb-9">
      <div className="mb-3 flex items-center gap-2">
        {/* A/B/C is a neutral section marker, not a selected state , calm gray chip. */}
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-s-bg-sunken font-heading text-[12px] font-bold text-s-ink">
          {letter}
        </span>
        <h3 className="font-heading text-[17px] font-bold text-s-ink">{title}</h3>
        {recommended && (
          <span className="rounded-full border border-s-accent px-2 py-0.5 font-body text-[12px] font-semibold text-s-accent">
            Recommended
          </span>
        )}
      </div>
      {/* The section rendered on a sunken PDP body , the real store-page surface. */}
      <div className="rounded-[20px] bg-s-bg-sunken p-3.5">{children}</div>
      <Caption>{caption}</Caption>
    </div>
  );
}

export default function BundlesProductsMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-white py-6">
      <div className="mx-auto w-full max-w-[400px] px-4">
        <h1 className="font-heading text-[19px] font-bold text-s-ink">Bundles and products , pick the scope</h1>
        <p className="mb-7 mt-1 text-[13px] text-s-ink-2">
          Each option is shown as it would appear on the store page.
        </p>

        <Option
          letter="A"
          title="Products"
          recommended
          caption={
            <>
              Salon sells retail products on its page. Backend mostly exists (nail retail + Stripe path built);
              net-new = generalize to all salons + this customer UI.
            </>
          }
        >
          <OptionA />
        </Option>

        <Option
          letter="B"
          title="Bundles"
          caption={
            <>
              2+ services grouped at a package price (Fresha bundle mechanics).{" "}
              <span className="font-semibold text-s-ink">FLAG:</span> packages feature was removed 2026-06-11 (owner
              call, "never rebuild") , picking B consciously un-kills it: bundle builder in dashboard + this section +
              booking integration.
            </>
          }
        >
          <OptionB />
        </Option>

        <Option
          letter="C"
          title="Already live today"
          caption={
            <>
              Service variants (service_options) and add-ons (service_addons) are ALREADY built and live in the booking
              flow. Picking C = nothing net-new.
            </>
          }
        >
          <OptionC />
        </Option>

        <p className="mt-2 border-t border-s-border pt-5 text-[12.5px] leading-relaxed text-s-ink-2">
          <span className="font-semibold text-s-ink">Recommendation: A.</span> Products is the most backend-ready and
          adds a new revenue surface without un-killing packages. B is possible but reverses the 2026-06-11 removal. C
          costs nothing.
        </p>
      </div>
    </main>
  );
}
