"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/app/[locale]/_components/primitives";
import GalleryManager from "@/components-legacy/dashboard/GalleryManager";
import SalonAboutEditor from "@/components-legacy/dashboard/SalonAboutEditor";

export default function GalleryPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("dashboard.galleryPage");
  
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
          <Skeleton className="h-8 w-48 mb-2" rounded={8} />
          <Skeleton className="h-4 w-96" rounded={8} />
        </div>
        <Skeleton className="h-[400px] w-full" rounded={24} />
      </div>
    );
  }

  if (!salon) return null;

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="font-heading text-[28px] text-s-ink tracking-[0.01em]">
          {t("title")}
        </h1>
        <p className="text-s-ink-2 mt-1">
          {t("description")}
        </p>
      </div>

      <GalleryManager
        salonId={salon.id}
        salonCategories={salon.categories || []}
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
