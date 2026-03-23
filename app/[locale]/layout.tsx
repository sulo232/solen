import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n";
import { PostHogProvider } from "@/components/PostHogProvider";
import { ToastProvider } from "@/components/ui/Toast";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import CookieBanner from "@/components/ui/CookieBanner";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";
import TosPrompt from "@/components/auth/TosPrompt";
import TOSUpdateBanner from "@/components/global/TOSUpdateBanner";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <PostHogProvider>
        <ToastProvider>
          <Header locale={locale} />
          <div className="pb-16 md:pb-0">
            {children}
          </div>
          <BottomNav />
          <CookieBanner />
          <PWAInstallPrompt />
          <TosPrompt />
          <TOSUpdateBanner />
        </ToastProvider>
      </PostHogProvider>
    </NextIntlClientProvider>
  );
}
