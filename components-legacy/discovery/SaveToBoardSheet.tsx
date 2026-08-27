"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { X, Plus, Images } from "lucide-react";

// V3-D414 (Phase 2): "Speichern in" sheet. Lists the user's collections + a create row; picking one saves the
// look into it (POST /collections/[id]/items, upsert), creating one then saves into the new board. Mockup frame 5.
interface Collection { id: string; name: string; count: number; covers: string[]; }

interface Props {
  itemId: string;
  open: boolean;
  onClose: () => void;
  onSaved?: (collectionId: string) => void;
}

export default function SaveToBoardSheet({ itemId, open, onClose, onSaved }: Props) {
  const t = useTranslations("common");
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/discovery/collections");
      const data = await res.json();
      setCollections(Array.isArray(data.collections) ? data.collections : []);
    } catch (err) {
      console.error("[SaveToBoardSheet] load failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) { setCreating(false); setNewName(""); load(); }
  }, [open, load]);

  const saveTo = async (collectionId: string) => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/discovery/collections/${collectionId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId }),
      });
      if (res.ok) { onSaved?.(collectionId); onClose(); }
      else console.error("[SaveToBoardSheet] save failed:", res.status);
    } catch (err) {
      console.error("[SaveToBoardSheet] save error:", err);
    } finally {
      setBusy(false);
    }
  };

  const createAndSave = async () => {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/discovery/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (res.ok && data.collection?.id) {
        await saveTo(data.collection.id); // saveTo flips busy back
      } else {
        console.error("[SaveToBoardSheet] create failed:", data?.error);
        setBusy(false);
      }
    } catch (err) {
      console.error("[SaveToBoardSheet] create error:", err);
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end" role="dialog" aria-modal="true" aria-label={t("savedToBoard")}>
      <div className="absolute inset-0 bg-s-ink/40 backdrop-blur-[6px] animate-in fade-in duration-200" onClick={onClose} />
      <div className="relative flex max-h-[80vh] w-full flex-col overflow-hidden rounded-t-[22px] bg-white shadow-elevation-3 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <button onClick={onClose} aria-label={t("closeOverlay")} className="text-s-ink transition-colors hover:text-s-ink-2"><X size={20} strokeWidth={2.2} /></button>
          <p className="font-heading text-[16px] font-semibold text-s-ink">{t("savedToBoard")}</p>
          <span className="w-5" />
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {creating ? (
            <div className="px-1.5 py-1">
              <label className="text-[12px] font-heading font-semibold uppercase tracking-[0.05em] text-s-ink-2">Name</label>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                maxLength={60}
                placeholder="z. B. Mein Schnitt"
                className="mt-1.5 w-full px-3.5 py-3 font-body text-s-ink placeholder:text-s-ink/40" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
              />
              <div className="mt-3.5 flex gap-2.5">
                <button onClick={() => setCreating(false)} className="h-12 flex-1 rounded-pill bg-s-bg-sunken font-heading text-[14px] font-semibold text-s-ink">{t("back")}</button>
                <button onClick={createAndSave} disabled={!newName.trim() || busy} className="h-12 flex-1 rounded-pill bg-s-ink font-heading text-[14px] font-semibold text-white transition-opacity disabled:opacity-40">Erstellen</button>
              </div>
            </div>
          ) : loading ? (
            <p className="py-10 text-center text-[14px] text-s-ink-2">Lädt…</p>
          ) : (
            <>
              {collections.map((c) => (
                <button
                  key={c.id}
                  onClick={() => saveTo(c.id)}
                  disabled={busy}
                  className="flex w-full items-center gap-3 rounded-xl px-1.5 py-2 text-left transition-colors duration-150 hover:bg-s-bg-sunken disabled:opacity-50"
                >
                  <span className="grid h-12 w-12 shrink-0 grid-cols-2 grid-rows-2 gap-px overflow-hidden rounded-[12px] bg-s-bg-sunken">
                    {c.covers && c.covers.length > 0
                      ? c.covers.slice(0, 4).map((src, i) => <img key={i} src={src} alt="" className="h-full w-full object-cover" />)
                      : <span className="col-span-2 row-span-2 grid place-items-center text-s-ink-2"><Images size={18} strokeWidth={1.9} /></span>}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-heading text-[15px] font-semibold text-s-ink">{c.name}</span>
                    <span className="text-[12px] text-s-ink-2">{c.count} {c.count === 1 ? "Look" : "Looks"}</span>
                  </span>
                </button>
              ))}
              <button onClick={() => setCreating(true)} className="mt-1 flex w-full items-center gap-3 rounded-xl px-1.5 py-2.5 text-left transition-colors duration-150 hover:bg-s-bg-sunken">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] bg-s-bg-sunken text-s-ink-2"><Plus size={20} strokeWidth={2.2} /></span>
                <span className="font-heading text-[15px] font-semibold text-s-ink">Neue Kollektion</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
