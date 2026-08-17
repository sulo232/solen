/**
 * Mockup-scope: whole-page
 *
 * Exists-check: npm run exists terminal , the terminal family only. This route used to be a chooser
 * for three directions; the owner cut the other two on 2026-08-17 ("lets not focus on anywhere else
 * then the terminal"), so it now serves THE terminal directly. Directions A and C are removed from
 * the tree and remain in git history at commit 4b268576b if they are ever wanted back.
 *
 * Dev-only preview route. Not linked from any production nav; blocked in production below.
 */
import { notFound } from "next/navigation";
import { loadTerminalData } from "./loadTerminalData";
import Screen from "./Screen";

export default async function TerminalPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const { salonName, bookings, queue, staff, services } = await loadTerminalData();

  return (
    <Screen
      salonName={salonName}
      bookings={bookings}
      queue={queue}
      staff={staff}
      services={services}
    />
  );
}
