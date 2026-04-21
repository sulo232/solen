/**
 * /design-system — Canonical visual reference for Solen.ch.
 *
 * This is a DEV tool, not a customer-facing page. Strings are hardcoded in English
 * (exempt from the project-wide useTranslations() rule — see DESIGN_SYSTEM.md §15).
 *
 * Purpose: let agents/devs see what tokens and components exist before rebuilding.
 * Keep this page lean — it's a reference, not a showcase.
 */

"use client";

import { useState } from "react";
import { Heart, Search, Calendar, Sparkles, Check, X, Info } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import SalonCardSkeleton from "@/components/ui/SalonCardSkeleton";

const ACTIVE_COLORS = [
  { token: "s-coral", hex: "#E8624A", use: "Primary action, brand" },
  { token: "s-amber", hex: "#D4870A", use: "Urgency / promo / premium" },
  { token: "s-blue", hex: "#6BA3C8", use: "Info / links" },
  { token: "s-ink", hex: "#1A1209", use: "Primary text on light" },
];

const RESERVED_COLORS = [
  { token: "s-plum", hex: "#4A1E3C", use: "Barbershop" },
  { token: "s-sage", hex: "#7BA688", use: "Spa / wellness" },
  { token: "s-sand", hex: "#C9A96E", use: "Makeup / partnership" },
  { token: "s-yellow", hex: "#F2C144", use: "Top Rated / achievement" },
];

const SURFACES = [
  { token: "s-bg-base", hex: "#FAF6EF", use: "Page background (cream)" },
  { token: "s-bg-raised", hex: "#FFFFFF", use: "Cards" },
  { token: "s-bg-sunken", hex: "#EDE5D8", use: "Inputs, wells" },
];

const CANONICAL_COMPONENTS = [
  { name: "SalonCard", path: "components/SalonCard.tsx", use: "Listing card" },
  { name: "InteractiveHoverButton", path: "components/ui/interactive-hover-button.tsx", use: "Primary CTA" },
  { name: "SolenDatePicker", path: "components/ui/date-picker.tsx", use: "Date picker" },
  { name: "FilterBar", path: "components/ui/FilterBar.tsx", use: "Filter row" },
  { name: "EmptyState", path: "components/ui/EmptyState.tsx", use: "Empty list state" },
  { name: "Skeleton", path: "components/ui/Skeleton.tsx", use: "Loading shimmer" },
  { name: "Spinner", path: "components/ui/Spinner.tsx", use: "Inline spinner" },
  { name: "BottomTabBar", path: "components/layout/BottomTabBar.tsx", use: "Mobile nav" },
  { name: "DashboardLayout", path: "components/dashboard/DashboardLayout.tsx", use: "Dashboard shell" },
  { name: "Sidebar", path: "components/ui/sidebar.tsx", use: "Dashboard sidebar" },
];

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <h2 className="text-2xl font-display uppercase tracking-wide text-s-ink mb-1">{title}</h2>
      {note && <p className="text-sm text-s-ink/60 mb-5">{note}</p>}
      {!note && <div className="mb-5" />}
      {children}
    </section>
  );
}

function Swatch({ token, hex, use }: { token: string; hex: string; use: string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-input border border-s-ink/[0.08] bg-white">
      <div className="w-12 h-12 rounded-input shrink-0" style={{ backgroundColor: hex }} />
      <div className="min-w-0">
        <p className="font-body text-sm font-semibold text-s-ink truncate">{token}</p>
        <p className="font-body text-xs text-s-ink/60 truncate">{hex}</p>
        <p className="font-body text-xs text-s-ink/50 truncate">{use}</p>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [pressed, setPressed] = useState(false);

  return (
    <div className="min-h-screen bg-s-bg-base px-6 py-12 md:px-12 md:py-16">
      <div className="max-w-5xl mx-auto">
        <header className="mb-14 pb-8 border-b border-s-ink/[0.08]">
          <p className="text-xs uppercase tracking-[2.5px] text-s-coral font-body font-semibold mb-2">
            /design-system
          </p>
          <h1 className="text-4xl md:text-5xl font-display uppercase text-s-ink mb-3">
            Solen Visual Reference
          </h1>
          <p className="text-base text-s-ink/60 max-w-2xl">
            Canonical tokens and components. If you need one of these, import it — don&apos;t rebuild.
            Spec lives in <code className="text-xs bg-s-bg-sunken px-1.5 py-0.5 rounded">DESIGN_SYSTEM.md</code>.
          </p>
        </header>

        <Section title="Canonical Components" note="Import these. Don't rebuild.">
          <div className="overflow-hidden rounded-input border border-s-ink/[0.08] bg-white">
            <table className="w-full text-sm">
              <thead className="bg-s-bg-sunken">
                <tr>
                  <th className="text-left p-3 font-body font-semibold text-s-ink">Name</th>
                  <th className="text-left p-3 font-body font-semibold text-s-ink">Path</th>
                  <th className="text-left p-3 font-body font-semibold text-s-ink">Use</th>
                </tr>
              </thead>
              <tbody>
                {CANONICAL_COMPONENTS.map((c) => (
                  <tr key={c.name} className="border-t border-s-ink/[0.05]">
                    <td className="p-3 font-body font-semibold text-s-ink">{c.name}</td>
                    <td className="p-3 font-body text-xs text-s-ink/60"><code>{c.path}</code></td>
                    <td className="p-3 font-body text-s-ink/70">{c.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Active Colors" note="Use these by default.">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {ACTIVE_COLORS.map((c) => <Swatch key={c.token} {...c} />)}
          </div>
        </Section>

        <Section title="Reserved Colors" note="Defaults for their category. Override in PR with rationale.">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {RESERVED_COLORS.map((c) => <Swatch key={c.token} {...c} />)}
          </div>
        </Section>

        <Section title="Surfaces">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SURFACES.map((c) => <Swatch key={c.token} {...c} />)}
          </div>
        </Section>

        <Section title="Typography">
          <div className="space-y-4 p-6 rounded-card border border-s-ink/[0.08] bg-white">
            <div>
              <p className="text-xs text-s-ink/50 font-body mb-1">Display — Bebas Neue — text-4xl</p>
              <p className="text-4xl font-display uppercase text-s-ink">Beauty, booked nearby.</p>
            </div>
            <div>
              <p className="text-xs text-s-ink/50 font-body mb-1">Heading — Syne — text-2xl</p>
              <p className="text-2xl font-heading text-s-ink">Handpicked salons in Basel.</p>
            </div>
            <div>
              <p className="text-xs text-s-ink/50 font-body mb-1">Body — DM Sans — text-base</p>
              <p className="text-base font-body text-s-ink/70">
                Book appointments with verified salons. Read honest reviews. Pay securely.
              </p>
            </div>
            <div>
              <p className="text-xs text-s-ink/50 font-body mb-1">Data — DM Sans tabular-nums — text-sm</p>
              <p className="text-sm font-body tabular-nums text-s-ink">CHF 89.00 · 4.8 · 1,247 reviews</p>
            </div>
          </div>
        </Section>

        <Section title="Buttons" note="All pressables use active:scale-[0.97]. Hover uses brightness, not opacity.">
          <div className="flex flex-wrap gap-3 p-6 rounded-card border border-s-ink/[0.08] bg-white">
            <button
              className="bg-s-coral text-white rounded-btn px-6 h-11 text-sm font-body font-semibold hover:brightness-[1.06] active:scale-[0.97] transition-[filter,transform] duration-150"
              onClick={() => setPressed((p) => !p)}
            >
              Primary CTA
            </button>
            <button className="border border-s-ink/10 text-s-ink/70 rounded-btn px-6 h-11 text-sm font-body font-semibold hover:border-s-coral/40 hover:text-s-coral active:scale-[0.97] transition-[color,border-color,transform] duration-150">
              Secondary
            </button>
            <button className="text-s-ink/60 rounded-btn px-4 h-11 text-sm font-body font-semibold hover:text-s-coral active:scale-[0.97] transition-colors duration-150">
              Ghost / link
            </button>
            <button
              aria-label="Favorite"
              className="w-11 h-11 rounded-full flex items-center justify-center text-s-ink/60 hover:text-s-coral hover:bg-s-ink/[0.05] active:scale-[0.97] transition-[color,background-color,transform] duration-150"
            >
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </Section>

        <Section title="Pills & Badges">
          <div className="flex flex-wrap gap-2 p-6 rounded-card border border-s-ink/[0.08] bg-white">
            <span className="px-3 py-1 rounded-pill bg-s-coral text-white text-xs font-body font-semibold">Active</span>
            <span className="px-3 py-1 rounded-pill bg-s-ink/[0.05] text-s-ink/55 text-xs font-body font-semibold hover:bg-s-ink/[0.09] cursor-pointer active:scale-[0.97] transition-all duration-150">Inactive</span>
            <span className="px-3 py-1 rounded-pill bg-s-amber/15 text-s-amber text-xs font-body font-semibold">Last Minute</span>
            <span className="px-3 py-1 rounded-pill bg-s-yellow/20 text-[#7A5C00] text-xs font-body font-semibold flex items-center gap-1"><Sparkles className="w-3 h-3" /> Top Rated</span>
            <span className="px-3 py-1 rounded-pill bg-s-sage/15 text-[#2E5E3A] text-xs font-body font-semibold">Spa</span>
            <span className="px-3 py-1 rounded-pill bg-white border border-s-ink/10 text-s-ink/70 text-xs font-body font-semibold">New</span>
          </div>
        </Section>

        <Section title="Form Input">
          <div className="p-6 rounded-card border border-s-ink/[0.08] bg-white max-w-md">
            <label className="block text-sm font-body font-semibold text-s-ink mb-2">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="w-full h-12 px-4 rounded-input bg-s-bg-sunken border border-transparent text-base text-s-ink placeholder:text-s-ink/40 focus:outline-none focus:border-s-coral focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 transition-[border-color,box-shadow] duration-150"
            />
            <p className="text-xs text-s-ink/50 mt-2">48px height, 16px font, focus ring at full opacity.</p>
          </div>
        </Section>

        <Section title="Radii">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { token: "rounded-input", px: "12px", use: "Inputs, dashboard cards" },
              { token: "rounded-card", px: "16px", use: "Feature cards" },
              { token: "rounded-card-lg", px: "20px", use: "Hero, modal" },
              { token: "rounded-btn", px: "99px", use: "CTA buttons" },
              { token: "rounded-pill", px: "9999px", use: "Tags, badges" },
            ].map((r) => (
              <div key={r.token} className={`${r.token} p-4 bg-white border border-s-ink/[0.08] text-center`}>
                <p className="font-body text-xs font-semibold text-s-ink">{r.token}</p>
                <p className="font-body text-xs text-s-ink/60">{r.px}</p>
                <p className="font-body text-[10px] text-s-ink/50 mt-1">{r.use}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Cards — Rest vs Hover" note="Flat at rest with 1px border. Lift on hover (marketing zone).">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-5 aspect-square flex items-end">
              <div>
                <p className="text-sm font-heading font-semibold text-s-ink">.card (hover me)</p>
                <p className="text-xs text-s-ink/60">Flat rest → -4px lift + shadow at 200ms</p>
              </div>
            </div>
            <div className="border border-s-ink/[0.08] rounded-card bg-white p-5 aspect-square flex items-end">
              <div>
                <p className="text-sm font-heading font-semibold text-s-ink">App-zone card</p>
                <p className="text-xs text-s-ink/60">No lift, no shadow. Static.</p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Skeleton (loading)">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SalonCardSkeleton />
            <Skeleton variant="card" />
          </div>
        </Section>

        <Section title="Empty State">
          <div className="border border-s-ink/[0.08] rounded-card bg-white">
            <EmptyState
              icon={Search}
              title="No salons match your filters"
              message="Try a wider search area or clear a filter to see more results."
              zone={3}
            />
          </div>
        </Section>

        <Section title="Glass Surfaces" note="Floating chrome only. Never on listing cards.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass p-6 rounded-card-lg">
              <p className="text-sm font-heading font-semibold text-s-ink mb-1">.glass</p>
              <p className="text-xs text-s-ink/60">Header pill, dropdowns, modals, bottom tab bar.</p>
            </div>
            <div className="glass-subtle p-6 rounded-card-lg">
              <p className="text-sm font-heading font-semibold text-s-ink mb-1">.glass-subtle</p>
              <p className="text-xs text-s-ink/60">Interactive filter pills in marketing zone.</p>
            </div>
          </div>
        </Section>

        <Section title="Motion Notes">
          <div className="p-6 rounded-card border border-s-ink/[0.08] bg-white space-y-2 font-body text-sm">
            <p><strong className="text-s-ink">Duration:</strong> 100ms press · 150ms hover · 200ms modal · 300ms max on UI</p>
            <p><strong className="text-s-ink">Easing:</strong> <code className="text-xs bg-s-bg-sunken px-1.5 py-0.5 rounded">--ease-out: cubic-bezier(0.16, 1, 0.3, 1)</code></p>
            <p><strong className="text-s-ink">Card lift:</strong> -4px default (allow -2 small / -6 hero)</p>
            <p><strong className="text-s-ink">Stagger:</strong> 60ms between grid children (marketing zone only)</p>
            <p><strong className="text-s-ink">Springs:</strong> heart bounce, avatar pop, category icon only. Never on modals or layout.</p>
          </div>
        </Section>

        <footer className="mt-16 pt-8 border-t border-s-ink/[0.08] text-center">
          <p className="text-xs text-s-ink/50 font-body">
            This page is a dev reference. See <code className="bg-s-bg-sunken px-1.5 py-0.5 rounded">DESIGN_SYSTEM.md</code> for the full spec.
          </p>
        </footer>
      </div>
    </div>
  );
}
