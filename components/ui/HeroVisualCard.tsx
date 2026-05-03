"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";

export default function HeroVisualCard() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const reduced = typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!mounted) return <div className="relative h-[540px] hidden lg:block" aria-hidden="true" />;

  return (
    <div className="relative h-[540px] hidden lg:block" aria-hidden="true">
      {/* ── Main gradient card ── */}
      <div className="absolute top-10 left-8 right-0 bottom-0 rounded-[20px] overflow-hidden"
        style={{ background: "linear-gradient(145deg, #F3A864 0%, #E8624A 100%)",
                 boxShadow: "0 24px 72px rgba(26,18,9,.18)" }}>

        {/* Deco circles on gradient */}
        <div className="absolute w-[220px] h-[220px] rounded-full bg-white/10 right-[-40px] top-[-40px]" />
        <div className="absolute w-[160px] h-[160px] rounded-full bg-s-plum/20 left-[-30px] bottom-[80px]" />

        {/* Bebas Neue salon name watermark */}
        <div className="font-display text-[80px] text-white/15 px-6 pt-6 leading-none select-none">
          AMARA
        </div>

        {/* Heart button */}
        <button className="absolute top-4 right-4 w-[36px] h-[36px] rounded-full flex items-center justify-center transition-[transform,filter] duration-150 active:scale-[0.97]"
          style={{ background: "var(--glass-bg-card)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)", border: "1px solid var(--glass-border-subtle)" }}>
          <Heart size={16} className="text-s-coral fill-s-coral" />
        </button>

        {/* Top Pick badge */}
        <span className="absolute top-4 left-4 text-[10px] font-heading uppercase tracking-[.08em] px-2.5 py-1 rounded-pill text-s-amber-text"
          style={{ background: "#F2C144", boxShadow: "0 1px 3px rgba(26,18,9,.07), 0 2px 8px rgba(26,18,9,.05)" }}>
          Solen Top Pick
        </span>

        {/* Glass overlay info card */}
        <div className="absolute bottom-0 left-0 right-0 rounded-b-[20px] p-5"
          style={{ background: "var(--glass-bg-subtle)", backdropFilter: "blur(16px) saturate(1.2)",
                   WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                   borderTop: "1px solid var(--glass-border-subtle)",
                   boxShadow: "var(--glass-shadow-inset)" }}>
          <p className="font-heading text-s-ink text-[16px] mb-0.5">Salon Amara</p>
          <p className="text-xs text-s-ink/60 mb-3 font-body">Kleinbasel · ★ 4.9 · 28 Bewertungen</p>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-s-sage-text mb-3 px-3 py-1 rounded-pill"
            style={{ background: "#EBF5EE", boxShadow: "0 1px 2px rgba(26,18,9,.06)" }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
            </svg>
            Heute 14:30 frei
          </span>
          <div className="flex items-center justify-between">
            <span className="text-sm text-s-ink/70 font-body">Ab <strong className="text-s-ink font-heading">CHF 45</strong></span>
            <button className="px-4 py-2 rounded-pill text-white text-xs font-heading uppercase tracking-[.04em] transition-[transform,filter] duration-150"
              style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 16px rgba(232,98,74,.15)" }}>
              Jetzt buchen
            </button>
          </div>
        </div>
      </div>

      {/* ── Floating stat card ── */}
      <motion.div
        className="absolute top-0 left-0 rounded-[20px] p-5 min-w-[140px]"
        style={{ background: "var(--glass-bg-subtle)", backdropFilter: "blur(16px) saturate(1.2)",
                 WebkitBackdropFilter: "blur(16px) saturate(1.2)",
                 border: "1px solid var(--glass-border-subtle)",
                 boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), var(--glass-shadow-inset)" }}
        animate={reduced ? {} : { y: [0, -10, 0], rotate: [-0.5, 0.5, -0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
        <div className="font-display text-[44px] leading-none text-s-coral">~250</div>
        <div className="text-[10px] font-heading uppercase tracking-[.14em] text-s-ink/50 mt-0.5 leading-tight">
          Buchungen<br />diese Woche
        </div>
      </motion.div>
    </div>
  );
}
