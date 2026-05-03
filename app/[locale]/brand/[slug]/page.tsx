"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { MapPin, Star, ExternalLink } from "lucide-react";
import SalonCard from "@/components/SalonCard";
import Spinner from "@/components/ui/Spinner";
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
  const params = useParams();
  const slug = params.slug as string;
  const locale = (params.locale as string) ?? "de";

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
        <p className="text-s-ink/50">Marke nicht gefunden</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s-bg-surface">
      {/* Hero */}
      <div className="bg-white border-b border-s-ink/5">
        <div className="max-w-5xl mx-auto px-4 py-10 flex flex-col sm:flex-row items-center gap-6">
          {group.logo_url ? (
            <div className="relative w-20 h-20 rounded-[12px] overflow-hidden bg-s-bg-sunken shrink-0">
              <Image src={group.logo_url} alt={group.name} fill className="object-contain" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-[12px] bg-s-coral/10 flex items-center justify-center text-s-coral text-2xl font-heading shrink-0">
              {group.name[0]}
            </div>
          )}
          <div>
            <h1 className="font-heading text-2xl text-s-ink">{group.name}</h1>
            {group.description && (
              <p className="text-sm text-s-ink/60 mt-1 max-w-lg">{group.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-s-ink/40">
                {salons.length} {salons.length === 1 ? "Standort" : "Standorte"}
              </span>
              {group.website && (
                <a
                  href={group.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-s-coral hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Locations grid */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="font-heading text-lg text-s-ink mb-4">
          Alle Standorte
        </h2>
        {salons.length === 0 ? (
          <p className="text-sm text-s-ink/40">Noch keine Standorte verfügbar.</p>
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
