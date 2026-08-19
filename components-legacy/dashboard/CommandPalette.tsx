"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  Search, Home, Calendar, Clock, MessageCircle, Users, Scissors, BarChart,
  Settings, Star, Image as ImageIcon, Megaphone, UserCheck, Award, ShieldCheck,
  Camera, Plus, X
} from "lucide-react";

interface Command {
  label: string;
  description?: string;
  icon: React.ElementType;
  href?: string;
  action?: () => void;
  category: string;
  shortcut?: string;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const COMMANDS: Command[] = [
    { label: t("nav.overview"), icon: Home, href: `/${locale}/dashboard`, category: "Navigation" },
    { label: t("nav.bookings"), icon: Calendar, href: `/${locale}/dashboard/bookings`, category: "Navigation" },
    { label: t("nav.calendar"), icon: Clock, href: `/${locale}/dashboard/calendar`, category: "Navigation" },
    // messaging turned off for now (owner 2026-06-13)
    { label: t("nav.team"), icon: Users, href: `/${locale}/dashboard/staff`, category: "Navigation" },
    { label: t("nav.clients"), icon: UserCheck, href: `/${locale}/dashboard/clients`, category: "Navigation" },
    { label: t("nav.services"), icon: Scissors, href: `/${locale}/dashboard/services`, category: "Navigation" },
    { label: t("nav.analytics"), icon: BarChart, href: `/${locale}/dashboard/analytics`, category: "Navigation" },
    { label: t("nav.reviews"), icon: Star, href: `/${locale}/dashboard/reviews`, category: "Navigation" },
    { label: t("nav.gallery"), icon: ImageIcon, href: `/${locale}/dashboard/gallery`, category: "Navigation" },
    { label: t("nav.marketing"), icon: Megaphone, href: `/${locale}/dashboard/marketing`, category: "Navigation" },
    { label: t("nav.loyalty"), icon: Award, href: `/${locale}/dashboard/loyalty`, category: "Navigation" },
    { label: t("nav.settings"), icon: Settings, href: `/${locale}/dashboard/settings`, category: "Navigation" },
    { label: t("nav.posts"), icon: Camera, href: `/${locale}/dashboard/discovery-posts`, category: "Navigation" },
    { label: t("nav.verification"), icon: ShieldCheck, href: `/${locale}/dashboard/verification`, category: "Navigation" },
    { label: t("cmd.newAppointment"), icon: Plus, href: `/${locale}/dashboard/calendar`, category: t("cmd.actions"), shortcut: "N" },
    { label: t("cmd.editServices"), icon: Scissors, href: `/${locale}/dashboard/services`, category: t("cmd.actions") },
    // messaging turned off for now (owner 2026-06-13)
    { label: t("cmd.openAnalytics"), icon: BarChart, href: `/${locale}/dashboard/analytics`, category: t("cmd.actions"), shortcut: "A" },
    { label: t("cmd.manageStaff"), icon: Users, href: `/${locale}/dashboard/staff`, category: t("cmd.actions") },
  ];

  const filtered = query.trim()
    ? COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()) ||
        (c.description?.toLowerCase().includes(query.toLowerCase())) ||
        c.category.toLowerCase().includes(query.toLowerCase())
      )
    : COMMANDS;

  // Reset cursor when filtered list changes
  useEffect(() => { setCursor(0); }, [query]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setCursor(0);
    }
  }, [open]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(c + 1, filtered.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[cursor];
        if (cmd?.href) { router.push(cmd.href); onClose(); }
        if (cmd?.action) { cmd.action(); onClose(); }
      }
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, cursor, router, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[10vh] px-4 bg-s-ink/50 backdrop-blur-[4px]"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[560px] bg-[--raised] rounded-card border border-s-ink/[0.08] shadow-v5-float overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-s-ink/[0.06]">
          <Search size={15} strokeWidth={1.9} className="text-s-ink-2 shrink-0" />
          {/* mockup-ok: !important prevents a look change, not a new one. The dialog row owns
              the visible chrome + padding; this input must stay invisible AND compact inside
              it, or the widened base input law (globals.css, 2026-07-17, also sets
              min-height:48px/padding:16px/font-size:16px) paints a second box AND balloons
              the row (V3-D-input-fill-2026-07-17). */}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("cmdPlaceholder")}
            aria-label={t("cmdPlaceholder")}
            className="flex-1 text-s-ink !border-0 !bg-transparent !min-h-0 !px-0 !text-sm outline-none placeholder:text-s-ink/30"
          />
          <button onClick={onClose} aria-label={t("close")} className="p-2 rounded-pill hover:bg-s-ink/5:bg-white/5 transition-[colors,transform] duration-150 active:scale-[0.94] active:duration-[80ms] active:ease-glide">
            <X size={16} strokeWidth={1.9} className="text-s-ink/40" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[400px] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12px] font-heading text-s-ink-2 uppercase tracking-[.10em]">
              {t("noResults")}
            </p>
          ) : (
            (() => {
              const groups: Record<string, Command[]> = {};
              filtered.forEach((cmd) => {
                if (!groups[cmd.category]) groups[cmd.category] = [];
                groups[cmd.category].push(cmd);
              });
              return Object.entries(groups).map(([category, cmds]) => (
                <div key={category}>
                  <p className="px-4 py-1 text-[12px] font-heading uppercase tracking-[.20em] text-s-ink/25">
                    {category}
                  </p>
                  {cmds.map((cmd, globalIdx) => {
                    const flatIdx = filtered.indexOf(cmd);
                    const active = flatIdx === cursor;
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={cmd.label}
                        onClick={() => {
                          if (cmd.href) { router.push(cmd.href); onClose(); }
                          if (cmd.action) { cmd.action(); onClose(); }
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-[colors,transform] duration-150 active:scale-[0.98] active:duration-[80ms] active:ease-glide ${
                          active
                            ? "bg-s-coral/[0.06] text-s-coral"
                            : "hover:bg-s-bg-sunken text-s-ink"
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 ${active ? "bg-s-coral/15" : "bg-s-bg-sunken"}`}>
                          <Icon size={13} className={active ? "text-s-coral" : "text-s-ink/45"} />
                        </div>
                        <span className="flex-1 text-sm font-heading">{cmd.label}</span>
                        {cmd.shortcut && (
                          <kbd className="shrink-0 text-[12px] font-bold px-1.5 py-0.5 rounded-[4px] bg-s-bg-sunken text-s-ink/45 font-mono">
                            {cmd.shortcut}
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              ));
            })()
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2.5 border-t border-s-ink/[0.05] flex items-center gap-3 bg-s-bg-sunken">
          <span className="text-[12px] text-s-ink/25">
            ↑↓ {t("navigate")} Enter {t("select")} Esc {t("close")}
          </span>
        </div>
      </div>
    </div>
  );
}
