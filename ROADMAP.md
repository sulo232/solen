# 🚀 Solen — Salon Registration Fix + Staff Step Roadmap

> **For:** Claude Code
> **Updated:** 2026-03-12
> **Scope:** Fix all bugs in the salon registration flow (screenshots) + add a staff management step during signup.

---

## ⚠️ CONSTRAINTS

- All code is in root `index.html` (~13,800 lines). No build tools, no npm, no `src/`.
- All visible text needs `data-i18n` + translations for **DE / EN / FR / TR**.
- Every change must work in **dark mode** and **light mode**.
- Test all changes at **mobile width (390×844)** — the registration is used primarily on phone.
- After final phase, bump SW cache version in `sw.js`.
- `git push origin main` after each phase.

---

## Phase 1: Address Field — Google Maps Autocomplete

**Screenshot 1:** Step 2 "Strasse & Hausnummer" — user wants address suggestions (like Google Maps autocomplete) while typing.

**Field:** `<input id="reg_street">` at line ~10634 inside `#regStep2`.

### What to do:

#### 1.1 — Add Google Places Autocomplete API
Load the Google Places JS library in `<head>`:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initPlacesAutocomplete" async defer></script>
```
> **⚠️ IMPORTANT:** You need a Google Maps API key with the Places API enabled. Ask the user for their API key, or use the Solen project's existing key if one exists. Search for `maps.googleapis.com` in the file to see if one is already loaded.

#### 1.2 — Initialize autocomplete on the street input
Add a JS function:
```js
function initPlacesAutocomplete() {
  const input = document.getElementById('reg_street');
  if (!input) return;
  const autocomplete = new google.maps.places.Autocomplete(input, {
    types: ['address'],
    componentRestrictions: { country: 'ch' },
    fields: ['formatted_address', 'address_components', 'geometry']
  });
  autocomplete.addListener('place_changed', function() {
    const place = autocomplete.getPlace();
    if (place.formatted_address) {
      input.value = place.formatted_address;
    }
    // Optionally auto-fill quartier based on address components
  });
}
```
Restrict to Switzerland (`country: 'ch'`) since Solen is Basel-focused.

#### 1.3 — Style the autocomplete dropdown
Google's autocomplete dropdown needs to match Solen's dark mode. Add CSS:
```css
.pac-container {
  background: var(--surface) !important;
  border: 1.5px solid var(--border) !important;
  border-radius: 12px !important;
  font-family: var(--font-body) !important;
  z-index: 10001 !important;
}
[data-theme="dark"] .pac-container { background: var(--surface) !important; }
.pac-item { padding: 10px 14px !important; border-color: var(--border) !important; color: var(--text) !important; }
.pac-item:hover { background: var(--surfaceAlt) !important; }
.pac-item-query { color: var(--text) !important; }
.pac-matched { font-weight: 700 !important; }
.pac-icon { display: none; }
```

#### 1.4 — Fallback if no API key
If Google Places API isn't available, the field should still work as a normal text input. No errors, just no suggestions.

### ⚡ Caution:
- The autocomplete dropdown renders outside `#salonRegModal` in the DOM — make sure `z-index: 10001` is above the modal's `z-index: 9999`.
- Touch targets in the suggestion list must be ≥44px for mobile.
- If a Google Maps API key is already loaded elsewhere in the file (search for `maps.googleapis.com`), reuse it — don't load the script twice.

### ✅ Test:
1. Open salon registration, go to Step 2.
2. Start typing "Hauptstrasse" — address suggestions should appear.
3. Tap a suggestion — the full address fills the field.
4. Test in dark mode — dropdown should match the theme.
5. Test on mobile — suggestions should be tappable with a thumb.

---

## Phase 2: Fix "Filiale von" Dropdown (Broken Select)

**Screenshot 2:** The "Filiale von (optional)" dropdown at Step 4 shows **multiple overlapping down-arrows (chevrons)** — it looks glitchy and broken.

**Element:** `<select id="reg_parent_store_id" class="form-input">` at line ~10681.

### Root cause:
The `<select>` has `class="form-input"` AND is inside a `.reg-field`, so it inherits TWO sets of styles:
1. `.reg-field select` at line ~10480: `appearance:none; -webkit-appearance:none;` — hides native arrow
2. `.form-input` (defined elsewhere): likely adds its own custom arrow via `background-image` or `::after`
3. The browser might STILL render a native arrow despite `appearance:none` on some iOS/Android versions

This causes duplicate or triple arrows.

### Fix:

#### 2.1 — Remove `class="form-input"` from the select
At line ~10681, change:
```html
<select id="reg_parent_store_id" class="form-input" style="font-size:.88rem">
```
to:
```html
<select id="reg_parent_store_id" style="font-size:.88rem">
```
This way it only picks up `.reg-field select` styles which are already correct.

#### 2.2 — Add a single clean custom arrow
Add a custom dropdown arrow using a background SVG on `.reg-field select`:
```css
.reg-field select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 14px;
  padding-right: 36px;
}
```
Check if this rule already exists at line ~10480 — if so, add the `background-image` properties. If there's a conflicting rule somewhere, remove it.

#### 2.3 — Dark mode arrow color
```css
[data-theme="dark"] .reg-field select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23aaa' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
}
```

#### 2.4 — Also fix the Category dropdown (Step 1) and Quartier dropdown (Step 2)
The same bug may affect `<select id="reg_cat">` (line ~10615) and `<select id="reg_nb">` (line ~10636). Apply the same fix to all `<select>` elements inside `.reg-field`.

### ✅ Test:
1. Step 1: tap "Kategorie wählen" — clean single arrow, dropdown opens correctly on mobile.
2. Step 2: tap "Quartier wählen" — same clean look.
3. Step 4: tap "Filiale von" — single arrow, opens a native iOS/Android picker, no visual glitches.
4. Test both dark mode and light mode.

---

## Phase 3: Fix Opening Hours Checkboxes + Day Rows

**Screenshot 3:** The day checkboxes (MO, DI, MI, etc.) on Step 4 can't be tapped on phone. The boxes "look weird" and the rows feel broken.

**Element:** `#regHoursGrid` at line ~10683, rendered by JS (search for `regHoursGrid`).

### Root cause analysis:
- At line ~10488: `.reg-day-row input[type=checkbox]` has `width:22px; height:22px` with `accent-color:var(--accent2)`.
- At line ~10514: mobile override increases to `width:24px; height:24px`.
- The `appearance:none` on `.reg-field input` at line ~10480 **includes checkboxes** because the selector is `.reg-field input` (no type filter). This hides the checkbox completely — it becomes invisible/untappable.

### Fix:

#### 3.1 — Exclude checkboxes from `appearance:none`
At line ~10480, change the selector from:
```css
.reg-field input,.reg-field select,.reg-field textarea
```
to:
```css
.reg-field input:not([type=checkbox]):not([type=radio]),.reg-field select,.reg-field textarea
```
This preserves checkbox native appearance so it's visible and tappable.

#### 3.2 — Explicitly restore checkbox appearance
Add:
```css
.reg-day-row input[type=checkbox] {
  appearance: checkbox !important;
  -webkit-appearance: checkbox !important;
}
```

#### 3.3 — Improve the day row layout for mobile
The row currently has `display:flex; align-items:center; gap:8px`. On small screens, the time inputs may overflow. Fix:

```css
@media (max-width: 600px) {
  .reg-day-row {
    display: grid;
    grid-template-columns: 28px 32px 1fr auto 1fr;
    gap: 6px;
    align-items: center;
  }
}
```
Where columns = checkbox | day label | start time | dash | end time.

#### 3.4 — Ensure time inputs are tappable
The `<input type="time">` elements at line ~10491 have `min-height:36px`. On mobile at line ~10515 this is `min-height:44px`. **Verify** you can actually tap and change the time on iOS/Android. If the native time picker doesn't open, it might be because the input is too narrow or overlapped.

Add `cursor:pointer` and ensure `touch-action:manipulation`.

### ✅ Test:
1. Step 4: each day checkbox (MO through SO) must be **tappable** on phone.
2. Tapping a checkbox should toggle check/uncheck visually.
3. Time inputs (09:00 / 19:00) should open a native time picker on tap.
4. The entire row should fit on one line — no overflow or wrapping.
5. Test on iOS Safari and Android Chrome.

---

## Phase 4: Fix Footer Buttons — "Zurück" + "Jetzt eintragen" Overflow

**Screenshot 4:** On Step 4, the "← Zurück" and "Jetzt eintragen" buttons don't fit on one line. The text wraps/hyphenates ("Zu-rück", "Jetzt eintra-gen"), which looks broken.

**Element:** `.salon-reg-footer` at line ~10494 (CSS) and line ~10693 (HTML).

### Root cause:
- `.salon-reg-footer button` has `padding:11px 24px` and `font-size:.88rem`.
- Mobile override at line ~10516: `padding:13px 28px; font-size:.92rem`.
- With two buttons in a `display:flex; gap:10px` container, the combined width exceeds the modal width (especially on ≤375px screens like iPhone SE).

### Fix:

#### 4.1 — Reduce button padding on mobile
```css
@media (max-width: 600px) {
  .salon-reg-footer {
    padding: 16px 20px 24px;
    gap: 8px;
  }
  .salon-reg-footer button {
    padding: 12px 16px;
    font-size: .85rem;
    min-height: 48px;
    flex: 1;
    white-space: nowrap;
  }
}
```
`flex:1` makes both buttons share the space equally. `white-space:nowrap` prevents hyphenation.

#### 4.2 — Shorten button text on very small screens
If `white-space:nowrap` + `flex:1` still doesn't fit on tiny screens (≤360px), shorten the text via JS on mobile:
- "← Zurück" → "← Zurück" (already short, fine)
- "Jetzt eintragen" → "Eintragen" on small screens

Or use `font-size: .82rem` as a last resort.

#### 4.3 — Apply the same fix to ALL step footers
The same button layout is used on Steps 1–3 ("← Zurück" / "Weiter →"). Make sure these also don't wrap. They're shorter text so probably fine, but verify.

### ✅ Test:
1. On iPhone SE (375px) and iPhone 14 (390px): Step 4 footer buttons sit side by side on one line.
2. No hyphenation or word-breaking in button text.
3. Both buttons are fully tappable (≥48px tall on mobile).
4. Test Steps 1–3 footers too.

---

## Phase 5: Add Staff Management Step to Salon Registration

**Current flow:** 4 steps: Basis-Info → Standort → Services → Details/Öffnungszeiten.
**New flow:** 5 steps: Basis-Info → Standort → Services → **Team / Personal** → Details/Öffnungszeiten.

The user wants to add/manage staff (names, roles, calendar availability) during salon registration.

### Existing staff system in the codebase:
- **CSS:** `.stylist-grid`, `.stylist-avatar`, `.stylist-name`, `.stylist-role`, `.stylist-add-form` (lines ~858–868)
- **Staff setup cards:** `.staff-setup-card` (line ~1483), `.staff-card` (line ~1368)
- **Add staff modal:** `#addStaffMdl` (line ~1402)
- **Staff calendar editor:** `.stylist-cal-modal`, `.stylist-cal-modal-overlay` (lines ~2277–2282)
- **Supabase table:** `stylists` table (used by existing dashboard staff management)

### What to build:

#### 5.1 — Update step count from 4 to 5
- Add a 5th dot to the progress dots (line ~10600–10604): add `<div class="salon-reg-dot" id="regDot5"></div>`.
- Update step hints: "Schritt 1 von **5**", "Schritt 2 von **5**", etc. (lines ~10612, 10633, 10660, 10679).
- Create a new `<div class="reg-step" id="regStep4">` for the staff step.
- Renumber the old Step 4 (Details/Öffnungszeiten) to Step 5 (`regStep5`, `regDot5`).
- Update the `regNext()` and `regPrev()` functions (search for them) to handle 5 steps.
- Update `submitSalonReg()` to be on Step 5 instead of Step 4.

#### 5.2 — New Step 4 HTML: "Dein Team"
Insert after `</div><!-- end regStep3 -->` (after line ~10675):

```html
<!-- STEP 4: Staff / Team -->
<div class="reg-step" id="regStep4">
  <div class="salon-reg-body">
    <p class="step-hint">Schritt 4 von 5: Dein Team</p>
    <p style="font-size:.85rem;color:var(--muted);margin-bottom:14px">
      Füge dein Team hinzu. Du kannst später jederzeit Mitarbeiter ändern.
    </p>
    <div id="regStaffContainer">
      <!-- Staff cards rendered by JS -->
    </div>
    <button type="button" onclick="regAddStaffRow()" style="font-size:.82rem;background:none;border:1.5px dashed var(--border2);color:var(--text2);padding:12px 16px;border-radius:var(--r);cursor:pointer;margin-top:8px;width:100%;min-height:44px">
      + Mitarbeiter hinzufügen
    </button>
  </div>
  <div class="salon-reg-footer">
    <button type="button" class="reg-btn-back" onclick="regPrev(4)">← Zurück</button>
    <button type="button" class="reg-btn-next" onclick="regNext(4)">Weiter →</button>
  </div>
</div>
```

#### 5.3 — Staff row template
Each staff member is a card with:
- **Name** (required) — text input
- **Rolle** — text input (e.g., "Senior Stylist", "Junior", "Auszubildende")
- **Buchbar** — checkbox (whether customers can book this person directly)
- **Verfügbarkeit** — per-weekday toggle (MO–SO) with start/end time
- **Delete button** — to remove the row

Use the existing `.stylist-add-form` and `.staff-setup-card` CSS classes for consistent styling.

JS function:
```js
let regStaffRows = [];
function regAddStaffRow() {
  const container = document.getElementById('regStaffContainer');
  const idx = regStaffRows.length;
  regStaffRows.push({ name: '', role: '', bookable: true, hours: {} });
  const card = document.createElement('div');
  card.className = 'staff-setup-card';
  card.style.cssText = 'margin-bottom:12px;padding:16px;position:relative';
  card.innerHTML = `
    <button type="button" onclick="regRemoveStaff(${idx},this)" style="position:absolute;top:8px;right:8px;background:none;border:none;color:var(--text2);cursor:pointer;font-size:1rem">&times;</button>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
      <div class="reg-field" style="margin:0"><label>Name</label><input type="text" class="reg-staff-name" data-idx="${idx}" placeholder="z.B. Maria"></div>
      <div class="reg-field" style="margin:0"><label>Rolle</label><input type="text" class="reg-staff-role" data-idx="${idx}" placeholder="z.B. Senior Stylist"></div>
    </div>
    <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;cursor:pointer;margin-bottom:10px">
      <input type="checkbox" class="reg-staff-bookable" data-idx="${idx}" checked style="width:20px;height:20px;accent-color:var(--accent2);appearance:checkbox;-webkit-appearance:checkbox">
      Online buchbar
    </label>
    <details style="margin-top:8px">
      <summary style="font-size:.82rem;font-weight:600;color:var(--text2);cursor:pointer">Verfügbarkeit festlegen</summary>
      <div class="reg-staff-hours" data-idx="${idx}" style="margin-top:8px"></div>
    </details>
  `;
  container.appendChild(card);
  // Render availability grid for this staff member
  renderRegStaffHours(idx, card.querySelector('.reg-staff-hours'));
}
```

#### 5.4 — Staff availability grid (per-member)
Reuse the same row layout as the salon opening hours grid but scoped to each staff member:
```js
function renderRegStaffHours(idx, container) {
  const days = ['MO','DI','MI','DO','FR','SA','SO'];
  container.innerHTML = days.map((d, di) => `
    <div class="reg-day-row">
      <input type="checkbox" checked data-staff="${idx}" data-day="${di}">
      <span class="reg-day-lbl">${d}</span>
      <div class="reg-time-inputs">
        <input type="time" value="09:00" data-staff="${idx}" data-day="${di}" data-type="start">
        <span class="reg-time-dash">–</span>
        <input type="time" value="19:00" data-staff="${idx}" data-day="${di}" data-type="end">
      </div>
    </div>
  `).join('');
}
```

#### 5.5 — Collect staff data on submit
In `submitSalonReg()`, after inserting the salon into the `stores` table, loop through `regStaffRows` and insert each staff member into the `stylists` table:
```js
// After salon is created and we have store_id:
const staffCards = document.querySelectorAll('#regStaffContainer .staff-setup-card');
for (const card of staffCards) {
  const name = card.querySelector('.reg-staff-name')?.value?.trim();
  if (!name) continue;
  const role = card.querySelector('.reg-staff-role')?.value?.trim() || '';
  const bookable = card.querySelector('.reg-staff-bookable')?.checked ?? true;
  // Collect hours from this card's availability grid...
  await sb.from('stylists').insert({
    salon_id: newStoreId,
    name: name,
    role: role,
    is_bookable: bookable,
    // hours: JSON.stringify(collectedHours)
  });
}
```

**Check the existing `stylists` table schema** — search for `sb.from('stylists')` to see what columns exist (name, salon_id, role, is_bookable, etc.).

#### 5.6 — i18n keys (all 4 languages)
| Key | DE | EN | FR | TR |
|-----|----|----|----|----|
| `reg_step_team` | Dein Team | Your Team | Votre équipe | Ekibiniz |
| `reg_team_hint` | Füge dein Team hinzu. Du kannst später jederzeit Mitarbeiter ändern. | Add your team. You can always change staff later. | Ajoutez votre équipe. Vous pourrez toujours modifier le personnel plus tard. | Ekibinizi ekleyin. Personeli daha sonra istediğiniz zaman değiştirebilirsiniz. |
| `reg_add_staff` | + Mitarbeiter hinzufügen | + Add staff member | + Ajouter un membre | + Personel ekle |
| `reg_staff_name` | Name | Name | Nom | İsim |
| `reg_staff_role` | Rolle | Role | Rôle | Rol |
| `reg_staff_bookable` | Online buchbar | Bookable online | Réservable en ligne | Online rezerve edilebilir |
| `reg_staff_hours_toggle` | Verfügbarkeit festlegen | Set availability | Définir la disponibilité | Uygunluğu ayarla |

### ⚡ Caution:
- The step is **optional** — users should be able to skip it (click "Weiter →" with zero staff members). They can add staff later from the dashboard.
- Don't break the existing dashboard staff management (`#addStaffMdl`, `renderStaffGrid()`). The registration step creates the same data in the same table.
- Make sure `regNext()` and `regPrev()` handle the new step count (5 steps total).
- The progress dots need to update correctly: done + active states.

### ✅ Test:
1. Open salon registration. Progress dots show **5** segments.
2. Step 1 → Step 2 → Step 3 → **Step 4 "Dein Team"** → Step 5 (Details/Öffnungszeiten).
3. On Step 4: tap "+ Mitarbeiter hinzufügen" — a staff card appears with name, role, bookable checkbox.
4. Add 2 staff members with names and roles. Expand "Verfügbarkeit" — day checkboxes and time inputs work.
5. Tap "Weiter →" — goes to Step 5.
6. Submit the form. Check Supabase `stylists` table — staff members should be saved with correct salon_id.
7. Also test skipping (no staff added) — should work fine.
8. Test on mobile, dark mode, all 4 languages.

---

## Phase 6: Bump SW Cache + Final Polish

### 6.1 — Bump `sw.js` cache version
After all changes, bump `solen-vXX` → next version.

### 6.2 — Verify i18n coverage
All new text in Step 4 (team) and existing steps should have `data-i18n` attributes. Switch to EN, FR, TR and verify step hints change ("Step X of 5: ...").

### 6.3 — Test entire registration flow end-to-end on mobile
1. Tap "Salon eintragen" → modal opens full-screen on mobile
2. Step 1: fill basics → "Weiter"
3. Step 2: type address → autocomplete suggestions appear → select one → "Weiter"
4. Step 3: add a service → "Weiter"
5. Step 4: add staff member, set availability → "Weiter"
6. Step 5: description, "Filiale" dropdown (single clean arrow), opening hours (checkboxes work), accept terms → "Jetzt eintragen"
7. Both footer buttons fit on one line on all steps
8. Success screen appears
9. Check Supabase: `stores` + `stylists` tables have correct data

---

## 📋 Key Code Locations

| What | Line(s) |
|------|---------|
| Salon reg modal CSS | ~10461–10520 |
| Salon reg modal HTML | ~10592–10709 |
| Step 1 (Basics) | ~10610–10629 |
| Step 2 (Standort) — address field | ~10631–10656 |
| Step 3 (Services) | ~10658–10675 |
| Step 4 (Details/Hours) → becomes Step 5 | ~10677–10697 |
| `.reg-field input` appearance rule | ~10480 |
| `.reg-day-row` checkbox CSS | ~10487–10488 |
| `.salon-reg-footer` button CSS | ~10494–10500 |
| Mobile overrides for reg | ~10512–10518 |
| `regHoursGrid` JS rendering | ~7438 |
| `regNext()` / `regPrev()` functions | search `function regNext` |
| `submitSalonReg()` | search `function submitSalonReg` |
| Existing staff/stylist CSS | ~858–868, ~1368–1403, ~1483–1495 |
| Staff calendar CSS | ~2261–2282 |
| `#addStaffMdl` (existing) | ~1402 |
| `stylists` table queries | search `sb.from('stylists')` |
| `openSalonRegistration()` | ~10889 |
| SW cache version | `sw.js` |

---

## 🚦 Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6
  │          │          │          │          │          │
  ▼          ▼          ▼          ▼          ▼          ▼
Address    Fix        Fix        Fix        Add        SW bump
auto-      dropdown   checkbox   button     staff      + final
complete   arrows     tapping    overflow   step       test
```

**After each phase:** `git add -A && git commit -m "Phase X: [description]" && git push origin main`
