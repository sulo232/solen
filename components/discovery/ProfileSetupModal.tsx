"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useLocale } from "next-intl";

interface ProfileSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (prefs: Record<string, string | null>) => void;
}

const L: Record<string, {
  title: string; subtitle: string; genderLabel: string; textureLabel: string;
  lengthLabel: string; faceLabel: string; skip: string; save: string;
  female: string; male: string; allPref: string;
  straight: string; wavy: string; curly: string; coily: string; protective: string; bald: string;
  short: string; medium: string; long: string;
  oval: string; round: string; square: string; heart: string; oblong: string;
}> = {
  de: {
    title: "Feed personalisieren", subtitle: "Wir zeigen dir passende Styles. Alle Felder sind optional — du kannst sie später in deinem Profil ändern. Deine Daten werden nur zur Personalisierung genutzt.",
    genderLabel: "Styles anzeigen für", textureLabel: "Haarstruktur", lengthLabel: "Haarlänge", faceLabel: "Gesichtsform",
    skip: "Überspringen", save: "Einstellungen speichern",
    female: "Frauen", male: "Männer", allPref: "Alle / Egal",
    straight: "Glatt", wavy: "Wellig", curly: "Lockig", coily: "Kraus", protective: "Protective", bald: "Kahl / Sehr kurz",
    short: "Kurz", medium: "Mittel", long: "Lang",
    oval: "Oval", round: "Rund", square: "Eckig", heart: "Herzförmig", oblong: "Länglich",
  },
  en: {
    title: "Personalize Your Feed", subtitle: "We'll show you styles that match your preferences. All fields are optional — you can skip and customize later in your profile. Your data is only used to personalize your feed and is never shared.",
    genderLabel: "I want to see styles for", textureLabel: "Hair texture", lengthLabel: "Hair length", faceLabel: "Face shape",
    skip: "Skip", save: "Save preferences",
    female: "Women", male: "Men", allPref: "All / No preference",
    straight: "Straight", wavy: "Wavy", curly: "Curly", coily: "Coily", protective: "Protective", bald: "Bald / Very short",
    short: "Short", medium: "Medium", long: "Long",
    oval: "Oval", round: "Round", square: "Square", heart: "Heart", oblong: "Oblong",
  },
  fr: {
    title: "Personnaliser votre fil", subtitle: "Nous vous montrerons des styles qui correspondent à vos préférences. Tous les champs sont optionnels. Vos données ne sont utilisées que pour la personnalisation.",
    genderLabel: "Voir des styles pour", textureLabel: "Type de cheveux", lengthLabel: "Longueur", faceLabel: "Forme du visage",
    skip: "Ignorer", save: "Enregistrer",
    female: "Femmes", male: "Hommes", allPref: "Tous / Pas de préférence",
    straight: "Lisses", wavy: "Ondulés", curly: "Bouclés", coily: "Crépus", protective: "Protecteurs", bald: "Rasé / Très court",
    short: "Courts", medium: "Moyens", long: "Longs",
    oval: "Ovale", round: "Rond", square: "Carré", heart: "Cœur", oblong: "Oblong",
  },
  it: {
    title: "Personalizza il tuo feed", subtitle: "Ti mostreremo stili che corrispondono alle tue preferenze. Tutti i campi sono opzionali. I tuoi dati vengono utilizzati solo per la personalizzazione.",
    genderLabel: "Mostra stili per", textureLabel: "Tipo di capelli", lengthLabel: "Lunghezza", faceLabel: "Forma del viso",
    skip: "Salta", save: "Salva preferenze",
    female: "Donne", male: "Uomini", allPref: "Tutti / Nessuna preferenza",
    straight: "Lisci", wavy: "Mossi", curly: "Ricci", coily: "Crespi", protective: "Protettivi", bald: "Rasato / Molto corto",
    short: "Corti", medium: "Medi", long: "Lunghi",
    oval: "Ovale", round: "Rotondo", square: "Quadrato", heart: "Cuore", oblong: "Oblungo",
  },
};

export default function ProfileSetupModal({ open, onClose, onSave }: ProfileSetupModalProps) {
  const locale = useLocale();
  const t = L[locale] ?? L.en;

  const [gender, setGender] = useState<string | null>(null);
  const [texture, setTexture] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  const [faceShape, setFaceShape] = useState<string | null>(null);

  if (!open) return null;

  const GENDERS = [
    { value: "female", label: t.female },
    { value: "male", label: t.male },
    { value: "unisex", label: t.allPref },
  ];

  const TEXTURES = [
    { value: "straight", label: t.straight },
    { value: "wavy", label: t.wavy },
    { value: "curly", label: t.curly },
    { value: "coily", label: t.coily },
    { value: "protective", label: t.protective },
    { value: "bald", label: t.bald },
  ];

  const LENGTHS = [
    { value: "short", label: t.short },
    { value: "medium", label: t.medium },
    { value: "long", label: t.long },
  ];

  const FACE_SHAPES = [
    { value: "oval", label: t.oval },
    { value: "round", label: t.round },
    { value: "square", label: t.square },
    { value: "heart", label: t.heart },
    { value: "oblong", label: t.oblong },
  ];

  const handleSave = () => {
    onSave({
      disc_gender: gender,
      disc_hair_texture: texture,
      disc_hair_length: length,
      disc_face_shape: faceShape,
      disc_profile_set: "true",
    });
    onClose();
  };

  const pillClass = (active: boolean) =>
    `px-4 py-2.5 rounded-pill text-[11px] font-heading font-bold uppercase tracking-[.06em] border transition-[color,background-color,border-color] duration-150 ${active ? "border-s-coral bg-s-coral/[0.08] text-s-coral" : "border-s-ink/[0.08] dark:border-white/[0.08] text-s-ink/55 dark:text-s-dm-text/55 hover:border-s-coral/40"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-s-ink/40" onClick={onClose}>
      <div
        className="relative w-full sm:max-w-md rounded-t-[16px] sm:rounded-[18px] overflow-hidden max-h-[85vh] overflow-y-auto"
        style={{
          background: "#FFFFFF",
          boxShadow: "0 8px 24px rgba(26,18,9,.12), 0 32px 72px rgba(26,18,9,.10)"
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-s-ink/[0.06] flex items-start justify-between">
          <div>
            <p className="text-[9px] font-heading font-bold uppercase tracking-[.20em] text-s-coral mb-1">
              Profil einrichten
            </p>
            <h2 className="font-heading font-bold text-lg text-s-ink">{t.title}</h2>
            <p className="text-xs font-body text-s-ink/45 mt-1">{t.subtitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-[8px] hover:bg-s-ink/[0.04]" aria-label="Close">
            <X size={16} className="text-s-ink/50" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
        {/* Gender */}
        <div>
          <label className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 mb-2 block">{t.genderLabel}</label>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map((g) => (
              <button key={g.value} aria-pressed={gender === g.value} onClick={() => setGender(gender === g.value ? null : g.value)} className={pillClass(gender === g.value)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Texture */}
        <div>
          <label className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 mb-2 block">{t.textureLabel}</label>
          <div className="flex flex-wrap gap-2">
            {TEXTURES.map((tx) => (
              <button key={tx.value} aria-pressed={texture === tx.value} onClick={() => setTexture(texture === tx.value ? null : tx.value)} className={pillClass(texture === tx.value)}>
                {tx.label}
              </button>
            ))}
          </div>
        </div>

        {/* Length */}
        <div>
          <label className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 mb-2 block">{t.lengthLabel}</label>
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map((l) => (
              <button key={l.value} aria-pressed={length === l.value} onClick={() => setLength(length === l.value ? null : l.value)} className={pillClass(length === l.value)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Face shape */}
        <div>
          <label className="text-[9px] font-heading font-bold uppercase tracking-[.14em] text-s-ink/30 mb-2 block">{t.faceLabel}</label>
          <div className="flex flex-wrap gap-2">
            {FACE_SHAPES.map((f) => (
              <button key={f.value} aria-pressed={faceShape === f.value} onClick={() => setFaceShape(faceShape === f.value ? null : f.value)} className={pillClass(faceShape === f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-3 rounded-pill border border-s-ink/[0.08] text-xs font-heading font-bold text-s-ink/50 hover:border-s-ink/20 transition-colors">
            {t.skip}
          </button>
          <button onClick={handleSave}
            className="flex-1 py-4 rounded-pill text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-[transform,filter] duration-150 shadow-coral-glow"
            style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.28), 0 6px 20px rgba(232,98,74,.18)" }}>
            {t.save}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
