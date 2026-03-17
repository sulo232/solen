'use client';

import React from "react";
import { SignIn } from "../../components/auth/SignIn";

export function RegisterPage({ locale = "de" }: { locale?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <p className="text-xs text-center text-gray-400 mb-4 font-medium uppercase tracking-wide">Neues Konto erstellen</p>
        <SignIn locale={locale} />
      </div>
    </div>
  );
}
