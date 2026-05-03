"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { X, Plus, Check, FolderOpen } from "lucide-react";
import { useTranslations } from "next-intl";

interface Board {
  id: string;
  name: string;
  image_count: number;
}

interface InspoImage {
  id: string;
  image_url: string;
  board_id: string | null;
}

interface InspoBoardProps {
  open: boolean;
  onClose: () => void;
  onSelect: (imageIds: string[]) => void;
}

export default function InspoBoard({ open, onClose, onSelect }: InspoBoardProps) {
  const t = useTranslations("booking") as any;
  const [boards, setBoards] = useState<Board[]>([]);
  const [images, setImages] = useState<InspoImage[]>([]);
  const [activeBoard, setActiveBoard] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newBoardName, setNewBoardName] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [loading, setLoading] = useState(true);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Fetch boards
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch("/api/nail-inspo/boards")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.boards) setBoards(d.boards); })
      .catch((err) => console.error("[InspoBoard] failed to load inspo boards:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open]);

  // Fetch images for active board
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const params = new URLSearchParams();
    if (activeBoard) params.set("board_id", activeBoard);
    fetch(`/api/nail-inspo/images?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d?.images) setImages(d.images); })
      .catch((err) => console.error("[InspoBoard] failed to load inspo images:", err));
    return () => { cancelled = true; };
  }, [open, activeBoard]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCreateBoard = async () => {
    if (!newBoardName.trim()) return;
    try {
      const res = await fetch("/api/nail-inspo/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBoardName.trim() }),
      });
      if (!res.ok) return;
      const d = await res.json();
      setBoards((prev) => [...prev, d.board]);
      setNewBoardName("");
      setShowNewForm(false);
    } catch {
      // silent fail — board creation is non-critical
    }
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected));
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-s-ink/40" onClick={onClose} />

      {/* Modal */}
      <div role="dialog" aria-modal="true" className="relative w-full sm:max-w-lg max-h-[80vh] bg-[--raised] rounded-t-[24px] sm:rounded-[24px] shadow-elevation-3 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-s-ink/5">
          <h3 className="font-heading text-s-ink">{t("board_title")}</h3>
          <button onClick={onClose} aria-label={t("close")} className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-s-ink/40 hover:bg-s-ink/5:bg-white/5 rounded-pill transition-colors duration-150">
            <X size={18} />
          </button>
        </div>

        {/* Board tabs */}
        <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto border-b border-s-ink/5 scrollbar-hide">
          <button
            onClick={() => setActiveBoard(null)}
            className={`shrink-0 text-[11px] font-heading uppercase tracking-[.06em] px-3 py-1 rounded-pill border transition-colors duration-150 ${
              activeBoard === null
                ? "bg-s-coral text-white border-s-coral"
                : "border-s-ink/10 text-s-ink/60 hover:brightness-[1.06]"
            }`}
          >
            {t("board_all")}
          </button>
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => setActiveBoard(b.id)}
              className={`shrink-0 text-[11px] font-heading uppercase tracking-[.06em] px-3 py-1 rounded-pill border transition-colors duration-150 ${
                activeBoard === b.id
                  ? "bg-s-coral text-white border-s-coral"
                  : "border-s-ink/10 text-s-ink/60 hover:brightness-[1.06]"
              }`}
            >
              {b.name} ({b.image_count})
            </button>
          ))}
          <button
            onClick={() => setShowNewForm(true)}
            aria-label={t("board_new")}
            className="shrink-0 text-xs px-2 py-1 rounded-pill border border-dashed border-s-ink/20 text-s-ink/40 hover:border-s-coral/30"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* New board form */}
        {showNewForm && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-s-ink/5">
            <input
              value={newBoardName}
              onChange={(e) => setNewBoardName(e.target.value)}
              placeholder={t("board_name_placeholder")}
              className="flex-1 text-sm px-3 py-1.5 rounded-input border border-s-ink/10 bg-transparent text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/15 focus:border-s-coral transition-[border-color,box-shadow] duration-150"
              onKeyDown={(e) => e.key === "Enter" && handleCreateBoard()}
            />
            <button onClick={handleCreateBoard} className="text-[11px] font-heading uppercase tracking-[.04em] px-3 py-1.5 rounded-pill active:scale-[0.97] bg-s-coral text-white hover:brightness-[1.06] transition-[transform,filter] duration-150">
              {t("board_create")}
            </button>
            <button onClick={() => setShowNewForm(false)} aria-label={t("close")} className="text-xs text-s-ink/40">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-sm text-s-ink/40 py-8">{t("board_loading")}</p>
          ) : images.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen size={32} className="mx-auto text-s-ink/20 mb-2" />
              <p className="text-sm text-s-ink/40">{t("board_empty")}</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => toggleSelect(img.id)}
                  className={`relative aspect-square rounded-card overflow-hidden border-2 transition-[border-color] duration-150 ${
                    selected.has(img.id) ? "border-s-coral ring-2 ring-s-coral/30" : "border-transparent"
                  }`}
                >
                  <Image src={img.image_url} alt="" fill className="object-cover" />
                  {selected.has(img.id) && (
                    <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-s-coral flex items-center justify-center">
                      <Check size={12} className="text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {selected.size > 0 && (
          <div className="px-4 py-3 border-t border-s-ink/5">
            <button
              onClick={handleConfirm}
              className="w-full py-2.5 rounded-pill active:scale-[0.97] bg-s-coral text-white text-xs font-heading uppercase tracking-[.04em] hover:brightness-[1.06] transition-[transform,filter] duration-150 shadow-elevation-2"
            >
              {t("board_select_images", { count: selected.size })}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
