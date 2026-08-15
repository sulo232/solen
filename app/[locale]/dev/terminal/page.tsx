/**
 * Mockup-scope: whole-page
 *
 * Exists-check: npm run exists terminal , the terminal family only (Terminal.tsx, the round-1
 * seven-tab mockup this route used to serve, now rejected). This route is REWRITTEN into a
 * chooser for three genuinely different directions (a/, b/, c/), each its own route with its own
 * data load. Net-new: the chooser itself.
 *
 * Dev-only preview route. Not linked from any production nav; blocked in production below.
 * The chooser is deliberately NOT styled like the product; it is a plain index, not a design.
 *
 * FIXED 2026-08-15: the phone list used `flex-1` per row, which stretched three rows over the
 * whole viewport and rendered as three ~270px bands of empty white with a word floating in each.
 * Measured on the tunnel before the fix. Rows are now their own height and the list sits at the
 * top, and the whole thing is a fixed overlay so the site header, footer and cookie bar do not
 * appear around it.
 */
import { notFound } from "next/navigation";
import ChooserOverlay from "./ChooserOverlay";

const DIRECTIONS = [
  { letter: "A", name: "One stream", note: "Everything in time order, one list", path: "a" },
  { letter: "B", name: "Attention bar", note: "Calm day, one bar counts what needs you", path: "b" },
  { letter: "C", name: "Now and next", note: "Chairs pinned on top, the day below", path: "c" },
] as const;

export default async function TerminalChooserPage({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();

  const { locale } = await params;

  return <ChooserOverlay locale={locale} directions={[...DIRECTIONS]} />;
}
