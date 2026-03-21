"use client";

import { useState } from "react";
import { Users, Mail, UserPlus } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

interface TeamStepProps {
  locale: string;
  onSaved: () => void;
}

export default function TeamStep({ locale, onSaved }: TeamStepProps) {
  const isDE = locale === "de" || locale === "fr";
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [invites, setInvites] = useState<{ email: string; name: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendInvite = async () => {
    if (!email) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/staff/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed");
      }
      setInvites((prev) => [...prev, { email, name }]);
      setEmail("");
      setName("");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fehler");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 rounded-xl bg-s-coral/10 flex items-center justify-center">
          <Users size={22} className="text-s-coral" />
        </div>
        <div>
          <h2 className="font-heading font-bold text-xl text-s-ink">
            {isDE ? "Team einladen" : "Invite Your Team"}
          </h2>
          <p className="text-sm text-s-ink/40">
            {isDE ? "Lade Mitarbeiter per E-Mail ein, oder überspringe diesen Schritt" : "Invite staff by email, or skip this step"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-card border border-s-ink/5 p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">
              <Mail size={12} className="inline mr-1" />
              E-Mail *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mitarbeiter@email.ch"
              className="w-full px-4 py-2.5 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-s-ink/50 mb-1">
              <UserPlus size={12} className="inline mr-1" />
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isDE ? "Vorname" : "First name"}
              className="w-full px-4 py-2.5 rounded-button border border-s-ink/10 text-sm focus:outline-none focus:border-s-coral transition-colors"
            />
          </div>
        </div>

        {error && <p className="text-xs text-s-coral">{error}</p>}

        <button
          onClick={sendInvite}
          disabled={!email || sending}
          className="w-full py-2.5 rounded-button bg-s-coral text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-s-coral/90 transition-colors"
        >
          {sending && <Spinner size="sm" invert />}
          {isDE ? "Einladung senden" : "Send Invite"}
        </button>
      </div>

      {invites.length > 0 && (
        <div className="bg-white rounded-card border border-s-ink/5 overflow-hidden">
          {invites.map((inv, i) => (
            <div key={i} className={["flex items-center gap-3 px-5 py-3", i > 0 ? "border-t border-s-ink/5" : ""].join(" ")}>
              <div className="w-8 h-8 rounded-full bg-s-coral/10 flex items-center justify-center">
                <UserPlus size={14} className="text-s-coral" />
              </div>
              <div>
                <p className="text-sm text-s-ink">{inv.name || inv.email}</p>
                <p className="text-xs text-s-ink/40">{isDE ? "Einladung gesendet" : "Invite sent"} ✓</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-s-bg-surface rounded-card px-4 py-3">
        <p className="text-xs text-s-ink/40">
          💡 {isDE
            ? "Arbeitest du alleine? Kein Problem — überspringe diesen Schritt. Du kannst später jederzeit Mitarbeiter einladen."
            : "Working solo? No problem — skip this step. You can invite staff later."}
        </p>
      </div>
    </div>
  );
}
