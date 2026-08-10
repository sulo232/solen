<!-- exists-check: extends _design-system/references/ (chrome-by-page-type.md, chrome-per-solen-page.md).
     Net-new for this brand: no Qonto file existed. Captured live 2026-08-10 from Mobbin (iOS flow)
     and qonto.com (web, measured with getComputedStyle), never from memory. -->

# Qonto sign-up and log-in, captured

The owner attached Mobbin screenshots of this flow and said to rebuild ours like it, then added:
*"in this reference, we don't have the login process that much. So can you go look into it
yourself... q o n t o is the account."* So this is the look, not a recollection of it.

## The one place his description and reality differ, and it matters

He described: social buttons, then an email field, and the path SPLITS there , password if the
address already has an account, a 6-digit code if it does not.

**Qonto never branches off a shared email field.** Sign-up and log-in are two separate doors, chosen
at the very first tap on a splash screen. Log-in then shows email AND password on ONE screen. The
6-digit code exists only in sign-up.

His version needs a lookup that Qonto does not have: given an email, does an account exist. That is
a real endpoint we would have to build, and it leaks whether an address is registered, which is a
known account-enumeration tradeoff. Qonto's two-door version avoids it by never asking.

**This is his call and it is written down as A2, unanswered.**

## Sign-up, screen by screen

| # | screen | what is on it |
|---|---|---|
| 1 | splash | photo, black pill "Open an account", outlined pill "Sign in". No top bar. |
| 2 | Sign up | Google, Apple, an "or" rule, ONE email field, an opt-out tick, black Continue |
| 3 | Confirm your email address | "Enter the 6-digit code we've sent to [email]", six grey boxes split 3 + dash + 3, greyed "Resend code in 9 seconds" counting down, NO button (it submits on the sixth digit) |
| 4 | Create your password | one box with an eye toggle, five strength bars going red to green, button greyed until the password is strong |

Between 3 and 4 Qonto inserts six banking screens (business status, tax, phone, plan). Strip those
and password lands straight after the code, which is exactly his order.

## Log-in

1. Continue with Google, Continue with Apple, black "Continue with email"
2. **"Welcome back": email AND password on the same screen**, plus "Forgot password?"
3. A returning user sees only "Hi [name]" and a password box, with "Change account"

## The controls he asked about

iOS values are read from a Mobbin image so they carry about 2pt of slop; web values were measured
live.

| control | shape | size | fill | border | shadow |
|---|---|---|---|---|---|
| back, app | **circle, with a CHEVRON inside, not an arrow** | ~45pt | white | **none** | soft, low, offset down, page grey darkens to about #E9E9E9 beneath it and fades over ~20pt |
| back, web | circle, **chevron** | 48px | transparent | none | **none** |
| close, app | **a PILL with the word "Close"**, ~68 x 46pt | | white | none | same soft shadow |
| close, post-login | circle with an X, ~45pt | | white | none | same |
| menu | **there is none** during account creation |

Back sits top-left, Close top-right, both 17pt from their edge and ~57pt from the top. Nothing
between them: no title, no progress bar.

**Why we keep our border and they do not.** Their circle carries no border because it sits on a grey
page (#F6F6F6) and the shadow does the separating. Ours sit on white, where a low soft shadow is
nearly invisible, which is the grey-haze the contract bans. So ours is a circle with the shadow AND
the hairline until he says otherwise.

## Inputs, for when the auth screens get built

- the label is ALWAYS above the box. Never a placeholder standing in for a label, never floating.
- the box is 44px tall, radius 8, filled a faint grey (5% black), **no border at all**
- primary button: full width, fully rounded, solid near-black. On web it stays ENABLED on an empty
  form; on iOS it greys to #888888 until the form is valid.

## Not captured, and why

Qonto's mobile web bounces a logged-out phone to "Sign in via the app", so the live log-in form only
renders at desktop width, and that page is near-black. Do not copy the dark treatment; web here is
light-only. The code boxes and strength bars were not measured in real pixels because the only
source is a downscaled image, and opening those screens for real would have meant submitting an
address.


## The glyph, spelled out because I got it wrong

The capture said "bare chevron inside, no box around the glyph" and I built an arrow anyway. His
correction, verbatim: *"I told you I wanna get, like, not, like, an arrow. Like, I want, like, a
good triangle."*

**Back is a CHEVRON (`ChevronLeft`), never an arrow (`ArrowLeft`).** A chevron is the bare angle,
the triangle shape with no shaft. Every Qonto screen in the reference uses it, and so does the
close-adjacent chrome. This line exists because the measurement was already on the page and I
still built from memory.
