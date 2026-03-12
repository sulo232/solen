# 🚀 Solen — Registration Auth + Salon Signup Fix Roadmap

> **For:** Claude Code
> **Updated:** 2026-03-12
> **Scope:** Fix salon registration bugs, improve auth flow, add postal code/quartier auto-select, add break times, remove dark mode.

---

## ⚠️ CONSTRAINTS

- All code is in root `index.html` (~14,000 lines). No build tools.
- All visible text needs `data-i18n` + translations for **DE / EN / FR / TR**.
- **Light mode only** after this roadmap — all dark mode code will be removed.
- Test on mobile (390×844). Push to `main` after each phase.

---

## Phase 1: Fix "E-Mail ungültig oder bereits registriert" False Error

**Bug:** When submitting the salon registration form (Step 5 → "Jetzt eintragen"), it always shows "E-Mail-Adresse ungültig oder bereits registriert" even with a valid new email.

### Root cause:
In `submitSalonReg()` (line ~11086), the catch block at line ~11152 checks:
```js
if (msg.includes('email')) {
  regShowErrorSummary(['E-Mail-Adresse ungültig oder bereits registriert.']);
}
```
This is **too broad** — ANY error message that happens to contain the word "email" (even unrelated Supabase errors like "missing column email" or "email format" from the DB schema) triggers this message.

Additionally, `store_applications` or `stores` tables might have a **unique constraint on the email column**, so if someone already registered a salon with that email, the insert fails with a duplicate key error.

### Fixes:

#### 1.1 — Make the error check more specific
At line ~11152, replace the broad `msg.includes('email')` check:
```js
// Before (too broad):
if (msg.includes('email')) { ... }

// After (specific):
if (ex && ex.code === '23505' && msg.includes('email')) {
  // Unique constraint violation on email
  regShowFieldError('field_reg_email');
  regShowErrorSummary(['Diese E-Mail ist bereits registriert. Bitte eine andere verwenden oder anmelden.']);
} else if (msg.includes('invalid') && msg.includes('email')) {
  regShowFieldError('field_reg_email');
  regShowErrorSummary(['E-Mail-Adresse ist ungültig.']);
} else if (msg.includes('email')) {
  // Some other email-related error — show the actual error
  regShowErrorSummary(['E-Mail-Fehler: ' + msg]);
}
```

#### 1.2 — Allow already-registered users to register a salon
The salon registration form (`submitSalonReg`, line ~11086) only inserts into `store_applications` / `stores` — it does NOT create a Supabase auth account. The `email` field in the form is the **salon's contact email**, not a login email.

**Check:** Is the `store_applications` or `stores` table rejecting the insert because of a unique email constraint? If so:
- If the user is **already logged in**, use `currentUser.id` as the `user_id` / `owner_id` in the insert.
- The salon email field should NOT require uniqueness — multiple salons can share the same contact email.
- If there IS a unique constraint on email in the DB, it should be removed or changed to allow duplicates. Document this in the roadmap as a **Supabase migration needed**.

#### 1.3 — Pre-fill email if user is logged in
If `currentUser` exists when the salon reg opens, pre-fill `#reg_email` with `currentUser.email`. The user can change it if they want.

In `openSalonRegistration()` (line ~10889), add:
```js
if (currentUser && currentUser.email) {
  const emailField = document.getElementById('reg_email');
  if (emailField && !emailField.value) emailField.value = currentUser.email;
}
```

#### 1.4 — Add client-side email validation before submit
Before sending to Supabase, validate the email format in JS:
```js
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
```
In `regValidateStep(5)` (or wherever Step 5 / the final step validates), check `isValidEmail()` and show a clear error if invalid — so the user knows it's a format issue vs. a server issue.

### ✅ Test:
1. Open salon registration (not logged in). Fill all fields with a brand-new email. Submit → should succeed.
2. Log in with an existing account. Open salon registration. The email field pre-fills. Submit → should succeed (no "already registered" error).
3. Try submitting with an obviously invalid email (no @) → client-side error "E-Mail ungültig".
4. Try submitting with valid email that's already used by another salon → specific error telling them it's taken.

---

## Phase 2: Email Verification Code on Registration

**Current:** When registering (both customer and salon owner via `doSalonSignup`), Supabase sends a confirmation email with a link. The user wants a **verification code** instead — enter a code to verify your email.

### How Supabase auth works:
- `sb.auth.signUp()` sends a confirmation email by default (link-based).
- For OTP (one-time password / code), use `sb.auth.signInWithOtp()`.

### What to do:

#### 2.1 — Change customer registration to OTP flow
In the customer signup function (search for `sb.auth.signUp` with `email` and `password`), after creating the account:
1. Show a new "Verification Code" step instead of "Check your email for a confirmation link".
2. The user enters a 6-digit code they received by email.
3. Call `sb.auth.verifyOtp({ email, token: code, type: 'signup' })` to verify.

#### 2.2 — Create the verification code UI
Add a new section in the auth overlay (after registration form):
```html
<div id="formVerifyCode" class="auth-form" style="display:none">
  <h3>Code eingeben</h3>
  <p style="font-size:.88rem;color:var(--text2)">Wir haben dir einen 6-stelligen Code per E-Mail gesendet.</p>
  <div style="display:flex;gap:8px;justify-content:center;margin:20px 0">
    <input type="text" id="verifyCode" maxlength="6" placeholder="000000"
      style="text-align:center;font-size:1.5rem;letter-spacing:.5em;width:200px;padding:14px;border:1.5px solid var(--border);border-radius:12px;background:var(--surfaceAlt);color:var(--text);font-family:var(--font-mono,monospace)">
  </div>
  <button class="btn-primary" onclick="verifyEmailCode()">Bestätigen</button>
  <p style="font-size:.82rem;margin-top:12px;color:var(--text2)">Keinen Code erhalten? <a onclick="resendVerificationCode()" style="color:var(--accent);cursor:pointer;font-weight:600">Erneut senden</a></p>
</div>
```

#### 2.3 — JS functions
```js
let _pendingVerifyEmail = '';

async function verifyEmailCode() {
  const code = document.getElementById('verifyCode').value.trim();
  if (code.length !== 6) return showAuthMsg('Bitte 6-stelligen Code eingeben.');
  const { error } = await sb.auth.verifyOtp({
    email: _pendingVerifyEmail,
    token: code,
    type: 'signup'
  });
  if (error) return showAuthMsg('Code ungültig. Bitte erneut versuchen.');
  toast('E-Mail bestätigt!', 'success');
  closeAuth();
  // Proceed to populate profile, etc.
}

async function resendVerificationCode() {
  await sb.auth.resend({ type: 'signup', email: _pendingVerifyEmail });
  toast('Code erneut gesendet', 'success');
}
```

#### 2.4 — Change salon owner signup to match
In `doSalonSignup()` (line ~5433), after `sb.auth.signUp()` succeeds, show the verification code form instead of auto-closing. Set `_pendingVerifyEmail = email` and show `#formVerifyCode`.

#### 2.5 — Google login stays as-is
Google OAuth login should still work normally — no verification code needed for Google sign-in. Only email/password registration gets the code step.

#### 2.6 — i18n keys
| Key | DE | EN | FR | TR |
|-----|----|----|----|----|
| `verify_code_title` | Code eingeben | Enter code | Entrer le code | Kodu girin |
| `verify_code_hint` | Wir haben dir einen 6-stelligen Code per E-Mail gesendet. | We sent you a 6-digit code by email. | Nous vous avons envoyé un code à 6 chiffres par e-mail. | E-posta ile 6 haneli bir kod gönderdik. |
| `verify_code_btn` | Bestätigen | Confirm | Confirmer | Onayla |
| `verify_code_resend` | Erneut senden | Resend | Renvoyer | Tekrar gönder |
| `verify_code_invalid` | Code ungültig. | Code invalid. | Code invalide. | Kod geçersiz. |

### ⚡ Caution:
- Supabase OTP verification requires the project to have email templates configured. If the default template sends a link instead of a code, the Supabase dashboard email settings need to be updated (this is a backend config, not a code change).
- Google sign-in (`sb.auth.signInWithOAuth({provider:'google'})`) skips verification entirely — that's correct behavior.

### ✅ Test:
1. Register with email → see "Code eingeben" screen → receive email with code → enter code → logged in.
2. Tap "Erneut senden" → new code arrives.
3. Enter wrong code → "Code ungültig" error.
4. Google login → still works without code step.

---

## Phase 3: Auto-Draft Salon Registration for Logged-In Users

**The draft system already exists!** (lines ~10748–10916). It saves to `localStorage` and auto-restores on reopen. The user wants to make sure it works properly when logged in.

### What to verify / fix:

#### 3.1 — Draft is already attached
`regAttachAutosave()` (line ~10911) adds `input` and `change` listeners to the form. `regSaveDraft()` (line ~10819) saves to `localStorage['solen_reg_draft']`. `regRestoreDraft()` (line ~10835) restores on form open.

**Verify this works:** Open registration, fill Step 1, close the modal, reopen → data should still be there. If it's NOT working, debug:
- Is `regAttachAutosave()` called in `openSalonRegistration()` (line ~10889)? Check line ~7459 — it's called from the partner page init but maybe not from `openSalonRegistration()`. Add it if missing.
- Is `regRestoreDraft()` called when the modal opens? Check line ~7457 — same issue. Add to `openSalonRegistration()` if missing.

#### 3.2 — Show a "Entwurf gespeichert" indicator clearly
The `#regDraftIndicator` (line ~10630) already shows "Entwurf gespeichert um HH:MM". Make sure:
- It updates timestamp correctly (line ~10829).
- It's visible to the user (check font size, position).

#### 3.3 — Save draft to Supabase if logged in (optional enhancement)
Currently drafts are `localStorage` only — lost if user clears browser data. For logged-in users, also save to Supabase:
```js
if (currentUser) {
  await sb.from('salon_reg_drafts').upsert({
    user_id: currentUser.id,
    draft_data: JSON.stringify(regCollectDraft()),
    updated_at: new Date().toISOString()
  });
}
```
This requires creating a `salon_reg_drafts` table in Supabase. **If creating DB tables is out of scope**, skip this and note it as a future improvement.

### ✅ Test:
1. Log in. Open salon registration. Fill Steps 1–3. Close the modal.
2. Reopen the registration. All data should be restored. Current step should be saved.
3. "Entwurf gespeichert um 19:08" indicator should show with correct time.

---

## Phase 4: Postal Code + Auto-Quartier on Step 2

**User wants:** On Step 2 (Standort), instead of just a "Quartier wählen..." dropdown, add:
1. A **PLZ (Postleitzahl)** field where you enter the postal code (e.g., "4000").
2. An **Ort** field that auto-fills based on the PLZ (e.g., "Basel").
3. The **Quartier dropdown auto-selects** based on the PLZ.
4. If the PLZ format is wrong (not 4 digits, or not a Basel-area code), show a red error.

### 4.1 — Add PLZ + Ort fields before Quartier
In `#regStep2` (line ~10653), after the street field and before the quartier select, add:

```html
<div style="display:grid;grid-template-columns:1fr 2fr;gap:10px">
  <div class="reg-field" id="field_reg_plz">
    <label for="reg_plz">PLZ (Pflichtfeld)</label>
    <input type="text" id="reg_plz" placeholder="4000" maxlength="4" inputmode="numeric" pattern="[0-9]{4}">
    <div class="reg-field-error" id="err_reg_plz" role="alert">Bitte gültige PLZ eingeben (z.B. 4000).</div>
  </div>
  <div class="reg-field" id="field_reg_ort">
    <label for="reg_ort">Ort</label>
    <input type="text" id="reg_ort" placeholder="Basel" readonly style="background:var(--surfaceAlt);opacity:.7">
  </div>
</div>
```

#### 4.2 — Basel PLZ → Quartier mapping
Create a JS lookup object:
```js
const BASEL_PLZ_MAP = {
  '4000': { ort: 'Basel', quartiere: ['Altstadt Grossbasel'] },
  '4001': { ort: 'Basel', quartiere: ['Altstadt Grossbasel'] },
  '4051': { ort: 'Basel', quartiere: ['St. Alban', 'Bruderholz'] },
  '4052': { ort: 'Basel', quartiere: ['Bachletten', 'Neubad'] },
  '4053': { ort: 'Basel', quartiere: ['Gundeldingen'] },
  '4054': { ort: 'Basel', quartiere: ['Am Ring', 'Vorstädte'] },
  '4055': { ort: 'Basel', quartiere: ['St. Johann'] },
  '4056': { ort: 'Basel', quartiere: ['Matthäus', 'Iselin'] },
  '4057': { ort: 'Basel', quartiere: ['Clara', 'Wettstein'] },
  '4058': { ort: 'Basel', quartiere: ['Hirzbrunnen'] },
  '4059': { ort: 'Basel', quartiere: ['Altstadt Kleinbasel'] }
};
```
> **⚠️ IMPORTANT:** These mappings need to be verified for accuracy! Some PLZ may map to multiple quartiers. The user should verify this list or provide corrections.

#### 4.3 — Auto-fill on PLZ input
```js
document.getElementById('reg_plz')?.addEventListener('input', function() {
  const plz = this.value.trim();
  const ortField = document.getElementById('reg_ort');
  const nbSelect = document.getElementById('reg_nb');
  const plzFieldDiv = document.getElementById('field_reg_plz');

  if (plz.length !== 4 || isNaN(plz)) {
    if (plz.length === 4) {
      plzFieldDiv.classList.add('has-error');
    }
    ortField.value = '';
    nbSelect.value = '';
    return;
  }

  const match = BASEL_PLZ_MAP[plz];
  if (match) {
    plzFieldDiv.classList.remove('has-error');
    ortField.value = match.ort;
    // Auto-select first matching quartier
    if (match.quartiere.length === 1) {
      nbSelect.value = match.quartiere[0];
    } else {
      // If multiple quartiers, select the first one but let user change
      nbSelect.value = match.quartiere[0];
    }
    regSaveDraft(); // trigger autosave
  } else {
    plzFieldDiv.classList.add('has-error');
    ortField.value = '';
    nbSelect.value = '';
  }
});
```

#### 4.4 — Red error styling
The `.reg-field.has-error` class already exists (line ~10505) — it adds a red border. The error text div `.reg-field-error` shows when `.has-error` is on the parent. This is already wired up.

#### 4.5 — Update address assembly
In `submitSalonReg()` (line ~11104), the address is currently:
```js
address: document.getElementById('reg_street').value.trim() + ', Basel'
```
Change to:
```js
address: document.getElementById('reg_street').value.trim() + ', ' + (document.getElementById('reg_plz')?.value||'4000') + ' ' + (document.getElementById('reg_ort')?.value||'Basel')
```

#### 4.6 — Include PLZ in draft save/restore
In `regCollectDraft()` (line ~10754), add `plz` and `ort` to the collected data. In `regRestoreDraft()` (line ~10835), restore them.

### ✅ Test:
1. Step 2: Type "4053" in PLZ → Ort auto-fills "Basel", Quartier auto-selects "Gundeldingen".
2. Type "1234" → red error on PLZ, ort and quartier empty.
3. Type "4051" → Ort = "Basel", Quartier = "St. Alban".
4. Manually change quartier dropdown → still allowed.
5. Submit → address includes PLZ and Ort correctly.

---

## Phase 5: Break Times for Salon + Staff Schedules

**User wants:** When setting opening hours (salon) or staff availability, option to add a **lunch break / pause** (e.g., 12:00–13:00).

### 5.1 — Add break time toggle per day row (salon hours)
In the opening hours grid on Step 5, each day row currently shows:
```
[✓] MO   09:00 – 19:00
```
Add a "Pause" button that reveals a second time range:
```
[✓] MO   09:00 – 12:00   Pause: 12:00 – 13:00   13:00 – 19:00
```

#### Simplified approach: add a "+ Pause" button per row
Change each day row to:
```
[✓] MO   09:00 – 19:00   [+ Pause]
```
When "+ Pause" is tapped:
```
[✓] MO   09:00 – 12:00  |  13:00 – 19:00   [× Pause]
```
This splits the day into two shifts with a gap = the break.

#### Implementation:
Modify the JS that renders `#regHoursGrid` (search for the function near line ~7438 that builds day rows). Add a break toggle button per row:

```js
// In the day row template:
`<button type="button" class="reg-break-toggle" onclick="toggleRegBreak(this, '${dayKey}')" 
  style="font-size:.72rem;padding:4px 8px;border:1px solid var(--border);border-radius:6px;background:none;color:var(--text2);cursor:pointer;white-space:nowrap">
  + Pause
</button>`
```

When toggled, show a second pair of time inputs:
```js
function toggleRegBreak(btn, dayKey) {
  const row = btn.closest('.reg-day-row');
  let breakInputs = row.querySelector('.reg-break-inputs');
  if (breakInputs) {
    breakInputs.remove();
    btn.textContent = '+ Pause';
  } else {
    breakInputs = document.createElement('div');
    breakInputs.className = 'reg-break-inputs';
    breakInputs.style.cssText = 'display:flex;align-items:center;gap:6px;margin-top:4px;padding-left:62px';
    breakInputs.innerHTML = `
      <span style="font-size:.72rem;color:var(--text2);font-weight:600">Pause:</span>
      <input type="time" value="12:00" class="reg-break-start" style="...">
      <span class="reg-time-dash">–</span>
      <input type="time" value="13:00" class="reg-break-end" style="...">
    `;
    row.after(breakInputs);
    btn.textContent = '× Pause';
  }
}
```

### 5.2 — Break times for staff availability
Apply the same pattern to the staff availability grid (Phase 5 of previous roadmap → the `renderRegStaffHours()` function or the `<details>` block inside each staff card).

### 5.3 — Save break times
In `regCollectHours()`, collect break times per day:
```js
hours: {
  mon: { open: '09:00', close: '19:00', break_start: '12:00', break_end: '13:00' },
  tue: { open: '09:00', close: '19:00' }, // no break
  ...
}
```

### 5.4 — CSS for break row
```css
.reg-break-inputs input[type=time] {
  /* same styles as .reg-time-inputs input[type=time] */
}
@media (max-width: 600px) {
  .reg-break-inputs { padding-left: 0 !important; flex-wrap: wrap; }
}
```

### ✅ Test:
1. Step 5: tap "+ Pause" on Monday → break time inputs appear (12:00–13:00 default).
2. Tap "× Pause" → break inputs removed.
3. Submit with breaks set → check stored data includes break_start/break_end.
4. Staff step: same break functionality works per staff member.

---

## Phase 6: Remove Dark Mode — Light Mode Only

**User wants:** Delete dark mode entirely. Only light mode.

### What to remove:

#### 6.1 — Remove the theme toggle button
Search for `.theme-toggle` in HTML — there's a toggle switch in the header (near the nav). Remove the entire `<button>` or `<div>` containing the sun/moon toggle.

Also remove it from the mobile menu if it appears there.

#### 6.2 — Remove `toggleTheme()` function
The function at line ~4907 handles theme switching. Delete it. Also delete any `setTheme()`, `loadTheme()`, or `localStorage` theme preference code.

#### 6.3 — Force light mode
At the top of `<html>` or in the first `<script>`, set:
```js
document.documentElement.setAttribute('data-theme', 'light');
```
Remove the `DOMContentLoaded` listener that reads theme preference from `localStorage`.

#### 6.4 — Remove ALL `[data-theme="dark"]` CSS rules
There are **100+ lines** of `[data-theme="dark"]` rules scattered throughout the `<style>` blocks. Remove ALL of them:
- `[data-theme="dark"] { ... }` blocks (line ~79, ~151–155, ~160–161, ~187–190, etc.)
- All `@media(prefers-color-scheme:dark)` rules (lines ~98, ~392, ~404, ~434, ~479, ~520, ~658, etc.)

**Strategy:** Do a search-and-delete for:
1. All lines matching `[data-theme="dark"]`
2. All `@media(prefers-color-scheme:dark){...}` blocks
3. `[data-theme="light"]` specific overrides can be kept — they'll be the default now. But clean them up by moving the values into the base `:root` if they're just overrides.

#### 6.5 — Remove dark mode CSS variables
The `:root` block at line ~79 defines dark mode variables (`[data-theme="dark"]`). Delete the entire block. Keep only the light mode `:root` variables.

#### 6.6 — Clean up the navigation
The theme toggle button in the header takes up space. Removing it gives more room for other nav items on mobile.

### ⚡ Caution:
- **Do NOT break any CSS that isn't dark-mode specific.** Some rules might use selectors like `[data-theme] .something` or `[data-theme="light"]` — convert those to just `.something` since there's only one theme now.
- **Test everything after removal.** Colors, backgrounds, borders, text — make sure nothing looks wrong on light mode.
- The `.glass-panel`, `.modal`, `.bottom-nav` and other components all have dark-mode overrides. After removing those, verify they look correct with only the light-mode base styles.

### ✅ Test:
1. Load solen.ch — no theme toggle visible anywhere.
2. Site is always light mode, even if device is in dark mode.
3. All pages look correct: Home, Entdecken, Termine, Profil, Salon Registration.
4. No visual glitches (missing backgrounds, invisible text, etc.).
5. Search the entire file for `data-theme="dark"` — zero results.
6. Search for `prefers-color-scheme` — zero results.

---

## Phase 7: Bump SW Cache

After all changes: bump `solen-vXX` in `sw.js` to force fresh cache.

---

## 📋 Key Code Locations

| What | Line(s) |
|------|---------|
| `submitSalonReg()` — email error | ~11086, error at ~11153 |
| `doSalonSignup()` — auth signup | ~5433 |
| `sb.auth.signUp()` calls | ~5452 |
| Draft system | ~10748–10916 |
| `openSalonRegistration()` | ~10889 |
| Step 2 HTML (address/quartier) | ~10653–10668 |
| Step 5 HTML (hours) | ~10699–10720 |
| `regHoursGrid` JS rendering | ~7438 |
| `toggleTheme()` | ~4907 |
| Dark mode CSS `[data-theme="dark"]` | ~79, 151–155, 160, 187–190, 232–235, 302, 391–404, 433, 483, etc. |
| `@media(prefers-color-scheme:dark)` | ~98, 392, 404, 434, 479, 520, 658, etc. |
| Theme toggle HTML | search `.theme-toggle` |
| `.reg-day-row` checkbox CSS | ~10487–10488 |
| SW cache | `sw.js` |

---

## 🚦 Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
  │          │          │          │          │          │          │
  ▼          ▼          ▼          ▼          ▼          ▼          ▼
Fix        Email      Auto-      PLZ →     Break     Remove     SW
email      verify     draft      auto      times     dark       bump
error      code       salon      quartier  salon +   mode
                      reg                  staff
```

**After each phase:** `git add -A && git commit -m "Phase X: [description]" && git push origin main`
