import { Suspense } from "react";
import Link from "next/link";
import SignIn from "@/components-legacy/auth/SignIn";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-white flex flex-col px-6 pt-8 pb-12">
      <div className="w-full max-w-sm mx-auto">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] leading-[1.1] text-s-ink">
          Willkommen zurück
        </h1>
        {/* mockup-ok: public/_mockups/login-uncluttered-2026-08-20.html, "B, with your three changes" panel, owner-approved */}
        <div className="mt-8">
          <Suspense>
            <SignIn />
          </Suspense>
        </div>

        <p className="text-center mt-5 text-[13px] text-s-ink-2">
          Noch kein Konto?{" "}
          <Link href={`/${locale}/auth/register`}
            className="text-s-ink font-semibold">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
