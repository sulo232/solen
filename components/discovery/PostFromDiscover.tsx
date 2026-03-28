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

const L: Record<string, {
  newPost: string; created: string; photo: string; tiktok: string;
  uploadPhoto: string; categoryLabel: string; genderLabel: string;
  styleNamePh: string; descPh: string; tagsPh: string; post: string;
  tosError: string; networkError: string;
  hair: string; beard: string; nails: string; makeup: string; waxing: string;
  women: string; men: string; unisex: string;
}> = {
  de: {
    newPost: "Neuer Post", created: "Post erstellt!", photo: "Foto", tiktok: "TikTok",
    uploadPhoto: "Foto hochladen", categoryLabel: "Kategorie", genderLabel: "Geschlecht",
    styleNamePh: "Stilname (optional)", descPh: "Beschreibung (optional)", tagsPh: "Tags (Komma-getrennt)", post: "Veröffentlichen",
    tosError: "Bitte akzeptiere die Nutzungsbedingungen", networkError: "Netzwerkfehler",
    hair: "Haar", beard: "Bart", nails: "Nägel", makeup: "Make-up", waxing: "Waxing",
    women: "Frauen", men: "Männer", unisex: "Unisex",
  },
  en: {
    newPost: "New Post", created: "Post created!", photo: "Photo", tiktok: "TikTok",
    uploadPhoto: "Upload photo", categoryLabel: "Category", genderLabel: "Gender",
    styleNamePh: "Style name (optional)", descPh: "Description (optional)", tagsPh: "Tags (comma-separated)", post: "Post",
    tosError: "Please accept the Terms of Service", networkError: "Network error",
    hair: "Hair", beard: "Beard", nails: "Nails", makeup: "Makeup", waxing: "Waxing",
    women: "Women", men: "Men", unisex: "Unisex",
  },
  fr: {
    newPost: "Nouveau post", created: "Post créé !", photo: "Photo", tiktok: "TikTok",
    uploadPhoto: "Télécharger une photo", categoryLabel: "Catégorie", genderLabel: "Genre",
    styleNamePh: "Nom du style (optionnel)", descPh: "Description (optionnel)", tagsPh: "Tags (séparés par des virgules)", post: "Publier",
    tosError: "Veuillez accepter les conditions d'utilisation", networkError: "Erreur réseau",
    hair: "Cheveux", beard: "Barbe", nails: "Ongles", makeup: "Maquillage", waxing: "Épilation",
    women: "Femmes", men: "Hommes", unisex: "Unisexe",
  },
  it: {
    newPost: "Nuovo post", created: "Post creato!", photo: "Foto", tiktok: "TikTok",
    uploadPhoto: "Carica foto", categoryLabel: "Categoria", genderLabel: "Genere",
    styleNamePh: "Nome dello stile (opzionale)", descPh: "Descrizione (opzionale)", tagsPh: "Tag (separati da virgole)", post: "Pubblica",
    tosError: "Accetta i termini di servizio", networkError: "Errore di rete",
    hair: "Capelli", beard: "Barba", nails: "Unghie", makeup: "Trucco", waxing: "Ceretta",
    women: "Donne", men: "Uomini", unisex: "Unisex",
  },
};

export default function PostFromDiscover({ isAuthenticated, onAuthRequired }: PostFromDiscoverProps) {
  const locale = useLocale();
  const t = L[locale] ?? L.en;
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

  const CATEGORIES: { key: DiscoveryCategory; label: string }[] = [
    { key: "hair", label: t.hair },
    { key: "beard", label: t.beard },
    { key: "nails", label: t.nails },
    { key: "makeup", label: t.makeup },
    { key: "waxing", label: t.waxing },
  ];

  const GENDERS: { key: DiscoveryGender; label: string }[] = [
    { key: "female", label: t.women },
    { key: "male", label: t.men },
    { key: "unisex", label: t.unisex },
  ];

  const handleOpen = () => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }
    setOpen(true);
  };

  const handlePost = async () => {
    if (!tosAccepted) {
      setError(t.tosError);
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
        tags: tags.split(",").map((s) => s.trim()).filter(Boolean),
        tos_accepted: true,
      };

      if (mode === "tiktok") {
        body.tiktok_url = tiktokUrl;
      }

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
      setError(t.networkError);
    } finally {
      setPosting(false);
    }
  };

  return (
    <>
      {/* Floating + button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-24 right-4 z-40 w-12 h-12 rounded-full flex items-center justify-center text-white active:scale-[0.96] transition-[transform,filter] duration-150 shadow-coral-glow"
        style={{
          background: "#E8624A",
          boxShadow: "0 4px 12px rgba(232,98,74,.40), 0 12px 32px rgba(232,98,74,.22)"
        }}
        aria-label={t.newPost}
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-s-ink/40" onClick={() => setOpen(false)} />
          <div
            className="relative w-full sm:max-w-md bg-white dark:bg-s-dm-surface rounded-t-[16px] sm:rounded-[16px] p-5 max-h-[85vh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={t.newPost}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-bold text-s-ink dark:text-s-dm-text">{t.newPost}</h2>
              <button onClick={() => setOpen(false)} className="text-s-ink/30 dark:text-s-dm-text/30" aria-label="Close">
                <X size={20} />
              </button>
            </div>

            {success ? (
              <div className="text-center py-8">
                <p className="text-s-coral font-medium">{t.created}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button
                    aria-pressed={mode === "photo"}
                    onClick={() => setMode("photo")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-colors duration-150 ${mode === "photo" ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`}
                  >
                    <Upload size={14} /> {t.photo}
                  </button>
                  <button
                    aria-pressed={mode === "tiktok"}
                    onClick={() => setMode("tiktok")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-btn text-[11px] font-heading font-bold uppercase tracking-[.06em] transition-colors duration-150 ${mode === "tiktok" ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`}
                  >
                    <LinkIcon size={14} /> {t.tiktok}
                  </button>
                </div>

                {mode === "tiktok" && (
                  <input
                    type="url"
                    value={tiktokUrl}
                    onChange={(e) => setTiktokUrl(e.target.value)}
                    placeholder="https://www.tiktok.com/@user/video/..."
                    className="w-full px-3 py-2.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30"
                  />
                )}

                {mode === "photo" && (
                  <div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" aria-label={t.uploadPhoto} />
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full py-8 rounded-btn border-2 border-dashed border-s-ink/10 dark:border-white/10 text-sm text-s-ink/40 dark:text-s-dm-text/40 hover:border-s-coral/30 transition-colors"
                    >
                      {t.uploadPhoto}
                    </button>
                  </div>
                )}

                {/* Category */}
                <div>
                  <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">{t.categoryLabel}</label>
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
                  <label className="text-xs font-medium text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">{t.genderLabel}</label>
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
                  placeholder={t.styleNamePh}
                  className="w-full px-3 py-2.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30"
                />

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t.descPh}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 resize-none"
                />

                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t.tagsPh}
                  className="w-full px-3 py-2.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg border border-s-ink/10 dark:border-white/5 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30"
                />

                <ToSCheckbox checked={tosAccepted} onChange={setTosAccepted} />

                {error && <p className="text-xs text-s-error">{error}</p>}

                <button
                  onClick={handlePost}
                  disabled={posting || !tosAccepted}
                  className="w-full py-3 rounded-pill bg-s-coral hover:brightness-[1.06] text-white font-medium text-sm disabled:opacity-40 transition-[transform,filter] duration-150 shadow-coral-glow flex items-center justify-center gap-2"
                >
                  {posting && <Loader2 size={14} className="animate-spin" />}
                  {t.post}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
