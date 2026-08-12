/**
 * /dev/mock/home-density , findings 1 and 29 of the sweep, on the real home screen.
 *
 * measured, both sides live at 390x844 on 2026-08-12: their card photo is 165 x 157 at a ratio of
 * 1.053 and about 2.2 fit across the screen; ours is 231 x 185 at 1.25 and about 1.6 fit. Their
 * first screen holds 4 stores, ours holds 2. Our own density rule asks for at least 4.
 *
 * Our March spec for this exact card already prescribed 20/19, which is 1.0526, and the code never
 * followed it.
 *
 * exists-check: `npm run exists "mock home density"` = 0 (run this turn alongside the shell).
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import { MockShell, MockRoute } from "../_shell/MockShell";

const PROPOSED = `
  [class*="snap-start"][class*="w-[calc((100vw"] { width: 165px !important; }
  [class*="aspect-[5/4]"] { aspect-ratio: 1.053 !important; }
`;

export default function Page() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <MockShell proposed={PROPOSED}>
      <MockRoute src="/de" />
    </MockShell>
  );
}
