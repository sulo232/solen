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
    `px-3 py-2 rounded-pill text-sm transition-colors ${active ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-s-ink/40 backdrop-blur-lg" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white dark:bg-s-dm-surface rounded-t-[16px] sm:rounded-card p-6 space-y-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-s-ink dark:text-s-dm-text">{t.title}</h2>
          <button onClick={onClose} className="p-1 text-s-ink/30 hover:text-s-ink/60" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{t.subtitle}</p>

        {/* Gender */}
        <div>
          <label className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2 block">{t.genderLabel}</label>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map((g) => (
              <button key={g.value} onClick={() => setGender(gender === g.value ? null : g.value)} className={pillClass(gender === g.value)}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Texture */}
        <div>
          <label className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2 block">{t.textureLabel}</label>
          <div className="flex flex-wrap gap-2">
            {TEXTURES.map((tx) => (
              <button key={tx.value} onClick={() => setTexture(texture === tx.value ? null : tx.value)} className={pillClass(texture === tx.value)}>
                {tx.label}
              </button>
            ))}
          </div>
        </div>

        {/* Length */}
        <div>
          <label className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2 block">{t.lengthLabel}</label>
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map((l) => (
              <button key={l.value} onClick={() => setLength(length === l.value ? null : l.value)} className={pillClass(length === l.value)}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Face shape */}
        <div>
          <label className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2 block">{t.faceLabel}</label>
          <div className="flex flex-wrap gap-2">
            {FACE_SHAPES.map((f) => (
              <button key={f.value} onClick={() => setFaceShape(faceShape === f.value ? null : f.value)} className={pillClass(faceShape === f.value)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-btn text-sm text-s-ink/50 dark:text-s-dm-text/50 hover:bg-s-ink/5">
            {t.skip}
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium transition-all">
            {t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
