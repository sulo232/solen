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
        <ThemeScript />
      </head>
      <body style={{ margin: 0, padding: 0 }} className="bg-white dark:bg-dm-bg text-dark dark:text-dm-text">
        {children}
      </body>
    </html>
  );
}
