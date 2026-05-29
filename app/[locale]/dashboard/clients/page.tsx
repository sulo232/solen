"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { Search, User, Tag, StickyNote, ChevronLeft, Calendar, Beaker, Camera, ClipboardList } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import FormulaTab from "@/components-legacy/dashboard/FormulaTab";
import ClientPhotosTab from "@/components-legacy/dashboard/ClientPhotosTab";
import IntakeFormTab from "@/components-legacy/dashboard/IntakeFormTab";

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface Client {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  last_visit: string | null;
  total_bookings: number;
  tags: { tag: string; color: string }[];
  segment_tag?: string;
  total_spent?: number;
}

interface Booking {
  id: string;
  starts_at: string;
  status: string;
  service_name: string | null;
  price_paid: number | null;
}

interface ClientNote {
  id: string;
  note: string;
  note_type: string;
  created_at: string;
}

type DetailTab = "termine" | "formeln" | "fotos" | "notizen" | "tags" | "fragebogen";

// ─────────────────────────────────────────
// Client List
// ─────────────────────────────────────────

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string>("Alle");

  const SEGMENTS = [
    { key: "Alle", label: "Alle", color: "bg-s-bg-sunken text-s-ink-2" },
    { key: "VIP", label: "VIP", color: "bg-s-bg-sunken text-s-ink" },
    { key: "Gefährdet", label: "Gefährdet", color: "bg-s-error-bg text-s-error" },
    { key: "Neu", label: "Neu", color: "bg-s-success-bg text-s-success" },
    { key: "Regulär", label: "Regulär", color: "bg-s-bg-sunken text-s-ink-2" },
  ];

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setSalonId(p?.salon_id ?? null);
        if (p?.salon_id) {
          return fetch(`/api/salon/clients?salon_id=${p.salon_id}`).then((r) => r.json());
        }
        return { clients: [] };
      })
      .then((d) => setClients(d.clients ?? d.items ?? []))
      .catch((err) => console.error("[DashboardClients] failed to fetch clients:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = clients;
    if (segmentFilter !== "Alle") {
      list = list.filter((c) => c.segment_tag === segmentFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.display_name?.toLowerCase().includes(q));
    }
    return list;
  }, [clients, search, segmentFilter]);

  if (selectedClient && salonId) {
    return (
      <DashboardLayout>
        <ClientDetail client={selectedClient} salonId={salonId} onBack={() => setSelectedClient(null)} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-5">
        <h1 className="text-[26px] font-semibold tracking-[-0.015em] text-s-ink">Kunden</h1>
        <p className="text-sm text-s-ink/40">Kundenkartei & CRM</p>
      </div>

      {/* Segment filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {SEGMENTS.map((s) => {
          const count = s.key === "Alle" ? clients.length : clients.filter((c) => c.segment_tag === s.key).length;
          return (
            <button key={s.key} onClick={() => setSegmentFilter(s.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                segmentFilter === s.key ? "bg-s-ink text-white hover:bg-black" : s.color + " hover:opacity-80"
              }`}>
              {s.label}
              <span className={`data-text text-[10px] ${segmentFilter === s.key ? "text-white/70" : "opacity-50"}`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-s-ink/30" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Name suchen…"
          className="w-full pl-9 pr-3 py-2.5 rounded-btn border border-s-border bg-white text-sm text-s-ink focus:outline-none focus:border-s-ink"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="md" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-s-ink/30 text-center py-10">
          {search ? "Keine Kunden gefunden" : "Noch keine Kunden"}
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <button
              key={c.user_id}
              onClick={() => setSelectedClient(c)}
              className="w-full flex items-center gap-3 p-3 rounded-2xl border border-s-border bg-white hover:border-s-ink transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-s-bg-sunken flex items-center justify-center shrink-0 overflow-hidden relative">
                {c.avatar_url ? (
                  <Image src={c.avatar_url} alt="" fill className="object-cover" unoptimized />
                ) : (
                  <User size={16} className="text-s-ink" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-s-ink truncate">{c.display_name || "Unbekannt"}</p>
                <div className="flex items-center gap-2 text-xs text-s-ink/40">
                  <span>{c.total_bookings} Termine</span>
                  {c.last_visit && <span>· Letzter: {new Date(c.last_visit).toLocaleDateString("de-CH")}</span>}
                </div>
              </div>
              {c.segment_tag && c.segment_tag !== "Regulär" && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium shrink-0 ${
                  c.segment_tag === "VIP" ? "bg-s-bg-sunken text-s-ink" :
                  c.segment_tag === "Gefährdet" ? "bg-s-error-bg text-s-error" :
                  c.segment_tag === "Neu" ? "bg-s-success-bg text-s-success" :
                  "bg-s-bg-sunken text-s-ink-2"
                }`}>{c.segment_tag}</span>
              )}
              {c.tags?.length > 0 && (
                <div className="flex gap-1 shrink-0">
                  {c.tags.slice(0, 3).map((t) => (
                    <span key={t.tag} className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${tagColor(t.color)}`}>
                      {t.tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────
// Tag colors
// ─────────────────────────────────────────

function tagColor(color: string): string {
  const map: Record<string, string> = {
    red: "bg-s-error-bg text-s-error",
    orange: "bg-s-warning-bg text-s-warning",
    teal: "bg-s-bg-sunken text-s-ink",
    blue: "bg-s-bg-sunken text-s-ink-2",
    purple: "bg-s-bg-sunken text-s-ink-2",
    gray: "bg-s-bg-sunken text-s-ink-2",
  };
  return map[color] ?? map.gray;
}

// ─────────────────────────────────────────
// Client Detail View
// ─────────────────────────────────────────

function ClientDetail({ client, salonId, onBack }: { client: Client; salonId: string; onBack: () => void }) {
  const [tab, setTab] = useState<DetailTab>("termine");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notes, setNotes] = useState<ClientNote[]>([]);
  const [tags, setTags] = useState<{ tag: string; color: string }[]>(client.tags ?? []);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tagColor_, setTagColor_] = useState("gray");
  const [savingTag, setSavingTag] = useState(false);

  useEffect(() => {
    // Load bookings
    fetch(`/api/bookings?user_id=${client.user_id}&salon_id=${salonId}`)
      .then((r) => r.json())
      .then((d) => setBookings(d.bookings ?? d.items ?? []))
      .catch((err) => console.error("[DashboardClients] failed to fetch client bookings:", err))
      .finally(() => setLoadingBookings(false));

    // Load notes
    fetch(`/api/client-notes?salon_id=${salonId}&customer_id=${client.user_id}`)
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? d.items ?? []))
      .catch((err) => console.error("[DashboardClients] failed to fetch client notes:", err))
      .finally(() => setLoadingNotes(false));
  }, [client.user_id, salonId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/client-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, customer_id: client.user_id, note: newNote.trim(), note_type: "permanent" }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotes((prev) => [data.data ?? data, ...prev]);
        setNewNote("");
      }
      // V3-D334 (overnight T2): error handling per CLAUDE.md.
    } catch (err) { console.error("[Clients] save note failed:", err); } finally {
      setSavingNote(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    setSavingTag(true);
    try {
      const res = await fetch(`/api/salons/${salonId}/client-tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: client.user_id, tag: newTag.trim(), color: tagColor_ }),
      });
      if (res.ok) {
        setTags((prev) => [...prev, { tag: newTag.trim(), color: tagColor_ }]);
        setNewTag("");
      }
      // V3-D334 (overnight T2): error handling per CLAUDE.md.
    } catch (err) { console.error("[Clients] add tag failed:", err); } finally {
      setSavingTag(false);
    }
  };

  const TABS: { key: DetailTab; label: string; icon: typeof Calendar }[] = [
    { key: "termine", label: "Termine", icon: Calendar },
    { key: "formeln", label: "Formeln", icon: Beaker },
    { key: "fotos", label: "Fotos", icon: Camera },
    { key: "notizen", label: "Notizen", icon: StickyNote },
    { key: "tags", label: "Tags", icon: Tag },
    { key: "fragebogen", label: "Fragebogen", icon: ClipboardList },
  ];

  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-s-ink-2 hover:text-s-ink transition-colors mb-4">
        <ChevronLeft size={16} /> Zurück
      </button>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 rounded-full bg-s-bg-sunken flex items-center justify-center overflow-hidden relative">
          {client.avatar_url ? (
            <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <User size={20} className="text-s-ink" />
          )}
        </div>
        <div>
          <h2 className="font-heading text-lg text-s-ink">{client.display_name || "Unbekannt"}</h2>
          <p className="text-xs text-s-ink/40">{client.total_bookings} Termine</p>
        </div>
      </div>

      {/* Tags display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map((t) => (
            <span key={t.tag} className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${tagColor(t.color)}`}>
              {t.tag}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${tab === t.key ? "bg-s-ink text-white hover:bg-black" : "bg-white border border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink"}`}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "termine" && (
        loadingBookings ? <div className="flex justify-center py-6"><Spinner size="md" /></div> : (
          bookings.length === 0 ? (
            <p className="text-xs text-s-ink/30 text-center py-6">Keine Termine</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-s-border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-s-ink">{b.service_name || "Service"}</p>
                    <p className="text-xs text-s-ink/40">
                      {new Date(b.starts_at).toLocaleDateString("de-CH")} · {new Date(b.starts_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <DashStatusPill tone={b.status === "confirmed" ? "success" : b.status === "cancelled" ? "error" : "neutral"}>
                      {b.status}
                    </DashStatusPill>
                    {b.price_paid != null && <p className="text-xs text-s-ink/40 mt-0.5 data-text">CHF {b.price_paid}</p>}
                  </div>
                </div>
              ))}
            </div>
          )
        )
      )}

      {tab === "formeln" && <FormulaTab customerId={client.user_id} />}
      {tab === "fotos" && <ClientPhotosTab customerId={client.user_id} />}
      {tab === "fragebogen" && <IntakeFormTab customerId={client.user_id} />}

      {tab === "notizen" && (
        <div>
          <div className="flex gap-2 mb-4">
            <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Notiz hinzufügen…"
              className="flex-1 px-3 py-2 rounded-btn border border-s-border bg-white text-sm text-s-ink focus:outline-none focus:border-s-ink"
              onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); }} />
            <button onClick={handleAddNote} disabled={!newNote.trim() || savingNote}
              className="px-3 py-2 rounded-btn bg-s-ink text-white text-xs font-medium hover:bg-black disabled:opacity-50 transition-colors">
              {savingNote ? <Spinner size="sm" invert /> : "Speichern"}
            </button>
          </div>
          {loadingNotes ? <div className="flex justify-center py-6"><Spinner size="md" /></div> : (
            notes.length === 0 ? (
              <p className="text-xs text-s-ink/30 text-center py-6">Keine Notizen</p>
            ) : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="bg-white rounded-2xl border border-s-border p-3">
                    <p className="text-sm text-s-ink">{n.note}</p>
                    <p className="text-[10px] text-s-ink/20 mt-1">{new Date(n.created_at).toLocaleDateString("de-CH")}</p>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      )}

      {tab === "tags" && (
        <div>
          <div className="flex gap-2 mb-4">
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Neues Tag…"
              className="flex-1 px-3 py-2 rounded-btn border border-s-border bg-white text-sm text-s-ink focus:outline-none focus:border-s-ink" />
            <select value={tagColor_} onChange={(e) => setTagColor_(e.target.value)}
              className="px-2 py-2 rounded-btn border border-s-border bg-white text-xs text-s-ink focus:outline-none focus:border-s-ink">
              {["gray", "red", "orange", "blue", "purple", "teal"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button onClick={handleAddTag} disabled={!newTag.trim() || savingTag}
              className="px-3 py-2 rounded-btn bg-s-ink text-white text-xs font-medium hover:bg-black disabled:opacity-50 transition-colors">
              {savingTag ? <Spinner size="sm" invert /> : "Hinzufügen"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t.tag} className={`px-2.5 py-1 rounded-full text-xs font-medium ${tagColor(t.color)}`}>
                {t.tag}
              </span>
            ))}
            {tags.length === 0 && <p className="text-xs text-s-ink/30">Keine Tags</p>}
          </div>
        </div>
      )}
    </div>
  );
}
