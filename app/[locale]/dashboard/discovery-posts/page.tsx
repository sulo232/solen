"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Plus, Upload, Link as LinkIcon, Loader2, Eye, EyeOff, BarChart } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import ToSCheckbox from "@/components-legacy/discovery/ToSCheckbox";
import type { DiscoveryItem, DiscoveryCategory, DiscoveryGender } from "@/lib/types";

const CATEGORY_KEYS = ["hair", "beard", "nails"] as const satisfies readonly DiscoveryCategory[];
type FormCategory = (typeof CATEGORY_KEYS)[number];

const GENDER_KEYS = ["female", "male", "unisex"] as const satisfies readonly DiscoveryGender[];
type FormGender = (typeof GENDER_KEYS)[number];

export default function DiscoveryPostsPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.discoveryPostsPage");

  const categoryLabels: Record<FormCategory, string> = {
    hair: t("categoryHair"),
    beard: t("categoryBeard"),
    nails: t("categoryNails"),
  };

  const genderLabels: Record<FormGender, string> = {
    female: t("genderFemale"),
    male: t("genderMale"),
    unisex: t("genderUnisex"),
  };
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
      setError(t("errorAcceptTos"));
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
        setError(data.message || data.error || t("errorFailedToPost"));
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
      setError(t("errorNetwork"));
    } finally {
      setPosting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-heading text-s-ink mb-4">{t("title")}</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-s-ink/5 rounded-pill p-0.5 w-fit mb-6">
          {(["new", "history"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => setTab(tabKey)}
              className={`px-4 py-2 rounded-pill text-sm font-medium transition-colors ${tab === tabKey ? "bg-white text-s-ink shadow-elevation-1" : "text-s-ink/40"}`}
            >
              {tabKey === "new" ? (
                <span className="flex items-center gap-1.5"><Plus size={14} strokeWidth={1.6} /> {t("tabNew")}</span>
              ) : (
                <span className="flex items-center gap-1.5"><BarChart size={14} strokeWidth={1.6} /> {t("tabHistory")}</span>
              )}
            </button>
          ))}
        </div>

        {tab === "new" && (
          <div className="space-y-4">
            {success && (
              <div className="p-3 rounded-[12px] bg-s-success-bg text-s-success text-sm">
                {t("successCreated")}
              </div>
            )}

            {/* Mode toggle */}
            <div className="flex gap-2">
              {/* selected-ok: dashboard vibrant skin (LOCKFILE §12.2/§12.4), s-coral retired, s-accent is the locked active fill */}
              <button onClick={() => setMode("photo")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-medium transition-colors ${mode === "photo" ? "bg-s-accent text-white" : "bg-s-ink/5 text-s-ink-2"}`}>
                <Upload size={14} strokeWidth={1.6} /> {t("modePhoto")}
              </button>
              <button onClick={() => setMode("tiktok")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-btn text-sm font-medium transition-colors ${mode === "tiktok" ? "bg-s-accent text-white" : "bg-s-ink/5 text-s-ink-2"}`}>
                <LinkIcon size={14} strokeWidth={1.6} /> TikTok
              </button>
            </div>

            {mode === "tiktok" && (
              // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
              <input type="url" value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://www.tiktok.com/@user/video/..." className="w-full px-3 py-2.5 text-sm text-s-ink placeholder:text-s-ink/30" />
            )}

            <div>
              <label className="text-xs font-medium text-s-ink-2 mb-1.5 block">{t("labelCategory")}</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_KEYS.map((key) => (
                  <button key={key} onClick={() => setCategory(key)} className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${category === key ? "bg-s-accent text-white" : "bg-s-ink/5 text-s-ink-2"}`}>{categoryLabels[key]}</button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-s-ink-2 mb-1.5 block">{t("labelGender")}</label>
              <div className="flex gap-1.5">
                {GENDER_KEYS.map((key) => (
                  <button key={key} onClick={() => setGender(key)} className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${gender === key ? "bg-s-accent text-white" : "bg-s-ink/5 text-s-ink-2"}`}>{genderLabels[key]}</button>
                ))}
              </div>
            </div>

            {/* mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17) */}
            <input type="text" value={styleName} onChange={(e) => setStyleName(e.target.value)} placeholder={t("placeholderStyleName")} className="w-full px-3 py-2.5 text-sm text-s-ink placeholder:text-s-ink/30" />
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("placeholderDescription")} rows={2} className="w-full px-3 py-2.5 text-sm text-s-ink placeholder:text-s-ink/30 resize-none" />
            <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("placeholderTags")} className="w-full px-3 py-2.5 text-sm text-s-ink placeholder:text-s-ink/30" />

            <ToSCheckbox checked={tosAccepted} onChange={setTosAccepted} />
            {error && <p className="text-xs text-s-error">{error}</p>}

            <button onClick={handlePost} disabled={posting || !tosAccepted} className="w-full py-3 rounded-btn bg-s-accent hover:brightness-[1.06] text-white font-medium text-sm disabled:opacity-40 transition-[transform,filter] flex items-center justify-center gap-2">
              {posting && <Loader2 size={14} strokeWidth={1.6} className="animate-spin" />}
              {t("publish")}
            </button>
          </div>
        )}

        {tab === "history" && (
          <div>
            {loading ? (
              <p className="text-sm text-s-ink/30 py-8 text-center">{t("loading")}</p>
            ) : posts.length === 0 ? (
              <p className="text-sm text-s-ink/30 py-8 text-center">{t("emptyHistory")}</p>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div key={post.id} className="p-3 rounded-[12px] bg-white border border-s-ink/5 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-btn bg-s-ink/5 shrink-0 overflow-hidden relative">
                      {post.image_url && <Image src={post.image_url} alt="" fill className="object-cover" unoptimized />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-s-ink truncate">{post.style_name || post.category}</p>
                      <div className="flex items-center gap-2 text-xs text-s-ink/40 mt-0.5">
                        <span className="flex items-center gap-0.5">
                          {post.status === "published" ? <Eye size={10} /> : <EyeOff size={10} />}
                          {post.status}
                        </span>
                        <span>{t("likes", { n: post.like_count })}</span>
                        <span>{t("views", { n: post.view_count })}</span>
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
