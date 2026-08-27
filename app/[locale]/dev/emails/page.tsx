/**
 * /dev/emails , every transactional and lifecycle email, on one page.
 *
 * WHY (2026-08-15): 67 email templates ship today and there was no way to look at any
 * of them without triggering the real event and reading an inbox. That is the reason
 * the CONTENT of these emails kept improving through July (localisation, plain-text
 * part, unsubscribe, calendar file, address on the confirmation) while the LOOK never
 * moved: no pass could see its own result.
 *
 * Each frame below is the exact string Resend is handed, because it goes through
 * `wrapEmailHtml()`, the same one function sendEmail() wraps every body in. Nothing is
 * approximated and nothing here can send.
 *
 * exists-check: `npm run exists email` (2026-08-15) , 61 hits, all templates + DB
 * columns, no preview surface. Net-new.
 *
 * Chrome note: each email sits in a white card on the sunken tray with hairline rows
 * INSIDE it and NO outer border. That is the container-with-divided-rows half of
 * LOCKFILE 17.2, not doubled chrome; the white-on-sunken step is the edge (FLOORS LAW 4a).
 *
 * Dev-only: notFound() in production, same hard gate as /api/dev/login.
 */
import { notFound } from "next/navigation";
import type { EmailLocale, EmailPayload } from "@/lib/email";
import { wrapEmailHtml } from "@/lib/email";
import { EMAIL_PREVIEWS, EMAIL_PREVIEW_GROUPS } from "@/lib/email-preview-samples";

export const dynamic = "force-dynamic";

const LOCALES: EmailLocale[] = ["de", "en", "fr", "it"];

/** Frame widths. 390 is the phone the design floors are measured at; 700 is a desktop mail window. */
const WIDTHS = { phone: 390, desktop: 700 } as const;
type WidthKey = keyof typeof WIDTHS;

export default async function DevEmailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ l?: string; w?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();

  const { locale: routeLocale } = await params;
  const sp = await searchParams;

  const locale = (LOCALES.includes(sp.l as EmailLocale) ? sp.l : "de") as EmailLocale;
  const width: WidthKey = sp.w === "phone" ? "phone" : "desktop";
  const frameWidth = WIDTHS[width];

  const href = (next: { l?: string; w?: string }) =>
    `/${routeLocale}/dev/emails?l=${next.l ?? locale}&w=${next.w ?? width}`;

  // Some template builders are async now (salon-outreach-invitation, see lib/unsubscribe-token.ts).
  // A .map() callback used inline in JSX below cannot itself be async, so every entry is built and
  // awaited HERE, before render, and the render below only ever does a synchronous lookup.
  const built = new Map<string, { payload?: EmailPayload; error: string | null }>();
  await Promise.all(
    EMAIL_PREVIEWS.map(async (entry) => {
      try {
        const payload = await entry.build(locale);
        built.set(entry.id, { payload, error: null });
      } catch (err) {
        built.set(entry.id, { error: err instanceof Error ? err.message : String(err) });
      }
    })
  );

  return (
    <main className="min-h-screen bg-s-bg-sunken text-s-ink">
      {/* ---------------------------------------------------------------- chrome */}
      <header className="sticky top-0 z-10 border-b border-s-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-x-6 gap-y-3 px-6 py-4">
          <div className="mr-auto">
            <h1 className="font-display text-[28px] font-semibold leading-tight">Email preview</h1>
            <p className="mt-0.5 text-[13px] text-s-ink-2">
              {EMAIL_PREVIEWS.length} templates, exactly as they arrive. Sample content, nothing sends.
            </p>
          </div>

          <nav className="flex items-center gap-1" aria-label="Language">
            {LOCALES.map((l) => (
              <a
                key={l}
                href={href({ l })}
                className={`rounded-full px-3 py-1.5 text-[13px] ${
                  l === locale ? "bg-s-bg-sunken font-semibold text-s-ink" : "text-s-ink-2 hover:text-s-ink"
                }`}
              >
                {l.toUpperCase()}
              </a>
            ))}
          </nav>

          <nav className="flex items-center gap-1" aria-label="Width">
            {(Object.keys(WIDTHS) as WidthKey[]).map((w) => (
              <a
                key={w}
                href={href({ w })}
                className={`rounded-full px-3 py-1.5 text-[13px] capitalize ${
                  w === width ? "bg-s-bg-sunken font-semibold text-s-ink" : "text-s-ink-2 hover:text-s-ink"
                }`}
              >
                {w} {WIDTHS[w]}
              </a>
            ))}
          </nav>
        </div>
      </header>

      {/* ---------------------------------------------------------------- index */}
      <div className="mx-auto max-w-[1280px] px-6 py-6">
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
          {EMAIL_PREVIEW_GROUPS.map((g) => (
            <li key={g}>
              <a href={`#${slug(g)}`} className="text-s-accent hover:underline">
                {g} ({EMAIL_PREVIEWS.filter((e) => e.group === g).length})
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* ---------------------------------------------------------------- the emails */}
      <div className="mx-auto max-w-[1280px] px-6 pb-24">
        {EMAIL_PREVIEW_GROUPS.map((group) => {
          const entries = EMAIL_PREVIEWS.filter((e) => e.group === group);
          if (entries.length === 0) return null;

          return (
            <section key={group} id={slug(group)} className="scroll-mt-28 pt-10">
              <h2 className="text-[20px] font-semibold">{group}</h2>

              <div className="mt-4 space-y-6">
                {entries.map((entry) => {
                  const result = built.get(entry.id);
                  const payload = result?.payload;
                  const error = result?.error ?? null;

                  return (
                    <article
                      key={entry.id}
                      id={entry.id}
                      // boxed-ok: container WITH divided rows and NO outer border, the legal half of LOCKFILE 17.2. The hairlines separate three different kinds of thing inside one email entry (its identity, its subject line, the rendered mail itself); the card edge is the white-on-sunken step, not a border.
                      className="scroll-mt-28 overflow-hidden rounded-card bg-white"
                    >
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-s-border px-4 py-3">
                        <span className="text-[15px] font-semibold">{entry.label}</span>
                        <span className="rounded-full bg-s-bg-sunken px-2 py-0.5 text-[12px] text-s-ink-2">
                          to the {entry.audience}
                        </span>
                        {payload?.attachments?.length ? (
                          <span className="rounded-full bg-s-bg-sunken px-2 py-0.5 text-[12px] text-s-ink-2">
                            {payload.attachments.map((a) => a.filename).join(", ")} attached
                          </span>
                        ) : null}
                        <code className="ml-auto text-[12px] text-s-ink-2">{entry.id}</code>
                      </div>

                      {error ? (
                        <p className="px-4 py-6 text-[14px] text-s-error">Could not build: {error}</p>
                      ) : (
                        <>
                          <p className="border-b border-s-border px-4 py-3 text-[14px]">
                            <span className="text-s-ink-2">Subject: </span>
                            <span className="font-semibold">{payload!.subject}</span>
                          </p>

                          <div className="flex justify-center bg-s-bg-sunken p-6">
                            <iframe
                              title={entry.label}
                              srcDoc={frameDoc(wrapEmailHtml(payload!.html))}
                              width={frameWidth}
                              height={260}
                              data-autosize="1"
                              className="rounded-[8px] bg-white"
                              sandbox="allow-same-origin"
                            />
                          </div>
                        </>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Grow each frame to its content so nothing is judged through a scrollbar. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function () {
              function fit(f) {
                try {
                  var d = f.contentDocument;
                  if (!d || !d.body) return;
                  f.style.height = '0px';
                  f.style.height = Math.max(120, d.documentElement.scrollHeight) + 'px';
                } catch (e) {}
              }
              function fitAll() {
                document.querySelectorAll('iframe[data-autosize]').forEach(function (f) {
                  if (f.contentDocument && f.contentDocument.readyState === 'complete') fit(f);
                  f.addEventListener('load', function () { fit(f); });
                });
              }
              window.addEventListener('load', fitAll);
              fitAll();
            })();
          `,
        }}
      />
    </main>
  );
}

/** Mail clients render on their own white page with default margins. Mirror that, nothing more. */
function frameDoc(inner: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:16px;background:#ffffff">${inner}</body></html>`;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
