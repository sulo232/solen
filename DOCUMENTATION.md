# Solen.ch , documentation moved

> This file used to describe Solen as a "Vanilla HTML/CSS/JS monolith" (13,000-line `index.html`, no build step, GitHub Pages / Vercel). **That was a fossil from a long-dead version of the project and was wrong.** It has been replaced to stop it misleading readers (2026-07-14).

**Solen today** is a Next.js App Router + Supabase (Postgres, Auth, Storage) + Stripe marketplace, deployed on **Netlify**, with ~351 API routes, 26 crons (GitHub Actions), and 7 Supabase edge functions.

## Where the real documentation lives

| You want... | Read |
|---|---|
| **How every backend system actually works** (auth, DB/RLS, storage, payments, booking engine, crons, notifications, search, security, ops, value-store, GDPR, moderation, AI/analytics) | **`_docs/BACKEND.md`** |
| Project overview: stack, folder tree, commands, deployment | `_docs/PROJECT_REFERENCE.md` |
| Design system (tokens, components, motion, voice) | `_design-system/SOURCE.md` + `_design-system/LOCKFILE.md` |
| Security rules every API route must follow | `_rules/SECURITY_RULES.md` |
| Database schema | `_rules/DB_SCHEMA.md` |
| Backend health + security state (latest audit) | `_plans/BACKEND_HEALTH_AUDIT_2026-07-14.md` |
| Ops: monitoring, backups, disaster recovery, cost | `_plans/OPS_RUNBOOK.md` |
| Operational rules (auto-loaded) | `CLAUDE.md` |
