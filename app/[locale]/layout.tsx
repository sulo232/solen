import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n";
import { PostHogProvider } from "@/components/PostHogProvider";
import { ToastProvider } from "@/components/ui/Toast";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "solen.ch — Salons in Basel",
  description: "Finde und buche die besten Salons in Basel. Coiffeur, Barbershop, Nails, Spa, Makeup und mehr.",
};

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
    <html lang={locale}>
      <body style={{ margin: 0, padding: 0 }}>
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider>
            <ToastProvider>
              <Header locale={locale} />
              <div className="pb-16 md:pb-0">
                {children}
              </div>
              <BottomNav />
            </ToastProvider>
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
