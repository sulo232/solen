# SalonContact — section spec

**Reference:** (Fresha shows contact in the title-block; Solen shows in main column on mobile for parity with desktop sidebar) · `_audits/screenshots/salon-detail/10-mobile-haarwerk-c2.png` (Solen — Kontakt section)
**Component:** `app/[locale]/_components/salon/SalonContact.tsx`
**Layer:** 1 (chrome)

## Layout

Mobile-only (`lg:hidden`). On desktop the same info is in `SalonSidebar`.

```
H2 "Kontakt"                 (Inter Tight 700 clamp 18-23px)

📞  +41 61 555 12 34
🌐  atelier-haarwerk.ch                                  [↗]
📷  @atelier_haarwerk                                    [↗]
```

- List spacing: `space-y-3`
- Each row: `flex items-center gap-3 text-[14px] text-s-ink`
- Lucide icon: `size={16} strokeWidth={2} text-s-ink-3` (icon stays muted, text is full ink)
- External link indicator: `ExternalLink size={12} text-s-ink-3 opacity-60`

## Tokens
- All text: `text-s-ink` (interactive — full contrast)
- Icons: `text-s-ink-3` (passive indicators)
- Hover: `hover:text-s-ink` (no color change — kept consistent for B&W chrome)

## Interaction
- Phone row: `<a href="tel:{phone}">` → native dialer
- Website row: `<a href={url} target="_blank" rel="noreferrer noopener">` → new tab
- Instagram row: same; URL formatted as `@handle` (stripped of `https://instagram.com/` prefix)

## Intentional deviations
- Solen renders this as a section in main flow on mobile because the title-block contact icons (Fresha pattern) would crowd the H1 + meta row at narrow widths
- Format Instagram as `@handle` (stripped) — clearer than full URL

## Edge cases
- All three null: returns null (no empty section)
- One or two present: renders only those

## Provenance
- V2-D53.3 — initial impl (added for mobile-vs-desktop parity)
- V3-D202 (A15) — H2 swap to Inter Tight 700
