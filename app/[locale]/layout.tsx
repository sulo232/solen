import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n";
import { PostHogProvider } from "@/components-legacy/PostHogProvider";
import { ToastProvider } from "@/components-legacy/ui/Toast";
import Header from "./_components/layout/Header";
import Footer from "./_components/layout/Footer";
// BottomTabBar import removed 2026-05-03 per Q58 (deprecated for web rendering).
// Keep file at components/layout/BottomTabBar.tsx for future PWA mount.
// import BottomTabBar from "@/components-legacy/layout/BottomTabBar";
// Legacy CookieBanner replaced by V3 CookieConsentProvider (§F.8) which
// auto-mounts the banner + provides useCookieConsent hook. Original at
// components-legacy/ui/CookieBanner.tsx kept until next sweep.
import { CookieConsentProvider } from "./_components/primitives/CookieConsent";
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
          <CookieConsentProvider>
          {/* Skip-to-content: first focusable element for keyboard users */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-s-coral focus:text-white focus:rounded-btn focus:shadow-warm-md focus:text-sm focus:font-medium"
          >
            Zum Inhalt springen
          </a>
          {/* V3-D92 (2026-05-21): Hims-style top promo banner — dimensions
              measured from live hims.com mobile @ 393 viewport via Playwright
              getBoundingClientRect:
                - banner total height: 44px
                - padding: 12px vertical, 16px horizontal
                - text: 12px / weight 600 (semibold)
              Solen uses royal blue bg + white text (vs Hims peach bg + ink text).
              Copy is PLACEHOLDER — swap with real promo / feature copy when ready. */}
          <div className="w-full bg-s-brand text-white">
            <div className="mx-auto flex max-w-[1280px] items-center justify-center gap-2 px-4 py-3">
              <span className="font-body text-[12px] font-semibold">
                Sofort verfügbar — 320 Buchungen heute
              </span>
              <a
                href="/de/search"
                className="font-body inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[12px] font-semibold text-s-ink transition-colors hover:bg-s-bg-sunken"
              >
                Salons finden
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
          <Header locale={locale} />
          <PageTransitionWrapper>
            <CompareProvider>
              <main id="main-content" tabIndex={-1} className="pb-[env(safe-area-inset-bottom)] isolate">
                <Breadcrumb />
                {children}
              </main>
            </CompareProvider>
          </PageTransitionWrapper>
          {/* V2-D46 (2026-05-09): V3 Footer mounted at locale-layout level
              so it renders site-wide (not just homepage). Replaces the
              legacy components-legacy/layout/Footer.tsx which was never
              mounted in the V3 rebuild. */}
          <Footer locale={locale} />
          {/* BottomTabBar removed from web rendering 2026-05-03 per Q58
              ("No bottom nav (web-only decision); bottom-nav components
              deprecated for web rendering. Mobile native/PWA can re-introduce
              bottom nav later"). Component file preserved at
              `components/layout/BottomTabBar.tsx` for the future PWA path.
              FloatingNavPill was already removed; BottomTabBar mount was the
              second resurrection that page-level verifier caught. */}
          {/* CookieConsentProvider auto-mounts the banner; placed at provider
              level so analytics / marketing consent is queryable everywhere. */}
          <PWAInstallPrompt />
          <TosPrompt />
          <TOSUpdateBanner />
          </CookieConsentProvider>
        </ToastProvider>
      </PostHogProvider>
    </NextIntlClientProvider>
    </MotionProvider>
  );
}
