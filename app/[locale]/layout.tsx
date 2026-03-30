import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n";
import { PostHogProvider } from "@/components/PostHogProvider";
import { ToastProvider } from "@/components/ui/Toast";
import Header from "@/components/layout/Header";
import BottomTabBar from "@/components/layout/BottomTabBar";
import CookieBanner from "@/components/ui/CookieBanner";
import PWAInstallPrompt from "@/components/ui/PWAInstallPrompt";
import TosPrompt from "@/components/auth/TosPrompt";
import TOSUpdateBanner from "@/components/global/TOSUpdateBanner";
import { CompareProvider } from "@/components/compare/CompareContext";
import Breadcrumb from "@/components/ui/Breadcrumb";

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
          {/* Skip-to-content: first focusable element for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-s-coral focus:text-white focus:rounded-btn focus:shadow-warm-md focus:text-sm focus:font-medium"
          >
            Zum Inhalt springen
          </a>
          <Header locale={locale} />
          <CompareProvider>
            <main id="main-content" tabIndex={-1} className="pb-[calc(58px+env(safe-area-inset-bottom))] md:pb-0 isolate">
              <Breadcrumb />
              {children}
            </main>
          </CompareProvider>
          <BottomTabBar />
          <CookieBanner />
          <PWAInstallPrompt />
          <TosPrompt />
          <TOSUpdateBanner />
        </ToastProvider>
      </PostHogProvider>
    </NextIntlClientProvider>
  );
}
