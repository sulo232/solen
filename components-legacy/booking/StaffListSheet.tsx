"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, Star, Users } from "lucide-react";
import { SelectedCheckBadge } from "@/components-legacy/ui/SelectedCheckBadge";
import { motion } from "framer-motion";
import StaffProfilePage from "@/components-legacy/staff/StaffProfilePage";
import type { StaffMember } from "@/lib/types";

/**
 * StaffListSheet — Fresha "Select professional" list. Avatar + rating pill +
 * name + languages + role, with "Auswählen" (pick) and "Profil ansehen" (opens
 * the staff profile as a nested sheet). Opened from the booking flow's
 * "Alle Stylisten" affordance. Solen black/Geist.
 */
export default function StaffListSheet({
  staffList,
  selectedStaff,
  onSelect,
  onClose,
  salonSlug,
}: {
  staffList: StaffMember[];
  selectedStaff: string;
  onSelect: (staffId: string) => void;
  onClose: () => void;
  salonSlug: string;
}) {
  const [mounted, setMounted] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const pick = (id: string) => {
    onSelect(id);
    onClose();
  };
  const langs = (s: StaffMember) =>
    ((s as any).languages as string[] | null | undefined)?.map((l) => l.toUpperCase()).join("/") ?? "";

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[60] flex flex-col bg-white"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      transition={{ type: "spring", damping: 34, stiffness: 320 }}
    >
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-s-border bg-white px-4 py-3">
        <span className="font-heading text-[16px] font-bold text-s-ink">Stylist:in wählen</span>
        <button type="button" onClick={onClose} aria-label="Schließen" className="grid h-9 w-9 place-items-center rounded-full bg-s-bg-sunken hover:bg-s-bg-sunken">
          <X size={20} className="text-s-ink" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Keine Präferenz */}
        <button
          type="button"
          onClick={() => pick("any")}
          className="mb-3 flex w-full items-center gap-3.5 rounded-2xl border border-s-border p-3 text-left transition-colors"
        >
          <span className="relative shrink-0">
            <span className="grid h-[60px] w-[60px] place-items-center rounded-full bg-s-bg-sunken">
              <Users size={20} className="text-s-ink-2" strokeWidth={2} />
            </span>
            <SelectedCheckBadge selected={selectedStaff === "any"} size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] font-semibold text-s-ink">Keine Präferenz</span>
            <span className="block text-[13px] text-s-ink-2">Maximale Verfügbarkeit</span>
          </span>
        </button>

        {/* Staff rows */}
        <div className="space-y-3">
          {staffList.map((s) => {
            const rating = s.average_rating != null && s.average_rating > 0 ? s.average_rating : null;
            const role = s.specialties?.[0] ?? null;
            const l = langs(s);
            const meta = [l, role].filter(Boolean).join("  ");
            return (
              <div
                key={s.id}
                className="flex items-center gap-3.5 rounded-2xl border border-s-border p-3"
              >
                <div className="relative shrink-0">
                  <div className="grid h-[60px] w-[60px] place-items-center overflow-hidden rounded-full bg-s-bg-sunken">
                    {s.avatar_url ? (
                      <Image src={s.avatar_url} alt={s.name} width={60} height={60} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-[22px] font-semibold text-s-ink-2">{s.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {rating != null && (
                    <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 rounded-full bg-white px-1.5 py-[2px] shadow-[0_2px_8px_rgba(0,0,0,0.14)] ring-1 ring-s-ink/[0.05]">
                      <Star size={10} stroke="none" className="fill-s-star" />
                      <span className="text-[11px] font-semibold leading-none tabular-nums text-s-ink">{rating.toFixed(1)}</span>
                    </span>
                  )}
                  <SelectedCheckBadge selected={selectedStaff === s.id} size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[16px] font-semibold text-s-ink">{s.name}</div>
                  {meta && <div className="truncate text-[13px] text-s-ink-2">{meta}</div>}
                  <button
                    type="button"
                    onClick={() => setProfileId(s.id)}
                    className="mt-0.5 text-[13px] font-medium text-s-accent transition-opacity hover:opacity-80"
                  >
                    Profil ansehen
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => pick(s.id)}
                  className="shrink-0 rounded-full border border-s-border px-5 py-2.5 font-heading text-[14px] font-semibold text-s-ink transition-colors hover:border-s-ink/30"
                >
                  Auswählen
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Nested profile sheet */}
      {profileId && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-white">
          <StaffProfilePage staffId={profileId} salonSlug={salonSlug} onClose={() => setProfileId(null)} onSelect={pick} />
        </div>
      )}
    </motion.div>,
    document.body
  );
}
