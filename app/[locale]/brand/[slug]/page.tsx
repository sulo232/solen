"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { MapPin, Star, ExternalLink } from "lucide-react";
import SalonCard from "@/components-legacy/SalonCard";
import Spinner from "@/components-legacy/ui/Spinner";
import type { SalonCard as SalonCardType } from "@/lib/types";

interface SalonGroup {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  website: string | null;
}

export default function BrandPage() {
  const params = useParams()!;
  const slug = params.slug as string;
  const locale = (params.locale as string) ?? "de";
  const t = useTranslations("brandPage");

  const [group, setGroup] = useState<SalonGroup | null>(null);
  const [salons, setSalons] = useState<SalonCardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/brand/${slug}`);
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setGroup(data.group);
        setSalons(data.salons ?? []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-s-ink-2">Marke nicht gefunden</p>
      </div>
    );
  }

  return (
    // V3-D264 (W4, 2026-05-27): retired s-bg-surface → s-bg-sunken; s-coral → s-accent + s-ink per LOCKFILE
    <div className="min-h-screen bg-s-bg-sunken">
      {/* Hero */}
      <div className="bg-white border-b border-s-border">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center gap-6">
          {group.logo_url ? (
            <div className="relative w-20 h-20 rounded-[12px] overflow-hidden bg-s-bg-sunken shrink-0">
              <Image src={group.logo_url} alt={group.name} fill className="object-contain" />
            </div>
          ) : (
            <div className={"w-20 h-20 rounded-[12px] bg-s-bg-sunken flex items-center justify-center text-s-ink text-2xl font-heading shrink-0" /* drift-ok: logo FALLBACK showing an initial, not a glyph on a decorative tile; the imagery floor requires this fallback */}>
              {group.name[0]}
            </div>
          )}
          <div>
            {/* V3-D264: H1 bumped to LOCKFILE Salon-PDP H1 (40/48px, 700, -0.03em) */}
            <h1 className="font-heading text-[clamp(22px,2.8vw,26px)] md:text-[48px] font-semibold text-s-ink leading-[1.05] tracking-[-0.03em]">{group.name}</h1>
            {group.description && (
              <p className="text-sm text-s-ink-2 mt-1 max-w-lg">{group.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-s-ink-2">
                {t("locationsCount", { count: salons.length })}
              </span>
              {group.website && (
                <a
                  href={group.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-s-accent hover:text-s-accent-deep transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Locations grid — V3-D264: h2 to LOCKFILE Section spec */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-4">
          Alle Standorte
        </h2>
        {salons.length === 0 ? (
          <p className="text-sm text-s-ink-2">Noch keine Standorte verfügbar.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {salons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} locale={locale} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
