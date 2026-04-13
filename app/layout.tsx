import type { Metadata } from "next";
import ThemeScript from "@/components/ui/ThemeScript";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "solen.ch — Salons in Basel",
  description: "Finde und buche die besten Salons in Basel. Coiffeur, Barbershop, Nails, Spa, Makeup und mehr.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" suppressHydrationWarning className="bg-white">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preload" href="/logo.svg" as="image" type="image/svg+xml" />
        {/* Preload Inter font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          as="style"
        />
        <ThemeScript />
      </head>
      <body style={{ margin: 0, padding: 0 }} className="bg-white text-[#484848] dark:bg-[#0A0A0A] dark:text-[#A1A1A1]">
        {children}
      </body>
    </html>
  );
}
