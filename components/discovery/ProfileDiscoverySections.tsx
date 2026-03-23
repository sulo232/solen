"use client";

import { useState, useEffect } from "react";
import { Palette, Grid3X3 } from "lucide-react";
import UserPostsSection from "./UserPostsSection";

interface ProfileDiscoverySectionsProps {
  userId: string;
  profile: {
    disc_gender: string | null;
    disc_hair_texture: string | null;
    disc_hair_length: string | null;
    disc_face_shape: string | null;
    disc_skin_tone: string | null;
    disc_preferred_categories: string[] | null;
  };
}

const TEXTURE_OPTIONS = ["straight", "wavy", "curly", "coily"];
const LENGTH_OPTIONS = ["short", "medium", "long"];
const FACE_SHAPE_OPTIONS = ["oval", "round", "square", "heart", "oblong"];
const GENDER_OPTIONS = ["female", "male"];

export default function ProfileDiscoverySections({ userId, profile }: ProfileDiscoverySectionsProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    disc_gender: profile.disc_gender ?? "",
    disc_hair_texture: profile.disc_hair_texture ?? "",
    disc_hair_length: profile.disc_hair_length ?? "",
    disc_face_shape: profile.disc_face_shape ?? "",
    disc_skin_tone: profile.disc_skin_tone ?? "",
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* My Looks */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Grid3X3 size={16} className="text-s-coral" />
          <h3 className="text-base font-heading font-semibold text-s-ink dark:text-s-dm-text">Meine Looks</h3>
        </div>
        <UserPostsSection userId={userId} />
      </div>

      {/* Discovery Preferences */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Palette size={16} className="text-s-blue" />
            <h3 className="text-base font-heading font-semibold text-s-ink dark:text-s-dm-text">Discovery Preferences</h3>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className="text-xs text-s-coral hover:underline"
          >
            {saving ? "Saving..." : editing ? "Save" : "Edit"}
          </button>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Gender</label>
              <div className="flex gap-1.5">
                {GENDER_OPTIONS.map((g) => (
                  <button key={g} onClick={() => setForm({ ...form, disc_gender: g })} className={`px-3 py-1.5 rounded-pill text-xs font-medium ${form.disc_gender === g ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`}>
                    {g === "female" ? "Women" : "Men"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Hair Texture</label>
              <div className="flex flex-wrap gap-1.5">
                {TEXTURE_OPTIONS.map((t) => (
                  <button key={t} onClick={() => setForm({ ...form, disc_hair_texture: t })} className={`px-3 py-1.5 rounded-pill text-xs font-medium capitalize ${form.disc_hair_texture === t ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Hair Length</label>
              <div className="flex gap-1.5">
                {LENGTH_OPTIONS.map((l) => (
                  <button key={l} onClick={() => setForm({ ...form, disc_hair_length: l })} className={`px-3 py-1.5 rounded-pill text-xs font-medium capitalize ${form.disc_hair_length === l ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mb-1 block">Face Shape</label>
              <div className="flex flex-wrap gap-1.5">
                {FACE_SHAPE_OPTIONS.map((f) => (
                  <button key={f} onClick={() => setForm({ ...form, disc_face_shape: f })} className={`px-3 py-1.5 rounded-pill text-xs font-medium capitalize ${form.disc_face_shape === f ? "bg-s-coral text-white" : "bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60"}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.disc_gender && <span className="text-xs px-2 py-1 rounded-pill bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60 capitalize">{profile.disc_gender}</span>}
            {profile.disc_hair_texture && <span className="text-xs px-2 py-1 rounded-pill bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60 capitalize">{profile.disc_hair_texture}</span>}
            {profile.disc_hair_length && <span className="text-xs px-2 py-1 rounded-pill bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60 capitalize">{profile.disc_hair_length}</span>}
            {profile.disc_face_shape && <span className="text-xs px-2 py-1 rounded-pill bg-s-ink/5 dark:bg-white/5 text-s-ink/60 dark:text-s-dm-text/60 capitalize">{profile.disc_face_shape}</span>}
            {!profile.disc_gender && !profile.disc_hair_texture && (
              <span className="text-xs text-s-ink/30 dark:text-s-dm-text/30">Not set — edit to personalize your feed</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
