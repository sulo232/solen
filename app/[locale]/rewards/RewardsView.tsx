"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { useTranslations } from "next-intl";
import { Award, Crown, Check, CalendarClock, Timer, Gift, Tag, BadgePercent, Clock, Search, Lock } from "lucide-react";
import { LOYALTY, type LoyaltyStatus, type Tier } from "@/lib/loyalty/status";

const RANK: Record<Tier, number> = { base: 0, gold: 1, platinum: 2 };

// Single thick ladder bar fill: position within the Base->Gold->Platinum track.
function ladderPct(s: LoyaltyStatus): number {
  const g = LOYALTY.thresholds.gold;
  const p = LOYALTY.thresholds.platinum;
  if (s.tier === "platinum") return 100;
  if (s.tier === "gold") return 50 + Math.min(1, (s.visits - g) / Math.max(1, p - g)) * 50;
  return Math.min(1, s.visits / Math.max(1, g)) * 50; // base
}

// Perks plug into the REAL value levers: Angebote (offers) + promos + booking.
// (No walk-in — that's a niche barbershop-queue feature, not the loyalty lever.)
const PERKS = [
  { key: "angebote", Icon: Tag, chip: "accent", min: "gold" as Tier },
  { key: "memberDeals", Icon: BadgePercent, chip: "success", min: "gold" as Tier },
  { key: "birthday", Icon: Gift, chip: "pink", min: "gold" as Tier },
  { key: "slots", Icon: CalendarClock, chip: "mut", min: "platinum" as Tier },
  { key: "angebote48", Icon: Timer, chip: "mut", min: "platinum" as Tier },
] as const;

function chipClass(kind: string): string {
  const base = "grid h-9 w-9 shrink-0 place-items-center rounded-[11px]";
  if (kind === "accent") return `${base} bg-s-ink/[0.07] text-s-ink`;
  if (kind === "success") return `${base} bg-s-success/10 text-s-success`;
  if (kind === "pink") return `${base} bg-[#FF3366]/10 text-[#FF3366]`;
  return `${base} bg-s-bg-sunken text-s-ink-2`;
}

function LadderNode({
  label,
  state,
  icon,
  reduce,
}: {
  label: string;
  state: "done" | "now" | "todo";
  icon: "check" | "award" | "crown";
  reduce: boolean | null;
}) {
  const Icon = icon === "check" ? Check : icon === "award" ? Award : Crown;
  const dot =
    state === "done"
      ? "bg-s-ink/80 text-white"
      : state === "now"
        ? "bg-s-ink text-white"
        : "bg-s-bg-sunken text-s-ink-2";
  const labelCls =
    state === "now"
      ? "text-s-ink font-bold"
      : state === "done"
        ? "text-s-ink-2"
        : "text-s-ink-2";
  return (
    <div className="flex flex-col items-center gap-1.5">
      {state === "now" && !reduce ? (
        <motion.span
          className="grid h-6 w-6 place-items-center rounded-full bg-s-ink text-white"
          animate={{
            boxShadow: [
              "0 0 0 4px rgba(10,10,10,0.16)",
              "0 0 0 8px rgba(10,10,10,0.05)",
              "0 0 0 4px rgba(10,10,10,0.16)",
            ],
          }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon size={13} strokeWidth={2.5} aria-hidden />
        </motion.span>
      ) : (
        <span
          className={`grid h-6 w-6 place-items-center rounded-full ${dot} ${state === "now" ? "ring-4 ring-s-ink/10" : ""}`}
        >
          <Icon size={13} strokeWidth={2.5} aria-hidden />
        </span>
      )}
      <span className={`text-[10.5px] font-semibold ${labelCls}`}>{label}</span>
    </div>
  );
}

export default function RewardsView({ status, locale }: { status: LoyaltyStatus; locale: string }) {
  const t = useTranslations("rewards");
  const reduce = useReducedMotion();
  const pct = ladderPct(status);

  const EASE: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.04 } } };
  const item: Variants = reduce
    ? {}
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
      };

  const tierLabel = (tier: Tier) => t(`tier_${tier}`);

  return (
    <motion.main
      variants={container}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-2xl px-4 pt-2 pb-10 sm:px-6"
    >
      {/* Hero status card */}
      <motion.section
        variants={item}
        className="relative overflow-hidden rounded-card border border-s-border bg-white p-[18px] shadow-elevation-1"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-9 -right-3 font-display text-[150px] font-bold leading-none text-s-ink/[0.04]"
        >
          +
        </span>
        <div className="font-display text-[16px] font-bold tracking-[-0.02em] text-s-ink">
          solen<span className="align-top text-[11px] font-bold text-s-ink">+</span>
        </div>
        <p className="relative mt-3.5 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-s-ink-2">
          {t("yourStatus")}
        </p>
        <div className="relative mt-1 flex items-center gap-2">
          <span className="font-display text-[34px] font-bold leading-none tracking-[-0.02em] text-s-ink">
            {tierLabel(status.tier)}
          </span>
          {status.tier === "platinum" ? (
            <Crown size={24} strokeWidth={2.4} className="text-s-ink" aria-hidden />
          ) : status.tier === "gold" ? (
            <Award size={24} strokeWidth={2.4} className="text-s-star" aria-hidden />
          ) : null}
        </div>

        {/* Tier ladder (single thick bar) */}
        <div className="relative mt-5">
          <div className="absolute left-[26px] right-[26px] top-[7px] h-2.5 overflow-hidden rounded-full bg-s-bg-sunken">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-s-ink to-s-ink/60"
              initial={{ width: reduce ? `${pct}%` : 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.05, ease: EASE, delay: 0.45 }}
            />
          </div>
          <div className="relative z-[1] flex items-start justify-between">
            <LadderNode label={tierLabel("base")} state={RANK[status.tier] > 0 ? "done" : "now"} icon="check" reduce={reduce} />
            <LadderNode
              label={tierLabel("gold")}
              state={RANK[status.tier] > 1 ? "done" : RANK[status.tier] === 1 ? "now" : "todo"}
              icon="award"
              reduce={reduce}
            />
            <LadderNode label={tierLabel("platinum")} state={RANK[status.tier] === 2 ? "now" : "todo"} icon="crown" reduce={reduce} />
          </div>
        </div>

        {/* Next + window */}
        <div className="relative mt-[18px] flex items-baseline justify-between">
          <span className="text-[13.5px] font-semibold text-s-ink">
            {status.toNext !== null && status.nextTier
              ? t("toNext", { n: status.toNext, tier: tierLabel(status.nextTier) })
              : t("topTier")}
          </span>
          <span className="text-[12.5px] tabular-nums text-s-ink-2">
            {status.nextThreshold !== null
              ? t("ofVisits", { n: status.visits, total: status.nextThreshold })
              : t("visitsCount", { n: status.visits })}
          </span>
        </div>
        <p className="relative mt-2.5 flex items-center gap-1.5 text-[11.5px] text-s-ink-2">
          <Clock size={13} aria-hidden />{" "}
          {status.validThrough
            ? t("validThrough", {
                date: new Date(status.validThrough).toLocaleDateString(locale, { day: "numeric", month: "short" }),
              })
            : t("windowNote")}
        </p>
      </motion.section>

      {/* Perks */}
      <motion.h2 variants={item} className="mb-3 mt-[18px] font-display text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
        {t("perksTitle")}
      </motion.h2>
      <div className="flex flex-col gap-2.5">
        {PERKS.map((p) => {
          const active = RANK[status.tier] >= RANK[p.min];
          return (
            <motion.div
              key={p.key}
              variants={item}
              className={
                active
                  ? "flex items-center gap-3 rounded-[14px] bg-s-bg-sunken p-3"
                  : "flex items-center gap-3 rounded-[14px] border border-dashed border-s-border bg-white p-3"
              }
            >
              <span className={chipClass(active ? p.chip : "mut")}>
                <p.Icon size={18} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-[13.5px] font-semibold ${active ? "text-s-ink" : "text-s-ink-2"}`}>
                  {t(`perk_${p.key}_t`)}
                </div>
                <div className="mt-0.5 text-[11.5px] text-s-ink-2">{t(`perk_${p.key}_s`)}</div>
              </div>
              {active ? (
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-s-success">
                  <Check size={13} aria-hidden /> {t("active")}
                </span>
              ) : (
                <span className="flex shrink-0 items-center gap-1 text-[11px] font-semibold text-s-ink-2">
                  <Lock size={12} aria-hidden /> {tierLabel(p.min)}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* How it works */}
      <motion.div variants={item} className="mt-[18px] rounded-card bg-s-bg-sunken p-4">
        <div className="mb-1.5 font-display text-[15px] font-semibold tracking-[-0.01em] text-s-ink">{t("howTitle")}</div>
        <p className="text-[12.5px] leading-relaxed text-s-ink-2">
          {t("howBody", { gold: LOYALTY.thresholds.gold, platinum: LOYALTY.thresholds.platinum })}
        </p>
      </motion.div>

      {/* CTA */}
      <motion.div variants={item} className="mt-4">
        <Link
          href={`/${locale}/search`}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink text-[15.5px] font-bold text-white transition-transform active:scale-[0.985]"
        >
          <Search size={16} strokeWidth={1.9} aria-hidden /> {t("cta")}
        </Link>
      </motion.div>
    </motion.main>
  );
}
