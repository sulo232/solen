"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

interface ProfileSetupModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (prefs: Record<string, string | null>) => void;
}

const GENDERS = [
  { value: "female", label: "Women" },
  { value: "male", label: "Men" },
  { value: "unisex", label: "All / No preference" },
];

const TEXTURES = [
  { value: "straight", label: "Straight" },
  { value: "wavy", label: "Wavy" },
  { value: "curly", label: "Curly" },
  { value: "coily", label: "Coily" },
  { value: "protective", label: "Protective" },
  { value: "bald", label: "Bald / Very short" },
];

const LENGTHS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];

const FACE_SHAPES = [
  { value: "oval", label: "Oval" },
  { value: "round", label: "Round" },
  { value: "square", label: "Square" },
  { value: "heart", label: "Heart" },
  { value: "oblong", label: "Oblong" },
];

export default function ProfileSetupModal({ open, onClose, onSave }: ProfileSetupModalProps) {
  const [gender, setGender] = useState<string | null>(null);
  const [texture, setTexture] = useState<string | null>(null);
  const [length, setLength] = useState<string | null>(null);
  const [faceShape, setFaceShape] = useState<string | null>(null);

  if (!open) return null;

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

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full sm:max-w-md bg-white dark:bg-s-dm-surface rounded-t-2xl sm:rounded-card p-6 space-y-5 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-heading font-bold text-s-ink dark:text-s-dm-text">Personalize Your Feed</h2>
          <button onClick={onClose} className="p-1 text-s-ink/30 hover:text-s-ink/60">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">
          This helps us show you styles that match your preferences. All fields are optional — you can skip and customize later in your profile. Your data is only used to personalize your feed and is never shared.
        </p>

        {/* Gender */}
        <div>
          <label className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2 block">I want to see styles for</label>
          <div className="flex flex-wrap gap-2">
            {GENDERS.map((g) => (
              <button
                key={g.value}
                onClick={() => setGender(gender === g.value ? null : g.value)}
                className={[
                  "px-3 py-2 rounded-pill text-sm transition-colors",
                  gender === g.value ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60",
                ].join(" ")}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Texture */}
        <div>
          <label className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2 block">Hair texture</label>
          <div className="flex flex-wrap gap-2">
            {TEXTURES.map((t) => (
              <button
                key={t.value}
                onClick={() => setTexture(texture === t.value ? null : t.value)}
                className={[
                  "px-3 py-2 rounded-pill text-sm transition-colors",
                  texture === t.value ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Length */}
        <div>
          <label className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2 block">Hair length</label>
          <div className="flex flex-wrap gap-2">
            {LENGTHS.map((l) => (
              <button
                key={l.value}
                onClick={() => setLength(length === l.value ? null : l.value)}
                className={[
                  "px-3 py-2 rounded-pill text-sm transition-colors",
                  length === l.value ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60",
                ].join(" ")}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Face shape */}
        <div>
          <label className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2 block">Face shape</label>
          <div className="flex flex-wrap gap-2">
            {FACE_SHAPES.map((f) => (
              <button
                key={f.value}
                onClick={() => setFaceShape(faceShape === f.value ? null : f.value)}
                className={[
                  "px-3 py-2 rounded-pill text-sm transition-colors",
                  faceShape === f.value ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60",
                ].join(" ")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-button text-sm text-s-ink/50 dark:text-s-dm-text/50 hover:bg-s-ink/5">
            Skip
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium">
            Save preferences
          </button>
        </div>
      </div>
    </div>
  );
}
