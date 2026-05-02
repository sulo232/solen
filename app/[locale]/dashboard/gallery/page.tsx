"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Skeleton from "@/components/ui/Skeleton";
import GalleryManager from "@/components/dashboard/GalleryManager";
import SalonAboutEditor from "@/components/dashboard/SalonAboutEditor";

export default function GalleryPage() {
  const locale = useLocale();
  const router = useRouter();
  
  const [salon, setSalon] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSalon = () => {
    fetch("/api/salons/mine")
      .then((res) => {
        if (!res.ok) throw new Error("Not authorized");
        return res.json();
      })
      .then((data) => {
        if (!data.salon) {
          router.push(`/${locale}/dashboard`);
          return;
        }
        setSalon(data.salon);
      })
      .catch((err) => {
        console.error("Gallery page error:", err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSalon();
  }, [locale, router]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-[24px]" />
      </div>
    );
  }

  if (!salon) return null;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-[28px] text-s-ink tracking-[-0.02em]">
          Fotos & Galerie
        </h1>
        <p className="text-s-ink/60 mt-1">
          Verwalte die Fotos deines Salons. Diese werden auf deiner Profilseite und in den Suchergebnissen angezeigt.
        </p>
      </div>

      <GalleryManager
        salonId={salon.id}
        galleryUrls={salon.gallery_urls || []}
        coverPhotoUrl={salon.cover_photo_url}
        onUpdate={fetchSalon}
      />

      <SalonAboutEditor 
        salon={salon}
        onUpdate={fetchSalon}
      />
    </div>
  );
}
