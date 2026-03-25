# Account / Messages Page — Deep-Dive V3 Roadmap

> **Scope:** `app/[locale]/account/messages/page.tsx` (150 lines). `account/page.tsx` is a redirect to `/profile` — nothing to do there.
> **Zone: 3 (Clean Functional)** — Messaging is trust + utility. Zero glass, zero blobs. Solid card surfaces with warm shadows. `ChatWindow` is dynamically imported — **do not touch it**.
>
> ⚠️ **CRITICAL:** `ChatWindow` (line 132), the API calls to `/api/conversations` and `/api/profile`, and all conversation selection logic are completely untouched.

---

## Violations Found

| Location | Issue | Action |
|---|---|---|
| Loading state (lines 46–51) | `<Spinner size="lg" />` centered | → conversation list skeleton |
| Empty state icon (line 56) | Raw `MessageCircle w-12 h-12 text-s-ink/20` — no icon box | → coral icon box |
| Empty state heading (line 57) | `font-semibold text-lg` — no eyebrow | Add eyebrow above |
| Empty state body (line 58–60) | `text-sm text-s-ink/50` — correct font-body ✅ | Keep |
| Empty state CTA (line 63) | `font-medium text-sm rounded-btn bg-s-coral` | → `font-heading font-bold uppercase text-xs` |
| Page h1 (line 74) | `font-heading font-bold text-2xl` ✅ but no eyebrow | Add `"Nachrichten"` eyebrow |
| Conversation list item (line 86) | `rounded-card` | → `rounded-[12px]` |
| Conv item active (line 88) | `bg-s-coral/5 border border-s-coral/20` ✅ warm tint, keep | Keep |
| Conv item inactive (line 89) | `border-s-ink/5` — too faint | → `border-s-ink/[0.07]` |
| Conv name (line 98) | `text-sm font-medium` | → `text-sm font-heading font-semibold` |
| Conv preview (line 106) | `text-xs text-s-ink/40` ✅ | Keep |
| Conv timestamp (line 109) | `text-[10px] text-s-ink/25` | → `font-heading uppercase tracking-[.08em]` |
| Conv avatar (line 93) | `rounded-full bg-s-coral/20 font-semibold text-sm` | → `font-heading font-bold text-xs` |
| Chat header name (lines 127–129) | `text-sm font-medium text-s-ink` | → `font-heading font-semibold` + eyebrow |
| Empty chat placeholder (line 140–142) | `text-s-ink/30 text-sm` | → `font-heading uppercase tracking` |
| Page bg (line 72) | `bg-s-bg-surface` ✅ — correct Zone 3 | Keep |

---

## Phase 1 — Loading Skeleton

### Current state (lines 45–51)
```tsx
if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
```

### Files to modify

#### [MODIFY] [account/messages/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/account/messages/page.tsx)
**Lines 45–51** — loading skeleton:
```tsx
if (loading) {
  return (
    <div className="min-h-screen bg-s-bg-surface">
      <div className="max-w-5xl mx-auto pt-6 pb-8 px-4 sm:px-6 animate-pulse">
        <div className="h-2.5 w-20 bg-s-bg-sunken rounded mb-1" />
        <div className="h-7 w-36 bg-s-bg-sunken rounded mb-6" />
        <div className="flex gap-4">
          {/* Conversation list skeleton */}
          <div className="w-72 shrink-0 flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-[12px] bg-white border border-s-ink/[0.06]">
                <div className="w-10 h-10 rounded-full bg-s-bg-sunken shrink-0" />
                <div className="flex-1 space-y-1.5 pt-1">
                  <div className="h-2.5 w-3/4 bg-s-bg-sunken rounded" />
                  <div className="h-2 w-1/2 bg-s-bg-sunken rounded" />
                </div>
              </div>
            ))}
          </div>
          {/* Chat pane skeleton */}
          <div className="flex-1 rounded-[14px] bg-white border border-s-ink/[0.06]" />
        </div>
      </div>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/account/messages/page.tsx && git commit -m "MSGS-P1: loading → messages list + chat pane skeleton"`

---

## Phase 2 — Empty State: Icon Box + Eyebrow

### Current state (lines 53–68)
```tsx
<div className="min-h-screen bg-s-bg-surface flex flex-col items-center justify-center gap-4 text-center px-4">
  <MessageCircle className="w-12 h-12 text-s-ink/20" />
  <p className="font-heading font-semibold text-s-ink text-lg">Keine Nachrichten</p>
  <p className="text-sm text-s-ink/50">...</p>
  <a className="... bg-s-coral font-medium text-sm ...">Salons entdecken</a>
</div>
```

### Files to modify

#### [MODIFY] [account/messages/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/account/messages/page.tsx)
**Lines 53–68** — empty state:
```tsx
if (conversations.length === 0) {
  return (
    <div className="min-h-screen bg-s-bg-surface flex flex-col items-center justify-center gap-3 text-center px-4">
      <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-2"
        style={{ background: "rgba(232,98,74,.08)" }}>
        <MessageCircle size={28} className="text-s-coral/70" />
      </div>
      <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30">
        Nachrichten
      </p>
      <p className="font-heading font-bold text-lg text-s-ink">Noch keine Nachrichten</p>
      <p className="text-sm font-body text-s-ink/45 max-w-xs leading-relaxed">
        Wenn du einen Salon kontaktierst, erscheinen deine Unterhaltungen hier.
      </p>
      <a href={`/${locale}/coiffeur`}
        className="mt-2 px-6 py-3.5 rounded-btn text-white text-xs font-heading font-bold uppercase tracking-[.04em] active:scale-[0.98] transition-all"
        style={{ background: "#E8624A", boxShadow: "0 2px 4px rgba(232,98,74,.25), 0 4px 12px rgba(232,98,74,.15)" }}>
        Salons entdecken
      </a>
    </div>
  );
}
```

**Git commit:** `git add app/[locale]/account/messages/page.tsx && git commit -m "MSGS-P2: empty state → coral icon box, eyebrow, font-heading CTA uppercase"`

---

## Phase 3 — Page Heading + Eyebrow

### Current state (line 74)
```tsx
<h1 className="font-heading font-bold text-2xl text-s-ink mb-6">Nachrichten</h1>
```

### Files to modify

#### [MODIFY] [account/messages/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/account/messages/page.tsx)
**Line 74** — page heading:
```tsx
<div className="mb-6">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.22em] text-s-ink/30 mb-1">
    Account
  </p>
  <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text">Nachrichten</h1>
</div>
```

**Git commit:** `git add app/[locale]/account/messages/page.tsx && git commit -m "MSGS-P3: page h1 → 'Account' eyebrow above heading"`

---

## Phase 4 — Conversation List Items

### Current state (lines 85–118)
```tsx
<button className={[
  "flex items-start gap-3 p-3 rounded-card text-left transition-colors w-full",
  selected === conv.id
    ? "bg-s-coral/5 border border-s-coral/20"
    : "bg-white border border-s-ink/5 hover:border-s-coral/20",
].join(" ")}>
  {/* Avatar */}
  <div className="w-10 h-10 rounded-full bg-s-coral/20 font-semibold text-sm">
    {initial}
  </div>
  {/* Name */}
  <p className="text-sm font-medium text-s-ink truncate">{name}</p>
  {/* Preview */}
  <p className="text-xs text-s-ink/40 truncate">{preview}</p>
  {/* Timestamp */}
  <p className="text-[10px] text-s-ink/25">{date}</p>
```

### Files to modify

#### [MODIFY] [account/messages/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/account/messages/page.tsx)
**Lines 85–118** — full conversation list item:
```tsx
<button
  key={conv.id}
  onClick={() => setSelected(conv.id)}
  className={[
    "flex items-start gap-3 p-3 rounded-[12px] text-left w-full transition-all",
    selected === conv.id
      ? "border border-s-coral/20"
      : "bg-white dark:bg-s-dm-surface border border-s-ink/[0.07] dark:border-white/[0.06] hover:border-s-coral/25",
  ].join(" ")}
  style={selected === conv.id ? { background: "rgba(232,98,74,.04)" } : undefined}>

  {/* Avatar */}
  <div className="w-10 h-10 rounded-full flex items-center justify-center text-s-coral text-xs font-heading font-bold shrink-0"
    style={{ background: "rgba(232,98,74,.15)" }}>
    {conv.other_party_name?.[0] ?? "?"}
  </div>

  <div className="flex-1 min-w-0">
    <div className="flex items-center justify-between gap-1">
      <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text truncate">
        {conv.other_party_name}
      </p>
      {unread > 0 && (
        <span className="w-5 h-5 rounded-full bg-s-coral text-white text-[10px] flex items-center justify-center font-heading font-bold shrink-0">
          {unread}
        </span>
      )}
    </div>
    {conv.last_message_preview && (
      <p className="text-xs font-body text-s-ink/40 dark:text-s-dm-text/40 truncate mt-0.5">
        {conv.last_message_preview}
      </p>
    )}
    {conv.last_message_at && (
      <p className="text-[9px] font-heading uppercase tracking-[.08em] text-s-ink/25 dark:text-s-dm-text/25 mt-0.5">
        {new Date(conv.last_message_at).toLocaleDateString("de-CH", {
          day: "numeric",
          month: "short",
        })}
      </p>
    )}
  </div>
</button>
```

**Git commit:** `git add app/[locale]/account/messages/page.tsx && git commit -m "MSGS-P4: conv list → rounded-[12px], font-heading name+timestamp, coral avatar"`

---

## Phase 5 — Chat Header Name + Empty Placeholder

### Current state (lines 126–142)
```tsx
<div className="mb-2 flex items-center gap-2">
  <p className="text-sm font-medium text-s-ink">{selectedConv?.other_party_name}</p>
</div>
...
<div className="h-full flex items-center justify-center text-s-ink/30 text-sm">
  Wähle eine Unterhaltung
</div>
```

### Files to modify

#### [MODIFY] [account/messages/page.tsx](file:///c:/Users/sulod/solen/app/%5Blocale%5D/account/messages/page.tsx)
**Lines 126–130** — chat header:
```tsx
<div className="mb-3 pb-3 border-b border-s-ink/[0.06] flex items-center gap-2">
  <div className="w-7 h-7 rounded-full flex items-center justify-center text-s-coral text-[10px] font-heading font-bold shrink-0"
    style={{ background: "rgba(232,98,74,.12)" }}>
    {selectedConv?.other_party_name?.[0] ?? "?"}
  </div>
  <div>
    <p className="text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text">
      {selectedConv?.other_party_name}
    </p>
    <p className="text-[9px] font-heading uppercase tracking-[.10em] text-s-ink/30">Salon</p>
  </div>
</div>
```

**Lines 140–142** — empty chat placeholder:
```tsx
<div className="h-full flex flex-col items-center justify-center gap-2 text-center">
  <p className="text-[9px] font-heading font-bold uppercase tracking-[.18em] text-s-ink/25 dark:text-s-dm-text/25">
    Unterhaltung auswählen
  </p>
  <p className="text-xs font-body text-s-ink/25">Wähle links eine Unterhaltung</p>
</div>
```

**Git commit:** `git add app/[locale]/account/messages/page.tsx && git commit -m "MSGS-P5: chat header → mini avatar + salon label; empty pane → eyebrow uppercase"`

---

## Execution Order

| Phase | Task | Parallel? |
|---|---|---|
| P1 | Loading skeleton | ✅ Start here |
| P2 | Empty state | ✅ Independent |
| P3 | Page heading + eyebrow | ✅ Independent |
| P4 | Conversation list items | After P3 (same area) |
| P5 | Chat header + empty pane | After P4 (needs P4 context) |

> P1, P2, P3 all parallel.
> P4 after P3.
> P5 last.

---

## MESSAGES COMPLIANCE CHECK

```bash
npm run build

# rounded-card removed:
grep -n "rounded-card" app/[locale]/account/messages/page.tsx
# Expected: 0

# font-medium removed:
grep -n "font-medium\b" app/[locale]/account/messages/page.tsx
# Expected: 0

# ChatWindow untouched:
grep -n "ChatWindow" app/[locale]/account/messages/page.tsx
# Expected: still present at import + usage

# API calls untouched:
grep -n "api/conversations\|api/profile" app/[locale]/account/messages/page.tsx
# Expected: both present

# Manual checklist:
# ✅ Loading: messages list skeleton + chat pane skeleton
# ✅ Empty state: coral icon box, eyebrow, font-heading CTA
# ✅ Page heading: "Account" eyebrow above h1
# ✅ Conversation items: rounded-[12px], font-heading name, coral avatar
# ✅ Active item: coral/4 bg + coral border (no glass)
# ✅ Timestamps: 9px font-heading uppercase
# ✅ Chat header: mini avatar + "Salon" label
# ✅ ChatWindow: NOT TOUCHED
```

---

## Final Step — Push

```bash
git push
```
