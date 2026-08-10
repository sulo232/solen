/**
 * /dev/form-labels , the three real label styles already in the product, side by side, to pick one.
 *
 * WHY. The design system specifies 21 of the 22 layers a complete system needs. The one hole is
 * forms, and inside forms exactly one thing has no rule: the label above a field. So the product
 * invented its own: 111 labels across the app in 8 different styles, counted from source.
 *
 * This is not a redesign and not an invention. Every option below is a style ALREADY SHIPPING in
 * the app, with the count of places it is used, so the decision is "which of ours wins" rather than
 * "here is something new". Owner rule: values that are not locked get asked, never filled in from
 * memory.
 *
 * A is the incumbent by a distance (69 of 111). B and C are the two real challengers. The tail of
 * one-offs is not offered, because a style used once is not a candidate, it is a mistake.
 *
 * Dev-only, notFound() in production. Copy in English because this is a dev surface.
 * exists-check: `npm run exists form-label` = 0 matches. Nearest is /dev/pin-label, an unrelated
 * map-pin surface. Net-new.
 */
import { notFound } from "next/navigation";

type Option = {
  key: string;
  used: string;
  cls: string;
  note: string;
};

const OPTIONS: Option[] = [
  {
    key: "A",
    used: "69 of 111 places",
    cls: "block text-xs font-medium text-s-ink-2 mb-1.5",
    note: "Small, grey, medium weight. Quiet: the field is the thing, the label just names it.",
  },
  {
    key: "B",
    used: "8 of 111 places",
    cls: "block text-[12px] text-s-ink mb-1.5",
    note: "Same size, but black instead of grey. Reads as part of the form rather than a hint.",
  },
  {
    key: "C",
    used: "4 of 111 places",
    cls: "block text-[12px] font-semibold text-s-ink mb-1.5",
    note: "Black and bold. Strongest, and the only one you can scan down a long form with.",
  },
];

/**
 * D and E are not ours. They are the two references he named, MEASURED on the live sites on
 * 2026-08-09 rather than recalled, because all three of A/B/C turned out to be variations of the
 * one pattern both references reject.
 *
 *   Airbnb (airbnb.ch/login): one label, 16px, weight 400, rgb(108,108,108), rendered at the SAME
 *   top as the input, i.e. floating inside a 55px-tall borderless field, rising when you type.
 *
 *   Uber (auth.uber.com): ZERO label elements. A 20px weight-400 BLACK question sits 20px above the
 *   field; the field itself carries only a placeholder, on a grey fill rgb(243,243,243).
 */
function FloatField({ text }: { text: string }) {
  return (
    <div className="relative h-14 w-full rounded-[12px] bg-s-bg-sunken">
      <span className="pointer-events-none absolute left-3 top-2 text-[12px] text-s-ink-2">
        {text}
      </span>
      <input
        className="absolute inset-x-0 bottom-0 h-8 w-full bg-transparent px-3 text-[16px] text-s-ink"
        defaultValue={text === "Email" ? "anna@example.ch" : ""}
      />
    </div>
  );
}

function Field({ opt }: { opt: Option }) {
  return (
    <div className="rounded-card border border-s-border bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-semibold text-s-ink">{opt.key}</span>
        <span className="text-[12px] text-s-ink-2">{opt.used}</span>
      </div>

      <div className="mt-4">
        <label className={opt.cls}>Email</label>
        <input
          type="email"
          defaultValue="anna@example.ch"
          className="h-11 w-full rounded-[12px] bg-s-bg-sunken px-3 text-[15px] text-s-ink"
        />
      </div>

      <div className="mt-3">
        <label className={opt.cls}>Phone</label>
        <input
          type="tel"
          defaultValue="+41 79 123 45 67"
          className="h-11 w-full rounded-[12px] bg-s-bg-sunken px-3 text-[15px] text-s-ink"
        />
      </div>

      <div className="mt-3">
        <label className={opt.cls}>Note for the salon</label>
        <input
          type="text"
          placeholder="Optional"
          className="h-11 w-full rounded-[12px] bg-s-bg-sunken px-3 text-[15px] text-s-ink placeholder:text-s-ink-2"
        />
      </div>

      <p className="mt-4 text-[14px] leading-[1.55] text-s-ink-2">{opt.note}</p>
    </div>
  );
}

export default function FormLabelsPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="min-h-dvh bg-s-bg-sunken">
      <div className="mx-auto max-w-[560px] px-4 py-10">
        <h1 className="font-display text-[30px] font-semibold leading-[1.1] text-s-ink">
          Which label wins?
        </h1>
        <p className="mt-3 text-[14px] leading-[1.55] text-s-ink-2">
          Your app has 111 form labels in 8 different styles, because there has never been a rule
          for them. A, B and C are the three actually in use. D and E are the two you named,
          measured on their live sites today, and both reject the small-label-above-a-box idea that
          A, B and C are all versions of.
        </p>

        <div className="mt-8 space-y-4">
          {OPTIONS.map((o) => (
            <Field key={o.key} opt={o} />
          ))}

          <div className="rounded-card border border-s-border bg-white p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold text-s-ink">D</span>
              <span className="text-[12px] text-s-ink-2">how Airbnb does it</span>
            </div>
            <div className="mt-4 space-y-3">
              <FloatField text="Email" />
              <FloatField text="Phone" />
              <FloatField text="Note for the salon" />
            </div>
            <p className="mt-4 text-[14px] leading-[1.55] text-s-ink-2">
              The label lives inside the field and rises when you type, so it never takes a line of
              its own. Measured on their live login: 16px, normal weight, grey, in a 55px field.
            </p>
          </div>

          <div className="rounded-card border border-s-border bg-white p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-[15px] font-semibold text-s-ink">E</span>
              <span className="text-[12px] text-s-ink-2">how Uber does it</span>
            </div>
            <div className="mt-4">
              <p className="text-[20px] leading-snug text-s-ink">What is your email?</p>
              <input
                defaultValue="anna@example.ch"
                className="mt-5 h-11 w-full rounded-[12px] bg-s-bg-sunken px-3 text-[16px] text-s-ink"
              />
            </div>
            <div className="mt-6">
              <p className="text-[20px] leading-snug text-s-ink">And your phone number?</p>
              <input
                defaultValue="+41 79 123 45 67"
                className="mt-5 h-11 w-full rounded-[12px] bg-s-bg-sunken px-3 text-[16px] text-s-ink"
              />
            </div>
            <p className="mt-4 text-[14px] leading-[1.55] text-s-ink-2">
              No label at all. One question at a time, big and black, with the field under it.
              Measured on their live sign-in: 20px, normal weight, black, 20px above the field. It
              reads warm and takes far more room, so it suits a short flow and not a long form.
            </p>
          </div>
        </div>

        <p className="mt-8 text-[14px] leading-[1.55] text-s-ink-2">
          My pick is D. It is the only one that never spends a line on the label, which matters most
          on a phone, and it keeps a permanent name on the field once it is filled, which E throws
          away. E is warmer but it costs about three times the height, so a booking form would
          become a long scroll. Among our own three, C is the only one you can scan down a long
          form, and A is only ahead because it is already the majority, which is a reason to keep it
          rather than a reason it is right.
        </p>
      </div>
    </main>
  );
}
