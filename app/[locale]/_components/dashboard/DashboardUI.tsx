"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus, ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Solen dashboard primitives (V3-D346) — B&W, LOCKFILE-compliant.
// Layer 1 chrome (Panel / StatCard / Row / QuickAction) + Layer 3
// semantic (StatusPill). Reused across all dashboard route archetypes.
// ─────────────────────────────────────────────────────────────

// `urgent` = escalation/attention (V3-D421 refund system): the reserved s-pop
// vermilion urgency-badge color on the pale s-urgency bg. Use with `pulse` for
// "live, awaiting decision" states (shares the walk-in live-indicator language).
type Tone = "success" | "warning" | "error" | "neutral" | "urgent";

const TONE_BG: Record<Tone, string> = {
  success: "bg-s-success-bg",
  warning: "bg-s-warning-bg",
  error: "bg-s-error-bg",
  neutral: "bg-s-bg-sunken",
  urgent: "bg-s-urgency-bg",
};

const TONE_DOT: Record<Tone, string> = {
  success: "bg-s-success",
  warning: "bg-s-warning",
  error: "bg-s-error",
  neutral: "bg-s-ink-2",
  urgent: "bg-s-pop",
};

// V3-D347: operator-dashboard vibrant skin — pills use SATURATED semantic TEXT
// (not ink), per LOCKFILE §2.5 Tag/Status. Warning uses the readable `.text` amber.
const TONE_TEXT: Record<Tone, string> = {
  success: "text-s-success",
  warning: "text-s-warning-text",
  error: "text-s-error",
  neutral: "text-s-ink-2",
  urgent: "text-s-pop",
};

/**
 * Semantic status pill (vibrant skin): pale bg + saturated semantic text + dot.
 * `pulse` adds the walk-in live-indicator halo (ping 2.6s) behind the dot — for
 * "live / awaiting decision" states. Respects prefers-reduced-motion.
 */
export function DashStatusPill({
  tone,
  children,
  pulse,
}: {
  tone: Tone;
  children: ReactNode;
  pulse?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        TONE_BG[tone],
        TONE_TEXT[tone],
      )}
    >
      <span className="relative flex w-[7px] h-[7px]" aria-hidden>
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex w-full h-full rounded-full opacity-60 motion-reduce:hidden",
              TONE_DOT[tone],
            )}
            style={{ animation: "ping 2.6s cubic-bezier(0,0,.2,1) infinite" }}
          />
        )}
        <span className={cn("relative inline-flex w-[7px] h-[7px] rounded-full", TONE_DOT[tone])} />
      </span>
      {children}
    </span>
  );
}

/** White content card with optional header (title + action link) and body. */
export function DashPanel({
  title,
  actionLabel,
  actionHref,
  children,
  className,
}: {
  title?: string;
  actionLabel?: string;
  actionHref?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-card-lg border border-s-border bg-white overflow-hidden", className)}>
      {title && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-s-border">
          <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-s-ink">{title}</h2>
          {actionLabel && actionHref && (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-1 text-[13px] font-medium text-s-ink hover:text-s-ink-2 transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide"
            >
              {actionLabel}
              <ArrowRight size={15} strokeWidth={1.9} />
            </Link>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

type Delta = { label: string; direction: "up" | "down" | "flat" };

/** KPI card: label + big value (optional prefix/suffix) + semantic delta. */
export function DashStatCard({
  label,
  value,
  prefix,
  suffix,
  delta,
}: {
  label: string;
  value: ReactNode;
  prefix?: string;
  suffix?: ReactNode;
  delta?: Delta;
}) {
  return (
    <div className="rounded-card-lg border border-s-border bg-white px-[18px] py-4">
      <p className="text-[12px] font-semibold uppercase tracking-[0.07em] text-s-ink-2 mb-2.5">{label}</p>
      <p className="text-[28px] font-semibold tracking-[-0.02em] leading-none text-s-ink">
        {prefix && <span className="text-[15px] font-semibold text-s-ink-2 align-middle mr-1">{prefix}</span>}
        {value}
        {suffix}
      </p>
      {delta && (
        <p
          className={cn(
            "inline-flex items-center gap-1 text-[12px] font-semibold mt-2.5",
            delta.direction === "up" && "text-s-success",
            delta.direction === "down" && "text-s-error",
            delta.direction === "flat" && "text-s-ink-2",
          )}
        >
          {delta.direction === "up" && <ArrowUpRight size={13} strokeWidth={2.4} />}
          {delta.direction === "down" && <ArrowDownRight size={13} strokeWidth={2.4} />}
          {delta.direction === "flat" && <Minus size={13} strokeWidth={2.4} />}
          {delta.label}
        </p>
      )}
    </div>
  );
}

/** Generic list row: hairline divider, hover fill. Compose children freely. */
export function DashRow({
  children,
  href,
  className,
}: {
  children: ReactNode;
  href?: string;
  className?: string;
}) {
  const cls = cn(
    "flex items-center gap-4 px-5 py-3.5 border-b border-s-border last:border-b-0 transition-[colors,transform]",
    href && "hover:bg-s-bg-sunken cursor-pointer active:scale-[0.98] active:duration-[80ms] active:ease-glide",
    className,
  );
  return href ? <Link href={href} className={cls}>{children}</Link> : <div className={cls}>{children}</div>;
}

/** Quick-action tile: icon chip + title + subtitle, hover fill. */
export function DashQuickAction({
  icon: Icon,
  title,
  subtitle,
  href,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-card-lg border border-s-border bg-white p-5 transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.97] active:duration-[80ms] active:ease-glide"
    >
      <span className="grid place-items-center w-[42px] h-[42px] rounded-xl bg-s-bg-sunken text-s-ink shrink-0 transition-colors group-hover:bg-white">
        <Icon size={20} strokeWidth={2.2} />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold tracking-[-0.005em] text-s-ink">{title}</span>
        {subtitle && <span className="block text-[12.5px] text-s-ink-2 mt-0.5 truncate">{subtitle}</span>}
      </span>
    </Link>
  );
}

/** Action button (vibrant skin): primary = accent-blue, secondary = outline, ghost = text. */
export function DashButton({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  onClick,
  href,
  type = "button",
  disabled,
  className,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  icon?: LucideIcon;
  onClick?: () => void;
  href?: string;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const base = cn(
    "inline-flex items-center justify-center gap-2 rounded-btn font-medium tracking-[-0.005em] transition-[colors,transform] disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] active:duration-[80ms] active:ease-glide",
    size === "sm" ? "text-[13px] px-3.5 py-2" : "text-[15px] px-[18px] py-2.5",
    variant === "primary" && "bg-s-accent-bright text-white hover:bg-s-accent",
    variant === "secondary" && "bg-white text-s-ink border border-s-border hover:bg-s-bg-sunken",
    variant === "ghost" && "text-s-ink-2 hover:text-s-ink hover:bg-s-bg-sunken",
    className,
  );
  const inner = (
    <>
      {Icon && <Icon size={size === "sm" ? 15 : 17} strokeWidth={2} />}
      {children}
    </>
  );
  return href ? (
    <Link href={href} className={base}>{inner}</Link>
  ) : (
    <button type={type} onClick={onClick} disabled={disabled} className={base}>{inner}</button>
  );
}

/** Vibrant multi-line chart (SVG). Colors via Tailwind stroke-* classes (no hardcoded hex). */
export function DashLineChart({ lines, height = 130 }: { lines: { values: number[]; className: string }[]; height?: number }) {
  const W = 400;
  const H = height;
  const pad = 8;
  // Per-line normalization so mixed-scale series (e.g. CHF vs counts) each show their trend shape.
  const toPts = (vals: number[]) => {
    const m = Math.max(1, ...vals);
    return vals
      .map((v, i) => {
        const x = vals.length > 1 ? (i / (vals.length - 1)) * W : W / 2;
        const y = H - pad - (v / m) * (H - pad * 2);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  };
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden>
      {lines.map((l, i) => (
        <polyline key={i} className={cn("fill-none", l.className)} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={toPts(l.values)} />
      ))}
    </svg>
  );
}

/** Vibrant grouped bar chart (SVG). Primary + optional secondary series per group. */
export function DashBarChart({
  data,
  height = 130,
  primaryClassName = "fill-s-accent-bright",
  secondaryClassName = "fill-s-error",
}: {
  data: { primary: number; secondary?: number }[];
  height?: number;
  primaryClassName?: string;
  secondaryClassName?: string;
}) {
  const W = 400;
  const H = height;
  const pad = 6;
  const max = Math.max(1, ...data.flatMap((d) => [d.primary, d.secondary ?? 0]));
  const slot = data.length > 0 ? W / data.length : W;
  const bw = Math.min(34, slot * 0.42);
  const barH = (v: number) => (v / max) * (H - pad * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden>
      {data.map((d, i) => {
        const cx = i * slot + slot / 2;
        const ph = barH(d.primary);
        const sh = barH(d.secondary ?? 0);
        return (
          <g key={i}>
            <rect className={primaryClassName} x={cx - bw - 1} y={H - pad - ph} width={bw} height={ph} rx="4" />
            {d.secondary !== undefined && d.secondary > 0 && (
              <rect className={secondaryClassName} x={cx + 1} y={H - pad - sh} width={bw * 0.5} height={sh} rx="3" />
            )}
          </g>
        );
      })}
    </svg>
  );
}
