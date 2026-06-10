"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { Scissors, Star, Share2, MapPin } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { formatCurrency } from "@/lib/format-currency";
import StaffAvailability from "@/components-legacy/staff/StaffAvailability";

interface BarberProfile {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
  cover_photo_url: string | null;
  accent_color: string | null;
  specialties: string[];
  salon_name: string;
  salon_slug: string;
  salon_id: string;
  cut_count: number;
}

interface PortfolioImage {
  id: string;
  image_url: string;
  caption: string | null;
  barber_style: string | null;
  fade_type: string | null;
  is_before_after: boolean;
  before_photo_url: string | null;
}

export default function BarberProfilePage() {
  const params = useParams()!;
  const locale = useLocale();
  const barberSlug = params.barberSlug as string;
  const salonSlug = params.slug as string;

  const [barber, setBarber] = useState<BarberProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    const fetchBarber = async () => {
      try {
        const [profileRes, portfolioRes] = await Promise.all([
          fetch(`/api/barber/${barberSlug}`),
          fetch(`/api/barber/${barberSlug}/portfolio${filter ? `?barber_style=${filter}` : ""}`),
        ]);

        if (profileRes.ok) {
          const data = await profileRes.json();
          setBarber(data.barber);
        }
        if (portfolioRes.ok) {
          const data = await portfolioRes.json();
          setPortfolio(data.portfolio ?? []);
        }
      } catch {
        // Error loading
      }
      setLoading(false);
    };
    fetchBarber();
  }, [barberSlug, filter]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <Spinner />
      </main>
    );
  }

  if (!barber) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-white gap-4">
        <Scissors size={40} className="text-s-ink-2" />
        <p className="text-s-ink-2">Barber nicht gefunden</p>
        {/* V3-D255 (W3): s-coral → s-accent (link role) per LOCKFILE §1 */}
        {/* V3-D337 (overnight T5): decorative accent link → ink underline per §1.5. */}
        <Link href={`/${locale}/salon/${salonSlug}`} className="text-s-ink text-sm underline underline-offset-2 hover:no-underline transition-colors">
          Zurück zum Salon
        </Link>
      </main>
    );
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/${locale}/salon/${salonSlug}/barber/${barberSlug}`;
    if (navigator.share) {
      await navigator.share({ title: barber.name, url });
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const styleFilters = ["fade", "buzz", "crop", "pompadour", "afro", "braids", "razor_art"];

  return (
    <main className="min-h-screen bg-white">
      {/* Cover */}
      <div className="relative h-48 sm:h-64 bg-s-ink/10">
        {barber.cover_photo_url && (
          <Image
            src={barber.cover_photo_url}
            alt={barber.name}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-s-ink/60 to-transparent" />

        {/* Share */}
        <div className="absolute top-4 left-4 right-4 flex justify-end">
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/80 backdrop-blur text-s-ink"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Profile header — V3-D255 (W3): retired s-bg-surface → s-bg-sunken; s-coral / s-amber → tokens per LOCKFILE §1 */}
      <div className="max-w-2xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex items-end gap-4 mb-4">
          <div className="w-24 h-24 rounded-full border-4 border-white bg-s-bg-sunken overflow-hidden shrink-0">
            {barber.avatar_url ? (
              <Image src={barber.avatar_url} alt={barber.name} width={96} height={96} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-s-ink-2">
                <Scissors size={32} />
              </div>
            )}
          </div>
          <div className="pb-1">
            {/* V3-D255: H1 bumped to Salon-PDP H1 spec (40/48px, 700, -0.03em) per LOCKFILE §2 */}
            {/* V3-D337 (overnight T5): tracking -0.03em → -0.02em (canonical Salon-PDP H1 per §2.5). */}
            <h1 className="font-heading text-[clamp(22px,2.8vw,26px)] md:text-[48px] font-semibold text-s-ink leading-[1.05] tracking-[-0.02em]">{barber.name}</h1>
            <Link
              href={`/${locale}/salon/${salonSlug}`}
              // V3-D337 (T5): hover decorative accent → hover ink per §1.5.
              className="text-sm text-s-ink-2 hover:text-s-ink flex items-center gap-1 transition-colors"
            >
              <MapPin size={12} />
              {barber.salon_name}
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 mb-6">
          {/* V3-D337 (T5): Scissors icon decorative accent → ink-3 per §1.5 forbidden. */}
          <div className="flex items-center gap-1.5 text-sm text-s-ink-2">
            <Scissors size={14} className="text-s-ink-3" />
            <span className="font-medium">{barber.cut_count}</span> Schnitte
          </div>
          {barber.specialties?.length > 0 && (
            <div className="flex items-center gap-1.5 text-sm text-s-ink-2">
              <Star size={14} className="fill-s-star text-s-star" />
              {barber.specialties.slice(0, 3).join(", ")}
            </div>
          )}
        </div>

        <StaffAvailability staffId={barber.id} locale={locale} />

        {/* Primary CTA — V3-D255: coral → ink per LOCKFILE §0 rule 2 + copy "Jetzt buchen" per §6 */}
        <Link
          href={`/${locale}/salon/${salonSlug}?staff=${barber.id}`}
          className="block w-full text-center rounded-btn bg-s-ink text-white font-medium py-3 text-sm hover:brightness-[1.06] transition-colors mb-6"
        >
          Jetzt bei {barber.name} buchen
        </Link>

        {/* Portfolio filter — V3-D255: TabPill pattern (active = ink-fill + white, inactive = white + hairline) per LOCKFILE §5 */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          <button
            onClick={() => setFilter("")}
            className={`shrink-0 px-3 py-1.5 rounded-pill text-xs font-medium transition-colors ${
              !filter
                ? "bg-s-ink text-white"
                : "bg-white border border-s-border text-s-ink hover:border-s-ink"
            }`}
          >
            Alle
          </button>
          {styleFilters.map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s === filter ? "" : s)}
              className={`shrink-0 px-3 py-1.5 rounded-pill text-xs font-medium capitalize transition-colors ${
                filter === s
                  ? "bg-s-ink text-white"
                  : "bg-white border border-s-border text-s-ink hover:border-s-ink"
              }`}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Portfolio grid */}
        {portfolio.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pb-8">
            {portfolio.map((img) => (
              <div key={img.id} className="relative aspect-square rounded-[16px] overflow-hidden group">
                <Image
                  src={img.image_url}
                  alt={img.caption ?? "Portfolio"}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 33vw"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-s-ink/0 group-hover:bg-s-ink/30 transition-colors flex items-end">
                  <div className="p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {img.barber_style && (
                      <span className="text-xs text-white bg-s-ink/50 rounded-pill px-2 py-0.5 capitalize">
                        {img.barber_style.replace("_", " ")}
                      </span>
                    )}
                    {img.fade_type && (
                      <span className="text-xs text-white bg-s-ink/50 rounded-pill px-2 py-0.5 ml-1 capitalize">
                        {img.fade_type.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
                {img.is_before_after && (
                  // V3-D255 (W3): badge coral → ink per LOCKFILE (chip pattern, not info-color, picture annotation)
                  <span className="absolute top-2 right-2 text-[12px] bg-s-ink text-white rounded-pill px-2 py-0.5">
                    Vorher/Nachher
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-s-ink/40 text-sm">
            Noch keine Portfolio-Bilder
          </div>
        )}
      </div>
    </main>
  );
}
