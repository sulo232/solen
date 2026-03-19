import { Suspense } from "react";
import SignIn from "@/components/auth/SignIn";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Soft background blobs */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden>
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-s-coral/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-s-coral/8 blur-[100px]" />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <a
            href="/"
            className="inline-block font-heading font-bold text-3xl text-s-ink dark:text-s-dm-text tracking-tight hover:opacity-80 transition-opacity"
          >
            solen<span className="text-s-coral">.</span>ch
          </a>
          <p className="text-s-ink/50 dark:text-s-dm-text/50 font-body text-sm mt-2">Willkommen zurück</p>
        </div>

        {/* GlassCard wrapping SignIn */}
        <div className="rounded-3xl border border-white/60 dark:border-white/10 bg-white/80 dark:bg-s-dm-surface/80 backdrop-blur-glass shadow-glass p-8">
          <Suspense>
            <SignIn />
          </Suspense>
        </div>

        <p className="text-center text-xs text-s-ink/30 dark:text-s-dm-text/30 font-body mt-6">
          Noch kein Konto?{" "}
          <a href={`/${locale}/auth/register`} className="text-s-coral hover:underline">
            Registrieren
          </a>
        </p>
      </div>
    </div>
  );
}
