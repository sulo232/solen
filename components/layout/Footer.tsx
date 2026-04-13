"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher";

/**
 * Footer — Fresha-inspired clean design
 *
 * Modern, minimal footer with organized link sections
 */

export default function Footer() {
  const locale = useLocale();
  const t = useTranslations("footer") as any;

  const linkSections = [
    {
      title: t("company") || "Company",
      links: [
        { label: t("about") || "About", href: `/${locale}/about` },
        { label: t("careers") || "Careers", href: `/${locale}/careers` },
        { label: t("press") || "Press", href: `/${locale}/press` },
        { label: t("help") || "Help", href: `/${locale}/help` },
      ],
    },
    {
      title: t("platform") || "Platform",
      links: [
        { label: t("platformDiscover") || "Discover", href: `/${locale}/discover` },
        { label: t("platformSearch") || "Search", href: `/${locale}/search` },
        { label: t("platformOffers") || "Deals", href: `/${locale}/angebote` },
        { label: t("platformLastMinute") || "Last Minute", href: `/${locale}/angebote` },
      ],
    },
    {
      title: t("forSalonsTitle") || "For Business",
      links: [
        { label: t("forSalonsPartner") || "Become a partner", href: `/${locale}/fuer-salons` },
        { label: t("forSalonsDashboard") || "Dashboard", href: `/${locale}/dashboard` },
        { label: t("forSalonsPricing") || "Pricing", href: `/${locale}/partner/pricing` },
      ],
    },
    {
      title: t("legalTitle") || "Legal",
      links: [
        { label: t("impressum") || "Imprint", href: `/${locale}/impressum` },
        { label: t("agb") || "Terms", href: `/${locale}/agb` },
        { label: t("privacy") || "Privacy", href: `/${locale}/datenschutz` },
        { label: t("cookies") || "Cookies", href: `/${locale}/cookies` },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-[#E8E8E8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        
        {/* Main grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-12">
          
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href={`/${locale}`} className="inline-block" aria-label="Solen Home">
              <Image
                src="/logo.svg"
                alt="Solen"
                width={100}
                height={32}
                className="h-7 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm text-[#717171] max-w-xs">
              {t("tagline") || "The Swiss platform for salon and spa bookings."}
            </p>
            
            {/* App download badges (placeholder) */}
            <div className="flex gap-3 mt-6">
              <a 
                href="#" 
                className="flex items-center gap-2 px-4 py-2 bg-[#101010] text-white text-xs font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                App Store
              </a>
              <a 
                href="#" 
                className="flex items-center gap-2 px-4 py-2 bg-[#101010] text-white text-xs font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.807 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.8 8.99l-2.302 2.302-8.635-8.635z"/>
                </svg>
                Google Play
              </a>
            </div>
          </div>

          {/* Link sections */}
          {linkSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-[#101010] mb-4">
                {section.title}
              </h3>
              <ul className="space-y-3">
                {section.links.map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm text-[#717171] hover:text-[#101010] transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-[#E8E8E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <p className="text-sm text-[#717171]">
              © {new Date().getFullYear()} Solen. {t("rights") || "All rights reserved."}
            </p>
            <LanguageSwitcher locale={locale} variant="footer" />
          </div>
          
          {/* Social links (optional) */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-[#717171] hover:text-[#101010] transition-colors" aria-label="Instagram">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="#" className="text-[#717171] hover:text-[#101010] transition-colors" aria-label="LinkedIn">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
