import { Suspense } from "react";
import SignIn from "@/components/auth/SignIn";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex flex-col items-center justify-center px-4 py-12">
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
          <a href="/"
            className="inline-block font-heading font-bold text-[32px] text-s-ink dark:text-s-dm-text leading-none hover:opacity-80 transition-opacity">
            solen<span className="text-s-coral">.</span>ch
          </a>
          <p className="text-xs font-heading font-bold uppercase tracking-[.12em] text-s-ink/40 dark:text-s-dm-text/40 mt-3">
            Willkommen zurück
          </p>
        </div>

        {/* Auth card — Zone 3, warm shadow */}
        <div className="rounded-[16px] border border-white/70 dark:border-white/10 p-8"
          style={{ background: "rgba(255,255,255,.90)", backdropFilter: "blur(20px) saturate(1.2)",
                   WebkitBackdropFilter: "blur(20px) saturate(1.2)",
                   boxShadow: "0 4px 12px rgba(26,18,9,.08), 0 16px 40px rgba(26,18,9,.06), inset 0 1px 0 rgba(255,255,255,.90)" }}>
          <Suspense>
            <SignIn />
          </Suspense>
        </div>

        <p className="text-center mt-6">
          <span className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-ink/30 dark:text-s-dm-text/30">
            Noch kein Konto?{" "}
          </span>
          <a href={`/${locale}/auth/register`}
            className="text-[11px] font-heading font-bold uppercase tracking-[.08em] text-s-coral hover:underline">
            Registrieren
          </a>
        </p>
      </div>
    </div>
  );
}
