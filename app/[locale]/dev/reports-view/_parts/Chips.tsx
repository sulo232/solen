"use client";

// exists-check: no existing "status chip" primitive matches the brief's literal grammar
// (bg-s-bg-sunken + ink + semibold, never blue/black). The closest existing thing,
// DashStatusPill (_components/dashboard/DashboardUI.tsx), is the OPERATOR-dashboard "vibrant
// skin" (pale bg + saturated dot, V3-D347) which the brief explicitly overrides for this
// surface. TabPill (primitives/TabPill.tsx) IS reused below for the actual filter row, its
// `active` treatment already matches the required grammar exactly. StatusChip/ReasonTag here
// are read-only <span> labels (a fact, not a toggle), not a second TabPill fork.

import * as React from "react";
import { Star, Store, User as UserIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatAge,
  isStale,
  REASON_LABEL,
  STATUS_LABEL,
  TARGET_LABEL,
  type ReportReason,
  type ReportStatus,
  type TargetType,
} from "./data";

export const TARGET_ICON: Record<TargetType, LucideIcon> = {
  review: Star,
  salon: Store,
  user: UserIcon,
};

/**
 * Read-only status label. Always the LOCKED "selected" grammar (sunken + ink + semibold):
 * a per-row status is a stated fact, not a toggle, so it never needs an "inactive" look.
 * Never blue, never a black fill, per the brief.
 */
export function StatusChip({ status, className }: { status: ReportStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full bg-s-bg-sunken px-2.5 py-1 text-[12px] font-semibold text-s-ink",
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function TargetTypeTag({ type, className }: { type: TargetType; className?: string }) {
  const Icon = TARGET_ICON[type];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 text-[12px] text-s-ink-2", className)}>
      <Icon size={12} strokeWidth={2} aria-hidden />
      {TARGET_LABEL[type]}
    </span>
  );
}

/** Icon-in-circle badge for the target type, used at the start of a row / case header. */
export function TargetIconBadge({
  type,
  size = 32,
  className,
}: {
  type: TargetType;
  size?: number;
  className?: string;
}) {
  const Icon = TARGET_ICON[type];
  return (
    <span
      className={cn("grid shrink-0 place-items-center rounded-full bg-s-bg-sunken text-s-ink-2", className)}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.47)} strokeWidth={2} aria-hidden />
    </span>
  );
}

/**
 * Relative age. Stale (still open, 3+ days) gets the s-warning text token, the ONE semantic
 * moment this queue needs, per the brief ("a report sitting open for 3 days is the signal
 * that matters"). Everything else stays plain ink-2, restraint over decoration.
 */
export function AgeLabel({
  minutes,
  status,
  className,
}: {
  minutes: number;
  status: ReportStatus;
  className?: string;
}) {
  const stale = isStale(minutes, status);
  return (
    <span
      className={cn("shrink-0 text-[12px]", stale ? "font-semibold text-s-warning-text" : "text-s-ink-2", className)}
      title={stale ? "Open 3+ days" : undefined}
    >
      {formatAge(minutes)}
    </span>
  );
}

export function reasonLabel(reason: ReportReason): string {
  return REASON_LABEL[reason];
}
