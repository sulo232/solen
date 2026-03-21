"use client";

import { useState } from "react";
import Image from "next/image";
import { Palette, Heart, FolderOpen, StickyNote, Tags } from "lucide-react";
import DesignHistoryTimeline from "@/components/nail/DesignHistoryTimeline";
import NailPreferencesForm from "./NailPreferencesForm";

interface NailClientTabProps {
  client: { id: string; display_name: string; avatar_url: string | null };
  salonId?: string | null;
}

const TABS = [
  { key: "designs", label: "Designs", icon: Palette },
  { key: "preferences", label: "Präferenzen", icon: Heart },
  { key: "inspo", label: "Inspiration", icon: FolderOpen },
  { key: "notes", label: "Notizen", icon: StickyNote },
  { key: "tags", label: "Tags", icon: Tags },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function NailClientTab({ client, salonId }: NailClientTabProps) {
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
      <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-4 border-b border-s-ink/5 dark:border-s-dm-text/10">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap border-b-2 transition-colors ${
              activeTab === key
                ? "border-s-coral text-s-coral font-medium"
                : "border-transparent text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text"
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
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
            Nutze den allgemeinen Kunden-Tab für Notizen.
          </p>
        )}
        {activeTab === "tags" && (
          <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">
            Nutze den allgemeinen Kunden-Tab für Tags.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Inspo Gallery (read-only salon view) ────

function InspoGallery({ customerId }: { customerId: string }) {
  const [images, setImages] = useState<{ id: string; image_url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useState(() => {
    fetch(`/api/nail-inspo/images?customer_id=${customerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.images) setImages(d.images); })
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  if (loading) return <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">Laden...</p>;
  if (images.length === 0) return <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 py-4">Keine gespeicherten Inspirationen</p>;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {images.map((img) => (
        <div key={img.id} className="aspect-square rounded-button overflow-hidden bg-s-bg-sunken dark:bg-s-dm-bg">
          <Image src={img.image_url} alt="" width={150} height={150} className="object-cover w-full h-full" />
        </div>
      ))}
    </div>
  );
}
