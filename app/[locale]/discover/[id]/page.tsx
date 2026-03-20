import { createServerSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { DiscoveryItem } from "@/lib/types";
import DetailPage from "@/components/discovery/DetailPage";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

async function getItem(id: string): Promise<DiscoveryItem | null> {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("discovery_items")
    .select("*")
    .eq("id", id)
    .eq("status", "published")
    .eq("is_active", true)
    .single();
  return data as DiscoveryItem | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id, locale } = await params;
  const item = await getItem(id);
  if (!item) return { title: "Not found" };

  const descKey = `description_${locale}` as keyof DiscoveryItem;
  const description = (item[descKey] as string | null) ?? item.description ?? "";
  const image = item.image_url ?? item.tiktok_thumbnail_url ?? undefined;

  return {
    title: `${item.style_name ?? "Discover"} | solen.ch`,
    description: description.slice(0, 160),
    openGraph: {
      title: item.style_name ?? "Discover",
      description: description.slice(0, 160),
      images: image ? [{ url: image }] : undefined,
    },
  };
}

export default async function DiscoverDetailPage({ params }: PageProps) {
  const { locale, id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  // Increment view count (fire-and-forget)
  const supabase = await createServerSupabaseClient();
  supabase.rpc("increment_discovery_view", { p_item_id: id }).then(() => {});

  // Check auth
  const { data: { session } } = await supabase.auth.getSession();
  const isAuthenticated = !!session?.user;

  return (
    <main className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg px-4 pt-6 pb-20">
      <DetailPage item={item} locale={locale} isAuthenticated={isAuthenticated} />
    </main>
  );
}
