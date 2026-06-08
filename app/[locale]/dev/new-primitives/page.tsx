"use client";

/**
 * V3-D195 (2026-05-26): Demo page for the 3 new primitives shipped by Wave 1 Agent D.
 * Internal-only — for visual review before /salon/[slug] rebuild commits to using them.
 *
 * Lives at `/de/dev/new-primitives`. Not linked from site nav. Safe to delete after review.
 */

import * as React from "react";
import { Star } from "lucide-react";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { Skeleton } from "@/app/[locale]/_components/primitives/Skeleton";
import { ComingSoon } from "@/app/[locale]/_components/primitives/ComingSoon";
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";
import { StatusPill } from "@/app/[locale]/_components/salon/StatusPill";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";

export default function NewPrimitivesDemo() {
  const [activeTab, setActiveTab] = React.useState("all");
  const tabs = ["All", "Coiffeur", "Barber", "Nails", "Spa"];
  return (
    <div className="mx-auto max-w-[640px] p-6 space-y-12">
      <header className="border-b border-s-border pb-6">
        {/* V3-D331: dropped pseudo-element accent dot + accent color per LOCKFILE §2.5. */}
        <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-s-ink-3">
          Wave 1 · Agent D
        </p>
        <h1 className="mt-2 font-display text-[clamp(22px,2.8vw,26px)] font-semibold leading-[1.0] tracking-[-0.03em] text-s-ink">
          New primitives
        </h1>
        <p className="mt-3 font-body text-[14px] font-normal leading-[1.4] text-s-ink-2">
          Toast / Skeleton / ComingSoon. V3-D195. Tap each demo to see the
          primitive in action.
        </p>
      </header>

      {/* ─── Toast ─── */}
      <section>
        <h2 className="font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.03em] text-s-ink">
          Toast
        </h2>
        <p className="mt-1 font-body text-[13px] font-normal leading-[1.4] text-s-ink-2">
          Top-of-viewport notification. Slides down on appear (200ms snap),
          auto-dismisses after 4s. 4 tones. Tap a button to fire one.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toast.success("Salon gespeichert", { duration: Infinity })}
            className="rounded-full bg-s-ink px-4 py-2 font-body text-[13px] font-medium text-white transition-colors hover:bg-black"
          >
            success
          </button>
          <button
            type="button"
            onClick={() =>
              toast.error("Fehler beim Speichern", {
                description: "Versuche es nochmal.",
                duration: Infinity,
              })
            }
            className="rounded-full bg-s-ink px-4 py-2 font-body text-[13px] font-medium text-white transition-colors hover:bg-black"
          >
            error
          </button>
          <button
            type="button"
            onClick={() =>
              toast.info("Neue Funktion verfügbar", {
                duration: Infinity,
                action: { label: "Ansehen", onClick: () => toast.success("Cool!") },
              })
            }
            className="rounded-full bg-s-ink px-4 py-2 font-body text-[13px] font-medium text-white transition-colors hover:bg-black"
          >
            info + action
          </button>
          <button
            type="button"
            onClick={() => toast.warning("Bald nicht mehr verfügbar", { duration: Infinity })}
            className="rounded-full bg-s-ink px-4 py-2 font-body text-[13px] font-medium text-white transition-colors hover:bg-black"
          >
            warning
          </button>
        </div>
      </section>

      {/* ─── Skeleton ─── */}
      <section>
        <h2 className="font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.03em] text-s-ink">
          Skeleton
        </h2>
        <p className="mt-1 font-body text-[13px] font-normal leading-[1.4] text-s-ink-2">
          Shimmer placeholder for loading states. Background-position 0% → 100%
          over 1.5s ease-glide. Respects prefers-reduced-motion.
        </p>

        <div className="mt-4 space-y-6">
          {/* SalonCard skeleton */}
          <div>
            <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-s-ink-3">
              SalonCard skeleton
            </p>
            <div className="flex gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="flex-1">
                  <Skeleton aspect="square" rounded={22} />
                  <Skeleton width="80%" height={16} rounded={4} className="mt-2" />
                  <Skeleton width="60%" height={12} rounded={4} className="mt-1" />
                  <Skeleton width="50%" height={12} rounded={4} className="mt-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Avatar + text rows */}
          <div>
            <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-s-ink-3">
              List item skeleton
            </p>
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton width={72} height={72} rounded="full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton width="70%" height={16} rounded={4} />
                    <Skeleton width="40%" height={12} rounded={4} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── ComingSoon ─── */}
      <section>
        <h2 className="font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.03em] text-s-ink">
          ComingSoon
        </h2>
        <p className="mt-1 font-body text-[13px] font-normal leading-[1.4] text-s-ink-2">
          Wrap any clickable surface to mark it as "coming soon": opacity-50,
          cursor-not-allowed, click shows a toast, aria-label suffixed. The
          surface stays keyboard-focusable but inert.
        </p>

        <div className="mt-4 space-y-4">
          <ComingSoon label="Karten-Ansicht">
            <button
              type="button"
              className="rounded-full bg-s-ink px-5 py-2.5 font-body text-[14px] font-semibold text-white"
            >
              Karten-Ansicht öffnen
            </button>
          </ComingSoon>

          <ComingSoon
            label="Live-Chat"
            toastTitle="Live-Chat ist in Arbeit"
            toastDescription="Wir melden uns, sobald es so weit ist."
          >
            <button
              type="button"
              className="rounded-full border border-s-border bg-white px-5 py-2.5 font-body text-[14px] font-semibold text-s-ink"
            >
              Live-Chat starten
            </button>
          </ComingSoon>
        </div>
      </section>

      {/* ─── StatusPill (NEW — salon Phase A · V3-D201) ─── */}
      <section>
        <h2 className="font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.03em] text-s-ink">
          StatusPill
        </h2>
        <p className="mt-1 font-body text-[13px] font-normal leading-[1.4] text-s-ink-2 mb-4">
          Layer 3 semantic UI. Open → universal green. Closed → muted grey. Single source for salon-detail open/closed state.
        </p>
        <div className="space-y-3">
          <div>
            <p className="mb-1.5 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-s-ink-3">
              size=sm, showDot=true (inline meta row)
            </p>
            <div className="flex flex-wrap gap-4">
              <StatusPill isOpen={true} label="Geöffnet bis 19:30" />
              <StatusPill isOpen={false} label="Geschlossen · Öffnet 10:00" />
            </div>
          </div>
          <div>
            <p className="mb-1.5 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-s-ink-3">
              size=sm, showDot=false (with bullet separators)
            </p>
            <div className="font-body text-[13px] text-s-ink-2 inline-flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-s-ink">
                <Star size={12} fill="#FFC32B" stroke="none" aria-hidden />
                4.8 (1.2k)
              </span>
              <MetaDot />
              <StatusPill isOpen={true} label="Geöffnet bis 19:30" showDot={false} />
              <MetaDot />
              <span>Basel</span>
            </div>
          </div>
          <div>
            <p className="mb-1.5 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-s-ink-3">
              size=md (sidebar block)
            </p>
            <div className="flex flex-wrap gap-4">
              <StatusPill isOpen={true} label="Geöffnet bis 19:30" size="md" />
              <StatusPill isOpen={false} label="Heute geschlossen" size="md" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── TabPill (NEW — salon Phase A · V3-D201) ─── */}
      <section>
        <h2 className="font-display text-[20px] font-semibold leading-[1.2] tracking-[-0.03em] text-s-ink">
          TabPill
        </h2>
        <p className="mt-1 font-body text-[13px] font-normal leading-[1.4] text-s-ink-2 mb-4">
          Layer 1 chrome — segmented filter affordance. Active = ink fill. Inactive = white + hairline border. Tap to switch.
        </p>
        <div className="space-y-5">
          <div>
            <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-s-ink-3">
              variant=outline, size=sm (default — filter rows)
            </p>
            <div className="flex flex-wrap gap-2">
              {tabs.map((t) => (
                <TabPill key={t} active={activeTab === t.toLowerCase()} onClick={() => setActiveTab(t.toLowerCase())}>
                  {t}
                </TabPill>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-s-ink-3">
              variant=outline, size=md (sticky segment)
            </p>
            <div className="flex flex-wrap gap-2">
              {tabs.slice(0, 3).map((t) => (
                <TabPill key={t} size="md" active={activeTab === t.toLowerCase()} onClick={() => setActiveTab(t.toLowerCase())}>
                  {t}
                </TabPill>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 font-body text-[11px] font-medium uppercase tracking-[0.1em] text-s-ink-3">
              variant=ghost (inside styled chrome)
            </p>
            <div className="flex flex-wrap gap-1 rounded-full bg-s-bg-sunken p-1">
              {tabs.slice(0, 4).map((t) => (
                <TabPill key={t} variant="ghost" active={activeTab === t.toLowerCase()} onClick={() => setActiveTab(t.toLowerCase())}>
                  {t}
                </TabPill>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-s-border pt-6">
        <p className="font-body text-[12px] font-normal leading-[1.5] text-s-ink-3">
          To delete this page: <code className="rounded bg-s-bg-sunken px-1.5 py-0.5 text-[11px]">app/[locale]/dev/new-primitives/page.tsx</code>.
          The primitives themselves live in <code className="rounded bg-s-bg-sunken px-1.5 py-0.5 text-[11px]">app/[locale]/_components/primitives/</code>.
        </p>
      </footer>
    </div>
  );
}
