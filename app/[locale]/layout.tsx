import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n";
import { PostHogProvider } from "@/components-legacy/PostHogProvider";
import { ToastProvider } from "@/components-legacy/ui/Toast";
import Header from "./_components/layout/Header";
// BottomTabBar import removed 2026-05-03 per Q58 (deprecated for web rendering).
// Keep file at components/layout/BottomTabBar.tsx for future PWA mount.
// import BottomTabBar from "@/components-legacy/layout/BottomTabBar";
import CookieBanner from "@/components-legacy/ui/CookieBanner";
import PWAInstallPrompt from "@/components-legacy/ui/PWAInstallPrompt";
import TosPrompt from "@/components-legacy/auth/TosPrompt";
import TOSUpdateBanner from "@/components-legacy/global/TOSUpdateBanner";
import { CompareProvider } from "@/components-legacy/compare/CompareContext";
import Breadcrumb from "@/components-legacy/ui/Breadcrumb";
import PageTransitionWrapper from "@/components-legacy/layout/PageTransitionWrapper";
import MotionProvider from "@/components-legacy/layout/MotionProvider";

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
    <MotionProvider>
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
          <PageTransitionWrapper>
            <CompareProvider>
              <main id="main-content" tabIndex={-1} className="pb-[env(safe-area-inset-bottom)] isolate">
                <Breadcrumb />
                {children}
              </main>
            </CompareProvider>
          </PageTransitionWrapper>
          {/* BottomTabBar removed from web rendering 2026-05-03 per Q58
              ("No bottom nav (web-only decision); bottom-nav components
              deprecated for web rendering. Mobile native/PWA can re-introduce
              bottom nav later"). Component file preserved at
              `components/layout/BottomTabBar.tsx` for the future PWA path.
              FloatingNavPill was already removed; BottomTabBar mount was the
              second resurrection that page-level verifier caught. */}
          <CookieBanner />
          <PWAInstallPrompt />
          <TosPrompt />
          <TOSUpdateBanner />
        </ToastProvider>
      </PostHogProvider>
    </NextIntlClientProvider>
    </MotionProvider>
  );
}
