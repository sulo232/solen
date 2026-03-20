"use client";

import { useState } from "react";
import { Share2, Check, Link2, MessageCircle, Download } from "lucide-react";
import type { DiscoveryItem } from "@/lib/types";

interface ShareButtonProps {
  item: DiscoveryItem;
}

export default function ShareButton({ item }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const shareWhatsApp = () => {
    const text = `${item.style_name ?? "Check this out"} — ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const downloadImage = async () => {
    if (!item.image_url) return;
    try {
      const res = await fetch(item.image_url);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${item.style_name ?? "discovery"}.webp`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // Silent
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-s-ink/5 dark:hover:bg-white/5 text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
        aria-label="Share"
      >
        <Share2 size={18} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 rounded-card shadow-warm-md py-1 min-w-[160px]">
            <button onClick={copyLink} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-s-ink dark:text-s-dm-text hover:bg-s-ink/5 dark:hover:bg-white/5">
              {copied ? <Check size={14} className="text-green-500" /> : <Link2 size={14} />}
              {copied ? "Copied!" : "Copy link"}
            </button>
            <button onClick={shareWhatsApp} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-s-ink dark:text-s-dm-text hover:bg-s-ink/5 dark:hover:bg-white/5">
              <MessageCircle size={14} /> WhatsApp
            </button>
            {item.media_type === "photo" && item.image_url && (
              <button onClick={downloadImage} className="flex items-center gap-2 w-full px-3 py-2 text-xs text-s-ink dark:text-s-dm-text hover:bg-s-ink/5 dark:hover:bg-white/5">
                <Download size={14} /> Download
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
