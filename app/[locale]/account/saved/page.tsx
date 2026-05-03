"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Bookmark, AlertCircle } from "lucide-react";
import SalonCard from "@/components/SalonCard";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import type { SalonCard as SalonCardType } from "@/lib/types";

export default function SavedPage() {
  const t = useTranslations("savedPage");
  const params = useParams();
  const locale = (params?.locale as string) ?? "de";
  const pathname = usePathname();
  const router = useRouter();

  const [items, setItems] = useState<SalonCardType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
        const supabase = createBrowserSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname ?? `/${locale}/account/saved`)}`);
          return;
        }

        const res = await fetch("/api/profile/favorites");
        if (res.ok) {
          const data = await res.json();
          setItems(data.items ?? []);
        } else {
          setError(t("errorTitle"));
          setItems([]);
        }
      } catch {
        setError(t("errorTitle"));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [locale, pathname, router, t]);

  function handleUnfavorite(salonId: string) {
    // Optimistic remove
    setItems((prev) => prev.filter((s) => s.id !== salonId));
    fetch(`/api/profile/favorites?salon_id=${salonId}`, { method: "DELETE" }).catch(() => {
      // If it fails, re-fetch to restore correct state
      fetch("/api/profile/favorites")
        .then((r) => r.json())
        .then((d) => setItems(d.items ?? []));
    });
  }

  return (
    <main className="min-h-screen bg-[--base] pb-24">
      <div className="max-w-5xl mx-auto px-4 pt-6 pb-4">
        <h1 className="font-heading text-2xl font-bold text-s-ink mb-6">
          {t("title")}
        </h1>

        {error ? (
          <EmptyState
            icon={AlertCircle}
            title={error}
            message={t("errorMessage")}
          />
        ) : loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="card" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Bookmark}
            title={t("emptyTitle")}
            message={t("emptyMessage")}
            action={
              <Link
                href={`/${locale}/discover`}
                className="inline-flex items-center gap-2 bg-s-coral text-white font-heading text-sm px-5 py-2.5 rounded-btn hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter]"
              >
                {t("discoverCta")}
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {items.map((salon) => (
              <SalonCard
                key={salon.id}
                salon={salon}
                locale={locale}
                isFavorited
                onFavoriteToggle={handleUnfavorite}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
