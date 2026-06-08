# 🧑 Solen.ch — Manual Steps Roadmap

> These are tasks that require YOUR action — before or alongside the Claude Code prompts.

---

## Step 1 — Supabase Env Vars ✅ DONE

## Step 2 — Map Provider

Mapbox skipped. MapView currently uses Mapbox — if it breaks due to no token, two options:
- **Option A:** Switch to Leaflet + OpenStreetMap (free, no API key). Tell Claude Code to refactor `MapView.tsx` from Mapbox GL to `react-leaflet`.
- **Option B:** Leave MapView as-is. It'll show a fallback/error if no Mapbox token. Not blocking.

> Note: This is NOT in the 3 parallel prompts. If you want Option A, create a separate prompt.

## Step 3 — Stripe ✅ DONE

## Step 4 — OpenWeather ✅ DONE

## Step 5 — Tag Current State ⏱️ 1 min

**Do BEFORE starting any Claude Code prompt.**

```bash
cd ~/Documents/solen
git tag v2-design-coral -m "Pre-polish snapshot" && git push origin v2-design-coral
```

## Step 6 — Legal Pages (When Ready)

Not blocking. Fill in real business data when you have it:
- `app/[locale]/impressum/page.tsx` — company name, address, phone, email, trade register #, VAT #
- `app/[locale]/agb/page.tsx` — terms of service
- `app/[locale]/datenschutz/page.tsx` — privacy policy (Swiss nDSG compliant)

## After ALL Prompts

```bash
git tag v3-ui-polish -m "Post-polish" && git push origin v3-ui-polish
```
