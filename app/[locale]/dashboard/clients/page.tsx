"use client";

import { useEffect, useState, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { Search, Tag, StickyNote, ChevronLeft, Calendar, Beaker, Camera, ClipboardList } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import { DashStatusPill } from "@/app/[locale]/_components/dashboard/DashboardUI";
import Spinner from "@/components-legacy/ui/Spinner";
import ErrorState from "@/components-legacy/ui/ErrorState";
import FormulaTab from "@/components-legacy/dashboard/FormulaTab";
import ClientPhotosTab from "@/components-legacy/dashboard/ClientPhotosTab";
import IntakeFormTab from "@/components-legacy/dashboard/IntakeFormTab";
import { resolveSwissLocale } from "@/lib/format";
import { avGrad } from "@/lib/avatar-gradients";

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
// Avatar helpers
// ─────────────────────────────────────────

const initials = (n: string) => {
  const p = (n || "").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "—";
};
// ─────────────────────────────────────────
// Client List
// ─────────────────────────────────────────

export default function ClientsPage() {
  const t = useTranslations("dashboard.clientsPage");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string>("Alle");

  const SEGMENTS = [
    { key: "Alle", label: t("segmentAll"), color: "bg-s-bg-sunken text-s-ink-2" },
    { key: "VIP", label: t("segmentVip"), color: "bg-s-bg-sunken text-s-ink" },
    { key: "Gefährdet", label: t("segmentAtRisk"), color: "bg-s-error-bg text-s-error" },
    { key: "Neu", label: t("segmentNew"), color: "bg-s-success-bg text-s-success" },
    { key: "Regulär", label: t("segmentRegular"), color: "bg-s-bg-sunken text-s-ink-2" },
  ];

  useEffect(() => {
    let current = true;
    const controller = new AbortController();
    setLoading(true);
    setLoadError(false);
    setClients([]);
    setSalonId(null);
    setSelectedClient(null);

    async function loadClients() {
      try {
        const profileResponse = await fetch("/api/profile", { signal: controller.signal });
        if (!profileResponse.ok) throw new Error(`Profile request failed (${profileResponse.status})`);
        const profile = await profileResponse.json();
        if (!current) return;
        if (typeof profile?.id !== "string" || !profile.id || typeof profile.salon_id !== "string" || !profile.salon_id) {
          throw new Error("Authenticated profile or active Store unavailable");
        }
        const response = await fetch(`/api/salon/clients?salon_id=${encodeURIComponent(profile.salon_id)}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`Clients request failed (${response.status})`);
        const data = await response.json();
        const population = data?.clients ?? data?.items;
        if (!Array.isArray(population)) throw new Error("Client population unavailable");
        if (!current) return;
        setSalonId(profile.salon_id);
        setClients(population);
      } catch (err) {
        if (!current) return;
        console.error("[DashboardClients] failed to fetch clients:", err);
        setLoadError(true);
      } finally {
        if (current) setLoading(false);
      }
    }

    void loadClients();
    return () => {
      current = false;
      controller.abort();
    };
  }, [loadAttempt]);

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
        <h1 className="font-heading text-[26px] font-bold tracking-[-0.02em] text-s-ink leading-none">{t("title")}</h1>
        <p className="text-[12.5px] text-s-ink-2 mt-1">{t("subtitle")}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="md" /></div>
      ) : loadError ? (
        <ErrorState title={tCommon("errorLoading")} retryLabel={tCommon("retry")} onRetry={() => setLoadAttempt((attempt) => attempt + 1)} />
      ) : (
      <>
      {/* Segment filter tabs */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 -mx-px [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SEGMENTS.map((s) => {
          const count = s.key === "Alle" ? clients.length : clients.filter((c) => c.segment_tag === s.key).length;
          const active = segmentFilter === s.key;
          return (
            <button key={s.key} onClick={() => setSegmentFilter(s.key)}
              className={`shrink-0 rounded-full text-[12.5px] font-semibold px-3.5 py-2 whitespace-nowrap transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide ${
                active
                  ? "bg-s-accent-bright/10 text-s-accent-bright border border-transparent"
                  : "bg-white border border-s-border text-s-ink-2"
              }`}>
              {s.label}
              <span className="opacity-50 ml-1">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 border border-s-border rounded-[14px] px-3.5 py-2.5 text-s-ink-2 mb-4">
        <Search size={17} strokeWidth={1.9} className="shrink-0" />
        {/* mockup-ok: !important prevents a look change, not a new one. The wrapper div owns
            the visible chrome (border+radius+padding); this input must stay invisible AND
            keep its compact size inside it, or the widened base input law (globals.css,
            2026-07-17, sets min-height:48px/padding:16px/font-size:16px too, not just
            fill/border/radius) both paints a second box AND balloons the row. Same carve-out
            as SearchOverlay.tsx (V3-D-input-fill-2026-07-17). */}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="flex-1 min-w-0 !border-0 !bg-transparent !min-h-0 !px-0 !text-[13.5px] text-s-ink placeholder:text-s-ink-2 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-s-ink/30 text-center py-10">
          {search ? t("noClientsFound") : t("noClientsYet")}
        </p>
      ) : (
        <div className="rounded-[16px] border border-s-border bg-white overflow-hidden">
          {filtered.map((c) => {
            const name = c.display_name || t("unknownClient");
            return (
              <button
                key={c.user_id}
                onClick={() => setSelectedClient(c)}
                className="w-full border-b border-s-border last:border-b-0 px-3.5 py-3 flex flex-col gap-2 text-left transition-transform active:scale-[0.98] active:duration-[80ms] active:ease-glide"
              >
                {/* head row */}
                <div className="flex items-center gap-3">
                  {c.avatar_url ? (
                    <span className="relative w-[40px] h-[40px] rounded-full overflow-hidden shrink-0">
                      <Image src={c.avatar_url} alt="" fill className="object-cover" unoptimized />
                    </span>
                  ) : (
                    <span className={`grid place-items-center w-[40px] h-[40px] rounded-full bg-gradient-to-br ${avGrad(name)} text-white font-heading font-semibold text-[13px] shrink-0`}>
                      {initials(name)}
                    </span>
                  )}
                  <span className="flex-1 min-w-0 font-heading font-semibold text-[14.5px] text-s-ink truncate">{name}</span>
                  {c.segment_tag && (
                    <DashStatusPill
                      tone={
                        c.segment_tag === "VIP" ? "warning" :
                        c.segment_tag === "Gefährdet" ? "error" :
                        "neutral"
                      }
                    >
                      {c.segment_tag}
                    </DashStatusPill>
                  )}
                </div>
                {/* meta row */}
                <div className="text-[12.5px] text-s-ink-2 flex gap-1.5 flex-wrap">
                  <span><b className="font-heading font-semibold text-s-ink">{c.total_bookings}</b> {t("appointments")}</span>
                  {c.last_visit && <span>| {t("lastVisit", { date: new Date(c.last_visit).toLocaleDateString(resolveSwissLocale(locale)) })}</span>}
                  {c.total_spent != null && <span>| <b className="font-heading font-semibold text-s-ink">CHF {c.total_spent}</b></span>}
                </div>
                {/* tags row */}
                {c.tags?.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {c.tags.slice(0, 3).map((t) => (
                      <span key={t.tag} className="text-[12px] font-semibold rounded-md px-2 py-0.5 bg-s-bg-sunken text-s-ink-2">
                        {t.tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
      </>
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
  const t = useTranslations("dashboard.clientsPage");
  const locale = useLocale();
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
    { key: "termine", label: t("tabAppointments"), icon: Calendar },
    { key: "formeln", label: t("tabFormulas"), icon: Beaker },
    { key: "fotos", label: t("tabPhotos"), icon: Camera },
    { key: "notizen", label: t("tabNotes"), icon: StickyNote },
    { key: "tags", label: t("tabTags"), icon: Tag },
    { key: "fragebogen", label: t("tabIntakeForm"), icon: ClipboardList },
  ];

  return (
    <div>
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-s-ink-2 hover:text-s-ink transition-[colors,transform] active:scale-[0.98] active:duration-[80ms] active:ease-glide mb-4">
        <ChevronLeft size={16} strokeWidth={1.9} /> {t("back")}
      </button>
      <div className="flex items-center gap-3 mb-5">
        {client.avatar_url ? (
          <span className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
            <img src={client.avatar_url} alt="" className="w-full h-full object-cover" />
          </span>
        ) : (
          <span className={`grid place-items-center w-12 h-12 rounded-full bg-gradient-to-br ${avGrad(client.display_name || t("unknownClient"))} text-white font-heading font-semibold text-base shrink-0`}>
            {initials(client.display_name || t("unknownClient"))}
          </span>
        )}
        <div>
          <h2 className="font-heading text-lg text-s-ink">{client.display_name || t("unknownClient")}</h2>
          <p className="text-xs text-s-ink/40">{client.total_bookings} {t("appointments")}</p>
        </div>
      </div>

      {/* Tags display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map((t) => (
            <span key={t.tag} className={`px-2 py-0.5 rounded-full text-[12px] font-medium ${tagColor(t.color)}`}>
              {t.tag}
            </span>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide ${tab === t.key ? "bg-s-ink text-white hover:bg-black" : "bg-white border border-s-border text-s-ink-2 hover:bg-s-bg-sunken hover:text-s-ink"}`}>
            <t.icon size={12} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "termine" && (
        loadingBookings ? <div className="flex justify-center py-6"><Spinner size="md" /></div> : (
          bookings.length === 0 ? (
            <p className="text-xs text-s-ink/30 text-center py-6">{t("noAppointments")}</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="bg-white rounded-2xl border border-s-border p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-s-ink">{b.service_name || t("serviceFallback")}</p>
                    <p className="text-xs text-s-ink/40">
                      {new Date(b.starts_at).toLocaleDateString(resolveSwissLocale(locale))} {new Date(b.starts_at).toLocaleTimeString(resolveSwissLocale(locale), { hour: "2-digit", minute: "2-digit" })}
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
            <input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder={t("notePlaceholder")}
              className="flex-1 px-3 py-2 text-sm text-s-ink focus:outline-none" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
              onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(); }} />
            <button onClick={handleAddNote} disabled={!newNote.trim() || savingNote}
              className="px-3 py-2 rounded-btn bg-s-ink text-white text-xs font-medium hover:bg-black disabled:opacity-50 transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide">
              {savingNote ? <Spinner size="sm" invert /> : t("save")}
            </button>
          </div>
          {loadingNotes ? <div className="flex justify-center py-6"><Spinner size="md" /></div> : (
            notes.length === 0 ? (
              <p className="text-xs text-s-ink/30 text-center py-6">{t("noNotes")}</p>
            ) : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="bg-white rounded-2xl border border-s-border p-3">
                    <p className="text-sm text-s-ink">{n.note}</p>
                    <p className="text-[12px] text-s-ink/20 mt-1">{new Date(n.created_at).toLocaleDateString(resolveSwissLocale(locale))}</p>
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
            <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder={t("newTagPlaceholder")}
              className="flex-1 px-3 py-2 text-sm text-s-ink focus:outline-none" /> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            <select value={tagColor_} onChange={(e) => setTagColor_(e.target.value)}
              className="px-2 py-2 text-xs text-s-ink focus:outline-none"> {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
              {["gray", "red", "orange", "blue", "purple", "teal"].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button onClick={handleAddTag} disabled={!newTag.trim() || savingTag}
              className="px-3 py-2 rounded-btn bg-s-ink text-white text-xs font-medium hover:bg-black disabled:opacity-50 transition-[colors,transform] active:scale-[0.97] active:duration-[80ms] active:ease-glide">
              {savingTag ? <Spinner size="sm" invert /> : t("add")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <span key={t.tag} className={`px-2.5 py-1 rounded-full text-xs font-medium ${tagColor(t.color)}`}>
                {t.tag}
              </span>
            ))}
            {tags.length === 0 && <p className="text-xs text-s-ink/30">{t("noTags")}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
