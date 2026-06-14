"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, Plus } from "lucide-react";

// V3-D414 (Phase 2): the user's saved "Kollektionen" (owner-named term, 2026-06-14 — matches the editorial
// Kollektionen row on Discover). Reached from the bookmark entry point in the discovery header. Focused view
// (own back; marketing chrome gated in HideInBooking).
interface Collection { id: string; name: string; count: number; covers: string[]; }

export default function SavedPage() {
  const params = useParams<{ locale: string }>()!;
  const router = useRouter();
  const locale = params.locale;
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loaded, setLoaded] = useState(false);
  // Create-a-collection flow (the mockup's "Neue Kollektion" card). The save sheet creates one WHILE saving a
  // look; here you can start an empty one directly, then save into it from the feed.
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/discovery/collections");
      const d = res.ok ? await res.json() : null;
      setCollections(Array.isArray(d?.collections) ? d.collections : []);
    } catch (err) {
      console.error("[Saved] load failed:", err);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const createCollection = async () => {
    const name = newName.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/discovery/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.collection?.id) {
        setCreating(false);
        setNewName("");
        await load();
      } else {
        console.error("[Saved] create failed:", data?.error);
      }
    } catch (err) {
      console.error("[Saved] create error:", err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="flex items-center gap-3 px-4 pb-3 pt-4">
        <button
          onClick={() => router.push(`/${locale}/discover`)}
          aria-label="Zurück"
          className="grid h-10 w-10 place-items-center rounded-full border border-s-border text-s-ink transition-transform duration-150 active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink">Kollektionen</h1>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        {!loaded ? null : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {/* Create card — start an empty collection (mockup's "Neue Kollektion" cell), then save looks into it. */}
              <button
                onClick={() => setCreating(true)}
                className="text-left transition-transform duration-150 active:scale-[0.98]"
              >
                <div className="grid aspect-[4/3] w-full place-items-center rounded-2xl border border-dashed border-s-border bg-s-bg-sunken text-s-ink-2">
                  <Plus size={26} />
                </div>
                <p className="mt-2 truncate font-heading text-[14px] font-semibold text-s-ink">Neue Kollektion</p>
              </button>
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => router.push(`/${locale}/discover/saved/${c.id}`)}
                className="text-left transition-transform duration-150 active:scale-[0.98]"
              >
                <div className="grid aspect-[4/3] w-full grid-cols-2 grid-rows-2 gap-0.5 overflow-hidden rounded-2xl border border-s-border bg-s-bg-sunken">
                  {c.covers && c.covers.length > 0 ? (
                    c.covers.slice(0, 4).map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt=""
                        loading="lazy"
                        className={`h-full w-full object-cover ${c.covers.length === 1 ? "col-span-2 row-span-2" : c.covers.length >= 3 && i === 0 ? "row-span-2" : ""}`}
                      />
                    ))
                  ) : (
                    <span className="col-span-2 row-span-2 grid place-items-center text-s-ink-3"><Bookmark size={22} /></span>
                  )}
                </div>
                <p className="mt-2 truncate font-heading text-[14px] font-semibold text-s-ink">{c.name}</p>
                <p className="text-[12px] text-s-ink-2">{c.count} {c.count === 1 ? "Look" : "Looks"}</p>
              </button>
            ))}
            </div>
            {collections.length === 0 && (
              <p className="mt-4 max-w-xs text-[14px] leading-relaxed text-s-ink-2">Tippe bei einem Look auf das Herz, um ihn in einer Kollektion zu speichern.</p>
            )}
          </>
        )}
      </div>

      {/* New-collection prompt (matches the SaveToBoardSheet create styling). */}
      {creating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6" role="dialog" aria-modal="true" aria-label="Neue Kollektion">
          <div className="absolute inset-0 bg-s-ink/40 backdrop-blur-[6px]" onClick={() => { if (!busy) setCreating(false); }} />
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-5 shadow-elevation-3">
            <p className="font-heading text-[16px] font-semibold text-s-ink">Neue Kollektion</p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createCollection(); }}
              maxLength={60}
              placeholder="z. B. Mein Schnitt"
              className="mt-3 w-full rounded-xl border border-s-border bg-s-bg-sunken px-3.5 py-3 font-body text-s-ink placeholder:text-s-ink/40 focus:border-s-accent focus:outline-none focus:ring-2 focus:ring-s-accent-pale"
            />
            <div className="mt-4 flex gap-2.5">
              <button onClick={() => setCreating(false)} className="h-12 flex-1 rounded-pill bg-s-bg-sunken font-heading text-[14px] font-semibold text-s-ink">Abbrechen</button>
              <button onClick={createCollection} disabled={!newName.trim() || busy} className="h-12 flex-1 rounded-pill bg-s-ink font-heading text-[14px] font-semibold text-white transition-opacity disabled:opacity-40">Erstellen</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
