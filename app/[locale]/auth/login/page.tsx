import { Suspense } from "react";
import Link from "next/link";
import SignIn from "@/components/auth/SignIn";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-s-bg-base flex flex-col items-center justify-center px-4 py-12">
      {/* Single ambient glow — Zone 3 exception */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[-15%] right-[-5%] w-[500px] h-[500px] rounded-full"
          style={{ background: "rgba(232,98,74,.08)", filter: "blur(120px)" }} />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo lockup */}
        <div className="text-center mb-8">
          <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-amber mb-3">
            solen.ch
          </p>
          <Link
            href={`/${locale}`}
            className="inline-block font-heading font-bold text-[32px] text-s-ink leading-none hover:opacity-80 transition-opacity"
          >
            solen<span className="text-s-coral">.</span>ch
          </Link>
          <p className="text-xs font-heading font-bold uppercase tracking-[.12em] text-s-ink/40 mt-3">
            Willkommen zurück
          </p>
        </div>

        {/* Auth card — Zone 3, warm shadow */}
        <div className="rounded-card border border-s-ink/[0.06] p-8 bg-white shadow-elevation-3">
          <Suspense>
            <SignIn />
          </Suspense>
        </div>

        <p className="text-center mt-6">
          <span className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/30">
            Noch kein Konto?{" "}
          </span>
          <Link href={`/${locale}/auth/register`}
            className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-coral hover:underline">
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  );
}
