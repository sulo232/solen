"use client";
import { motion } from "framer-motion";

export default function HeroVisualCard() {
  return (
    <div className="relative h-[520px] hidden lg:block">
      {/* Main gradient card */}
      <div className="absolute top-10 left-5 right-0 bottom-0 rounded-[20px] bg-gradient-to-br from-s-amber to-s-coral shadow-warm-float overflow-hidden flex flex-col justify-end">
        <div className="font-display text-[72px] text-white/18 px-6 pt-4 leading-none">AMARA</div>
        {/* Glass overlay */}
        <div
          className="bg-white/62 backdrop-blur-[16px] -webkit-backdrop-blur-[16px] border-t border-white/55 rounded-b-[20px] p-5"
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,.70)" }}
        >
          <p className="font-heading font-bold text-s-ink text-base">Salon Amara</p>
          <p className="text-xs text-s-ink/60 mb-2">Kleinbasel · ★ 4.9 · 28 Bewertungen</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-s-sage-text bg-s-sage-subtle px-3 py-1 rounded-pill mb-2 shadow-warm-xs">
            Heute 14:30 frei
          </span>
          <p className="text-sm text-s-ink/60 mb-3">Ab <strong className="text-s-ink">CHF 45</strong></p>
          <button className="px-4 py-2 rounded-pill bg-s-coral text-white text-xs font-heading font-bold uppercase tracking-[.04em] shadow-coral-glow hover:bg-s-coral-hover transition-all">
            Jetzt buchen
          </button>
        </div>
        {/* Heart */}
        <button className="absolute top-3.5 right-3.5 w-[34px] h-[34px] rounded-full bg-white/75 backdrop-blur-[8px] border border-white/50 flex items-center justify-center shadow-warm-sm hover:scale-110 transition-transform" />
        {/* Top Pick badge */}
        <span className="absolute top-3.5 left-3.5 bg-s-yellow text-s-yellow-text text-[10px] font-heading font-bold uppercase tracking-[.08em] px-2.5 py-1 rounded-pill shadow-warm-sm">
          Solen Top Pick
        </span>
      </div>
      {/* Floating stat card */}
      <motion.div
        className="absolute top-0 left-0 rounded-[20px] bg-white/62 backdrop-blur-[16px] border border-white/55 p-4 shadow-warm-lg"
        style={{ boxShadow: "0 4px 8px rgba(26,18,9,.09), 0 8px 32px rgba(26,18,9,.07), inset 0 1px 0 rgba(255,255,255,.70)" }}
        animate={{ y: [0, -10, 0], rotate: [-0.5, 0.5, -0.5] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="font-display text-[40px] leading-none text-s-coral">247</div>
        <div className="text-[10px] font-heading font-semibold uppercase tracking-[.14em] text-s-ink/50">Buchungen<br />diese Woche</div>
      </motion.div>
    </div>
  );
}
