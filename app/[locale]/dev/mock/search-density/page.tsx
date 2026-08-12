/**
 * /dev/mock/search-density , findings 30 and 1 of the sweep, on the real search results screen.
 *
 * measured, both sides live at 390x844 on 2026-08-12: their result card carries TWO type sizes,
 * ours carries five (16 name, 14 rating, 13.5 service and price, 13 on two meta lines, 12 duration).
 * Our own budget allows four per screen. Their card also fits more results per screen than ours.
 *
 * The proposal collapses the card to two of our already-locked sizes and narrows the card the way
 * the home rail does, so the same salon reads the same on both screens.
 *
 * exists-check: `npm run exists "mock search density"` = 0 (run this turn with the shell).
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import { MockShell, MockRoute } from "../_shell/MockShell";

const PROPOSED = `
  [class*="snap-start"][class*="w-[calc((100vw"] { width: 165px !important; }
  [class*="aspect-[5/4]"] { aspect-ratio: 1.053 !important; }
  [class*="text-[13.5px]"], [class*="text-[13px]"] { font-size: 12px !important; }
`;

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <MockShell proposed={PROPOSED}>
      <MockRoute src="/de/basel/coiffeur" />
    </MockShell>
  );
}
