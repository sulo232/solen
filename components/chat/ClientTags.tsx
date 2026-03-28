"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
  red: "bg-s-error-bg text-s-error dark:bg-s-error/10",
  orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  teal: "bg-s-coral/10 text-s-coral dark:bg-s-coral/20",  // legacy DB values
  coral: "bg-s-coral/10 text-s-coral dark:bg-s-coral/20",
  blue: "bg-s-blue-subtle text-s-blue-text dark:bg-s-blue/10 dark:text-s-blue",
  purple: "bg-s-plum/10 text-s-plum dark:bg-s-plum/20",
};

export default function ClientTags({ salonId, customerId, compact }: ClientTagsProps) {
  const t = useTranslations("chat.clientTags") as any;
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [newColor, setNewColor] = useState("gray");
  const [adding, setAdding] = useState(false);

  const allergyPresets = [
    t("allergyPresets.allergy"),
    t("allergyPresets.sensitiveSkin"),
    t("allergyPresets.latexAllergy"),
    t("allergyPresets.ammoniaFree"),
  ];

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
        <div className="flex items-center gap-2 bg-s-error-bg dark:bg-s-error/10 border border-s-error/20 rounded-btn px-3 py-2">
          <AlertTriangle size={14} className="text-s-error shrink-0" />
          <p className="text-xs text-s-error font-medium">
            {t("allergyWarning")}
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span key={tag.id} className={["inline-flex items-center gap-1 px-2 py-1 rounded-pill text-xs font-medium", COLOR_MAP[tag.color] ?? COLOR_MAP.gray].join(" ")}>
            {tag.color === "red" && <AlertTriangle size={10} className="shrink-0" />}
            {tag.tag}
            <button onClick={() => handleDelete(tag.id)} className="ml-0.5 opacity-50 hover:opacity-100">
              <X size={10} />
            </button>
          </span>
        ))}
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-pill text-xs font-medium bg-s-bg-sunken dark:bg-s-dm-raised text-s-ink/50 dark:text-s-ink/40 hover:bg-s-sand dark:hover:bg-s-ink/60 transition-colors"
        >
          <Plus size={10} /> {t("addTag")}
        </button>
      </div>

      {/* Add tag form */}
      {showAdd && (
        <div className="border border-s-ink/10 dark:border-white/10 rounded-[12px] p-3 space-y-2">
          {/* Allergy presets */}
          <div className="flex flex-wrap gap-1">
            {allergyPresets.map((preset) => (
              <button
                key={preset}
                onClick={() => handleAdd(preset)}
                disabled={tags.some((tag) => tag.tag === preset)}
                className="px-2 py-1 rounded-pill text-[10px] font-medium bg-s-error-bg dark:bg-s-error/10 text-s-error hover:bg-s-error/15 transition-colors disabled:opacity-30"
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
              placeholder={t("customTagPlaceholder")}
              maxLength={50}
              className="flex-1 px-2.5 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-xs focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 bg-white dark:bg-s-dm-surface dark:text-s-dm-text"
            />
            <select
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="px-2 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 text-xs bg-white dark:bg-s-dm-surface dark:text-s-dm-text"
            >
              <option value="gray">{t("colors.gray")}</option>
              <option value="red">{t("colors.red")}</option>
              <option value="orange">{t("colors.orange")}</option>
              <option value="coral">{t("colors.coral")}</option>
              <option value="blue">{t("colors.blue")}</option>
              <option value="purple">{t("colors.purple")}</option>
            </select>
            <button
              onClick={() => handleAdd()}
              disabled={!newTag.trim() || adding}
              className="px-3 py-1.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-xs font-medium disabled:opacity-50"
            >
              +
            </button>
          </div>

          <button
            onClick={() => setShowAdd(false)}
            className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text"
          >
            {t("cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
