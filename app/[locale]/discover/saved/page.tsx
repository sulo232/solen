"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Bookmark } from "lucide-react";

// V3-D414 (Phase 2): "Gespeichert" — the user's saved collections (boards). Reached from the bookmark entry point
// in the discovery header. Focused view (own back; marketing chrome gated in HideInBooking).
interface Collection { id: string; name: string; count: number; covers: string[]; }

export default function SavedPage() {
  const params = useParams<{ locale: string }>()!;
  const router = useRouter();
  const locale = params.locale;
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/discovery/collections")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) { setCollections(Array.isArray(d?.collections) ? d.collections : []); setLoaded(true); } })
      .catch((err) => { console.error("[Saved] load failed:", err); if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

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
        <h1 className="font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink">Gespeichert</h1>
      </div>

      <div className="mx-auto max-w-7xl px-4">
        {!loaded ? null : collections.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-24 text-center">
            <Bookmark size={28} className="text-s-ink-3" />
            <p className="font-heading text-[16px] font-semibold text-s-ink">Noch nichts gespeichert</p>
            <p className="max-w-xs text-[14px] leading-relaxed text-s-ink-2">Tippe bei einem Look auf das Lesezeichen, um ihn in einer Sammlung zu speichern.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
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
        )}
      </div>
    </main>
  );
}
