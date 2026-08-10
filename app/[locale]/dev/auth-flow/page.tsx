/**
 * /dev/auth-flow , the sign-up and sign-in overhaul. FULL-SCREEN mockup, nothing wired.
 *
 * REBUILT 2026-08-10 after three corrections in one message:
 *
 *   1. "I told you I wanna get, like, not, like, an arrow. Like, I want, like, a good triangle."
 *      It is a CHEVRON, not an arrow. The capture said "bare chevron inside" and I built
 *      `ArrowLeft` anyway, which is the whole complaint: the measurement was already written down.
 *   2. "I want the close button to not be an X close, like, written close and also like a shadow
 *      and like a pill." Close is a PILL with the word Close in it. Measured at ~68 x 46pt.
 *   3. "I told you about making a full, like, screen mock up when we're trying to make, like, a
 *      page, instead of whatever the fuck this is." The first version put 300px doll-house frames
 *      on a desktop page. A page mockup is rendered at the size of the thing.
 *
 * So: each screen is a real 390-wide viewport, stacked and scrolled, the way it would be held.
 * Every value comes from `_design-system/references/qonto--onboarding.md`, measured from his
 * Mobbin screenshots and the live site.
 *
 * Mockup copy is ENGLISH by house rule. Borders are `border`, never `ring-*`. The disabled button
 * uses our locked `opacity-50` rather than Qonto's measured #888888, because a foreign hex is not
 * a token here and the drift gate is right to refuse it.
 *
 * exists-check: `npm run exists auth mockup signup flow` = 0. The live /auth/* routes are untouched.
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import { ChevronLeft, Menu } from "lucide-react";

/** Back: circle, CHEVRON, shadow, no border. Qonto's exact treatment. */
function Back() {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-elevation">
      <ChevronLeft size={22} strokeWidth={2.4} className="text-s-ink" aria-hidden />
    </span>
  );
}

/** Close: a PILL with the word, not an X. ~68 x 46pt in the reference. */
function Close() {
  return (
    <span className="flex h-11 items-center rounded-full bg-white px-5 text-[15px] text-s-ink shadow-elevation">
      Close
    </span>
  );
}

function Bar() {
  return (
    <div className="flex items-center justify-between px-4 pt-4">
      <Back />
      <Close />
    </div>
  );
}

function Screen({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <p className="mb-2 text-[13px] text-s-ink-2">{label}</p>
      <div className="w-[390px] overflow-hidden rounded-[20px] border border-s-border bg-white">
        <div className="flex h-[760px] flex-col">{children}</div>
      </div>
    </section>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-s-ink-2">{label}</span>
      <span className="flex h-11 items-center rounded-[8px] bg-black/[0.05] px-3.5 text-[15px] text-s-ink-2">
        {placeholder}
      </span>
    </label>
  );
}

function Primary({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`flex h-[52px] items-center justify-center rounded-full bg-s-ink text-[15px] text-white ${
        muted ? "opacity-50" : ""
      }`}
    >
      {children}
    </span>
  );
}

function Social({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-[52px] items-center justify-center rounded-[12px] bg-white text-[15px] text-s-ink shadow-whisper">
      {children}
    </span>
  );
}

export default function AuthFlowMockup() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[430px] px-5 py-8 pb-24">
      <h1 className="font-display text-[28px] font-semibold tracking-[-0.02em] text-s-ink">
        Sign up and sign in
      </h1>
      <p className="mt-2 text-[15px] text-s-ink-2">
        Full size, nothing wired. Chevron not arrow, Close as a pill. Measured off your screenshots: their page is #F6F6F6 and the cards are white, and white covers most of the screen.
      </p>

      <div className="mt-8">
        <Screen label="1. Start">
          <Bar />
          <div className="flex flex-1 flex-col gap-3 px-5 pt-10">
            <h2 className="mb-3 text-center font-display text-[26px] font-semibold text-s-ink">
              Sign up for Solen
            </h2>
            <Social>Continue with Google</Social>
            <Social>Continue with Apple</Social>
            <div className="my-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-s-border" />
              <span className="text-[13px] text-s-ink-2">or</span>
              <span className="h-px flex-1 bg-s-border" />
            </div>
            <div className="rounded-[12px] bg-white p-4">
              <Field label="Email address" placeholder="Email address" />
            </div>
            <div className="mt-auto pb-6">
              <Primary>Continue</Primary>
            </div>
          </div>
        </Screen>

        <Screen label="2a. Email we know, so: password">
          <Bar />
          <div className="flex flex-1 flex-col gap-4 px-5 pt-10">
            <h2 className="font-display text-[26px] font-semibold text-s-ink">Welcome back</h2>
            <p className="text-[15px] text-s-ink-2">name@example.ch</p>
            <div className="rounded-[12px] bg-white p-4">
              <Field label="Password" placeholder="Password" />
            </div>
            <span className="text-[15px] text-s-accent">Forgot password?</span>
            <div className="mt-auto pb-6">
              <Primary>Sign in</Primary>
            </div>
          </div>
        </Screen>

        <Screen label="2b. Email we do not know, so: code">
          <Bar />
          <div className="flex flex-1 flex-col gap-3 px-5 pt-10">
            <h2 className="font-display text-[26px] font-semibold text-s-ink">
              Confirm your email address
            </h2>
            <p className="text-[15px] text-s-ink-2">
              Enter the 6-digit code we&rsquo;ve sent to name@example.ch
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-[12px] bg-white p-4">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-[52px] w-[38px] rounded-[8px] bg-black/[0.05]" />
              ))}
              <span className="px-1 text-s-ink-2">&ndash;</span>
              {[3, 4, 5].map((i) => (
                <span key={i} className="h-[52px] w-[38px] rounded-[8px] bg-black/[0.05]" />
              ))}
            </div>
            <p className="mt-4 text-[13px] text-s-ink-2">Resend code in 24 seconds</p>
          </div>
        </Screen>

        <Screen label="3. Then: create a password">
          <Bar />
          <div className="flex flex-1 flex-col gap-4 px-5 pt-10">
            <h2 className="font-display text-[26px] font-semibold text-s-ink">
              Create your password
            </h2>
            <div className="rounded-[12px] bg-white p-4">
              <Field label="Password" placeholder="At least 8 characters" />
            </div>
            <div className="mt-auto pb-6">
              <Primary muted>Create account</Primary>
            </div>
          </div>
        </Screen>
      </div>

      <section className="mt-4 rounded-card bg-white p-5">
        <h2 className="text-[18px] font-semibold text-s-ink">The controls, close up</h2>
        <div className="mt-4 flex items-center gap-6 rounded-[16px] bg-[#F6F6F6] p-5"> {/* drift-ok: measured off his Mobbin screenshots, Qonto page grey */}
          <div className="text-center">
            <Back />
            <p className="mt-2 text-[13px] text-s-ink-2">Back</p>
          </div>
          <div className="text-center">
            <Close />
            <p className="mt-2 text-[13px] text-s-ink-2">Close</p>
          </div>
          <div className="text-center">
            <span className="grid h-11 w-11 place-items-center rounded-input bg-white shadow-elevation">
              <Menu size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />
            </span>
            <p className="mt-2 text-[13px] text-s-ink-2">Menu, square</p>
          </div>
        </div>
        <p className="mt-4 text-[13px] text-s-ink-2">
          This strip is their exact page grey, #F6F6F6, sampled from your screenshot. The controls read on it. On plain white the shadow alone nearly disappears.
        </p>
      </section>

      <section className="mt-8 rounded-card bg-s-bg-sunken p-5">
        <h2 className="text-[18px] font-semibold text-s-ink">Still yours to pick</h2>
        <ol className="mt-3 space-y-2 text-[15px] text-s-ink">
          <li>1. This one-field flow, or two doors on the first screen like Qonto.</li>
          <li>2. The code screen, or let the account exist straight away.</li>
          <li>3. These screens on grey, or on white with a line on the buttons.</li>
        </ol>
      </section>
    </main>
  );
}
