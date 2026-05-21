import { z } from "zod";

/**
 * Centralized env-var schema. Single source of truth for every `process.env.*`
 * read in this codebase.
 *
 * Pre-2026-05-16 there was NO schema. Env was read inline with
 * `process.env.X || 'fallback'` patterns across ~40 files, silently masking
 * missing config in prod. See `_audits/2026-05-16-ai-coding-traps-audit/
 * 2b-env-fallbacks.md` for the full prior-state findings.
 *
 * Rules (per CLAUDE.md "Hardcoded values" rule):
 *   1. Required vars throw at FIRST ACCESS if missing/malformed (boot-time
 *      failure, not a customer-checkout-click failure).
 *   2. Optional vars are explicitly `.optional()` — callers MUST handle the
 *      undefined case (e.g. `if (!env.STRIPE_SECRET_KEY) return error500`).
 *   3. NO `|| 'fallback'` defaults anywhere. If a sensible default exists,
 *      it goes through zod `.default()`; otherwise undefined surfaces to caller.
 *   4. Format validation where applicable (`sk_*`, `whsec_*`, `re_*`, URL, email).
 *
 * Adding a new env var:
 *   1. Add to the schema below (required or `.optional()`).
 *   2. Add to `.env.example` with a placeholder.
 *   3. Set in `.env.local` + Netlify dashboard (server) or `.env.local` (public).
 *   4. Read via `getServerEnv().VAR` / `getPublicEnv().VAR`, never inline `process.env.VAR`.
 */

const serverEnvSchema = z.object({
  // ── Supabase ──────────────────────────────────────
  // SUPABASE_SERVICE_ROLE_KEY is the ONE truly-required server var — admin
  // client + every privileged server-side query depend on it.
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "SUPABASE_SERVICE_ROLE_KEY missing"),

  // ── Stripe ────────────────────────────────────────
  // Optional: salons without online payments can run without Stripe wired.
  // If present, must match Stripe's prefix conventions.
  STRIPE_SECRET_KEY: z
    .string()
    .refine((v) => v.startsWith("sk_live_") || v.startsWith("sk_test_"), {
      message: "STRIPE_SECRET_KEY must start with sk_live_ or sk_test_",
    })
    .optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),

  // ── Resend (email) ────────────────────────────────
  RESEND_API_KEY: z.string().startsWith("re_").optional(),
  RESEND_FROM_EMAIL: z.string().email().optional(),

  // ── AI providers ──────────────────────────────────
  // GEMINI_API_KEY is the canonical name. GOOGLE_AI_API_KEY exists in
  // exactly one route (`app/api/ai/suggest-service/route.ts:27`); migrate
  // that route to GEMINI_API_KEY and drop GOOGLE_AI_API_KEY from this
  // schema in a follow-up.
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_AI_API_KEY: z.string().optional(),
  FAL_KEY: z.string().optional(),

  // ── Upstash Redis (rate limiting) ─────────────────
  // Optional: missing means rate limiting is disabled (current behavior of
  // `lib/ratelimit.ts`). If present, both must be set for the client to work.
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // ── Cron + HMAC tokens ────────────────────────────
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 chars").optional(),
  BOOKING_HMAC_SECRET: z.string().min(16, "BOOKING_HMAC_SECRET must be at least 16 chars").optional(),
  LOYALTY_HMAC_SECRET: z.string().min(16, "LOYALTY_HMAC_SECRET must be at least 16 chars").optional(),

  // ── SMS via seven.io ──────────────────────────────
  // SEVEN_IO_API_KEY is the canonical name (matches `.env.example`).
  // SEVEN_API_KEY appears in some routes — migrate them and drop here later.
  SEVEN_IO_API_KEY: z.string().optional(),
  SEVEN_API_KEY: z.string().optional(),

  // ── Admin ─────────────────────────────────────────
  // No default. Routes that need admin contact must check explicitly:
  //   const adminEmail = getServerEnv().ADMIN_EMAIL;
  //   if (!adminEmail) return; // don't send notification
  ADMIN_EMAIL: z.string().email().optional(),

  // ── Stock photo APIs (optional) ───────────────────
  UNSPLASH_ACCESS_KEY: z.string().optional(),
  PEXELS_API_KEY: z.string().optional(),
  PIXABAY_API_KEY: z.string().optional(),

  // ── Mapbox server-side (optional) ─────────────────
  // Prefer NEXT_PUBLIC_MAPBOX_TOKEN for client-side use.
  MAPBOX_API: z.string().optional(),

  // ── PostHog server-side (optional) ────────────────
  POSTHOG_PERSONAL_API_KEY: z.string().optional(),
  POSTHOG_PROJECT_ID: z.string().optional(),

  // ── Built-in ──────────────────────────────────────
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const publicEnvSchema = z.object({
  // ── Supabase (publishable — these SHIP to the browser bundle) ─
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20, "NEXT_PUBLIC_SUPABASE_ANON_KEY missing"),

  // ── Stripe (publishable) ─────────────────────────
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z
    .string()
    .refine((v) => v.startsWith("pk_live_") || v.startsWith("pk_test_"), {
      message: "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with pk_live_ or pk_test_",
    })
    .optional(),

  // ── App URL ──────────────────────────────────────
  // NEXT_PUBLIC_APP_URL is the canonical name. NEXT_PUBLIC_SITE_URL is a
  // duplicate that's referenced in some legacy code; consolidate later.
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),

  // ── Mapbox client-side ───────────────────────────
  NEXT_PUBLIC_MAPBOX_TOKEN: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_STYLE_LIGHT: z.string().optional(),
  NEXT_PUBLIC_MAPBOX_STYLE_DARK: z.string().optional(),

  // ── PostHog client-side ──────────────────────────
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type PublicEnv = z.infer<typeof publicEnvSchema>;

let serverEnvCache: ServerEnv | null = null;
let publicEnvCache: PublicEnv | null = null;

function formatZodIssues(err: z.ZodError): string {
  return err.issues
    .map((i) => `  • ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
}

/**
 * Validated server-side env. Call from server code only (API routes, server
 * components, server actions, lib modules imported only by server code).
 *
 * Throws on FIRST ACCESS if any required var is missing or malformed —
 * that's the design. We want crash-loud at boot, not silent fallback at runtime.
 */
export function getServerEnv(): ServerEnv {
  if (serverEnvCache) return serverEnvCache;

  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const msg = `[lib/env] Server env validation failed:\n${formatZodIssues(parsed.error)}`;
    console.error(msg);
    throw new Error(msg);
  }

  serverEnvCache = parsed.data;
  return serverEnvCache;
}

/**
 * Validated public env. Safe to call from client + server.
 *
 * Next.js inlines NEXT_PUBLIC_* at BUILD time. Reading via `process.env.NEXT_PUBLIC_*`
 * in client code returns the inlined literal — but the rest of `process.env` is empty
 * on the client. So we pluck each NEXT_PUBLIC_* explicitly before parsing.
 */
export function getPublicEnv(): PublicEnv {
  if (publicEnvCache) return publicEnvCache;

  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    NEXT_PUBLIC_MAPBOX_STYLE_LIGHT: process.env.NEXT_PUBLIC_MAPBOX_STYLE_LIGHT,
    NEXT_PUBLIC_MAPBOX_STYLE_DARK: process.env.NEXT_PUBLIC_MAPBOX_STYLE_DARK,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
  };

  const parsed = publicEnvSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = `[lib/env] Public env validation failed:\n${formatZodIssues(parsed.error)}`;
    console.error(msg);
    throw new Error(msg);
  }

  publicEnvCache = parsed.data;
  return publicEnvCache;
}

/**
 * Canonical app URL accessor. Prefers NEXT_PUBLIC_APP_URL; falls back to
 * NEXT_PUBLIC_SITE_URL during the consolidation period. Throws if neither set.
 *
 * (Drop the SITE_URL leg once every caller is migrated and the var is removed
 * from `.env.example`.)
 */
export function getAppUrl(): string {
  const env = getPublicEnv();
  const url = env.NEXT_PUBLIC_APP_URL ?? env.NEXT_PUBLIC_SITE_URL;
  if (!url) {
    throw new Error("[lib/env] NEXT_PUBLIC_APP_URL or NEXT_PUBLIC_SITE_URL must be set");
  }
  return url;
}
