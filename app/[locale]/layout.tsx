import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { Syne, DM_Sans, Space_Grotesk } from "next/font/google";
import { locales } from "@/i18n";
import type { Locale } from "@/i18n";
import type { Metadata } from "next";
import "@/src/index.css";

const syne = Syne({ subsets: ["latin"], variable: "--font-heading", display: "swap" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-data", display: "swap" });

export const metadata: Metadata = {
  title: {
    template: "%s | solen.ch",
    default: "solen.ch – Beauty & Wellness Basel",
  },
  description:
    "Jetzt Termin buchen bei den besten Coiffeuren, Barbershops, Nail Studios und Spas in Basel.",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function RootLayout({
  children,
  params,
}: RootLayoutProps) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${syne.variable} ${dmSans.variable} ${spaceGrotesk.variable}`}>
      <body className="font-body bg-white text-dark antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
