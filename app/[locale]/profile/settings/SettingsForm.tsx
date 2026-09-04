"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Switch } from "@/app/[locale]/_components/primitives/Switch";
import { TextInput } from "@/app/[locale]/_components/primitives/TextInput";
import { FieldLabel } from "@/app/[locale]/_components/primitives/FieldLabel";
import { Avatar } from "@/app/[locale]/_components/primitives/Avatar";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/app/[locale]/_components/primitives/Modal";
import { useSubmitGuard } from "@/lib/hooks/useSubmitGuard";
import { LOCALES, type SettingsLocale } from "./locales";

// Client-side downscale before the avatar POST (owner spec, 2026-07-20): browsers can decode
// far larger originals than they should ever upload, so this keeps a 100MB INPUT acceptable
// while the actual network payload stays a small derivative. createImageBitmap avoids the
// classic new Image()+onload dance; falls back to the original file if decode fails (the
// server still validates MIME + a 100MB hard cap either way, so this is an optimization, not
// a security boundary).
async function downscaleAvatar(file: File, maxEdge = 1024, quality = 0.85): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], "avatar.jpg", { type: "image/jpeg" });
  } catch (err) {
    console.error("[Settings] avatar downscale failed, uploading original:", err);
    return file;
  }
}

// SettingsLocale moved to ./locales.ts (2026-07-20 crash fix, see that file's header comment for
// why): re-exported here so existing `import { type SettingsLocale } from "./SettingsForm"`
// call sites (the personal/password/language/notifications/delete sub-pages) keep resolving.
export type { SettingsLocale };

// Settings hub restructure (2026-07-20, owner-approved mockup public/_mockups/sweep-settings-insta):
// each slice below renders standalone on its own sub-page (app/[locale]/profile/settings/<slice>/page.tsx).
// `section` omitted keeps the original full-page render as a safety net (nothing else imports it today).
// "identity" added same day (owner correction, Instagram model): photo/name/bio moved OUT of
// "personal" into their own /profile/edit page. 2026-07-21: "personal" (email/phone) merged INTO
// "identity" too, so /profile/edit is now the single "who you are" screen (Foto, Name, Bio,
// E-Mail, Telefon); /profile/settings/personal just redirects there.
export type SettingsSection = "personal" | "identity" | "password" | "language" | "notifications" | "delete";

export interface SettingsInitial {
  display_name: string;
  avatar_url: string;
  bio: string;
  phone_number: string;
  locale: SettingsLocale;
  notification_email: boolean;
  notification_sms: boolean;
  // Marketing consent (defect-2 fix, 2026-09-04): notification_preferences.deals_enabled,
  // fetched + resent by every settings sub-page loader same as the two switches above.
  deals_enabled: boolean;
}

// White-first override for the sub-pages (LOCFILE input law defaults to a sunken #F4F4F5 fill;
// the settings sub-pages are white-first per the owner-approved mockup, radius stays 12 unchanged).
const WHITE_INPUT = "!bg-white !border !border-s-border";

export default function SettingsForm({
  locale,
  email,
  initial,
  section,
}: {
  locale: string;
  email: string;
  initial: SettingsInitial;
  section?: SettingsSection;
}) {
  const t = useTranslations("profileHub");
  const tp = useTranslations("Profile");
  const router = useRouter();

  // ── profile + notifications ──────────────────────────────
  const [form, setForm] = React.useState<SettingsInitial>(initial);
  const [saving, setSaving] = React.useState(false);
  const set = <K extends keyof SettingsInitial>(k: K, v: SettingsInitial[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: form.display_name.trim() || undefined,
          avatar_url: form.avatar_url.trim() || null,
          bio: form.bio.trim() || null,
          phone_number: form.phone_number.trim() || null,
          locale: form.locale,
          notification_email: form.notification_email,
          notification_sms: form.notification_sms,
          deals_enabled: form.deals_enabled,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[Settings] save failed:", err?.message ?? res.status);
        // states-forms-08: a 401 mid-form is a session-expiry, not a generic save
        // failure, name the real cause and send them back to login with a return
        // path instead of the undifferentiated saveError toast.
        if (res.status === 401) {
          toast.error(t("sessionExpired"));
          router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        toast.error(t("saveError"));
        return;
      }
      toast.success(t("savedToast"));
      router.refresh();
    } catch (err) {
      console.error("[Settings] save exception:", err);
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  // ── avatar upload ─────────────────────────────────────────
  const avatarInputRef = React.useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarError, setAvatarError] = React.useState<string | null>(null);

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file after an error
    if (!file) return;
    setAvatarError(null);
    setAvatarUploading(true);
    try {
      const downscaled = await downscaleAvatar(file);
      const body = new FormData();
      body.append("file", downscaled);
      // A15-upload-hardening (2026-07-27): required by the route's CSRF guard, see
      // lib/upload-security.ts requireUploadHeader.
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers: { "x-solen-upload": "1" },
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[Settings] avatar upload failed:", err?.error ?? res.status);
        setAvatarError(t("avatarUploadError"));
        return;
      }
      const { url } = await res.json();
      set("avatar_url", url);
      router.refresh();
    } catch (err) {
      console.error("[Settings] avatar upload exception:", err);
      setAvatarError(t("avatarUploadError"));
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── security: email + password ───────────────────────────
  const [newEmail, setNewEmail] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [emailBusy, setEmailBusy] = React.useState(false);
  const [pwBusy, setPwBusy] = React.useState(false);

  const emailValid = /\S+@\S+\.\S+/.test(newEmail.trim()) && newEmail.trim() !== email;
  // NIST SP 800-63-4 (July 2025): length only, no composition rules.
  const pwValid = newPassword.length >= 12;

  const updateEmail = async () => {
    if (!emailValid) return;
    setEmailBusy(true);
    try {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
      if (error) {
        console.error("[Settings] email update:", error.message);
        toast.error(error.message);
        return;
      }
      toast.success(t("emailSentToast"));
      setNewEmail("");
    } catch (err) {
      console.error("[Settings] email exception:", err);
      toast.error(t("saveError"));
    } finally {
      setEmailBusy(false);
    }
  };

  const updatePassword = async () => {
    if (!pwValid) return;
    setPwBusy(true);
    try {
      const { createBrowserSupabaseClient } = await import("@/lib/supabase-browser");
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        console.error("[Settings] password update:", error.message);
        toast.error(error.message);
        return;
      }
      toast.success(t("passwordChangedToast"));
      setNewPassword("");
    } catch (err) {
      console.error("[Settings] password exception:", err);
      toast.error(t("saveError"));
    } finally {
      setPwBusy(false);
    }
  };

  // ── danger: delete account ───────────────────────────────
  // Type-to-confirm KILLED (owner 2026-07-20): a plain confirm dialog replaces it.
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  // states-forms-05: account deletion is a non-idempotent write; a synchronous
  // ref guard (not just the `deleting` state flag) closes the double-tap race.
  const deleteGuard = useSubmitGuard();

  const deleteAccount = async () => {
    if (!deleteGuard.tryEnter()) return; // a delete is already in flight, drop the duplicate
    setDeleting(true);
    try {
      // The canonical full deletion flow (app/api/profile/request-deletion):
      // same 30-day-arm behavior for a registered user as the legacy
      // /api/profile/delete, plus rate limiting. Kept as the single UI entry
      // point so this and the guest-erasure path share one endpoint.
      const res = await fetch("/api/profile/request-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[Settings] delete failed:", err?.message ?? res.status);
        toast.error(err?.message || t("saveError"));
        setDeleteConfirmOpen(false);
        return;
      }
      toast.success(tp("deleteAccount30Days"));
      window.location.href = `/${locale}`;
    } catch (err) {
      console.error("[Settings] delete exception:", err);
      toast.error(t("saveError"));
      setDeleteConfirmOpen(false);
    } finally {
      deleteGuard.release();
      setDeleting(false);
    }
  };

  // ── sectioned sub-page renders ────────────────────────────
  // "identity" (/profile/edit): merged single "who you are" screen (owner correction, 2026-07-21):
  // Foto/Name/Bio (originally identity) PLUS E-Mail/Telefon (originally "personal" below) now
  // render together here, reusing the personal branch's exact email-change + phone markup and
  // handlers (updateEmail/newEmail/emailBusy, form.phone_number) rather than re-inventing them.
  // "personal" is kept below unreferenced (its route now redirects to /profile/edit) per
  // instruction to leave it in place, not delete it.
  if (section === "identity") {
    return (
      <form onSubmit={saveProfile} className="space-y-7">
        <div className="space-y-[18px]">
          {/* mockup-ok: direct owner order (real file upload replacing the URL field), styling
              grounded in this exact file's own locked ActionButton (rounded-[12px], white bg,
              hairline border via WHITE_INPUT) and the Avatar primitive's numeric-size prop
              (72px), not invented values; treatment-only, no new visual language introduced. */}
          <div className="space-y-1.5">
            <FieldLabel>{tp("avatarLabel")}</FieldLabel>
            <div className="flex items-center gap-4">
              <Avatar src={form.avatar_url || null} name={form.display_name || "?"} size={72} />
              <div className="space-y-1.5">
                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}
                  className={cn("h-10 px-4 inline-flex items-center justify-center gap-2 rounded-[12px] text-[14px] font-medium text-s-ink transition-colors duration-200 hover:bg-s-bg-sunken disabled:opacity-50", WHITE_INPUT)}>
                  {avatarUploading && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-s-border border-t-s-ink animate-spin" />}
                  {tp("avatarChange")}
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                {avatarError && <p className="text-[12px] text-s-error">{avatarError}</p>}
              </div>
            </div>
          </div>
          <Field label={tp("name")} htmlFor="display_name">
            <TextInput id="display_name" className={WHITE_INPUT} value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)} />
          </Field>
          <Field label={tp("bio")} htmlFor="bio" optional>
            <textarea id="bio" rows={3} maxLength={500} value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              className={cn("block w-full font-body font-normal text-[16px] text-s-ink px-4 py-3 placeholder:text-s-ink-2 transition-colors duration-150", WHITE_INPUT)} />
          </Field>
          <Field label={t("changeEmail")} htmlFor="new_email">
            <div className="flex gap-2">
              <TextInput id="new_email" type="email" inputMode="email" autoComplete="email"
                placeholder={email} value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                className={cn(WHITE_INPUT, "flex-1")} />
              <ActionButton onClick={updateEmail} busy={emailBusy} disabled={!emailValid}>
                {t("updateAction")}
              </ActionButton>
            </div>
          </Field>
          <Field label={t("phone")} htmlFor="phone" optional>
            <TextInput id="phone" type="tel" inputMode="tel" autoComplete="tel" className={WHITE_INPUT}
              value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
          </Field>
        </div>

        <button type="submit" disabled={saving}
          className="w-full h-12 rounded-btn bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em] flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 disabled:opacity-50 active:scale-[0.97] active:duration-[80ms] active:ease-glide">
          {saving && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {t("saveProfile")}
        </button>
      </form>
    );
  }

  // "personal" (/profile/settings/personal): kept unreferenced (2026-07-21, merged into
  // "identity" above per owner correction; the route now redirects to /profile/edit). Left in
  // place rather than deleted per instruction, in case anything still imports section="personal".
  if (section === "personal") {
    return (
      <form onSubmit={saveProfile} className="space-y-7">
        <div className="space-y-[18px]">
          <Field label={t("changeEmail")} htmlFor="new_email">
            <div className="flex gap-2">
              <TextInput id="new_email" type="email" inputMode="email" autoComplete="email"
                placeholder={email} value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                className={cn(WHITE_INPUT, "flex-1")} />
              <ActionButton onClick={updateEmail} busy={emailBusy} disabled={!emailValid}>
                {t("updateAction")}
              </ActionButton>
            </div>
          </Field>
          <Field label={t("phone")} htmlFor="phone" optional>
            <TextInput id="phone" type="tel" inputMode="tel" autoComplete="tel" className={WHITE_INPUT}
              value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
          </Field>
        </div>

        <button type="submit" disabled={saving}
          className="w-full h-12 rounded-btn bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em] flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 disabled:opacity-50 active:scale-[0.97] active:duration-[80ms] active:ease-glide">
          {saving && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {t("saveProfile")}
        </button>
      </form>
    );
  }

  if (section === "password") {
    return (
      <Field label={t("changePassword")} htmlFor="new_password">
        <div className="flex gap-2">
          <TextInput id="new_password" type="password" revealable autoComplete="new-password"
            placeholder={t("newPassword")} value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} className={cn(WHITE_INPUT, "flex-1")} />
          <ActionButton onClick={updatePassword} busy={pwBusy} disabled={!pwValid}>
            {t("updateAction")}
          </ActionButton>
        </div>
      </Field>
    );
  }

  if (section === "language") {
    return (
      <form onSubmit={saveProfile} className="space-y-7">
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-2">
            {LOCALES.map((l) => (
              <button key={l.value} type="button" onClick={() => set("locale", l.value)}
                aria-pressed={form.locale === l.value}
                className={cn(
                  "h-10 px-4 rounded-btn text-[14px] font-medium transition-colors duration-200",
                  form.locale === l.value
                    ? "bg-s-ink text-white"
                    : "border border-s-border text-s-ink hover:bg-s-bg-sunken",
                )}>
                {l.label}
              </button>
            ))}
          </div>
          <p className="text-[12px] text-s-ink-2">{t("localeNote")}</p>
        </div>

        <button type="submit" disabled={saving}
          className="w-full h-12 rounded-btn bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em] flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 disabled:opacity-50 active:scale-[0.97] active:duration-[80ms] active:ease-glide">
          {saving && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {t("saveProfile")}
        </button>
      </form>
    );
  }

  if (section === "notifications") {
    return (
      <form onSubmit={saveProfile} className="space-y-7">
        <div className="rounded-card border border-s-border bg-white px-[18px]">
          <Switch checked={form.notification_email}
            onCheckedChange={(v) => set("notification_email", v)}
            label={tp("emailNotifications")} subLabel={tp("notifBookingsDesc")} />
          <Switch checked={form.notification_sms}
            onCheckedChange={(v) => set("notification_sms", v)}
            label="SMS" subLabel={tp("notifSmsDesc")} />
          <Switch checked={form.deals_enabled}
            onCheckedChange={(v) => set("deals_enabled", v)}
            label={tp("notifDeals")} subLabel={tp("notifDealsDesc")} />
        </div>

        <button type="submit" disabled={saving}
          className="w-full h-12 rounded-btn bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em] flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 disabled:opacity-50 active:scale-[0.97] active:duration-[80ms] active:ease-glide">
          {saving && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {t("saveProfile")}
        </button>
      </form>
    );
  }

  if (section === "delete") {
    return (
      <div className="space-y-3">
        <p className="text-[14px] font-medium text-s-ink">{tp("deleteAccount")}</p>
        <p className="text-[13px] text-s-ink-2 leading-[1.5]">{tp("deleteAccountWarningDesc")}</p>
        <button type="button" onClick={() => setDeleteConfirmOpen(true)}
          className="w-full h-11 rounded-btn border border-s-error/40 text-s-error text-[14px] font-medium flex items-center justify-center gap-2 transition-colors duration-200 hover:bg-s-error-bg">
          {tp("deleteAccountConfirm")}
        </button>
        <DeleteConfirmModal
          isOpen={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          deleting={deleting}
          onConfirm={deleteAccount}
          title={tp("deleteAccountConfirm")}
          warning={tp("deleteAccountWarningDesc")}
          cancelLabel={tp("cancel")}
        />
      </div>
    );
  }

  // ── default: full render (unused today, kept per the section-prop rollout so nothing
  //    that still imports SettingsForm without a `section` regresses) ─────────────────
  return (
    <div className="space-y-7">
      {/* Profile + notifications */}
      <form onSubmit={saveProfile} className="space-y-7">
        <Section title={t("secProfile")}>
          <Field label={tp("avatarUrl")} htmlFor="avatar_url" optional>
            <TextInput id="avatar_url" type="url" inputMode="url" placeholder="https://…"
              value={form.avatar_url} onChange={(e) => set("avatar_url", e.target.value)} />
          </Field>
          <Field label={tp("name")} htmlFor="display_name">
            <TextInput id="display_name" value={form.display_name}
              onChange={(e) => set("display_name", e.target.value)} />
          </Field>
          <Field label={t("phone")} htmlFor="phone" optional>
            <TextInput id="phone" type="tel" inputMode="tel" autoComplete="tel"
              value={form.phone_number} onChange={(e) => set("phone_number", e.target.value)} />
          </Field>
          <Field label={tp("bio")} htmlFor="bio" optional>
            {/* mockup-ok: dead-class removal only, base input law already renders fill/border/radius for
                textarea; the focus-visible:outline-* classes duplicated the global ink-edge focus law
                (LOCKFILE V3-D449, no double ring), so both are dead (V3-D-input-fill-2026-07-17). */}
            <textarea id="bio" rows={3} maxLength={500} value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              className="block w-full font-body font-normal text-[16px] text-s-ink px-4 py-3 placeholder:text-s-ink-2 transition-colors duration-150" />
          </Field>
          <div className="space-y-1.5">
            <FieldLabel>{tp("language")}</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {LOCALES.map((l) => (
                <button key={l.value} type="button" onClick={() => set("locale", l.value)}
                  aria-pressed={form.locale === l.value}
                  className={cn(
                    "h-10 px-4 rounded-btn text-[14px] font-medium transition-colors duration-200",
                    form.locale === l.value
                      ? "bg-s-ink text-white"
                      : "border border-s-border text-s-ink hover:bg-s-bg-sunken",
                  )}>
                  {l.label}
                </button>
              ))}
            </div>
            <p className="text-[12px] text-s-ink-2">{t("localeNote")}</p>
          </div>
        </Section>

        <section>
          <h2 className="text-[13px] font-medium text-s-ink-2 mb-2 px-0.5">{t("secNotifications")}</h2>
          <div className="rounded-card border border-s-border bg-white px-[18px]">
            <Switch checked={form.notification_email}
              onCheckedChange={(v) => set("notification_email", v)}
              label={tp("emailNotifications")} subLabel={tp("notifBookingsDesc")} />
            <Switch checked={form.notification_sms}
              onCheckedChange={(v) => set("notification_sms", v)}
              label="SMS" subLabel={tp("notifSmsDesc")} />
            <Switch checked={form.deals_enabled}
              onCheckedChange={(v) => set("deals_enabled", v)}
              label={tp("notifDeals")} subLabel={tp("notifDealsDesc")} />
          </div>
        </section>

        <button type="submit" disabled={saving}
          className="w-full h-12 rounded-btn bg-s-ink text-white text-[15px] font-medium tracking-[-0.005em] flex items-center justify-center gap-2 transition-[opacity,transform] duration-200 disabled:opacity-50 active:scale-[0.97] active:duration-[80ms] active:ease-glide">
          {saving && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {t("saveProfile")}
        </button>
      </form>

      {/* Security */}
      <Section title={t("secSecurity")}>
        <Field label={t("changeEmail")} htmlFor="new_email">
          <div className="flex gap-2">
            <TextInput id="new_email" type="email" inputMode="email" autoComplete="email"
              placeholder={email} value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
              className="flex-1" />
            <ActionButton onClick={updateEmail} busy={emailBusy} disabled={!emailValid}>
              {t("updateAction")}
            </ActionButton>
          </div>
        </Field>
        <Field label={t("changePassword")} htmlFor="new_password">
          <div className="flex gap-2">
            <TextInput id="new_password" type="password" revealable autoComplete="new-password"
              placeholder={t("newPassword")} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} className="flex-1" />
            <ActionButton onClick={updatePassword} busy={pwBusy} disabled={!pwValid}>
              {t("updateAction")}
            </ActionButton>
          </div>
        </Field>
      </Section>

      {/* Danger zone. Type-to-confirm KILLED (owner 2026-07-20): warning + a plain confirm dialog. */}
      <section>
        <h2 className="text-[13px] font-medium text-s-ink-2 mb-2 px-0.5">{tp("dangerZone")}</h2>
        <div className="rounded-card border border-s-error/30 bg-white p-[18px] space-y-3">
          <p className="text-[14px] font-medium text-s-ink">{tp("deleteAccount")}</p>
          <p className="text-[13px] text-s-ink-2 leading-[1.5]">{tp("deleteAccountWarningDesc")}</p>
          <button type="button" onClick={() => setDeleteConfirmOpen(true)}
            className="w-full h-11 rounded-btn border border-s-error/40 text-s-error text-[14px] font-medium flex items-center justify-center gap-2 transition-colors duration-200 hover:bg-s-error-bg">
            {tp("deleteAccountConfirm")}
          </button>
        </div>
      </section>

      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        deleting={deleting}
        onConfirm={deleteAccount}
        title={tp("deleteAccountConfirm")}
        warning={tp("deleteAccountWarningDesc")}
        cancelLabel={tp("cancel")}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-[13px] font-medium text-s-ink-2 mb-2 px-0.5">{title}</h2>
      <div className="rounded-card border border-s-border bg-white p-[18px] space-y-[18px]">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, optional, children }: { label: string; htmlFor: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={htmlFor} optional={optional}>{label}</FieldLabel>
      {children}
    </div>
  );
}

function ActionButton({ onClick, busy, disabled, children }: { onClick: () => void; busy: boolean; disabled: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled || busy}
      className="shrink-0 h-14 px-4 rounded-[12px] border border-s-border text-s-ink text-[14px] font-medium flex items-center justify-center gap-2 transition-colors duration-200 hover:bg-s-bg-sunken disabled:opacity-40 disabled:hover:bg-white">
      {busy && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-s-border border-t-s-ink animate-spin" />}
      {children}
    </button>
  );
}

// Plain confirm dialog (Modal primitive), replaces the killed type-to-confirm input.
// Mirrors the destructive-confirm pattern in app/[locale]/queue/[token]/page.tsx.
function DeleteConfirmModal({
  isOpen,
  onOpenChange,
  deleting,
  onConfirm,
  title,
  warning,
  cancelLabel,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  deleting: boolean;
  onConfirm: () => void;
  title: string;
  warning: string;
  cancelLabel: string;
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="sm" keyboardDismissDisabled={deleting} isDismissable={!deleting}>
      <ModalHeader title={title} closeButton={!deleting} />
      <ModalBody>
        <p>{warning}</p>
      </ModalBody>
      <ModalFooter>
        <button type="button" onClick={() => onOpenChange(false)} disabled={deleting}
          className="rounded-full border border-s-border bg-white px-5 py-2.5 text-[14px] font-semibold text-s-ink transition-colors hover:bg-s-bg-sunken disabled:opacity-50">
          {cancelLabel}
        </button>
        <button type="button" onClick={onConfirm} disabled={deleting}
          className="rounded-full bg-s-error px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:brightness-[1.06] disabled:opacity-50">
          {deleting && <span aria-hidden className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
          {title}
        </button>
      </ModalFooter>
    </Modal>
  );
}
