"use client";

import { useEffect, useState } from "react";
import { Plus, X, AlertTriangle } from "lucide-react";

interface Tag {
  id: string;
  tag: string;
  color: string;
}

interface ClientTagsProps {
  salonId: string;
  customerId: string;
  compact?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  gray: "bg-s-bg-sunken text-s-ink/70 dark:bg-s-dm-raised dark:text-s-ink/30",
  red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  teal: "bg-s-coral/10 text-s-coral dark:bg-s-coral/20",  // legacy DB values
  coral: "bg-s-coral/10 text-s-coral dark:bg-s-coral/20",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
};

const ALLERGY_PRESETS = ["Allergie", "Empfindliche Haut", "Latex-Allergie", "Ammoniakfrei"];

export default function ClientTags({ salonId, customerId, compact }: ClientTagsProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newColor, setNewColor] = useState("gray");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/salons/${salonId}/client-tags?customer_id=${customerId}`)
      .then((r) => r.json())
      .then((d) => setTags(d.tags ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [salonId, customerId]);

  const handleAdd = async (tagText?: string) => {
    const text = tagText ?? newTag.trim();
    if (!text || adding) return;
    setAdding(true);
    try {
      const res = await fetch(`/api/salons/${salonId}/client-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, tag: text, color: newColor }),
      });
      if (res.ok) {
        const { tag } = await res.json();
        setTags((prev) => [...prev, tag]);
        setNewTag("");
        setShowAdd(false);
      }
    } catch { /* ignore */ } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (tagId: string) => {
    try {
      await fetch(`/api/salons/${salonId}/client-tags`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag_id: tagId }),
      });
      setTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch { /* ignore */ }
  };

  const hasAllergyTag = tags.some((t) => t.color === "red");

  if (loading) return null;

  // Compact mode: just show tag pills inline
  if (compact) {
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map((t) => (
          <span key={t.id} className={["px-1.5 py-0.5 rounded-pill text-[10px] font-medium", COLOR_MAP[t.color] ?? COLOR_MAP.gray].join(" ")}>
            {t.color === "red" && <AlertTriangle size={9} className="inline mr-0.5 -mt-px" />}
            {t.tag}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Allergy warning banner */}
      {hasAllergyTag && (
        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
          <p className="text-xs text-red-700 dark:text-red-300 font-medium">
            Achtung: Kundin hat Allergien/Unverträglichkeiten
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => (
          <span key={t.id} className={["inline-flex items-center gap-1 px-2 py-1 rounded-pill text-xs font-medium", COLOR_MAP[t.color] ?? COLOR_MAP.gray].join(" ")}>
            {t.color === "red" && <AlertTriangle size={10} className="shrink-0" />}
            {t.tag}
            <button onClick={() => handleDelete(t.id)} className="ml-0.5 opacity-50 hover:opacity-100">
              <X size={10} />
            </button>
          </span>
        ))}
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-pill text-xs font-medium bg-s-bg-sunken dark:bg-s-dm-raised text-s-ink/50 dark:text-s-ink/40 hover:bg-s-sand dark:hover:bg-s-ink/60 transition-colors"
        >
          <Plus size={10} /> Tag
        </button>
      </div>

      {/* Add tag form */}
      {showAdd && (
        <div className="border border-s-ink/10 dark:border-white/10 rounded-card p-3 space-y-2">
          {/* Allergy presets */}
          <div className="flex flex-wrap gap-1">
            {ALLERGY_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => handleAdd(preset)}
                disabled={tags.some((t) => t.tag === preset)}
                className="px-2 py-1 rounded-pill text-[10px] font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-800/30 transition-colors disabled:opacity-30"
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Custom tag input */}
          <div className="flex gap-2">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Eigenes Tag…"
              maxLength={50}
              className="flex-1 px-2.5 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 text-xs focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-surface dark:text-s-dm-text"
            />
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="px-2 py-1.5 rounded-button border border-s-ink/10 dark:border-white/10 text-xs bg-white dark:bg-s-dm-surface dark:text-s-dm-text"
            >
              <option value="gray">Grau</option>
              <option value="red">Rot</option>
              <option value="orange">Orange</option>
              <option value="coral">Coral</option>
              <option value="blue">Blau</option>
              <option value="purple">Lila</option>
            </select>
            <button
              onClick={() => handleAdd()}
              disabled={!newTag.trim() || adding}
              className="px-3 py-1.5 rounded-button bg-s-coral text-white text-xs font-medium disabled:opacity-50"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setShowAdd(false)}
            className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text"
          >
            Abbrechen
          </button>
        </div>
      )}
    </div>
  );
}
