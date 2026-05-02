import type { Metadata } from "next";
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
        {/* Preload critical Google Fonts (Q23 + Q48: Anton display + Figtree body) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Figtree:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          as="style"
        />
      </head>
      <body style={{ margin: 0, padding: 0 }} className="bg-s-bg-base text-s-ink">
        {children}
      </body>
    </html>
  );
}
