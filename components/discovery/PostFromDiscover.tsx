"use client";

import { useState, useRef } from "react";
import { Plus, X, Upload, Link as LinkIcon, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import ToSCheckbox from "./ToSCheckbox";
import type { DiscoveryCategory, DiscoveryGender } from "@/lib/types";

interface PostFromDiscoverProps {
  isAuthenticated: boolean;
  onAuthRequired?: () => void;
}

const CATEGORIES: { key: DiscoveryCategory; label: string }[] = [
  { key: "hair", label: "Hair" },
  { key: "beard", label: "Beard" },
  { key: "nails", label: "Nails" },
  { key: "makeup", label: "Makeup" },
  { key: "waxing", label: "Waxing" },
];

const GENDERS: { key: DiscoveryGender; label: string }[] = [
  { key: "female", label: "Women" },
  { key: "male", label: "Men" },
  { key: "unisex", label: "Unisex" },
];

export default function PostFromDiscover({ isAuthenticated, onAuthRequired }: PostFromDiscoverProps) {
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"photo" | "tiktok">("photo");
  const [category, setCategory] = useState<DiscoveryCategory>("hair");
  const [gender, setGender] = useState<DiscoveryGender>("female");
  const [styleName, setStyleName] = useState("");
  const [description, setDescription] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [tags, setTags] = useState("");
  const [tosAccepted, setTosAccepted] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleOpen = () => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }
    setOpen(true);
  };

  const handlePost = async () => {
    if (!tosAccepted) {
      setError(locale === "de" ? "Bitte akzeptiere die Nutzungsbedingungen" : "Please accept the Terms of Service");
      return;
    }
    setError("");
    setPosting(true);

    try {
      const body: Record<string, unknown> = {
        category,
        gender,
        media_type: mode === "photo" ? "photo" : "video",
        style_name: styleName || undefined,
        description: description || undefined,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        tos_accepted: true,
      };

      if (mode === "tiktok") {
        body.tiktok_url = tiktokUrl;
      }

      // For photo mode, we'd need to upload first — simplified here
      // In production, upload to Supabase Storage first, then reference

      const res = await fetch("/api/discovery/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || data.error || "Failed to post");
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        setStyleName("");
        setDescription("");
        setTiktokUrl("");
        setTags("");
        setTosAccepted(false);
      }, 2000);
    } catch {
      setError("Network error");
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      {/* Floating + button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full bg-s-coral hover:bg-s-coral-hover text-white shadow-warm-md flex items-center justify-center transition-colors"
        aria-label="Post"
      >
        <Plus size={24} />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative w-full sm:max-w-md bg-white dark:bg-s-dm-surface rounded-t-2xl sm:rounded-card p-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-bold text-s-ink dark:text-s-dm-text">
                {locale === "de" ? "Neuer Post" : "New Post"}
              </h2>
              <button onClick={() => setOpen(false)} className="text-s-ink/30 dark:text-s-dm-text/30">
                <X size={20} />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <p className="text-s-coral font-medium">
                  {locale === "de" ? "Post erstellt!" : "Post created!"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setMode("photo")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-button text-sm font-medium transition-colors ${mode === "photo" ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`}
                  >
                    <Upload size={14} /> Photo
                  </button>
                  <button
                    onClick={() => setMode("tiktok")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-button text-sm font-medium transition-colors ${mode === "tiktok" ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`}
                  >
                    <LinkIcon size={14} /> TikTok
                  </button>
                </div>

                {mode === "tiktok" && (
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@user/video/..."
                    className="w-full px-3 py-2.5 rounded-button bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30"
                  />
                )}

                {mode === "photo" && (
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full py-8 rounded-button border-2 border-dashed border-s-ink/10 dark:border-white/10 text-sm text-s-ink/40 dark:text-s-dm-text/40 hover:border-s-coral/30 transition-colors"
                    >
                      {locale === "de" ? "Foto hochladen" : "Upload photo"}
                    </button>
                  </div>
                )}

                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setCategory(key)}
                        className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${category === key ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Gender */}
                <div>
                  <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Gender</label>
                  <div className="flex gap-1.5">
                    {GENDERS.map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setGender(key)}
                        className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${gender === key ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <input
                  type="text"
                  value={styleName}
                  onChange={(e) => setStyleName(e.target.value)}
                  placeholder={locale === "de" ? "Stilname (optional)" : "Style name (optional)"}
                  className="w-full px-3 py-2.5 rounded-button bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30"
                />

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={locale === "de" ? "Beschreibung (optional)" : "Description (optional)"}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-button bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 resize-none"
                />

                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Tags (comma-separated)"
                  className="w-full px-3 py-2.5 rounded-button bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30"
                />

                <ToSCheckbox checked={tosAccepted} onChange={setTosAccepted} />

                {error && <p className="text-xs text-red-500">{error}</p>}

                <button
                  onClick={handlePost}
                  disabled={posting || !tosAccepted}
                  className="w-full py-3 rounded-button bg-s-coral hover:bg-s-coral-hover text-white font-medium text-sm disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                >
                  {posting && <Loader2 size={14} className="animate-spin" />}
                  {locale === "de" ? "Veröffentlichen" : "Post"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
