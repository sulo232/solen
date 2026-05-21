"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Check, ChevronRight, Clock, Plus, Star, X } from "lucide-react";
import type { SalonDetail, Service } from "./_shared";
import { capitalize } from "./_shared";
import { cn } from "@/lib/utils";

/**
 * SalonServicesSheet — V2-D53.3 polish (2026-05-11).
 *
 * Full-screen overlay opened from the salon detail page's "Alle ansehen"
 * services button. Matches Fresha's pattern: tapping "see all" doesn't
 * navigate to a new page, it opens a sheet/modal that takes over the
 * viewport and starts the booking flow at step 1 (Services).
 *
 * Anatomy (matches Fresha screenshot):
 *   • Top bar: back arrow LEFT, step breadcrumb CENTER
 *     (Services › Professional › Time › Confirm), X close RIGHT
 *   • Big "Services" h1
 *   • Category filter chips (derived from service.category enum)
 *   • Per-category section: subheading + description + service cards
 *   • Each service card: name + duration + description + price + (+) add button
 *   • Sticky right sidebar:
 *     - Salon thumbnail + name + rating + address
 *     - Selected services list (or "Keine Services ausgewählt")
 *     - Total
 *     - Continue button (disabled when nothing selected)
 *
 * Behavior:
 *   • Open: triggered by SalonServices "Alle ansehen" click via prop
 *   • Close: X button, back arrow (calls onClose), Escape key
 *   • Selection: + button toggles to check; service appears in cart
 *   • Continue: routes to /salon/[slug]/booking?services={ids} (the
 *     downstream booking flow steps are F.1.E #21 territory — for now we
 *     navigate there and let the booking page handle the rest)
 *
 * Brand: emerald `Continue` button per V2-D49j. White substrate. Open
 * Sauce body font for everything (matches the detail page typography).
 */
export function SalonServicesSheet({
  salon,
  locale,
  open,
  onClose,
}: {
  salon: SalonDetail;
  locale: string;
  open: boolean;
  onClose: () => void;
}) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [activeCat, setActiveCat] = React.useState<string>("");
  const [mounted, setMounted] = React.useState(false);
  const dialogRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => setMounted(true), []);

  // V2-D53.3: group by subcategory (Schnitt/Farbe/Styling/...) when available
  // for finer-grained filter chips. Falls back to top-level category.
  const grouped = React.useMemo(() => {
    return salon.services.reduce<Record<string, Service[]>>((acc, s) => {
      const key = s.subcategory ?? s.category ?? "andere";
      (acc[key] ??= []).push(s);
      return acc;
    }, {});
  }, [salon.services]);

  const categories = React.useMemo(() => Object.keys(grouped), [grouped]);

  React.useEffect(() => {
    if (open && categories.length > 0 && !activeCat) {
      setActiveCat(categories[0]);
    }
  }, [open, categories, activeCat]);

  // V2-D53.3 scroll-spy: observe sections within the DIALOG's scroll context
  // (not the viewport — the dialog is `fixed inset-0 overflow-y-auto` and
  // owns its own scroll). Fallback to scroll listener if IntersectionObserver
  // misses (some edge cases with portal mounting timing).
  React.useEffect(() => {
    if (!open || !mounted || categories.length === 0) return;
    const root = dialogRef.current;
    if (!root) return;

    const sectionEls: { cat: string; el: HTMLElement }[] = [];
    categories.forEach((c) => {
      const el = root.querySelector<HTMLElement>(`[data-cat="${c}"]`);
      if (el) sectionEls.push({ cat: c, el });
    });

    function updateActiveByScroll() {
      const root = dialogRef.current;
      if (!root) return;
      // The "active line" is just below the sticky top bar + chip bar (~128px).
      // Whichever section's TOP is closest to but still above that line is active.
      const activeLine = 128;
      let best: { cat: string; top: number } | null = null;
      for (const { cat, el } of sectionEls) {
        const rect = el.getBoundingClientRect();
        const rootRect = root.getBoundingClientRect();
        const relTop = rect.top - rootRect.top;
        if (relTop <= activeLine) {
          if (!best || relTop > best.top) best = { cat, top: relTop };
        }
      }
      if (!best && sectionEls.length > 0) {
        // Above all sections — use the first.
        best = { cat: sectionEls[0].cat, top: 0 };
      }
      if (best) setActiveCat(best.cat);
    }

    updateActiveByScroll();
    root.addEventListener("scroll", updateActiveByScroll, { passive: true });
    return () => root.removeEventListener("scroll", updateActiveByScroll);
  }, [open, mounted, categories]);

  const scrollToCategory = (cat: string) => {
    const root = dialogRef.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(`[data-cat="${cat}"]`);
    if (!el) return;
    // Offset for top bar (~64) + chip bar (~64) so the section heading
    // lands just below the sticky chrome.
    const offset = 128;
    const top = el.offsetTop - offset;
    root.scrollTo({ top, behavior: "smooth" });
  };

  // Lock body scroll while open + bind Escape
  React.useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedServices = salon.services.filter((s) => selectedIds.has(s.id));
  const total = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce(
    (sum, s) => sum + s.duration_minutes,
    0
  );

  const continueHref = `/${locale}/salon/${salon.slug}/booking${
    selectedIds.size > 0 ? `?services=${[...selectedIds].join(",")}` : ""
  }`;

  // V2-D53.3: render via portal to <body> so the z-index escapes the
  // ancestor stacking context created by main.isolate. Otherwise the site
  // header (z-50 at body level) bleeds through the sheet.
  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Services auswählen"
      className="fixed inset-0 z-[100] overflow-y-auto bg-white"
    >
      {/* Top sticky bar — back + title grouped LEFT, X close RIGHT.
          Earlier layout spread back/title/X at justify-between which left a
          big gap between back and title. Now back+title read as a unit. */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-s-border bg-white px-4 py-3 md:px-8 md:py-4">
        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            aria-label="Zurück"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white transition-colors hover:bg-s-bg-sunken"
          >
            <ArrowLeft size={18} strokeWidth={2.25} className="text-s-ink" />
          </button>
          <h2 className="font-body text-[16px] font-bold tracking-tight text-s-ink md:text-[18px]">
            Services
          </h2>
        </div>

        <button
          type="button"
          aria-label="Schließen"
          onClick={onClose}
          className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white transition-colors hover:bg-s-bg-sunken"
        >
          <X size={18} strokeWidth={2.25} className="text-s-ink" />
        </button>
      </header>

      {/* Body */}
      <div className="mx-auto w-full max-w-[1280px] px-4 pb-32 pt-6 md:px-8 md:pt-8 lg:grid lg:grid-cols-[1fr_360px] lg:gap-10 lg:pb-10">
        {/* LEFT — services list */}
        <div className="min-w-0">
          {/* Step breadcrumb — supplementary path above the title */}
          <nav
            aria-label="Buchungsschritte"
            className="font-body flex items-center gap-1.5 text-[13px] md:text-[14px]"
          >
            <BreadcrumbStep label="Services" active />
            <BreadcrumbDivider />
            <BreadcrumbStep label="Profi" />
            <BreadcrumbDivider />
            <BreadcrumbStep label="Zeit" />
            <BreadcrumbDivider />
            <BreadcrumbStep label="Bestätigen" />
          </nav>

          <h1 className="font-body mt-3 text-[28px] font-bold leading-tight tracking-tight text-s-ink md:mt-4 md:text-[40px]">
            Services
          </h1>

          {/* STICKY CHIP BAR — V2-D53.3 scroll-spy. Click chip = scrollToCategory.
              Active chip slides as user scrolls through sections (IntersectionObserver). */}
          {categories.length > 1 && (
            <div className="sticky top-[60px] z-[5] -mx-4 mt-6 border-b border-s-border bg-white px-4 py-3 md:top-[72px] md:-mx-8 md:px-8 lg:-mx-2 lg:px-2">
              <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => scrollToCategory(c)}
                    className={cn(
                      "font-body shrink-0 rounded-full border px-5 py-2 text-[14px] font-semibold transition-all duration-200",
                      activeCat === c
                        ? "border-s-brand bg-s-brand text-white shadow-[0_2px_8px_rgba(31,92,66,0.18)]"
                        : "border-s-border bg-white text-s-ink-2 hover:border-s-brand hover:text-s-brand"
                    )}
                    aria-current={activeCat === c ? "true" : undefined}
                  >
                    {capitalize(c)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All category sections stacked vertically */}
          <div className="mt-8 space-y-12">
            {categories.map((cat) => (
              <section
                key={cat}
                id={`sheet-cat-${cat}`}
                data-cat={cat}
                aria-label={`${capitalize(cat)} Services`}
                className="scroll-mt-32"
              >
                <h2 className="font-body text-[22px] font-bold leading-tight tracking-tight text-s-ink md:text-[26px]">
                  {capitalize(cat)}
                </h2>
                <ul className="mt-5 space-y-3">
                  {grouped[cat].map((s) => {
                    const isSelected = selectedIds.has(s.id);
                    return (
                      <li
                        key={s.id}
                        className={cn(
                          "rounded-2xl border-2 bg-white p-5 transition-all md:p-6",
                          isSelected
                            ? "border-s-brand shadow-[0_4px_16px_rgba(31,92,66,0.10)]"
                            : "border-s-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
                        )}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="font-body text-[16px] font-semibold text-s-ink md:text-[17px]">
                              {s.name_de}
                            </div>
                            <div className="font-body mt-1.5 flex items-center gap-2 text-[13px] text-s-ink-3">
                              <Clock size={12} strokeWidth={2} />
                              {s.duration_minutes} min
                            </div>
                            {s.description_de && (
                              <p className="font-body mt-2 text-[13px] leading-relaxed text-s-ink-2 md:text-[14px]">
                                {s.description_de}
                              </p>
                            )}
                            <div className="font-body mt-3 text-[16px] font-bold text-s-ink">
                              CHF {s.price}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggle(s.id)}
                            aria-label={
                              isSelected ? `${s.name_de} entfernen` : `${s.name_de} hinzufügen`
                            }
                            aria-pressed={isSelected}
                            className={cn(
                              "grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 transition-colors",
                              isSelected
                                ? "border-s-brand bg-s-brand text-white"
                                : "border-s-border bg-white text-s-ink hover:border-s-brand hover:text-s-brand"
                            )}
                          >
                            {isSelected ? (
                              <Check size={18} strokeWidth={2.5} />
                            ) : (
                              <Plus size={18} strokeWidth={2.25} />
                            )}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        </div>

        {/* RIGHT — sticky cart sidebar (desktop only). pt-14 aligns the card
            top with the "Services" h1 (skips past the breadcrumb row above). */}
        <aside className="hidden lg:block lg:pt-14">
          <div className="sticky top-28">
            <CartCard
              salon={salon}
              selectedServices={selectedServices}
              total={total}
              totalDuration={totalDuration}
              continueHref={continueHref}
            />
          </div>
        </aside>
      </div>

      {/* Mobile sticky bottom bar with total + Continue */}
      <div className="fixed bottom-0 left-0 right-0 z-10 border-t border-s-border bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="mx-auto flex max-w-[600px] items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-body text-[12px] text-s-ink-3">
              {selectedIds.size === 0
                ? "Keine Services ausgewählt"
                : `${selectedIds.size} Service${selectedIds.size > 1 ? "s" : ""} · ${totalDuration} min`}
            </div>
            <div className="font-body text-[16px] font-bold text-s-ink">
              {total === 0 ? "Gratis" : `CHF ${total}`}
            </div>
          </div>
          <Link
            href={continueHref}
            aria-disabled={selectedIds.size === 0}
            tabIndex={selectedIds.size === 0 ? -1 : 0}
            className={cn(
              "font-body inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold transition-colors",
              selectedIds.size === 0
                ? "pointer-events-none bg-s-bg-sunken text-s-ink-3"
                : "bg-s-brand text-white hover:bg-s-brand-mid active:bg-s-brand-deep"
            )}
          >
            Weiter
            <ChevronRight size={15} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}

// =====================================================
// Cart sidebar card (desktop)
// =====================================================

function CartCard({
  salon,
  selectedServices,
  total,
  totalDuration,
  continueHref,
}: {
  salon: SalonDetail;
  selectedServices: Service[];
  total: number;
  totalDuration: number;
  continueHref: string;
}) {
  return (
    <div className="flex min-h-[calc(100vh-180px)] flex-col rounded-2xl border border-s-border bg-white p-6 shadow-[0_8px_28px_rgba(0,0,0,0.08),0_2px_6px_rgba(0,0,0,0.04)] md:p-7">
      {/* Salon header — vertical stack, larger image, full 5-star row */}
      <div className="flex items-start gap-4">
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-s-bg-sunken">
          {salon.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={salon.cover_photo_url}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-display text-[24px] font-black text-s-ink-3/40">
              {salon.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="font-body truncate text-[16px] font-bold text-s-ink md:text-[17px]">
            {salon.name}
          </div>
          <div className="font-body mt-1.5 flex items-center gap-1.5 text-[13px]">
            <span className="font-bold text-s-ink">
              {salon.average_rating?.toFixed(1) ?? "—"}
            </span>
            <div className="flex items-center gap-0.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  size={12}
                  fill={
                    salon.average_rating !== null && i < Math.floor(salon.average_rating)
                      ? "#F3A864"
                      : "#E8DFD2"
                  }
                  stroke="none"
                />
              ))}
            </div>
            <span className="text-s-ink-3">
              ({salon.review_count.toLocaleString("de-CH")})
            </span>
          </div>
          <div className="font-body mt-1.5 truncate text-[13px] text-s-ink-3">
            {salon.address}
          </div>
        </div>
      </div>

      <div className="my-6 border-t border-s-border" />

      {/* Selected services list — flex-1 so it grows downward, pushing
          Total + Continue to the bottom edge of the card. */}
      <div className="flex-1">
        {selectedServices.length === 0 ? (
          <p className="font-body py-2 text-[14px] italic text-s-ink-3">
            Keine Services ausgewählt
          </p>
        ) : (
          <ul className="space-y-5">
            {selectedServices.map((s) => (
              <li
                key={s.id}
                className="font-body flex items-start justify-between gap-3 text-[14px]"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-s-ink">{s.name_de}</div>
                  <div className="mt-0.5 text-[12px] text-s-ink-3">
                    {s.duration_minutes} min
                  </div>
                </div>
                <span className="shrink-0 font-semibold text-s-ink">
                  CHF {s.price}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="my-6 border-t border-s-border" />

      {/* Total */}
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <div className="font-body text-[16px] font-semibold text-s-ink">
            Total
          </div>
          {totalDuration > 0 && (
            <div className="font-body mt-0.5 text-[12px] text-s-ink-3">
              {totalDuration} min
            </div>
          )}
        </div>
        <div className="font-body text-[22px] font-bold text-s-ink">
          {total === 0 ? "Gratis" : `CHF ${total}`}
        </div>
      </div>

      {/* Continue — taller, more prominent. Tracks Fresha's "this is THE
          commitment button" weight. */}
      <Link
        href={continueHref}
        aria-disabled={selectedServices.length === 0}
        tabIndex={selectedServices.length === 0 ? -1 : 0}
        className={cn(
          "font-body mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full py-4 text-[16px] font-semibold transition-colors",
          selectedServices.length === 0
            ? "pointer-events-none bg-s-bg-sunken text-s-ink-3"
            : "bg-s-brand text-white shadow-[0_4px_16px_rgba(31,92,66,0.20)] hover:bg-s-brand-mid active:bg-s-brand-deep"
        )}
      >
        Weiter
        <ChevronRight size={15} strokeWidth={2.5} />
      </Link>
    </div>
  );
}

// =====================================================
// Breadcrumb step bits
// =====================================================

function BreadcrumbStep({ label, active = false }: { label: string; active?: boolean }) {
  return (
    <span
      className={cn(
        "font-body",
        active ? "font-semibold text-s-ink" : "text-s-ink-3"
      )}
    >
      {label}
    </span>
  );
}

function BreadcrumbDivider() {
  return (
    <ChevronRight
      size={12}
      strokeWidth={2}
      className="shrink-0 text-s-ink-3/60"
    />
  );
}
