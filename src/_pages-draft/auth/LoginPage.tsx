'use client';

import React from "react";
import { SignIn } from "../../components/auth/SignIn";

export function LoginPage({ locale = "de" }: { locale?: string }) {
  const params = new URLSearchParams(window.location.search);
  const redirectTo = params.get("redirect") ?? `/${locale}`;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <SignIn redirectTo={redirectTo} locale={locale} />
    </div>
  );
}
