"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Star, ArrowLeft, Sparkles, Award } from "lucide-react";
import TechPortfolio from "@/components-legacy/nail/TechPortfolio";
import Spinner from "@/components-legacy/ui/Spinner";

interface TechProfile {
  id: string;
  name: string;
  avatar_url: string | null;
  specialties: string[];
  is_active: boolean;
  salon_id: string;
  salon_name?: string;
  salon_slug?: string;
  avg_rating?: number;
  review_count?: number;
  design_count?: number;
  tier_label?: string;
}

export default function NailTechProfilePage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const [tech, setTech] = useState<TechProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const res = await fetch(`/api/nail-tech/${id}/portfolio`);
        if (!res.ok) return;
        const data = await res.json();
        // The portfolio endpoint returns images; we need staff info from a separate source
        // For now, use the staff data embedded in the response or fetch from salon
        setTech(data.staff ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <Spinner />
      </main>
    );
  }

  if (!tech) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
        <p className="text-s-ink/50 mb-4">Nail Tech nicht gefunden</p>
        <Link href={`/${locale}`} className="text-s-coral text-sm hover:underline">
          Zurück zur Startseite
        </Link>
      </main>
    );
  }

  const TIER_COLORS: Record<string, string> = {
    junior: "bg-s-sand/20 text-s-sand-text",
    senior: "bg-s-blue/20 text-s-blue",
    master: "bg-s-coral/20 text-s-coral",
    specialist: "bg-s-plum/20 text-s-plum",
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-s-ink/5">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link
            href={tech.salon_slug ? `/${locale}/salon/${tech.salon_slug}` : `/${locale}`}
            className="inline-flex items-center gap-1 text-sm text-s-ink/50 hover:text-s-coral mb-4"
          >
            <ArrowLeft size={14} />
            {tech.salon_name ?? "Zurück"}
          </Link>

          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-s-bg-sunken overflow-hidden shrink-0 flex items-center justify-center">
              {tech.avatar_url ? (
                <Image
                  src={tech.avatar_url}
                  alt={tech.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-2xl font-bold text-s-ink/30">
                  {tech.name[0]}
                </span>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-heading text-xl font-bold text-s-ink">
                  {tech.name}
                </h1>
                {tech.tier_label && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-pill ${TIER_COLORS[tech.tier_label] ?? "bg-s-ink/5 text-s-ink/50"}`}>
                    {tech.tier_label.charAt(0).toUpperCase() + tech.tier_label.slice(1)}
                  </span>
                )}
              </div>

              {tech.specialties?.length > 0 && (
                <p className="text-sm text-s-ink/50 mt-0.5">
                  {tech.specialties.join(" · ")}
                </p>
              )}

              <div className="flex items-center gap-3 mt-1.5">
                {tech.avg_rating != null && (
                  <span className="flex items-center gap-1 text-sm text-s-ink/70">
                    <Star size={14} className="fill-s-amber text-s-amber" />
                    {tech.avg_rating.toFixed(1)}
                    {tech.review_count != null && (
                      <span className="text-s-ink/30">({tech.review_count})</span>
                    )}
                  </span>
                )}
                {tech.design_count != null && tech.design_count > 0 && (
                  <span className="flex items-center gap-1 text-sm text-s-ink/50">
                    <Award size={14} />
                    {tech.design_count} Designs
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Book CTA */}
          {tech.salon_slug && (
            <Link
              href={`/${locale}/salon/${tech.salon_slug}?staffId=${tech.id}`}
              className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-btn bg-s-coral text-white font-medium text-sm hover:brightness-[1.06] transition-colors"
            >
              <Sparkles size={16} />
              Bei {tech.name} buchen
            </Link>
          )}
        </div>
      </div>

      {/* Portfolio grid */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h2 className="font-heading text-base text-s-ink mb-4">
          Portfolio
        </h2>
        <TechPortfolio
          staffId={id}
          staffName={tech.name}
          salonSlug={tech.salon_slug}
        />
      </div>
    </main>
  );
}
