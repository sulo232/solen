"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Palette, Heart, FolderOpen, StickyNote, Tags, Hand } from "lucide-react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import DesignHistoryTimeline from "@/components/nail/DesignHistoryTimeline";
import NailPreferencesForm from "./NailPreferencesForm";
import HandChart from "@/components/nail/HandChart";

interface NailClientTabProps {
  client?: { id: string; display_name: string; avatar_url: string | null };
  salonId?: string | null;
}

const TAB_KEYS = ["designs", "preferences", "inspo", "notes", "tags", "hand_chart"] as const;
type TabKey = (typeof TAB_KEYS)[number];

const TAB_ICONS = {
  designs: Palette,
  preferences: Heart,
  inspo: FolderOpen,
  notes: StickyNote,
  tags: Tags,
  hand_chart: Hand,
} as const;

export default function NailClientTab({ client, salonId }: NailClientTabProps) {
  const t = useTranslations("nail_dashboard") as any;
  const [activeTab, setActiveTab] = useState<TabKey>("designs");

  if (!client) return null;

  return (
    <div>
      {/* Client header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-s-bg-sunken overflow-hidden flex items-center justify-center">
          {client.avatar_url ? (
            <Image src={client.avatar_url} alt="" width={48} height={48} className="object-cover w-full h-full" />
          ) : (
            <span className="text-lg font-bold text-s-ink/20">{client.display_name?.[0]}</span>
          )}
        </div>
        <h2 className="font-heading font-semibold text-lg text-s-ink">{client.display_name}</h2>
      </div>

      {/* Tab bar */}
      <div role="tablist" className="relative flex gap-1 overflow-x-auto scrollbar-hide mb-4 border-b border-s-ink/5">
        {TAB_KEYS.map((key) => {
          const Icon = TAB_ICONS[key];
          return (
            <button
              key={key}
              role="tab"
              aria-selected={activeTab === key}
              onClick={() => setActiveTab(key)}
              className={`relative flex items-center gap-1.5 px-3 py-2 text-sm whitespace-nowrap transition-colors duration-150 min-h-12 ${
                activeTab === key
                  ? "text-s-coral font-medium"
                  : "text-s-ink/50 hover:text-s-ink:text-s-dm-text"
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
          <ClientNotes customerId={client.id} salonId={salonId} />
        )}
        {activeTab === "tags" && (
          <ClientTags customerId={client.id} salonId={salonId} />
        )}
        {activeTab === "hand_chart" && (
          <HandChart customerId={client.id} />
        )}
      </div>
    </div>
  );
}

// ─── Client Notes ────

function ClientNotes({ customerId, salonId }: { customerId: string; salonId?: string | null }) {
  const t = useTranslations("nail_dashboard") as any;
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!salonId) return;
    fetch(`/api/dashboard/clients/${customerId}/notes?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.notes) setNotes(d.notes); })
      .finally(() => setLoading(false));
  }, [customerId, salonId]);

  const addNote = async () => {
    if (!newNote.trim() || !salonId) return;
    const res = await fetch(`/api/dashboard/clients/${customerId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salonId, note: newNote.trim(), note_type: "permanent" }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
    }
  };

  const deleteNote = async (id: string) => {
    const res = await fetch(`/api/dashboard/clients/${customerId}/notes?note_id=${id}&salon_id=${salonId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  if (!salonId) return null;
  if (loading) return <p className="text-sm text-s-ink/40 py-4">{t("loading")}</p>;

  return (
    <div className="space-y-4 py-2">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newNote} 
          onChange={(e) => setNewNote(e.target.value)} 
          placeholder={t("new_note_placeholder")}
          className="flex-1 bg-s-bg-sunken px-3 py-2 border border-s-ink/10 rounded-btn text-sm text-s-ink"
          onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
        />
        <button onClick={addNote} className="bg-s-coral text-white px-4 py-2 rounded-pill font-medium hover:brightness-[1.06] active:scale-[0.97] shadow-coral-glow transition-[transform,filter] duration-150 text-sm">
          {t("add")}
        </button>
      </div>
      {notes.length === 0 ? (
        <p className="text-sm text-s-ink/40 py-4">{t("notes_hint")}</p>
      ) : (
        <div className="space-y-2">
          {notes.map(n => (
            <div key={n.id} className="p-3 bg-white border border-s-ink/5 rounded-[12px] flex justify-between items-start gap-3">
              <p className="text-sm text-s-ink">{n.note}</p>
              <button title="Löschen" onClick={() => deleteNote(n.id)} className="text-s-ink/30 hover:text-red-500 transition-colors shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Client Tags ────

function ClientTags({ customerId, salonId }: { customerId: string; salonId?: string | null }) {
  const t = useTranslations("nail_dashboard") as any;
  const [tags, setTags] = useState<any[]>([]);
  const [newTag, setNewTag] = useState("");
  const [selectedColor, setSelectedColor] = useState("gray");
  const [loading, setLoading] = useState(true);

  const colors = ["gray", "red", "orange", "yellow", "green", "teal", "blue", "purple", "pink"];

  useEffect(() => {
    if (!salonId) return;
    fetch(`/api/dashboard/clients/${customerId}/tags?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.tags) setTags(d.tags); })
      .finally(() => setLoading(false));
  }, [customerId, salonId]);

  const addTag = async () => {
    if (!newTag.trim() || !salonId) return;
    const res = await fetch(`/api/dashboard/clients/${customerId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ salon_id: salonId, tag: newTag.trim(), color: selectedColor }),
    });
    if (res.ok) {
      const { tag } = await res.json();
      setTags((prev) => [tag, ...prev]);
      setNewTag("");
    }
  };

  const deleteTag = async (id: string) => {
    const res = await fetch(`/api/dashboard/clients/${customerId}/tags?tag_id=${id}&salon_id=${salonId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTags((prev) => prev.filter((t) => t.id !== id));
    }
  };

  if (!salonId) return null;
  if (loading) return <p className="text-sm text-s-ink/40 py-4">{t("loading")}</p>;

  // Basic color mapping for UI
  const colorMap: Record<string, string> = {
    gray: "bg-gray-100 text-gray-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-700",
    teal: "bg-teal-100 text-teal-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    pink: "bg-pink-100 text-pink-700",
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-col gap-3 p-3 bg-s-bg-sunken rounded-[12px] border border-s-ink/5">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={newTag} 
            onChange={(e) => setNewTag(e.target.value)} 
            placeholder={t("new_tag_placeholder")}
            className="flex-1 bg-white px-3 py-2 border border-s-ink/10 rounded-btn text-sm text-s-ink"
            onKeyDown={(e) => { if (e.key === "Enter") addTag(); }}
          />
          <button onClick={addTag} className="bg-s-coral text-white px-4 py-2 rounded-pill font-medium hover:brightness-[1.06] active:scale-[0.97] shadow-coral-glow transition-[transform,filter] duration-150 text-sm">
            {t("add")}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {colors.map(c => (
            <button 
              key={c}
              onClick={() => setSelectedColor(c)}
              className={`w-5 h-5 rounded-full ${colorMap[c].split(' ')[0]} ${selectedColor === c ? 'ring-2 ring-offset-1 ring-s-ink' : 'opacity-70'} transition-[border-color,background-color] duration-150`}
            />
          ))}
        </div>
      </div>

      {tags.length === 0 ? (
        <p className="text-sm text-s-ink/40 py-4">{t("tags_hint")}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <div key={tag.id} className={`flex items-center gap-1.5 px-3 py-1 rounded-pill text-xs font-medium ${colorMap[tag.color] || colorMap.gray}`}>
              <span>{tag.tag}</span>
              <button onClick={() => deleteTag(tag.id)} className="opacity-50 hover:opacity-100 focus:outline-none shrink-0 border-l border-current pl-1.5 ml-0.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Inspo Gallery (read-only salon view) ────

function InspoGallery({ customerId }: { customerId: string }) {
  const t = useTranslations("nail_dashboard") as any;
  const [images, setImages] = useState<{ id: string; image_url: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/nail-inspo/images?customer_id=${customerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.images) setImages(d.images); })
      .catch((err) => console.error("[NailClientTab] failed to load nail inspo images:", err))
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) return <p className="text-sm text-s-ink/40 py-4">{t("loading")}</p>;
  if (images.length === 0) return <p className="text-sm text-s-ink/40 py-4">{t("inspo_empty")}</p>;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {images.map((img) => (
        <div key={img.id} className="aspect-square rounded-btn overflow-hidden bg-s-bg-sunken">
          <Image src={img.image_url} alt="" width={150} height={150} className="object-cover w-full h-full" />
        </div>
      ))}
    </div>
  );
}
