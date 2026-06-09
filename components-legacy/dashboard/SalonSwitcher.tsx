"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Check, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * SalonSwitcher (V3 / H1) — lets a multi-salon owner change the active salon.
 * Variant A: the salon name is the tap target → a bottom sheet of owned salons
 * with the active one checked. Picking one POSTs /api/salons/active (sets the
 * `solen_active_salon` cookie) and router.refresh()es so every salon-scoped
 * route re-resolves to the new selection. Single-salon owners just see the name
 * (no chevron, not interactive).
 */
interface SalonLite {
  id: string;
  name: string;
  slug: string;
  categories: string[] | null;
}

const catLabel = (c: string[] | null) =>
  c?.[0] ? c[0][0].toUpperCase() + c[0].slice(1) : "Salon";

export default function SalonSwitcher({
  fallbackName,
  variant = "bar",
}: {
  fallbackName?: string;
  variant?: "bar" | "sidebar";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [salons, setSalons] = useState<SalonLite[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    fetch("/api/salons/mine")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setSalons(d.salons ?? []);
        setActiveId(d.salon?.id ?? null);
      })
      .catch((e) => console.error("[SalonSwitcher] fetch failed:", e));
  }, []);

  const active = salons.find((s) => s.id === activeId) ?? null;
  const activeName = active?.name ?? fallbackName ?? "Dein Salon";
  const multi = salons.length > 1;

  const pick = async (id: string) => {
    if (id === activeId) {
      setOpen(false);
      return;
    }
    setSwitching(id);
    try {
      const res = await fetch("/api/salons/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: id }),
      });
      if (res.ok) {
        setActiveId(id);
        setOpen(false);
        router.refresh();
      }
    } catch (e) {
      console.error("[SalonSwitcher] switch failed:", e);
    } finally {
      setSwitching(null);
    }
  };

  const filtered = q
    ? salons.filter((s) => s.name.toLowerCase().includes(q.toLowerCase()))
    : salons;

  const trigger =
    variant === "sidebar" ? (
      <button
        onClick={() => multi && setOpen(true)}
        className="flex-1 min-w-0 flex items-center gap-3 text-left"
        aria-label={multi ? "Salon wechseln" : undefined}
      >
        <div className="w-10 h-10 rounded-full bg-s-ink text-white grid place-items-center text-[15px] font-semibold shrink-0">
          {activeName.trim()[0]?.toUpperCase() ?? "S"}
        </div>
        <span className="flex-1 min-w-0">
          <span className="block font-heading font-semibold text-[15px] tracking-[-0.01em] text-s-ink truncate">
            {activeName}
          </span>
          {multi && <span className="block text-[11.5px] text-s-ink-3">Salon wechseln</span>}
        </span>
        {multi && <ChevronsUpDown size={16} className="text-s-ink-3 shrink-0" />}
      </button>
    ) : (
      <button
        onClick={() => multi && setOpen(true)}
        className="flex items-center gap-1.5 min-w-0"
        aria-label={multi ? "Salon wechseln" : undefined}
      >
        <span className="font-heading text-base truncate text-s-ink">{activeName}</span>
        {multi && <ChevronsUpDown size={15} className="text-s-ink-3 shrink-0" />}
      </button>
    );

  return (
    <>
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[80] bg-s-ink/40 flex items-end sm:items-center sm:justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl max-h-[75vh] flex flex-col shadow-[0_-8px_30px_rgba(10,10,10,0.12)]"
            >
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-s-ink-3">
                  Deine Salons {salons.length}
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Schließen"
                  className="p-1 -mr-1 text-s-ink-3 hover:text-s-ink"
                >
                  <X size={18} />
                </button>
              </div>
              {salons.length > 6 && (
                <div className="px-4 pb-2">
                  <div className="flex items-center gap-2 rounded-xl bg-s-bg-sunken px-3 h-10">
                    <Search size={15} className="text-s-ink-3" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Salon suchen…"
                      className="flex-1 bg-transparent text-[14px] outline-none placeholder:text-s-ink-3"
                    />
                  </div>
                </div>
              )}
              <div className="overflow-y-auto px-2 pb-[max(16px,env(safe-area-inset-bottom))]">
                {filtered.map((s) => {
                  const isActive = s.id === activeId;
                  return (
                    <button
                      key={s.id}
                      onClick={() => pick(s.id)}
                      disabled={!!switching}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                        isActive ? "bg-s-accent/[0.08]" : "hover:bg-s-bg-sunken"
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-[10px] grid place-items-center text-[13px] font-semibold shrink-0 ${
                          isActive ? "bg-s-accent text-white" : "bg-s-ink text-white"
                        }`}
                      >
                        {s.name.trim()[0]?.toUpperCase() ?? "S"}
                      </div>
                      <span className="flex-1 min-w-0">
                        <span className="block font-heading font-semibold text-[14px] text-s-ink truncate">
                          {s.name}
                        </span>
                        <span className="block text-[11.5px] text-s-ink-3 truncate">
                          {catLabel(s.categories)}
                        </span>
                      </span>
                      {switching === s.id ? (
                        <span className="text-[12px] text-s-ink-3 shrink-0">…</span>
                      ) : isActive ? (
                        <Check size={18} className="text-s-accent shrink-0" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
