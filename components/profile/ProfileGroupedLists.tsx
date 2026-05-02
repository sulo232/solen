"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { ChevronRight, type LucideIcon } from "lucide-react";

/**
 * ProfileGroupedLists — Q58 (locked 2026-05-02) Sei-Hiro grouped menu lists.
 *
 * Below the LiveActivityCard on the profile page, three rounded "cards" each
 * containing grouped rows. Replaces the retired 5-tab ProfileTabs layout.
 *
 * Group anatomy:
 *   - Card 1 "Activity" — Termine N · Favoriten N · Looks N (count chip on right)
 *   - Card 2 "Account"  — Beauty Profile · Zahlungsmethoden · Einstellungen (chevron right)
 *   - Card 3 "Misc"     — Freunde einladen with `CHF 10` chip · Hilfe & Support
 *
 * Sign-out is a quiet text-button rendered after the last group by the parent.
 *
 * i18n: caller passes localized labels.
 */

export interface GroupRow {
  /** Unique key */
  key: string;
  /** Localized label */
  label: string;
  /** Route to navigate to */
  href: string;
  /** Optional Lucide icon (renders left of label) */
  icon?: LucideIcon;
  /** Optional right-side count chip (e.g. "12", "2") — render numeric or short string */
  count?: string | number;
  /** Optional right-side reward chip (e.g. "CHF 10") — coral styling */
  rewardChip?: string;
}

export interface ProfileGroup {
  /** Localized eyebrow above the card (uppercase tracked) */
  eyebrow: string;
  rows: GroupRow[];
}

interface ProfileGroupedListsProps {
  groups: ProfileGroup[];
  className?: string;
}

export default function ProfileGroupedLists({ groups, className }: ProfileGroupedListsProps) {
  const locale = useLocale();

  return (
    <div className={["flex flex-col gap-5", className ?? ""].join(" ")}>
      {groups.map((group, gi) => (
        <section key={gi}>
          <h3 className="font-body text-[10px] font-bold uppercase tracking-[.22em] text-s-ink/40 mb-2 px-1">
            {group.eyebrow}
          </h3>
          <div className="rounded-[14px] bg-white border border-s-ink/[0.06] overflow-hidden">
            {group.rows.map((row, ri) => (
              <Link
                key={row.key}
                href={row.href.startsWith("/") ? `/${locale}${row.href}` : row.href}
                className={[
                  "flex items-center justify-between gap-3 px-4 py-3.5 min-h-[48px]",
                  ri < group.rows.length - 1 ? "border-b border-s-ink/[0.06]" : "",
                  "transition-colors duration-150 hover:bg-s-bg-sunken/60",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-s-coral focus-visible:ring-offset-2 focus-visible:rounded-[8px]",
                ].join(" ")}
              >
                <span className="flex items-center gap-3 min-w-0">
                  {row.icon && (
                    <row.icon size={18} className="text-s-ink/55 shrink-0" aria-hidden />
                  )}
                  <span className="font-body text-[14px] text-s-ink truncate">{row.label}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  {row.rewardChip && (
                    <span
                      className="font-body text-[10px] font-bold tabular-nums px-2 py-[2px] rounded-full"
                      style={{ background: "rgba(232,98,74,0.10)", color: "#C95A3A" }}
                    >
                      {row.rewardChip}
                    </span>
                  )}
                  {row.count !== undefined && (
                    <span className="font-body text-[12px] font-semibold tabular-nums text-s-ink/55">
                      {row.count}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-s-ink/35 shrink-0" aria-hidden />
                </span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
