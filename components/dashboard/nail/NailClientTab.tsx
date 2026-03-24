"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Palette, Heart, FolderOpen, StickyNote, Tags } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import DesignHistoryTimeline from "@/components/nail/DesignHistoryTimeline";
import NailPreferencesForm from "./NailPreferencesForm";

interface NailClientTabProps {
  client: { id: string; display_name: string; avatar_url: string | null };
  salonId?: string | null;
}

const TAB_KEYS = ["designs", "preferences", "inspo", "notes", "tags"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_ICONS = {
  designs: Palette,
  preferences: Heart,
  inspo: FolderOpen,
  notes: StickyNote,
  tags: Tags,
} as const;

export default function NailClientTab({ client, salonId }: NailClientTabProps) {
  const t = useTranslations("nail_dashboard");
  const [activeTab, setActiveTab] = useState<TabKey>("designs");

  return (
    <div>
      {/* Client header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-s-bg-sunken dark:bg-s-dm-bg overflow-hidden flex items-center justify-center">
          {client.avatar_url ? (
            <Image src={client.avatar_url} alt="" width={48} height={48} className="object-cover w-full h-full" />
          ) : (
            <span className="text-lg font-bold text-s-ink/20 dark:text-s-dm-text/20">{client.display_name?.[0]}</span>
          )}
        </div>
        <h2 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text">{client.display_name}</h2>
      </div>

      {/* Tab bar */}
      <div className="relative flex gap-1 overflow-x-auto scrollbar-hide mb-4 border-b border-s-ink/5 dark:border-s-dm-text/10">
        {TAB_KEYS.map((key) => {
          const Icon = TAB_ICONS[key];
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap transition-colors min-h-12 ${
                activeTab === key
                  ? "text-s-coral font-medium"
                  : "text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text"
              }`}
            >
              <Icon size={14} />
              {t(`tab_${key}`)}
              {activeTab === key && (
                <motion.div
                  layoutId="nail-client-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-s-coral"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "designs" && (
          <DesignHistoryTimeline customerId={client.id} salonId={salonId} />
        )}
        {activeTab === "preferences" && (
          <NailPreferencesForm customerId={client.id} />
        )}
        {activeTab === "inspo" && (
          <InspoGallery customerId={client.id} />
        )}
        {activeTab === "notes" && (
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">
            {t("notes_hint")}
          </p>
        )}
        {activeTab === "tags" && (
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">
            {t("tags_hint")}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Inspo Gallery (read-only salon view) ────

function InspoGallery({ customerId }: { customerId: string }) {
  const t = useTranslations("nail_dashboard");
  const [images, setImages] = useState<{ id: string; image_url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/nail-inspo/images?customer_id=${customerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.images) setImages(d.images); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">{t("loading")}</p>;
  if (images.length === 0) return <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">{t("inspo_empty")}</p>;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {images.map((img) => (
        <div key={img.id} className="aspect-square rounded-btn overflow-hidden bg-s-bg-sunken dark:bg-s-dm-bg">
          <Image src={img.image_url} alt="" width={150} height={150} className="object-cover w-full h-full" />
        </div>
      ))}
    </div>
  );
}
