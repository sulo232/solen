/**
 * /dev/auth-flow , the sign-up and sign-in overhaul, as a MOCKUP, before any real code.
 *
 * Owner, 2026-08-10: "I told you to overhaul the fucking sign up sign in page, and what you should
 * have done is just give me a fucking mock up." He is right. The mockup-first rule is explicit and
 * I went straight into the real header instead.
 *
 * GROUNDED, not invented. Every screen and every control here comes from the captured reference at
 * `_design-system/references/qonto--onboarding.md`, measured live from Mobbin and qonto.com. His
 * flow, in his words: social buttons, then email, then either a password (existing account) or a
 * 6-digit code and then a create-password screen (new account).
 *
 * THE ONE THING HE MUST DECIDE, shown as two columns rather than argued in prose: Qonto never
 * branches off a shared email field. Sign-up and log-in are separate doors chosen at the start.
 * His version needs a lookup that tells anyone who types an address whether it is registered here.
 *
 * The button row at the top is the other open thing: his last order was no border, shadow only, and
 * on white that is nearly invisible. It is rendered here next to the alternatives so he can SEE the
 * difference rather than read my objection to it again.
 *
 * Mockup copy is ENGLISH by house rule, even though the product ships German first. Borders are
 * `border`, never `ring-*`: the ring utilities are banned outright, halo or not.
 *
 * exists-check: `npm run exists auth mockup signup flow` = 0 matches. The real routes
 * (/auth/login, /auth/register, /auth/signup, /auth/reset-password) exist and are untouched.
 * Dev-only, notFound() in production.
 */
import { notFound } from "next/navigation";
import { ArrowLeft, Menu } from "lucide-react";

function Phone({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <figure className="m-0 w-[300px] shrink-0">
      <div className="h-[600px] w-[300px] overflow-hidden rounded-[28px] border border-s-border bg-white">
        {children}
      </div>
      <figcaption className="mt-2 text-[13px] text-s-ink-2">{label}</figcaption>
    </figure>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-s-ink-2">{label}</span>
      <span className="flex h-11 items-center rounded-[12px] bg-s-bg-sunken px-3.5 text-[15px] text-s-ink-2">
        {placeholder}
      </span>
    </label>
  );
}

function Primary({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <span
      className={`mt-1 flex h-12 items-center justify-center rounded-full text-[15px] text-white ${
        muted ? "bg-s-ink/40" : "bg-s-ink"
      }`}
    >
      {children}
    </span>
  );
}

function Social({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-12 items-center justify-center rounded-full border border-s-border bg-white text-[15px] text-s-ink">
      {children}
    </span>
  );
}

function Back() {
  return (
    <span className="grid h-11 w-11 place-items-center rounded-full bg-white shadow-elevation">
      <ArrowLeft size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />
    </span>
  );
}

/** The three treatments, so he can see the one he ordered next to the two alternatives. */
function BackVariant({ kind }: { kind: "shadow" | "hairline" | "both" }) {
  const base = "grid h-11 w-11 place-items-center rounded-full bg-white";
  const cls =
    kind === "shadow"
      ? `${base} shadow-elevation`
      : kind === "hairline"
        ? `${base} border border-s-border`
        : `${base} border border-s-border shadow-elevation`;
  return (
    <span className={cls}>
      <ArrowLeft size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />
    </span>
  );
}

export default function AuthFlowMockup() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto max-w-[1180px] px-5 py-8 pb-20">
      <h1 className="font-display text-[30px] font-semibold tracking-[-0.02em] text-s-ink">
        Sign up and sign in
      </h1>
      <p className="mt-2 max-w-[62ch] text-[15px] text-s-ink-2">
        A mockup. Nothing here is live. The screens follow Qonto, measured rather than remembered.
        Two things need you and both are shown instead of described.
      </p>

      <section className="mt-9">
        <h2 className="text-[20px] font-semibold text-s-ink">1. The back button, on white</h2>
        <p className="mt-1 max-w-[62ch] text-[15px] text-s-ink-2">
          You asked for no line and a shadow. That is the first one. Qonto does exactly that, but
          their page is grey, so the shadow has something to sit against. Ours is white.
        </p>
        <div className="mt-5 flex flex-wrap items-start gap-10 rounded-card border border-s-border bg-white p-6">
          {([
            ["shadow", "Shadow only, what you asked for"],
            ["hairline", "Line only, what shipped before today"],
            ["both", "Both, what I put in and you rejected"],
          ] as const).map(([kind, caption]) => (
            <div key={kind}>
              <BackVariant kind={kind} />
              <p className="mt-2 w-[150px] text-[13px] text-s-ink-2">{caption}</p>
            </div>
          ))}
          <div>
            <span className="grid h-11 w-11 place-items-center rounded-input bg-white shadow-elevation">
              <Menu size={20} strokeWidth={2.2} className="text-s-ink" aria-hidden />
            </span>
            <p className="mt-2 w-[150px] text-[13px] text-s-ink-2">Menu stays square, as you said</p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-[20px] font-semibold text-s-ink">2. Your flow</h2>
        <p className="mt-1 max-w-[62ch] text-[15px] text-s-ink-2">
          One email field that decides where you go next.
        </p>
        <div className="mt-5 flex gap-6 overflow-x-auto pb-3">
          <Phone label="Start">
            <div className="flex h-full flex-col gap-3 p-5">
              <Back />
              <h3 className="mt-4 font-display text-[24px] font-semibold text-s-ink">Welcome</h3>
              <Social>Continue with Google</Social>
              <Social>Continue with Apple</Social>
              <span className="my-1 text-center text-[13px] text-s-ink-2">or</span>
              <Field label="Email" placeholder="name@example.ch" />
              <Primary>Continue</Primary>
            </div>
          </Phone>

          <Phone label="Known email, so: password">
            <div className="flex h-full flex-col gap-3 p-5">
              <Back />
              <h3 className="mt-4 font-display text-[24px] font-semibold text-s-ink">Welcome back</h3>
              <p className="text-[14px] text-s-ink-2">name@example.ch</p>
              <Field label="Password" placeholder="Password" />
              <Primary>Sign in</Primary>
              <span className="mt-1 text-[14px] text-s-accent">Forgot password?</span>
            </div>
          </Phone>

          <Phone label="New email, so: code">
            <div className="flex h-full flex-col gap-3 p-5">
              <Back />
              <h3 className="mt-4 font-display text-[24px] font-semibold text-s-ink">
                Confirm your email
              </h3>
              <p className="text-[14px] text-s-ink-2">
                Enter the 6-digit code we sent to name@example.ch
              </p>
              <div className="mt-2 flex items-center gap-2">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-12 w-9 rounded-[10px] bg-s-bg-sunken" />
                ))}
                <span className="text-s-ink-2">&ndash;</span>
                {[3, 4, 5].map((i) => (
                  <span key={i} className="h-12 w-9 rounded-[10px] bg-s-bg-sunken" />
                ))}
              </div>
              <p className="mt-3 text-[13px] text-s-ink-2">Resend code in 24 seconds</p>
            </div>
          </Phone>

          <Phone label="Then: choose a password">
            <div className="flex h-full flex-col gap-3 p-5">
              <Back />
              <h3 className="mt-4 font-display text-[24px] font-semibold text-s-ink">
                Create a password
              </h3>
              <Field label="Password" placeholder="At least 8 characters" />
              <Primary muted>Create account</Primary>
            </div>
          </Phone>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-[20px] font-semibold text-s-ink">3. Qonto&rsquo;s way, for comparison</h2>
        <p className="mt-1 max-w-[62ch] text-[15px] text-s-ink-2">
          Two doors at the start. Nothing ever has to ask whether an address is already here, which
          is the part of your version that tells a stranger who has an account.
        </p>
        <div className="mt-5 flex gap-6 overflow-x-auto pb-3">
          <Phone label="Pick a door">
            <div className="flex h-full flex-col justify-end gap-3 p-5">
              <h3 className="font-display text-[24px] font-semibold text-s-ink">
                Appointments, confirmed instantly.
              </h3>
              <Primary>Create an account</Primary>
              <Social>Sign in</Social>
            </div>
          </Phone>
          <Phone label="Log in: both fields together">
            <div className="flex h-full flex-col gap-3 p-5">
              <Back />
              <h3 className="mt-4 font-display text-[24px] font-semibold text-s-ink">Welcome back</h3>
              <Field label="Email" placeholder="name@example.ch" />
              <Field label="Password" placeholder="Password" />
              <Primary>Sign in</Primary>
            </div>
          </Phone>
        </div>
      </section>

      <section className="mt-12 rounded-card bg-s-bg-sunken p-6">
        <h2 className="text-[20px] font-semibold text-s-ink">What I need from you</h2>
        <ol className="mt-3 space-y-2 text-[15px] text-s-ink">
          <li>1. Back button: shadow only, line only, or both.</li>
          <li>2. Your one-field flow, or Qonto&rsquo;s two doors.</li>
          <li>
            3. The code screen: worth an extra step for a haircut booking, or drop it and let the
            account exist straight away.
          </li>
        </ol>
        <p className="mt-4 text-[13px] text-s-ink-2">
          Nothing here is wired. The live sign-up is untouched.
        </p>
      </section>
    </main>
  );
}
