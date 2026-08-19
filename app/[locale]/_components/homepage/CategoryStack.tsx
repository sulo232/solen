import Link from "next/link";
import { ChevronRight, Scissors, Brush, Flower2, Hand, type LucideIcon } from "lucide-react";
import { Section, SectionFrame, SectionTitle } from "./SectionHeader";
import { useTranslations } from "next-intl";

/**
 * CategoryStack — V3-D99 (2026-05-22).
 *
 * Vertical stacked category list. Pattern matches IMG_4285 in
 * /Users/sulo/solen/screenshots/ (Hims homepage):
 *
 *   ┌───────────────────────────────────────────────┐
 *   │  Haarschnitt entdecken          [H]    ›     │
 *   ├───────────────────────────────────────────────┤
 *   │  Maniküre finden                [M]    ›     │
 *   ├───────────────────────────────────────────────┤
 *   │  ...                                           │
 *   └───────────────────────────────────────────────┘
 *
 * Each row: text-left (last word colored in brand) + monogram thumb on
 * right + chevron. Rows separated by hairlines. Anti-card pattern —
 * reads as a printed directory, not a generic SaaS feature grid.
 *
 * Hims uses photographic thumbnails; we use monogram tiles per user
 * "remove all those stock photo" — first letter of category on a brand-
 * family colored block.
 */

interface CatRow {
  href: string;
  /** Text label — the last word will render in brand color. */
  label: string;
  /** Lucide icon — floats as a cutout on the row bg, no container square. */
  Icon: LucideIcon;
  /** Icon stroke color. */
  iconColor: string;
}

const ROWS: CatRow[] = [
  // V3-D101 (2026-05-22): monogram tiles replaced with floating cutout-style
  // Lucide icons per user "look at the screenshot like how they cut out stuff."
  // Hims uses product photo cutouts on the right of each row; we use Lucide
  // icons at large size in brand color so they read as "floating" without
  // needing actual product photography. Icon size + thin stroke for an
  // illustrated-cutout feel.
  {
    href: "/de/coiffeur",
    label: "Haarschnitt buchen",
    Icon: Scissors,
    iconColor: "#142F4A",   // navy
  },
  {
    href: "/de/nails",
    label: "Maniküre finden",
    Icon: Brush,
    iconColor: "#E58840",   // orange
  },
  {
    href: "/de/spa",
    label: "Spa & Massage geniessen",
    Icon: Flower2,
    iconColor: "#142F4A",   // navy
  },
  {
    href: "/de/barbershop",
    label: "Barbershop & Bart",
    Icon: Scissors,
    iconColor: "#142F4A",   // navy
  },
];

/** Split label at last space — last word gets brand color. */
function splitLast(label: string) {
  const i = label.lastIndexOf(" ");
  if (i === -1) return { head: "", tail: label };
  return { head: label.slice(0, i + 1), tail: label.slice(i + 1) };
}

export default function CategoryStack() {
  // 2026-08-15 i18n sweep: these were hardcoded German literals, so they rendered German
  // on /en, /fr and /it. Same class the owner caught on the recently-viewed row.
  const t = useTranslations("home.categories");
  return (
    <Section>
      <SectionFrame>
        <SectionTitle title={t("whatToday")} />
        <ul className="mt-3 divide-y divide-black/[0.08] rounded-[14px] border border-s-border bg-white">
          {ROWS.map((row) => {
            const { head, tail } = splitLast(row.label);
            const Icon = row.Icon;
            return (
              <li key={row.href}>
                <Link
                  href={row.href}
                  className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-white"
                >
                  <span className="flex-1 font-display text-[20px] font-semibold leading-tight tracking-[-0.015em] text-s-ink md:text-[24px]">
                    {head}
                    <span className="text-s-ink">{tail}</span>
                  </span>
                  {/* Cutout-style icon: floats on the row bg, no container square */}
                  <Icon
                    size={40}
                    strokeWidth={1.5}
                    aria-hidden
                    color={row.iconColor}
                    className="flex-shrink-0 transition-transform group-hover:scale-105 md:size-[44px]"
                  />
                  <ChevronRight
                    size={20}
                    strokeWidth={2.2}
                    aria-hidden
                    className="text-s-ink-2 transition-transform group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </SectionFrame>
    </Section>
  );
}
