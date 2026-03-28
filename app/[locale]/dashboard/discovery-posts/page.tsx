"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { Plus, Upload, Link as LinkIcon, Loader2, Eye, EyeOff, BarChart } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ToSCheckbox from "@/components/discovery/ToSCheckbox";
import type { DiscoveryItem, DiscoveryCategory, DiscoveryGender } from "@/lib/types";

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

export default function DiscoveryPostsPage() {
  const locale = useLocale();
  const [tab, setTab] = useState<"new" | "history">("new");
  const [posts, setPosts] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
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

  useEffect(() => {
    if (tab === "history") loadPosts();
  }, [tab]);

  async function loadPosts() {
    setLoading(true);
    try {
      const res = await fetch("/api/discovery/feed?creator=me&limit=50");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.items ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePost() {
    if (!tosAccepted) {
      setError("Please accept the Terms of Service");
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
      if (mode === "tiktok") body.tiktok_url = tiktokUrl;

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
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-heading font-bold text-s-ink dark:text-s-dm-text mb-4">Meine Posts</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-s-ink/5 dark:bg-white/5 rounded-pill p-0.5 w-fit mb-6">
          {(["new", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${tab === t ? "bg-white dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text shadow-sm" : "text-s-ink/40 dark:text-s-dm-text/40"}`}
            >
              {t === "new" ? (
                <span className="flex items-center gap-1.5"><Plus size={14} /> Neuer Post</span>
              ) : (
                <span className="flex items-center gap-1.5"><BarChart size={14} /> Verlauf</span>
              )}
            </button>
          ))}
        </div>

        {tab === "new" && (
          <div className="space-y-4">
            {success && (
              <div className="p-3 rounded-[12px] bg-s-success-bg text-s-success text-sm">
                Post erstellt!
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex gap-2">
              <button onClick={() => setMode("photo")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-medium transition-colors ${mode === "photo" ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60"}`}>
                <Upload size={14} /> Foto
              </button>
              <button onClick={() => setMode("tiktok")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-medium transition-colors ${mode === "tiktok" ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60"}`}>
                <LinkIcon size={14} /> TikTok
              </button>
            </div>

            {mode === "tiktok" && (
              <input type="url" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://www.tiktok.com/@user/video/..." className="w-full px-3 py-2.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30" />
            )}

            <div>
              <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1.5 block">Kategorie</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(({ key, label }) => (
                  <button key={key} onClick={() => setCategory(key)} className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${category === key ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60"}`}>{label}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1.5 block">Geschlecht</label>
              <div className="flex gap-1.5">
                {GENDERS.map(({ key, label }) => (
                  <button key={key} onClick={() => setGender(key)} className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${gender === key ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60"}`}>{label}</button>
                ))}
              </div>
            </div>

            <input type="text" value={styleName} onChange={(e) => setStyleName(e.target.value)} placeholder="Stilname (optional)" className="w-full px-3 py-2.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beschreibung (optional)" rows={2} className="w-full px-3 py-2.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 resize-none" />
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (Kommagetrennt)" className="w-full px-3 py-2.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30" />

            <ToSCheckbox checked={tosAccepted} onChange={setTosAccepted} />
            {error && <p className="text-xs text-s-error">{error}</p>}

            <button onClick={handlePost} disabled={posting || !tosAccepted} className="w-full py-3 rounded-btn bg-s-coral hover:brightness-[1.06] text-white font-medium text-sm disabled:opacity-40 transition-[transform,filter] flex items-center justify-center gap-2">
              {posting && <Loader2 size={14} className="animate-spin" />}
              Veröffentlichen
            </button>
          </div>
        )}

        {tab === "history" && (
          <div>
            {loading ? (
              <p className="text-sm text-s-ink/30 dark:text-s-dm-text/30 py-8 text-center">Laden...</p>
            ) : posts.length === 0 ? (
              <p className="text-sm text-s-ink/30 dark:text-s-dm-text/30 py-8 text-center">Noch keine Posts</p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="p-3 rounded-[12px] bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-btn bg-s-ink/5 dark:bg-white/5 shrink-0 overflow-hidden">
                      {post.image_url && <img src={post.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-s-ink dark:text-s-dm-text truncate">{post.style_name || post.category}</p>
                      <div className="flex items-center gap-2 text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          {post.status === "published" ? <Eye size={10} /> : <EyeOff size={10} />}
                          {post.status}
                        </span>
                        <span>{post.like_count} likes</span>
                        <span>{post.view_count} views</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
