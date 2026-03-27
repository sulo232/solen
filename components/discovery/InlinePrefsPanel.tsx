"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Sparkles, X, Check } from "lucide-react";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";

interface InlinePrefsPanelProps {
  onSave: (prefs: Record<string, string | null>) => void;
  onDismiss: () => void;
}

const L: Record<string, {
  banner: string; bannerSub: string; expand: string;
  genderLabel: string; textureLabel: string; lengthLabel: string;
  save: string; dismiss: string;
  female: string; male: string; allPref: string;
  straight: string; wavy: string; curly: string; coily: string;
  short: string; medium: string; long: string;
}> = {
  de: {
    banner: "Personalisiere deinen Feed", bannerSub: "Wähle deine Präferenzen für bessere Empfehlungen",
    expand: "Einrichten", genderLabel: "Styles für", textureLabel: "Haartyp", lengthLabel: "Länge",
    save: "Speichern", dismiss: "Später",
    female: "Frauen", male: "Männer", allPref: "Alle",
    straight: "Glatt", wavy: "Wellig", curly: "Lockig", coily: "Kraus",
    short: "Kurz", medium: "Mittel", long: "Lang",
  },
  en: {
    banner: "Personalize your feed", bannerSub: "Set your preferences for better recommendations",
    expand: "Set up", genderLabel: "Styles for", textureLabel: "Hair type", lengthLabel: "Length",
    save: "Save", dismiss: "Later",
    female: "Women", male: "Men", allPref: "All",
    straight: "Straight", wavy: "Wavy", curly: "Curly", coily: "Coily",
    short: "Short", medium: "Medium", long: "Long",
  },
  fr: {
    banner: "Personnaliser votre fil", bannerSub: "Définissez vos préférences pour de meilleures recommandations",
    expand: "Configurer", genderLabel: "Styles pour", textureLabel: "Type", lengthLabel: "Longueur",
    save: "Enregistrer", dismiss: "Plus tard",
    female: "Femmes", male: "Hommes", allPref: "Tous",
    straight: "Lisses", wavy: "Ondulés", curly: "Bouclés", coily: "Crépus",
    short: "Courts", medium: "Moyens", long: "Longs",
  },
  it: {
    banner: "Personalizza il tuo feed", bannerSub: "Imposta le tue preferenze per consigli migliori",
    expand: "Configura", genderLabel: "Stili per", textureLabel: "Tipo", lengthLabel: "Lunghezza",
    save: "Salva", dismiss: "Dopo",
    female: "Donne", male: "Uomini", allPref: "Tutti",
    straight: "Lisci", wavy: "Mossi", curly: "Ricci", coily: "Crespi",
    short: "Corti", medium: "Medi", long: "Lunghi",
  },
};

export default function InlinePrefsPanel({ onSave, onDismiss }: InlinePrefsPanelProps) {
  const locale = useLocale();
  const t = L[locale] ?? L.en;

  const [expanded, setExpanded] = useState(false);
  const [gender, setGender] = useState<string | null>(null);
  const [texture, setTexture] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const pillClass = (active: boolean) =>
    `px-3.5 py-2 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] border transition-all cursor-pointer ${
      active
        ? "border-s-coral bg-s-coral/[0.08] text-s-coral"
        : "border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink/55 dark:text-s-dm-text/55 hover:border-s-coral/40"
    }`;

  const handleSave = () => {
    onSave({
      disc_gender: gender,
      disc_hair_texture: texture,
      disc_hair_length: length,
      disc_profile_set: "true",
    });
    setSaved(true);
    setTimeout(() => onDismiss(), 800);
  };

  if (saved) {
    return (
      <motion.div
        initial={{ opacity: 1, height: "auto" }}
        animate={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="overflow-hidden"
      >
        <div className="rounded-card border border-[#4CAF6F]/20 p-4 flex items-center gap-3"
          style={{ background: "rgba(76,175,111,.06)" }}>
          <Check size={16} className="text-[#4CAF6F]" />
          <p className="text-sm font-heading font-semibold text-[#4CAF6F]">Gespeichert!</p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="rounded-card border border-s-coral/15 overflow-hidden"
      style={{ background: "rgba(232,98,74,.03)" }}>
      {/* Collapsed banner */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: "rgba(232,98,74,.10)" }}>
          <Sparkles size={14} className="text-s-coral" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">{t.banner}</p>
          <p className="text-[10px] font-body text-s-ink/45 dark:text-s-dm-text/45 mt-0.5">{t.bannerSub}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!expanded && (
            <span className="text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-coral">
              {t.expand}
            </span>
          )}
          <ChevronDown
            size={14}
            className={`text-s-ink/30 dark:text-s-dm-text/30 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {/* Expanded preference pills */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-s-ink/[0.05] dark:border-white/[0.05] pt-3">
              {/* Gender */}
              <div>
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">{t.genderLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "female", l: t.female },
                    { v: "male", l: t.male },
                    { v: "unisex", l: t.allPref },
                  ].map((g) => (
                    <button key={g.v} onClick={() => setGender(gender === g.v ? null : g.v)} className={pillClass(gender === g.v)}>
                      {g.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Texture */}
              <div>
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">{t.textureLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "straight", l: t.straight },
                    { v: "wavy", l: t.wavy },
                    { v: "curly", l: t.curly },
                    { v: "coily", l: t.coily },
                  ].map((tx) => (
                    <button key={tx.v} onClick={() => setTexture(texture === tx.v ? null : tx.v)} className={pillClass(texture === tx.v)}>
                      {tx.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Length */}
              <div>
                <p className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 dark:text-s-dm-text/30 mb-2">{t.lengthLabel}</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "short", l: t.short },
                    { v: "medium", l: t.medium },
                    { v: "long", l: t.long },
                  ].map((ln) => (
                    <button key={ln.v} onClick={() => setLength(length === ln.v ? null : ln.v)} className={pillClass(length === ln.v)}>
                      {ln.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={onDismiss}
                  className="px-4 py-2.5 rounded-btn border border-s-ink/[0.08] dark:border-white/[0.08] text-[10px] font-heading font-bold uppercase tracking-[.06em] text-s-ink/40 dark:text-s-dm-text/40 hover:border-s-ink/20 transition-colors"
                >
                  {t.dismiss}
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-btn text-white text-[10px] font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all"
                  style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 4px 12px rgba(232,98,74,.16)" }}
                >
                  {t.save}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
