"use client";

import { useEffect, useState } from "react";
import { Loader2, Check, LayoutGrid } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

const SECTION_LABELS: Record<string, string> = {
  quartier: "Entdecke dein Quartier",
  trending: "Trending in Basel",
  nearby: "In deiner Nahe",
  new_salons: "Neue Salons",
  rebook: "Wieder buchen?",
  reviews: "Bewertungen Karussell",
  last_minute: "Last-Minute Angebote",
  featured: "Beliebte Salons",
  social_proof: "Social Proof Strip",
  partner_cta: "Partner CTA Banner",
};

const SECTION_ORDER = [
  "featured",
  "last_minute",
  "partner_cta",
  "trending",
  "nearby",
  "new_salons",
  "quartier",
  "rebook",
  "reviews",
  "social_proof",
];

export default function HomepageAdminPage() {
  const [sections, setSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/homepage-sections")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data) => setSections(data.sections ?? {}))
      .catch((err) => console.error("[DashboardHomepageAdmin] failed to fetch homepage sections:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = (key: string) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/homepage-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="font-heading font-bold text-2xl text-s-ink">
          Homepage Sektionen
        </h1>
        <p className="text-sm text-s-ink/50 font-body mt-1">
          Steuere welche Sektionen auf der Homepage sichtbar sind.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-s-coral" />
        </div>
      ) : (
        <div className="bg-white rounded-[12px] shadow-warm-md p-6 max-w-xl space-y-1">
          {SECTION_ORDER.map((key) => (
            <div
              key={key}
              className="flex items-center justify-between py-3 border-b border-s-ink/5 last:border-0"
            >
              <div className="flex items-center gap-3">
                <LayoutGrid size={16} className="text-s-ink/30" />
                <span className="text-sm font-medium text-s-ink font-body">
                  {SECTION_LABELS[key] ?? key}
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!!sections[key]}
                onClick={() => handleToggle(key)}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-pill border-2 border-transparent transition-colors duration-200",
                  sections[key]
                    ? "bg-s-coral"
                    : "bg-s-ink/10",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 rounded-pill bg-white shadow-warm-sm transition-transform duration-200",
                    sections[key] ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-btn bg-s-coral text-white text-sm font-medium hover:brightness-[1.06] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Speichern
            </button>
            {saved && (
              <span className="text-sm text-s-coral flex items-center gap-1">
                <Check size={14} /> Gespeichert
              </span>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
