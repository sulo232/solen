# AUTH + CHROME OVERHAUL , owner dictation 2026-08-10

His words, the load-bearing parts kept verbatim:

> "the booking screen, I don't want it anymore, like, how it is right now. I want you to overhaul
> and renew and make it actually like this... first, to sign up or sign in, just continue with
> Google or Apple. We already have to integrate it... and then email address. And if they are
> already registered, then go into the password, enter password and log in. But if they aren't,
> then make a separate page for the PIN, like they send you a PIN, enter it, for the confirm email
> address. And then after you enter, you're gonna be able to enter a password to create account."

> "I want you to overhaul the back button and, like, hamburger menu too and the close too, because
> it was, like, a weird fucking inside of a box thing, and I don't really like that. I want it to
> be like in the screenshot. The back button maybe, like, a circle, or the x button... the circle
> too and just an x button. And, yeah, and also, like, shadow."

> "in this reference, we don't have the login process that much. So can you go look into it
> yourself... q o n t o is the account."

> "we have to really fix up the principal design system and data because you keep boxing stuff or,
> like, writing unnecessary text."

Reference CAPTURED: `_design-system/references/qonto--onboarding.md`, live from Mobbin and qonto.com, measured not recalled.

---

## A. The auth flow, screen by screen

- [ ] A1 One entry screen: **Continue with Google**, **Continue with Apple**, then a divider, then
      an email field and one commit button. Google and Apple are already integrated
      (`project_money_features_shipped`), so this is wiring, not new backend.
- [ ] **A2 BLOCKED ON HIM, and the capture is why.** He described the path SPLITTING after the email.
      **Qonto does not do that.** Sign-up and log-in are two separate doors chosen at the first tap,
      and log-in puts email and password on ONE screen. His version needs a lookup Qonto never
      performs: given an address, does an account exist. That endpoint does not exist here, and it
      publicly leaks whether an address is registered, which is the account-enumeration tradeoff.
      TWO WAYS: (a) his split, one email field, we build the lookup and accept the leak;
      (b) Qonto's, two doors on the first screen, no lookup, no leak, one more tap at the start.
- [ ] A3 **Existing account** goes to a password screen and logs in.
- [ ] A4 **New account** goes to a separate PIN screen: a 6-digit code sent to the address, entered
      in boxes, with a resend affordance.
- [ ] A5 After the PIN, a separate screen to create a password, which creates the account.
- [ ] A6 Each of A1 to A5 is its own screen with its own back, not one page that swaps content.

## B. The three controls he named

- [x] B1 **Back**: a circle. DONE `verified: app/[locale]/_components/layout/Header.tsx:604` , checked on a phone. Measured today, ours is `rounded-input`, a 44px SQUARE with 12px
      corners, a hairline and white fill. That is the box he is describing, and it is on the
      reviews page, the salon page and search.
- [x] B2 **Close**: the same treatment, same file, same line family as back and the menu.
- [x] B3 **Hamburger**: DONE, a circle, `Header.tsx:797`. All three were in one file.
- [x] B4 Shadow, KEPT ALONGSIDE the border rather than replacing it. His words were "and also, like, shadow", not instead of. The cost below is why the border stays. NAMED COST, already put to him: a shadowed white circle on a white
      page is a weaker edge than the bordered one, and his own contract bans the grey-haze that
      results. Qonto's sit on grey, Airbnb's sit on a photo. Ours mostly sit on white.
- [x] B5 ONE treatment in the top bar, DONE. STILL OPEN and named rather than swept in: the booking flow draws its own 40px bare glyph, a second shape in a different file, left until he has seen this one. We currently ship two: the 44px box above, and a 40px bare glyph
      with no fill, no border and no shadow in the booking flow.

## C. The design system half

- [ ] C1 Write the button treatment into the frozen values so it stops drifting, since the drift is
      what produced two shapes for one control.
- [ ] C2 "You keep boxing stuff and writing unnecessary text" , find where the system tells me to
      box things, and whether the copy rules are being applied to these screens at all.

## Blocked on him

- [ ] D1 The PIN screen. NAMED COST, already put to him: Qonto is a bank and must prove you are
      real. For booking a haircut it is one more screen between wanting an appointment and having
      one, and every screen loses people. Worth it if he wants verified emails from day one.
- [ ] D2 Shadow versus hairline on the circles, which is B4's cost.

## What this replaces

Nothing is being deleted. The existing `/auth/login`, `/auth/register`, `/auth/signup` and
`/auth/reset-password` routes all exist and stay until their replacement is live and he has seen it.
