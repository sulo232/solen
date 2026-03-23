# 🔧 Manual Setup Checklist — Step by Step

> Do these IN ORDER. Copy-paste ready.

---

## ✅ Already Done

- [x] Gemini API Key → `.env.local` ✅
- [x] Resend API Key → `.env.local` ✅ (just set: `re_QnpoWHUi_LB9G4W1ZLmbDbRnWkUL94iPR`)
- [x] Supabase URL + Keys → `.env.local` ✅
- [x] Supabase Storage `salon-photos` bucket ✅

---

## ❌ Do These (2 steps left)

- [ ] Step 1: Supabase SMTP (noreply@solen.ch)
- [ ] Step 2: Gemini + Resend keys → Vercel

---

# Step 1: Supabase Custom SMTP 🔴 REQUIRED

> Makes auth emails (verification codes, password resets) come from `noreply@solen.ch` instead of `noreply@mail.app.supabase.io`.

### 1a. Verify Resend Domain (if not already done)

1. Open: **https://resend.com/domains**
2. If `solen.ch` is listed and **Verified** → skip to 1b
3. If NOT verified or not listed:
   - Click **"Add Domain"** → enter `solen.ch`
   - Resend shows DNS records to add
   - Go to **https://dash.cloudflare.com** → solen.ch → DNS
   - Add each DNS record Resend shows you
   - ⚠️ Set proxy to **OFF** (grey cloud icon) for any CNAME records
   - Back in Resend → click **"Verify"**
   - May take 5-60 min for DNS propagation

### 1b. Enable Custom SMTP in Supabase

1. Open: **https://supabase.com/dashboard/project/tocfnsmxmdxkrcmjzzdw/settings/auth**
2. Scroll to **"SMTP Settings"**
3. Toggle **"Enable Custom SMTP"** → ON
4. Fill in these EXACT values:

```
Sender email:    noreply@solen.ch
Sender name:     Solen.ch
Host:            smtp.resend.com
Port number:     465
Minimum interval: 60
Username:        resend
Password:        re_QnpoWHUi_LB9G4W1ZLmbDbRnWkUL94iPR
```

5. Click **Save**

### 1c. Customize Email Templates (Optional)

1. Open: **https://supabase.com/dashboard/project/tocfnsmxmdxkrcmjzzdw/auth/templates**

**Confirm Signup template:**
```
Subject: Dein Solen.ch Bestätigungscode

Body:
<h2>Willkommen bei Solen.ch!</h2>
<p>Dein Bestätigungscode lautet:</p>
<h1 style="letter-spacing: 8px; font-size: 32px; text-align: center; color: #38B2AC;">{{ .Token }}</h1>
<p>Dieser Code ist 60 Minuten gültig.</p>
<p>Falls du dich nicht registriert hast, ignoriere diese E-Mail.</p>
<br>
<p>Dein Solen.ch Team 💇‍♀️</p>
```

**Reset Password template:**
```
Subject: Passwort zurücksetzen — Solen.ch

Body:
<h2>Passwort zurücksetzen</h2>
<p>Klicke auf den folgenden Link, um dein Passwort zurückzusetzen:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #38B2AC; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Neues Passwort setzen</a></p>
<p>Dieser Link ist 60 Minuten gültig.</p>
<br>
<p>Dein Solen.ch Team</p>
```

**Magic Link template (keep as backup):**
```
Subject: Dein Anmeldelink — Solen.ch

Body:
<h2>Anmelden bei Solen.ch</h2>
<p><a href="{{ .ConfirmationURL }}" style="background: #38B2AC; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block;">Jetzt anmelden</a></p>
<p>Dieser Link ist 60 Minuten gültig.</p>
<br>
<p>Dein Solen.ch Team</p>
```

---

# Step 2: Add Keys to Vercel 🔴 REQUIRED

> Keys are in `.env.local` but production needs them too.

1. Open: **https://vercel.com/sulo232s-projects/solen/settings/environment-variables**

2. Add these 2 variables:

| Key | Value | Environments |
|---|---|---|
| `GEMINI_API_KEY` | `AIzaSyAsyvIz8xnWio5F4-BTcbZkMxEC0rpZGyM` | ✅ Production ✅ Preview ✅ Development |
| `RESEND_API_KEY` | `re_QnpoWHUi_LB9G4W1ZLmbDbRnWkUL94iPR` | ✅ Production ✅ Preview ✅ Development |

3. Click **Save** for each

---

# ✅ After These 2 Steps → Run All 3 Sessions

```
Step 1 ✅ → Supabase SMTP configured
Step 2 ✅ → Vercel env vars set
         ↓
    🚀 RUN ALL 3 CLAUDE CODE SESSIONS SIMULTANEOUSLY
         ↓
    Session 1: Registration + Auth (~10h)
    Session 2: Homepage + Chat + Design (~10h)  
    Session 3: Dashboard + Booking + Emails (~13h)
```

### Post-Sessions (do after all 3 finish):
- **Vercel Crons**: If on Pro plan → automatic. If free → use [cron-job.org](https://cron-job.org) to hit `/api/cron/*` routes daily.
