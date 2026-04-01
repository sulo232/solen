> 🛑 **GLOBAL DIRECTIVE: DO NOT PUSH TO PRODUCTION (NO `# 🛑 STOP: DO NOT PUSH (Wait for user approval)`)**
> **DO NOT RUN `# 🛑 STOP: DO NOT PUSH (Wait for user approval)` OR DEPLOY UNLESS EXPLICITLY INSTRUCTED BY THE USER.**
> 1. Everything must be built, tested, and validated on `localhost` FIRST.
> 2. Even if a roadmap says "# 🛑 STOP: DO NOT PUSH (Wait for user approval)" at the end of a step, **IGNORE IT**. Replace any implied pushes with just running a local `npm run build` or `npx tsc --noEmit`.
> 3. Only push when the user explicitly confirms "everything is good and push".
> 4. This rule applies to ALL agents (Claude, Cursor, Gemini, etc.).

# Roadmap: Critical Fixes & Auth Hardening
> **Priority**: 🔴 P0 — Run FIRST before other roadmaps
> **Parallelism**: Can run alone. DO NOT run alongside roadmap-salon-i18n (different file set, safe).
> **Estimated Time**: ~30 minutes

## BREAKAGE RISK ASSESSMENT

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟢 SAFE | Nothing | Read-only audit |
| Phase 2 | 🟡 MEDIUM | `/termine` page could show blank | Test with logged-out user after |
| Phase 3 | 🟢 SAFE | Nothing | Adding redirects, not removing pages |
| Phase 4 | 🟡 MEDIUM | Voucher flow could break if auth check wrong | Test the buy flow after |
| Phase 5 | 🟢 SAFE | Nothing | Only updating CLAUDE.md |

---

## 🤖 Phase 1: Audit & Verify Current State (READ-ONLY)

**Goal**: Confirm the exact crash behavior and files.

1. Open `components/TerminePage.tsx` and verify the auth guard at line 236–253
2. Open `app/[locale]/vouchers/buy/page.tsx` and find the `// TODO: Replace with actual Supabase session check` at line 104
3. Run `npx tsc --noEmit 2>&1 | head -30` to check for existing TypeScript errors in these files
4. Grep for all pages that fetch `/api/profile` without proper error handling:
   ```bash
   grep -rn "fetch.*api/profile" app/ components/ --include="*.tsx" | head -20
   ```

> ⚠️ **BE CAREFUL**: Do NOT modify any files in Phase 1. This is read-only. Phase 2 depends on confirming structure first.

---

## 🤖 Phase 2: Fix `/termine` Crash

**Problem**: When an unauthenticated user visits `/de/termine`, the page crashes with React Error #310. The issue is in `components/TerminePage.tsx` at line 236–253: the promise chain fetches `/api/profile`, and if it returns 401, the `.then()` tries to call `r.json()` which can fail on non-JSON 401 responses, causing an unhandled error that React renders as a crash.

**Files**:
- [MODIFY] `components/TerminePage.tsx` — Lines 234-253

**What to do**:
Replace the `useEffect` auth check to properly handle non-JSON responses and add a safe redirect:

✅ DO:
```tsx
useEffect(() => {
  let cancelled = false;
  fetch("/api/profile")
    .then((r) => {
      if (!r.ok) {
        // Any non-200 means not authenticated — redirect to login
        if (!cancelled) router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return null;
      }
      return r.json();
    })
    .then((p) => {
      if (cancelled || !p) return;
      if (!p.id) {
        router.push(`/${locale}/auth/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }
      return fetch("/api/bookings?limit=100").then((r) => r.ok ? r.json() : null);
    })
    .then((d) => {
      if (cancelled) return;
      if (d) setBookings(d.bookings ?? []);
    })
    .catch((err) => {
      console.error("[TerminePage] Auth/booking fetch error:", err);
      if (!cancelled) router.push(`/${locale}/auth/login`);
    })
    .finally(() => { if (!cancelled) setLoading(false); });
  return () => { cancelled = true; };
}, [locale, router, pathname]);
```

❌ DON'T:
```tsx
// DON'T just swallow the error like this:
.catch(() => {})
// DON'T try to parse JSON from a 401 response without checking .ok first
.then((r) => r.json()) // This crashes if r is a 401 HTML page
```

**Verification**:
1. Open the site in an incognito window
2. Navigate to `/de/termine`
3. Should redirect to `/de/auth/login?redirect=%2Fde%2Ftermine` instead of crashing
4. After logging in, should redirect back to `/de/termine`

```bash
git add components/TerminePage.tsx
git commit -m "fix: prevent crash on /termine when unauthenticated — redirect to login"
```

> ⚠️ **BE CAREFUL**: 
> - The `TerminePage.tsx` uses `useTranslations("termine")` — do NOT remove i18n imports
> - Do NOT touch the `CancelModal` or `MiniCalendar` sub-components
> - The catch handler MUST include the redirect, not just `console.error`

---

## 🤖 Phase 3: Fix Ghost 404 Pages — Add Redirects

**Problem**: 4 routes exist in the codebase but 404 on production: `/vouchers`, `/loyalty`, `/referral`, `/behandlungen`. Build a single "Coming Soon" landing page that all missing routes redirect to.

**Files**:
- [NEW] `app/[locale]/coming-soon/page.tsx`
- [MODIFY] `middleware.ts` — Add redirect rules for ghost routes
- [MODIFY] `messages/de.json` — Add `comingSoon` translation keys
- [MODIFY] `messages/en.json` — Add `comingSoon` translation keys
- [MODIFY] `messages/fr.json` — Add `comingSoon` translation keys
- [MODIFY] `messages/it.json` — Add `comingSoon` translation keys

### Step 3a: Create the Coming Soon page
[NEW] `app/[locale]/coming-soon/page.tsx`:

```tsx
"use client";

import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, ArrowLeft, Bell } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const FEATURE_MAP: Record<string, { icon: string; color: string }> = {
  vouchers: { icon: "🎁", color: "rgba(232,98,74,.12)" },
  loyalty: { icon: "⭐", color: "rgba(212,135,10,.12)" },
  referral: { icon: "💌", color: "rgba(123,166,136,.15)" },
  behandlungen: { icon: "💆", color: "rgba(107,163,200,.15)" },
};

export default function ComingSoonPage() {
  const locale = useLocale();
  const t = useTranslations("comingSoon");
  const params = useSearchParams();
  const feature = params.get("feature") ?? "default";
  const meta = FEATURE_MAP[feature] ?? { icon: "✨", color: "rgba(232,98,74,.08)" };
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = async () => {
    if (!email.includes("@")) return;
    try {
      await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, feature }),
      });
      setSubmitted(true);
    } catch (err) {
      console.error("[ComingSoon] Waitlist error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full text-center"
      >
        <div
          className="w-20 h-20 rounded-[24px] mx-auto mb-6 flex items-center justify-center text-4xl"
          style={{ background: meta.color }}
        >
          {meta.icon}
        </div>

        <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text mb-2">
          {t("title")}
        </h1>
        <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-8 leading-relaxed">
          {t(`description_${feature}`, { defaultValue: t("descriptionDefault") })}
        </p>

        {!submitted ? (
          <div className="flex gap-2 mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("emailPlaceholder")}
              className="flex-1 px-4 py-3 rounded-btn bg-white dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/10 text-sm font-body text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 focus:outline-none focus:border-s-coral/40 focus:ring-2 focus:ring-s-coral/10"
            />
            <button
              onClick={handleNotify}
              className="px-5 py-3 rounded-btn bg-s-coral text-white text-sm font-heading font-bold hover:brightness-[1.06] active:scale-[0.98] transition-all duration-150 flex items-center gap-2"
            >
              <Bell size={14} />
              {t("notify")}
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-s-success text-sm font-medium mb-6">
            <Sparkles size={16} />
            {t("notifySuccess")}
          </div>
        )}

        <Link
          href={`/${locale}`}
          className="inline-flex items-center gap-1.5 text-sm text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-coral transition-colors duration-150"
        >
          <ArrowLeft size={14} />
          {t("backHome")}
        </Link>
      </motion.div>
    </div>
  );
}
```

### Step 3b: Add translation keys
Add to ALL 4 locale files (`messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`) a new top-level `"comingSoon"` key:

For `de.json`:
```json
"comingSoon": {
  "title": "Kommt bald",
  "descriptionDefault": "Wir arbeiten an etwas Tollem. Lass dich benachrichtigen, wenn es soweit ist!",
  "description_vouchers": "Gutscheine & Geschenkkarten sind bald verfügbar. Verschenke Beauty-Erlebnisse!",
  "description_loyalty": "Unser Treueprogramm mit Stempelkarten kommt bald. Sammle Punkte bei jedem Besuch!",
  "description_referral": "Empfiehl Solen an Freunde und erhalte Guthaben. Das Empfehlungsprogramm startet bald!",
  "description_behandlungen": "Entdecke bald alle Behandlungen und finde den perfekten Salon dafür.",
  "emailPlaceholder": "deine@email.ch",
  "notify": "Benachrichtigen",
  "notifySuccess": "Du wirst benachrichtigt, wenn es losgeht!",
  "backHome": "Zur Startseite"
}
```

For `en.json`:
```json
"comingSoon": {
  "title": "Coming Soon",
  "descriptionDefault": "We're working on something great. Get notified when it's ready!",
  "description_vouchers": "Gift vouchers are coming soon. Give the gift of beauty!",
  "description_loyalty": "Our stamp card loyalty program is launching soon. Earn rewards with every visit!",
  "description_referral": "Refer friends and earn credit. Our referral program is starting soon!",
  "description_behandlungen": "Discover all treatments and find the perfect salon. Coming soon!",
  "emailPlaceholder": "your@email.ch",
  "notify": "Notify Me",
  "notifySuccess": "We'll notify you when it's ready!",
  "backHome": "Back to Home"
}
```

For `fr.json`:
```json
"comingSoon": {
  "title": "Bientôt disponible",
  "descriptionDefault": "Nous travaillons sur quelque chose de formidable. Soyez notifié quand c'est prêt !",
  "description_vouchers": "Les bons cadeaux arrivent bientôt. Offrez de la beauté !",
  "description_loyalty": "Notre programme de fidélité avec cartes de tampons arrive bientôt !",
  "description_referral": "Parrainez vos amis et gagnez du crédit. Le programme de parrainage démarre bientôt !",
  "description_behandlungen": "Découvrez tous les traitements et trouvez le salon parfait. Bientôt !",
  "emailPlaceholder": "votre@email.ch",
  "notify": "Me notifier",
  "notifySuccess": "Vous serez notifié quand ce sera prêt !",
  "backHome": "Retour à l'accueil"
}
```

For `it.json`:
```json
"comingSoon": {
  "title": "In arrivo",
  "descriptionDefault": "Stiamo lavorando a qualcosa di fantastico. Ricevi una notifica quando è pronto!",
  "description_vouchers": "I buoni regalo sono in arrivo. Regala un'esperienza di bellezza!",
  "description_loyalty": "Il nostro programma fedeltà con carte timbri arriva presto!",
  "description_referral": "Invita amici e guadagna credito. Il programma referral parte presto!",
  "description_behandlungen": "Scopri tutti i trattamenti e trova il salone perfetto. In arrivo!",
  "emailPlaceholder": "tua@email.ch",
  "notify": "Avvisami",
  "notifySuccess": "Ti avviseremo quando sarà pronto!",
  "backHome": "Torna alla home"
}
```

### Step 3c: Add middleware redirects
[MODIFY] `middleware.ts` — Add redirect rules for ghost routes. Find the existing redirect logic and add:

```typescript
// Ghost page redirects → Coming Soon
const COMING_SOON_ROUTES = ["/vouchers", "/loyalty", "/referral", "/behandlungen"];
const pathWithoutLocale = pathname.replace(/^\/(de|en|fr|it)/, "");
if (COMING_SOON_ROUTES.includes(pathWithoutLocale)) {
  const locale = pathname.match(/^\/(de|en|fr|it)/)?.[1] ?? "de";
  return NextResponse.redirect(new URL(`/${locale}/coming-soon?feature=${pathWithoutLocale.slice(1)}`, request.url));
}

// Also add /hilfe → /help redirect
if (pathWithoutLocale === "/hilfe") {
  const locale = pathname.match(/^\/(de|en|fr|it)/)?.[1] ?? "de";
  return NextResponse.redirect(new URL(`/${locale}/help`, request.url));
}
```

**Verification**:
1. Visit `/de/vouchers` — should redirect to `/de/coming-soon?feature=vouchers`
2. Visit `/de/loyalty` — should redirect to `/de/coming-soon?feature=loyalty`
3. Visit `/de/hilfe` — should redirect to `/de/help`
4. The coming-soon page should render with the correct feature icon and description

```bash
git add app/[locale]/coming-soon/ middleware.ts messages/
git commit -m "feat: add Coming Soon landing page + redirect ghost 404s (vouchers, loyalty, referral, behandlungen, hilfe)"
```

> ⚠️ **BE CAREFUL**:
> - `middleware.ts` is CRITICAL — a bad regex here breaks ALL routes
> - Test localhost FIRST before committing
> - Do NOT add redirects for routes that already work (`/help`, `/partner`, `/agb`, etc.)
> - The `/api/waitlist` route already exists — verify it accepts `{ email, feature }` POST body
> - Do NOT touch any other middleware logic (auth, locale detection, etc.)

---

## 🤖 Phase 4: Fix Voucher Auth TODO

**Problem**: `app/[locale]/vouchers/buy/page.tsx` line 104 has `// TODO: Replace with actual Supabase session check`. The auth check is a stub in a payment flow.

**Files**:
- [MODIFY] `app/[locale]/vouchers/buy/page.tsx` — Lines around 100-115

**What to do**: Replace the TODO with a proper Supabase session check:

✅ DO:
```tsx
// Replace the TODO block with:
useEffect(() => {
  fetch("/api/profile")
    .then((r) => {
      if (!r.ok) return null;
      return r.json();
    })
    .then((p) => {
      if (p?.id) setUser(p);
    })
    .catch((err) => console.error("[VoucherBuy] Profile fetch error:", err));
}, []);
```

❌ DON'T:
```tsx
// DON'T leave the TODO in production code
// TODO: Replace with actual Supabase session check
// DON'T block guest purchases — vouchers should be buyable without login
```

**Verification**:
1. Visit `/de/vouchers/buy` without login — page should load (guest purchase allowed)
2. Visit with login — should show user info auto-filled

```bash
git add app/[locale]/vouchers/buy/page.tsx
git commit -m "fix: replace auth TODO stub with proper profile fetch in voucher buy flow"
```

> ⚠️ **BE CAREFUL**: 
> - Voucher purchases should work for BOTH logged-in and guest users
> - Do NOT add a login gate — this would kill conversions
> - Only use the auth to auto-fill email/name if available

---

## 🤖 Phase 5: Update CLAUDE.md

Add these notes to CLAUDE.md:
- Coming Soon page pattern: `app/[locale]/coming-soon/page.tsx` is the standard "coming soon" template. New features should redirect here until ready.
- Auth guard pattern: Always check `r.ok` before calling `r.json()` on profile fetches. Never `.catch(() => {})` on auth flows.

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md with coming-soon pattern and auth guard notes"
```

> ⚠️ **BE CAREFUL**: Only append to CLAUDE.md, never overwrite existing sections.

---

## 🔍 SELF-CHECK PROTOCOL

Before pushing, Claude Code MUST run this verification sequence:

```bash
# 1. TypeScript check
npx tsc --noEmit 2>&1 | tail -5

# 2. Build check  
npm run build 2>&1 | tail -10

# 3. Verify no regressions
grep -rn "catch(() => {})" components/TerminePage.tsx  # Should return 0 results
grep -rn "TODO.*session" app/[locale]/vouchers/buy/page.tsx  # Should return 0 results

# 4. Verify new files exist
ls app/[locale]/coming-soon/page.tsx
```

If ANY check fails, fix the issue before pushing. Do NOT ask the user — diagnose and fix autonomously.

---

## DEPENDENCY ORDERING

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Audit & verify | Nothing |
| Phase 2 | 🤖 | Fix /termine crash | Phase 1 |
| Phase 3 | 🤖 | Coming Soon + redirects | Nothing |
| Phase 4 | 🤖 | Voucher auth fix | Nothing |
| Phase 5 | 🤖 | Update CLAUDE.md | Phases 2-4 |
