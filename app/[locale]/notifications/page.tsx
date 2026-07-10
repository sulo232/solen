// /notifications — customer notification inbox (owner mockup notifications-panel.html,
// audit gap #4). READ side of the existing notifications table (22 writer event types
// via lib/notifications.ts). Owner-dashboard alerts live elsewhere (dashboard
// NotificationCenter on /api/notifications) — this page is customer-only.

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import NotificationsClient from "./NotificationsClient";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "notifications" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/notifications`)}`);
  }
  return <NotificationsClient />;
}
