/**
 * /dev/mock/press-feedback , finding 47 of the sweep, and it is the one that touches every screen.
 *
 * measured, both sides live at 390x844 on 2026-08-12: 8 of 9 things you can tap on our screens drop
 * to opacity 0.78 when pressed. 0 of the 9 equivalents on Airbnb change opacity at all; they use a
 * transform only. Our own state table defines the pressed primary as a transform, not a fade.
 *
 * The mockup shows the home screen with the fade removed, so pressing a card, a pill or the search
 * bar moves without dimming.
 *
 * exists-check: `npm run exists "mock press feedback"` = 0 (run this turn alongside the shell).
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import { MockShell, MockRoute } from "../_shell/MockShell";

const PROPOSED = `
  a:active, button:active, [role="button"]:active { opacity: 1 !important; }
`;

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <MockShell proposed={PROPOSED}>
      <MockRoute src="/de" />
    </MockShell>
  );
}
