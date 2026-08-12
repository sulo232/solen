/**
 * /dev/mock , the list of mockups. Not a mockup itself, deliberately: it is the door, and every
 * door on it opens one real screen.
 *
 * Owner 2026-08-12: "refine the definition of a mock up". The definition lives at the top of
 * public/_mockups/_BASE.md and a check enforces it. Each entry below is one screen, full-bleed,
 * silent, with before and after on a toggle.
 *
 * exists-check: `npm run exists "mock shell"` = 0 this turn; /dev/airbnb-01-home,
 * /dev/airbnb-02-search, /dev/airbnb-03-salon and /dev/airbnb-findings are comparison DOCUMENTS and
 * stay where they are, they are not mockups and are not listed here.
 *
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import Link from "next/link";

const MOCKS = [
  { href: "salon-reviews", title: "Salon reviews", line: "The words a customer wrote take the black and the size." },
  { href: "home-density", title: "Home", line: "Two and a bit stores across the screen instead of one and a half." },
  { href: "search-density", title: "Search results", line: "The same narrower card, and fewer text sizes on it." },
  { href: "press-feedback", title: "Press feedback", line: "Things stop fading out when you tap them." },
];

export default function MockIndexPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className="mx-auto max-w-[560px] px-5 py-10">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">Mockups</h1>
      <ul className="mt-6 space-y-3">
        {MOCKS.map((m) => (
          <li key={m.href}>
            <Link
              href={`/de/dev/mock/${m.href}`}
              className="block rounded-[16px] border border-s-border p-4 hover:bg-s-bg-sunken"
            >
              <span className="block text-[16px] font-semibold text-s-ink">{m.title}</span>
              <span className="mt-1 block text-[14px] leading-relaxed text-s-ink-2">{m.line}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
