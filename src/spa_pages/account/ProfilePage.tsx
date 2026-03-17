'use client';

import React, { useState, useEffect } from "react";
import { Camera, Check } from "lucide-react";
import { Spinner } from "../../components/ui/Spinner";
import type { UserProfile } from "../../lib/types";

interface ProfilePageProps {
  locale?: string;
}

export function ProfilePage({ locale = "de" }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then(setProfile)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const update = (partial: Partial<UserProfile>) => setProfile((p) => p ? { ...p, ...partial } : p);

  if (isLoading) return <div className="flex justify-center pt-20"><Spinner size={32} /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-16">
      <div className="max-w-lg mx-auto px-4">
        <h1 className="font-heading font-bold text-2xl text-dark mb-6">Mein Profil</h1>

        {/* Avatar */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-teal/20 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading font-bold text-3xl text-teal">
                  {profile?.display_name?.[0] ?? "?"}
                </span>
              )}
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 bg-teal rounded-full flex items-center justify-center shadow-sm text-white hover:bg-teal/90">
              <Camera size={14} />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-card shadow-card p-5 flex flex-col gap-4 mb-4">
          {/* Display name */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Anzeigename</label>
            <input
              type="text"
              value={profile?.display_name ?? ""}
              onChange={(e) => update({ display_name: e.target.value })}
              className="w-full border border-gray-200 rounded-button px-3 py-2 text-sm focus:outline-none focus:border-teal"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Über mich</label>
            <textarea
              value={profile?.bio ?? ""}
              onChange={(e) => update({ bio: e.target.value })}
              rows={2}
              className="w-full border border-gray-200 rounded-button px-3 py-2 text-sm resize-none focus:outline-none focus:border-teal"
            />
          </div>

          {/* Hair type */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Haartyp</label>
            <div className="flex flex-wrap gap-2">
              {(["Glatt", "Wellig", "Lockig", "Kraus", "Weiß nicht"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => update({ hair_type: type })}
                  className={`px-3 py-1.5 rounded-pill text-xs border transition-colors ${
                    profile?.hair_type === type ? "bg-teal text-white border-teal" : "border-gray-200 text-dark"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Age group */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Altersgruppe</label>
            <div className="flex flex-wrap gap-2">
              {(["Kind", "Teenager", "Erwachsene", "Senior"] as const).map((age) => (
                <button
                  key={age}
                  onClick={() => update({ age_group: age })}
                  className={`px-3 py-1.5 rounded-pill text-xs border transition-colors ${
                    profile?.age_group === age ? "bg-teal text-white border-teal" : "border-gray-200 text-dark"
                  }`}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-2">Sprache</label>
            <div className="flex gap-2">
              {(["de", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => update({ preferred_locale: lang })}
                  className={`px-4 py-1.5 rounded-pill text-xs border transition-colors ${
                    profile?.preferred_locale === lang ? "bg-dark text-white border-dark" : "border-gray-200 text-dark"
                  }`}
                >
                  {lang === "de" ? "Deutsch" : "English"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-teal text-white font-semibold rounded-button text-sm hover:bg-teal/90 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSaving ? <Spinner size={16} invert /> : saved ? <Check size={16} /> : null}
          {saved ? "Gespeichert!" : "Speichern"}
        </button>
      </div>
    </div>
  );
}
