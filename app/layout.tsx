import type { Metadata } from "next";
import ThemeScript from "@/components/ui/ThemeScript";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "solen.ch — Salons in Basel",
  description: "Finde und buche die besten Salons in Basel. Coiffeur, Barbershop, Nails, Spa, Makeup und mehr.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
        <ThemeScript />
      </head>
      <body style={{ margin: 0, padding: 0 }} className="bg-s-bg-base text-s-ink dark:bg-s-dm-bg dark:text-s-dm-text">
        {children}
      </body>
    </html>
  );
}
