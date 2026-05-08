"use client";

/**
 * Dev-only primitives test page.
 *
 * Renders every Solen V3 §F.1 form primitive in every state — the React equivalent of
 * `public/solen-v2-primitives.html`. Used to visually verify Phase 0 §F.1 React
 * implementation against the locked V2-D16 mockup.
 *
 * Routes at `/{locale}/dev/primitives` (e.g. `/de/dev/primitives`).
 *
 * Production gate: returns `notFound()` when `NODE_ENV === "production"`. In Vercel
 * production deploys, this page is invisible. In `npm run dev` it renders normally.
 */

import * as React from "react";
import { notFound } from "next/navigation";
import {
  FieldLabel,
  FieldHelper,
  TextInput,
  Textarea,
  TextareaCounter,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  PillToggle,
  PillGroup,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Sheet,
  SheetHeader,
  SheetBody,
  SheetCTARow,
  ToastProvider,
  useToast,
  Logo,
  DateTimePicker,
  type DateTimeValue,
  type TimeSlot,
} from "../../_components/primitives";
import { today, getLocalTimeZone } from "@internationalized/date";

export default function PrimitivesDevPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <ToastProvider>
      <PrimitivesDevPageInner />
    </ToastProvider>
  );
}

function PrimitivesDevPageInner() {

  // Live state for interactive demos
  const [reviewText, setReviewText] = React.useState(
    "Sehr aufmerksamer Service, Maria hat sich Zeit für Beratung genommen. Der Schnitt sitzt nach 4 Wochen immer noch perfekt.",
  );
  const [emailLoading] = React.useState(false);
  const [subscribed, setSubscribed] = React.useState(true);
  const [allCookies, setAllCookies] = React.useState(false);
  const [requiredCookies] = React.useState(true);
  const [sortBy, setSortBy] = React.useState("distance");
  const [duration, setDuration] = React.useState("60");
  const [pushOn, setPushOn] = React.useState(true);
  const [emailNewsletterOn, setEmailNewsletterOn] = React.useState(false);
  const [marketingOn, setMarketingOn] = React.useState(true);
  const [activeServiceTypes, setActiveServiceTypes] = React.useState(
    new Set(["damen", "herren"]),
  );
  const [serviceMode, setServiceMode] = React.useState("damen");
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [loginOpen, setLoginOpen] = React.useState(false);
  const [reportOpen, setReportOpen] = React.useState(false);
  const [destructiveOpen, setDestructiveOpen] = React.useState(false);
  const [sortSheetOpen, setSortSheetOpen] = React.useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = React.useState(false);
  const [shareSheetOpen, setShareSheetOpen] = React.useState(false);
  const [sheetSortBy, setSheetSortBy] = React.useState("distance");
  const [sheetFilterTypes, setSheetFilterTypes] = React.useState(new Set(["damen", "herren"]));
  const toggleSheetFilter = (key: string) => {
    setSheetFilterTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleServiceType = (key: string) => {
    setActiveServiceTypes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-white py-14 px-5 pb-24">
      <div className="max-w-[1180px] mx-auto">
        {/* PAGE HEAD */}
        <header className="mb-14">
          <div className="h-px bg-s-ink mb-3.5" />
          <div className="flex items-baseline justify-between gap-4 mb-4 font-body font-bold text-[13px] uppercase tracking-[0.18em] tabular-nums">
            <span className="text-s-ink inline-flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-s-brand" />
              Solen V3 · Phase 0 · React
            </span>
            <span className="text-s-ink-3">§F.1 · 2026-05-08 · /dev/primitives</span>
          </div>
          <h1 className="font-display font-black text-[64px] leading-[0.95] tracking-[-0.02em] text-s-ink">
            Form primitives
          </h1>
          <p className="font-body font-normal text-[15px] text-s-ink-2 mt-4 max-w-[720px]">
            Live React implementation of the V2-D16 locked mockup. Every primitive is
            interactive — tab through to see real focus rings, click to toggle real
            state. This page is dev-gated: <code className="bg-s-bg-sunken px-1.5 py-0.5 rounded text-[12px]">notFound()</code> in production.
          </p>
        </header>

        {/* §F.1.1 TEXT INPUT */}
        <Section eyebrow="Text input" meta="§F.1.1 · 9 states + 6 types" title="Text input">
          <Grid cols={3}>
            <Card tag="State 01 · default">
              <FieldLabel htmlFor="ti-01">E-Mail-Adresse</FieldLabel>
              <TextInput id="ti-01" type="email" placeholder="lara@example.ch" autoComplete="email" />
              <FieldHelper>Wir senden dir eine Bestätigung.</FieldHelper>
            </Card>

            <Card tag="State 02 · focus (tab here)">
              <FieldLabel htmlFor="ti-02">E-Mail-Adresse</FieldLabel>
              <TextInput id="ti-02" type="email" placeholder="lara@example.ch" autoComplete="email" />
              <FieldHelper>2px brand outline appears on tab-in.</FieldHelper>
            </Card>

            <Card tag="State 03 · active (tone)">
              <FieldLabel htmlFor="ti-03">E-Mail-Adresse</FieldLabel>
              <TextInput id="ti-03" type="email" defaultValue="lara@" tone="active" />
              <FieldHelper>Bg warms to #FFF4E8.</FieldHelper>
            </Card>

            <Card tag="State 04 · filled">
              <FieldLabel htmlFor="ti-04">E-Mail-Adresse</FieldLabel>
              <TextInput id="ti-04" type="email" defaultValue="lara@example.ch" autoComplete="email" />
              <FieldHelper>Has value, no border highlight.</FieldHelper>
            </Card>

            <Card tag="State 05 · error">
              <FieldLabel htmlFor="ti-05" required>E-Mail-Adresse</FieldLabel>
              <TextInput id="ti-05" type="email" defaultValue="lara@" tone="error" />
              <FieldHelper tone="error">Diese E-Mail-Adresse ist nicht gültig.</FieldHelper>
            </Card>

            <Card tag="State 06 · warning">
              <FieldLabel htmlFor="ti-06">Passwort</FieldLabel>
              <TextInput id="ti-06" type="password" defaultValue="myPassword" tone="warning" />
              <FieldHelper tone="warning">Passwort ist schwach — füge eine Zahl hinzu.</FieldHelper>
            </Card>

            <Card tag="State 07 · success">
              <FieldLabel htmlFor="ti-07">E-Mail-Adresse</FieldLabel>
              <TextInput id="ti-07" type="email" defaultValue="lara@example.ch" tone="success" />
              <FieldHelper>Verfügbar — keine zusätzliche Meldung.</FieldHelper>
            </Card>

            <Card tag="State 08 · disabled">
              <FieldLabel htmlFor="ti-08">E-Mail-Adresse</FieldLabel>
              <TextInput id="ti-08" type="email" defaultValue="lara@example.ch" disabled />
              <FieldHelper>Form ist gesperrt während Login läuft.</FieldHelper>
            </Card>

            <Card tag="State 09 · loading">
              <FieldLabel htmlFor="ti-09">E-Mail-Adresse</FieldLabel>
              <TextInput id="ti-09" type="email" defaultValue="lara@example.ch" loading={!emailLoading} />
              <FieldHelper>Prüfe Verfügbarkeit…</FieldHelper>
            </Card>
          </Grid>

          <h3 className="font-body font-bold text-[13px] tracking-[0.16em] uppercase text-s-brand tabular-nums mt-9 mb-3.5">
            §F.1.1 · Variants by type
          </h3>
          <Grid cols={3}>
            <Card tag="type · text">
              <FieldLabel htmlFor="tv-text">Vorname</FieldLabel>
              <TextInput
                id="tv-text"
                type="text"
                placeholder="Lara"
                autoCapitalize="words"
                autoComplete="given-name"
              />
            </Card>
            <Card tag="type · tel">
              <FieldLabel htmlFor="tv-tel">Telefonnummer</FieldLabel>
              <TextInput
                id="tv-tel"
                type="tel"
                inputMode="tel"
                placeholder="+41 79 123 45 67"
                autoComplete="tel"
              />
            </Card>
            <Card tag="type · password (revealable)">
              <FieldLabel htmlFor="tv-pw">Passwort</FieldLabel>
              <TextInput id="tv-pw" type="password" defaultValue="myPassword123" revealable />
            </Card>
            <Card tag="type · search">
              <FieldLabel htmlFor="tv-search">Service oder Salon</FieldLabel>
              <TextInput
                id="tv-search"
                type="search"
                inputMode="search"
                placeholder="Coiffeur, Maniküre, Massage…"
              />
            </Card>
            <Card tag="type · number">
              <FieldLabel htmlFor="tv-num">Preis (CHF)</FieldLabel>
              <TextInput
                id="tv-num"
                type="number"
                inputMode="decimal"
                placeholder="89"
                min={0}
                step={1}
              />
            </Card>
            <Card tag="type · url">
              <FieldLabel htmlFor="tv-url" optional>
                Website
              </FieldLabel>
              <TextInput
                id="tv-url"
                type="url"
                inputMode="url"
                placeholder="https://salon.ch"
                autoComplete="url"
              />
            </Card>
          </Grid>
        </Section>

        {/* §F.1.0a SIZES */}
        <Section eyebrow="Sizes" meta="§F.1.0a · sm/md/lg" title="Sizes">
          <Grid cols={3}>
            <Card tag="sm · 40px · 13px">
              <FieldLabel htmlFor="sz-sm">Filter-Suche</FieldLabel>
              <TextInput id="sz-sm" type="search" size="sm" placeholder="Suchen…" />
              <FieldHelper>Kompakte Filter-Reihen, Dropdowns in Listen-Items.</FieldHelper>
            </Card>
            <Card tag="md · 56px · 14px (default)">
              <FieldLabel htmlFor="sz-md">Vorname</FieldLabel>
              <TextInput id="sz-md" type="text" placeholder="Lara" autoComplete="given-name" />
              <FieldHelper>Booking, login, signup, settings — alle Forms.</FieldHelper>
            </Card>
            <Card tag="lg · 64px · 16px">
              <FieldLabel htmlFor="sz-lg">Hero-Suche</FieldLabel>
              <TextInput
                id="sz-lg"
                type="search"
                size="lg"
                placeholder="Coiffeur, Maniküre, Massage…"
              />
              <FieldHelper>Reserviert für Hero-Inputs (§13.4).</FieldHelper>
            </Card>
          </Grid>
        </Section>

        {/* §F.1.2 TEXTAREA */}
        <Section eyebrow="Textarea" meta="§F.1.2 · multiline" title="Textarea">
          <Grid cols={2}>
            <Card tag="Default · empty">
              <FieldLabel htmlFor="ta-empty">Deine Bewertung</FieldLabel>
              <Textarea
                id="ta-empty"
                placeholder="Was hat dir gefallen? Worauf können andere achten?"
              />
              <FieldHelper>Mindestens 20 Zeichen.</FieldHelper>
            </Card>
            <Card tag="Filled · with counter (live)">
              <FieldLabel htmlFor="ta-filled">Deine Bewertung</FieldLabel>
              <Textarea
                id="ta-filled"
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={1000}
              />
              <TextareaCounter current={reviewText.length} max={1000} />
            </Card>
            <Card tag="Approaching limit (warn at 80%)">
              <FieldLabel htmlFor="ta-warn">Deine Bewertung</FieldLabel>
              <Textarea
                id="ta-warn"
                defaultValue="Dies ist eine längere Bewertung — ich versuche möglichst viel Detail zu geben weil andere Solen-Nutzerinnen davon profitieren sollen. Der Service war durchwegs sehr gut, von der Begrüssung bis zur Verabschiedung. Maria hat alle Wünsche aufgenommen…"
                maxLength={1000}
              />
              <TextareaCounter current={820} max={1000} />
            </Card>
            <Card tag="Error · too short">
              <FieldLabel htmlFor="ta-err" required>
                Deine Bewertung
              </FieldLabel>
              <Textarea id="ta-err" defaultValue="Top." tone="error" />
              <FieldHelper tone="error">
                Mindestens 20 Zeichen — andere möchten erfahren, was dir besonders aufgefallen
                ist.
              </FieldHelper>
            </Card>
          </Grid>
        </Section>

        {/* §F.1.3 SELECT */}
        <Section eyebrow="Select" meta="§F.1.3 · native" title="Select (dropdown)">
          <Grid cols={3}>
            <Card tag="Default · with placeholder">
              <FieldLabel htmlFor="sel-default">Stadt</FieldLabel>
              <Select id="sel-default" defaultValue="">
                <option value="" disabled>
                  Stadt wählen
                </option>
                <option value="basel">Basel</option>
                <option value="zurich">Zürich</option>
                <option value="bern">Bern</option>
              </Select>
            </Card>
            <Card tag="Filled · selection made">
              <FieldLabel htmlFor="sel-filled">Stadt</FieldLabel>
              <Select id="sel-filled" defaultValue="basel">
                <option value="basel">Basel</option>
                <option value="zurich">Zürich</option>
                <option value="bern">Bern</option>
              </Select>
            </Card>
            <Card tag="Disabled · locked">
              <FieldLabel htmlFor="sel-disabled">Stadt</FieldLabel>
              <Select id="sel-disabled" defaultValue="basel" disabled>
                <option value="basel">Basel</option>
              </Select>
            </Card>
          </Grid>
        </Section>

        {/* §F.1.4 CHECKBOX */}
        <Section eyebrow="Checkbox" meta="§F.1.4 · 2 variants" title="Checkbox">
          <h3 className="font-body font-bold text-[13px] tracking-[0.16em] uppercase text-s-brand tabular-nums mb-3.5">
            Variant A · boxed (forms)
          </h3>
          <Grid cols={3}>
            <Card tag="Default · unchecked">
              <Checkbox checked={false} onChange={() => {}}>
                Newsletter abonnieren
              </Checkbox>
            </Card>
            <Card tag="Checked (live)">
              <Checkbox
                checked={subscribed}
                onChange={(e) => setSubscribed(e.target.checked)}
              >
                Newsletter abonnieren
              </Checkbox>
            </Card>
            <Card tag="Indeterminate (parent)">
              <Checkbox
                indeterminate
                checked={allCookies}
                onChange={(e) => setAllCookies(e.target.checked)}
              >
                Alle Cookie-Kategorien
              </Checkbox>
            </Card>
            <Card tag="Disabled · unchecked">
              <Checkbox disabled checked={false} onChange={() => {}}>
                Premium-Funktionen (Upgrade nötig)
              </Checkbox>
            </Card>
            <Card tag="Disabled · checked (locked)">
              <Checkbox disabled checked={requiredCookies} onChange={() => {}}>
                Erforderliche Cookies
              </Checkbox>
            </Card>
            <Card tag="Click to toggle">
              <Checkbox defaultChecked={false}>Tap me, then tap again</Checkbox>
            </Card>
          </Grid>

          <h3 className="font-body font-bold text-[13px] tracking-[0.16em] uppercase text-s-brand tabular-nums mt-9 mb-3.5">
            Variant B · pill (filter sheets) — multi-select (live)
          </h3>
          <Card tag={`Service-Typ · ${activeServiceTypes.size} of 8 active`}>
            <FieldLabel className="block mb-2.5">Service-Typ</FieldLabel>
            <PillGroup mode="multi" aria-label="Service-Typ filter">
              {[
                ["damen", "Damen"],
                ["herren", "Herren"],
                ["kinder", "Kinder"],
                ["coloration", "Coloration"],
                ["hochsteck", "Hochsteckfrisur"],
                ["bart", "Bart"],
                ["manikuere", "Maniküre"],
                ["pedikuere", "Pediküre"],
              ].map(([key, label]) => (
                <PillToggle
                  key={key}
                  active={activeServiceTypes.has(key)}
                  onClick={() => toggleServiceType(key)}
                >
                  {label}
                </PillToggle>
              ))}
            </PillGroup>
          </Card>
        </Section>

        {/* §F.1.5 RADIO */}
        <Section eyebrow="Radio" meta="§F.1.5 · 2 variants" title="Radio">
          <h3 className="font-body font-bold text-[13px] tracking-[0.16em] uppercase text-s-brand tabular-nums mb-3.5">
            Variant A · radio row (sort sheets, forms)
          </h3>
          <Grid cols={2}>
            <Card tag={`Sort sheet · "${sortBy}" selected`}>
              <RadioGroup aria-label="Sortieren nach">
                <Radio
                  name="sort"
                  value="distance"
                  checked={sortBy === "distance"}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  Distanz (am nächsten zuerst)
                </Radio>
                <Radio
                  name="sort"
                  value="rating"
                  checked={sortBy === "rating"}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  Bewertung (höchste zuerst)
                </Radio>
                <Radio
                  name="sort"
                  value="availability"
                  checked={sortBy === "availability"}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  Verfügbarkeit (heute frei)
                </Radio>
                <Radio
                  name="sort"
                  value="popularity"
                  checked={sortBy === "popularity"}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  Beliebtheit
                </Radio>
              </RadioGroup>
            </Card>

            <Card tag={`Booking step · "${duration} Min" + disabled row`}>
              <RadioGroup aria-label="Behandlungsdauer">
                <Radio
                  name="duration"
                  value="60"
                  checked={duration === "60"}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  60 Minuten · CHF 89
                </Radio>
                <Radio
                  name="duration"
                  value="90"
                  checked={duration === "90"}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  90 Minuten · CHF 129
                </Radio>
                <Radio
                  name="duration"
                  value="120"
                  disabled
                >
                  120 Minuten · CHF 169 (heute nicht verfügbar)
                </Radio>
                <Radio
                  name="duration"
                  value="0"
                  checked={duration === "0"}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  Beratungstermin · CHF 0
                </Radio>
              </RadioGroup>
            </Card>
          </Grid>

          <h3 className="font-body font-bold text-[13px] tracking-[0.16em] uppercase text-s-brand tabular-nums mt-9 mb-3.5">
            Variant B · pill (compact single-select) — live
          </h3>
          <Card tag={`Bedienung · "${serviceMode}"`}>
            <FieldLabel className="block mb-2.5">Bedienung</FieldLabel>
            <PillGroup mode="single" aria-label="Bedienung">
              {[
                ["damen", "Damen"],
                ["herren", "Herren"],
                ["unisex", "Unisex"],
              ].map(([key, label]) => (
                <PillToggle
                  key={key}
                  active={serviceMode === key}
                  onClick={() => setServiceMode(key)}
                >
                  {label}
                </PillToggle>
              ))}
            </PillGroup>
          </Card>
        </Section>

        {/* §F.1.6 SWITCH */}
        <Section eyebrow="Switch" meta="§F.1.6 · boolean" title="Switch (toggle)">
          <Grid cols={2}>
            <Card tag="Settings list · live">
              <div className="bg-white border border-s-ink/[0.06] rounded-[12px] px-4">
                <Switch
                  id="sw-push"
                  checked={pushOn}
                  onCheckedChange={setPushOn}
                  label="Push-Benachrichtigungen"
                  subLabel="Termin-Erinnerungen 24h vorher"
                />
                <Switch
                  id="sw-news"
                  checked={emailNewsletterOn}
                  onCheckedChange={setEmailNewsletterOn}
                  label="E-Mail-Newsletter"
                  subLabel="Neue Salons in deiner Stadt, max 1×/Woche"
                />
                <Switch
                  id="sw-mkt"
                  checked={marketingOn}
                  onCheckedChange={setMarketingOn}
                  label="Marketing-Cookies"
                  subLabel="Werbung relevanter machen"
                />
                <Switch
                  id="sw-pro"
                  checked
                  disabled
                  label="Solen Pro Beta"
                  subLabel="Bald verfügbar"
                />
              </div>
            </Card>

            <Card tag="All 4 states · isolated">
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-3.5">
                  <Switch checked={false} onCheckedChange={() => {}} />
                  <span className="text-[14px] text-s-ink-2">Off · default</span>
                </div>
                <div className="flex items-center gap-3.5">
                  <Switch checked onCheckedChange={() => {}} />
                  <span className="text-[14px] text-s-ink-2">On · brand-teal track</span>
                </div>
                <div className="flex items-center gap-3.5">
                  <Switch defaultChecked={false} />
                  <span className="text-[14px] text-s-ink-2">Off · uncontrolled (click me)</span>
                </div>
                <div className="flex items-center gap-3.5">
                  <Switch checked={false} disabled onCheckedChange={() => {}} />
                  <span className="text-[14px] text-s-ink-2">Off · disabled</span>
                </div>
              </div>
            </Card>
          </Grid>
        </Section>

        {/* §F.2 MODAL */}
        <Section eyebrow="Modal" meta="§F.2 · 3 sizes" title="Modal (centered overlay)">
          <Grid cols={2}>
            <Card tag="size sm · confirmation">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors duration-150 ease-snap"
              >
                Termin bestätigen öffnen
              </button>
              <Modal isOpen={confirmOpen} onOpenChange={setConfirmOpen} size="sm">
                <ModalHeader title="Termin bestätigen" eyebrow="Buchung" size="sm" onClose={() => setConfirmOpen(false)} />
                <ModalBody size="sm">
                  <p className="text-s-ink-2">
                    Du buchst <strong className="text-s-ink font-semibold">Damen-Schnitt &amp; Föhnen</strong> bei
                    Salon Maria am <strong className="text-s-ink font-semibold">Donnerstag, 16. Mai um 14:30</strong>.
                  </p>
                </ModalBody>
                <ModalFooter size="sm">
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="font-body font-semibold text-[14px] px-5 py-3 rounded-full border border-s-ink/10 bg-white text-s-ink hover:bg-s-bg-sunken transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmOpen(false)}
                    className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors"
                  >
                    Bestätigen
                  </button>
                </ModalFooter>
              </Modal>
            </Card>

            <Card tag="size md · login">
              <button
                type="button"
                onClick={() => setLoginOpen(true)}
                className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors duration-150 ease-snap"
              >
                Login öffnen
              </button>
              <Modal isOpen={loginOpen} onOpenChange={setLoginOpen} size="md">
                <ModalHeader title="Willkommen zurück" eyebrow="Anmelden" size="md" onClose={() => setLoginOpen(false)} />
                <ModalBody size="md">
                  <p className="text-s-ink-2 mb-4">
                    Melde dich mit deiner E-Mail-Adresse an, um deine Buchung abzuschliessen.
                  </p>
                  <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel htmlFor="modal-login-email">E-Mail-Adresse</FieldLabel>
                      <TextInput id="modal-login-email" type="email" placeholder="lara@example.ch" autoComplete="email" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <FieldLabel htmlFor="modal-login-pw">Passwort</FieldLabel>
                      <TextInput id="modal-login-pw" type="password" placeholder="••••••••" revealable autoComplete="current-password" />
                    </div>
                  </div>
                </ModalBody>
                <ModalFooter size="md">
                  <button
                    type="button"
                    onClick={() => setLoginOpen(false)}
                    className="font-body font-semibold text-[14px] px-5 py-3 rounded-full border border-s-ink/10 bg-white text-s-ink hover:bg-s-bg-sunken transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginOpen(false)}
                    className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors"
                  >
                    Anmelden
                  </button>
                </ModalFooter>
              </Modal>
            </Card>

            <Card tag="size lg · report content">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors duration-150 ease-snap"
              >
                Report-Modal öffnen
              </button>
              <Modal isOpen={reportOpen} onOpenChange={setReportOpen} size="lg">
                <ModalHeader title="Was ist mit diesem Look?" eyebrow="Inhalt melden" size="lg" onClose={() => setReportOpen(false)} />
                <ModalBody size="lg">
                  <p className="text-s-ink-2 mb-4">
                    Wähle einen Grund. Wir prüfen alle Meldungen innerhalb von 24 Stunden.
                  </p>
                  <RadioGroup aria-label="Meldungsgrund">
                    <Radio name="report-reason" value="harassment">Belästigung oder Hassrede</Radio>
                    <Radio name="report-reason" value="spam">Spam oder irreführende Inhalte</Radio>
                    <Radio name="report-reason" value="false-info">Falsche Information über einen Salon</Radio>
                    <Radio name="report-reason" value="other">Anderer Grund</Radio>
                  </RadioGroup>
                  <div className="mt-4">
                    <FieldLabel htmlFor="report-detail" optional>Details</FieldLabel>
                    <Textarea id="report-detail" placeholder="Optionale Details (mind. 20 Zeichen)" />
                  </div>
                </ModalBody>
                <ModalFooter size="lg">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="font-body font-semibold text-[14px] px-5 py-3 rounded-full border border-s-ink/10 bg-white text-s-ink hover:bg-s-bg-sunken transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors"
                  >
                    Meldung senden
                  </button>
                </ModalFooter>
              </Modal>
            </Card>

            <Card tag="size sm · destructive (isDismissable=false)">
              <button
                type="button"
                onClick={() => setDestructiveOpen(true)}
                className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-error text-white hover:opacity-90 transition-opacity"
              >
                Konto löschen öffnen
              </button>
              <Modal
                isOpen={destructiveOpen}
                onOpenChange={setDestructiveOpen}
                size="sm"
                isDismissable={false}
                keyboardDismissDisabled
              >
                <ModalHeader title="Konto wirklich löschen?" size="sm" onClose={() => setDestructiveOpen(false)} />
                <ModalBody size="sm">
                  <p className="text-s-ink-2">
                    Diese Aktion kann nicht rückgängig gemacht werden. Alle Buchungen und Favoriten werden gelöscht.
                  </p>
                </ModalBody>
                <ModalFooter size="sm">
                  <button
                    type="button"
                    onClick={() => setDestructiveOpen(false)}
                    className="font-body font-semibold text-[14px] px-5 py-3 rounded-full border border-s-ink/10 bg-white text-s-ink hover:bg-s-bg-sunken transition-colors"
                    autoFocus
                  >
                    Abbrechen
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestructiveOpen(false)}
                    className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-error text-white hover:opacity-90 transition-opacity"
                  >
                    Löschen
                  </button>
                </ModalFooter>
              </Modal>
            </Card>
          </Grid>
        </Section>

        {/* §F.3 SHEET */}
        <Section eyebrow="Sheet" meta="§F.3 · 3 heights" title="Bottom sheet (mobile-only)">
          <p className="font-body font-normal text-[14px] text-s-ink-2 mb-4 max-w-[600px]">
            <strong className="text-s-ink">Resize browser to &lt; 768px to see sheets</strong> in their natural mobile context.
            On desktop they still render but full-width-bottom looks like a banner. Use{" "}
            <code className="bg-s-bg-sunken px-1.5 py-0.5 rounded text-[12px]">useResponsiveOverlay()</code> in real surfaces.
          </p>
          <Grid cols={3}>
            <Card tag="height auto · sort sheet">
              <button
                type="button"
                onClick={() => setSortSheetOpen(true)}
                className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors duration-150 ease-snap"
              >
                Sort sheet öffnen
              </button>
              <Sheet isOpen={sortSheetOpen} onOpenChange={setSortSheetOpen} height="auto">
                <SheetHeader title="Sortieren nach" onClose={() => setSortSheetOpen(false)} />
                <SheetBody>
                  <RadioGroup aria-label="Sortieren nach">
                    <Radio
                      name="sheet-sort"
                      value="distance"
                      checked={sheetSortBy === "distance"}
                      onChange={(e) => setSheetSortBy(e.target.value)}
                    >
                      Distanz (am nächsten zuerst)
                    </Radio>
                    <Radio
                      name="sheet-sort"
                      value="rating"
                      checked={sheetSortBy === "rating"}
                      onChange={(e) => setSheetSortBy(e.target.value)}
                    >
                      Bewertung (höchste zuerst)
                    </Radio>
                    <Radio
                      name="sheet-sort"
                      value="availability"
                      checked={sheetSortBy === "availability"}
                      onChange={(e) => setSheetSortBy(e.target.value)}
                    >
                      Verfügbarkeit (heute frei)
                    </Radio>
                    <Radio
                      name="sheet-sort"
                      value="popularity"
                      checked={sheetSortBy === "popularity"}
                      onChange={(e) => setSheetSortBy(e.target.value)}
                    >
                      Beliebtheit
                    </Radio>
                  </RadioGroup>
                </SheetBody>
              </Sheet>
            </Card>

            <Card tag="height default · filter sheet w sticky CTA">
              <button
                type="button"
                onClick={() => setFilterSheetOpen(true)}
                className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors duration-150 ease-snap"
              >
                Filter sheet öffnen
              </button>
              <Sheet isOpen={filterSheetOpen} onOpenChange={setFilterSheetOpen} height="default">
                <SheetHeader title="Filter" onClose={() => setFilterSheetOpen(false)} />
                <SheetBody>
                  <div className="mb-5">
                    <FieldLabel className="block mb-2.5">Service-Typ</FieldLabel>
                    <PillGroup mode="multi" aria-label="Service-Typ filter">
                      {[
                        ["damen", "Damen"],
                        ["herren", "Herren"],
                        ["kinder", "Kinder"],
                        ["coloration", "Coloration"],
                        ["hochsteck", "Hochsteckfrisur"],
                      ].map(([key, label]) => (
                        <PillToggle
                          key={key}
                          active={sheetFilterTypes.has(key)}
                          onClick={() => toggleSheetFilter(key)}
                        >
                          {label}
                        </PillToggle>
                      ))}
                    </PillGroup>
                  </div>
                  <div className="mb-5">
                    <FieldLabel className="block mb-2.5">Preis</FieldLabel>
                    <PillGroup mode="single" aria-label="Preis filter">
                      <PillToggle>CHF 0-50</PillToggle>
                      <PillToggle active>CHF 50-100</PillToggle>
                      <PillToggle>CHF 100-200</PillToggle>
                      <PillToggle>CHF 200+</PillToggle>
                    </PillGroup>
                  </div>
                  <div>
                    <FieldLabel className="block mb-2.5">Bewertung</FieldLabel>
                    <PillGroup mode="single" aria-label="Bewertung filter">
                      <PillToggle>4.0+</PillToggle>
                      <PillToggle active>4.5+</PillToggle>
                      <PillToggle>4.8+</PillToggle>
                    </PillGroup>
                  </div>
                </SheetBody>
                <SheetCTARow layout="reset-and-primary">
                  <button
                    type="button"
                    onClick={() => setSheetFilterTypes(new Set())}
                    className="font-body font-medium text-[14px] text-s-ink-3 hover:text-s-ink transition-colors"
                  >
                    Zurücksetzen
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterSheetOpen(false)}
                    className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors"
                  >
                    47 Salons anzeigen
                  </button>
                </SheetCTARow>
              </Sheet>
            </Card>

            <Card tag="height auto · share sheet">
              <button
                type="button"
                onClick={() => setShareSheetOpen(true)}
                className="font-body font-semibold text-[14px] px-5 py-3 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors duration-150 ease-snap"
              >
                Share sheet öffnen
              </button>
              <Sheet isOpen={shareSheetOpen} onOpenChange={setShareSheetOpen} height="auto">
                <SheetHeader title="Salon teilen" onClose={() => setShareSheetOpen(false)} />
                <SheetBody>
                  <p className="text-s-ink-3 text-[14px] mb-3.5">Salon Maria · Kleinbasel</p>
                  <PillGroup mode="multi" aria-label="Share targets">
                    <PillToggle>Link kopieren</PillToggle>
                    <PillToggle>WhatsApp</PillToggle>
                    <PillToggle>Nachricht</PillToggle>
                    <PillToggle>E-Mail</PillToggle>
                  </PillGroup>
                </SheetBody>
              </Sheet>
            </Card>
          </Grid>
        </Section>

        {/* §F.4 TOAST */}
        <Section eyebrow="Toast" meta="§F.4 · 4 tones" title="Toast (transient notifications)">
          <ToastDemo />
        </Section>

        {/* §F.5 DATE/TIME PICKER */}
        <Section eyebrow="Date / time picker" meta="§F.5 · V2-D28" title="Date / time picker (booking flow)">
          <DateTimePickerDemo />
        </Section>

        {/* LOGO */}
        <Section eyebrow="Logo" meta="V2-D27 · 4 sizes" title="Logo (Solen wordmark)">
          <Grid cols={2}>
            <Card tag="light tone (white substrate)">
              <div className="flex flex-col gap-8">
                <div className="flex items-baseline gap-2">
                  <Logo size="xl" />
                  <span className="text-s-ink-3 text-[12px] tracking-[0.16em] uppercase font-semibold">xl · 64px</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <Logo size="lg" />
                  <span className="text-s-ink-3 text-[12px] tracking-[0.16em] uppercase font-semibold">lg · 40px</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <Logo size="md" />
                  <span className="text-s-ink-3 text-[12px] tracking-[0.16em] uppercase font-semibold">md · 28px (default)</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <Logo size="sm" />
                  <span className="text-s-ink-3 text-[12px] tracking-[0.16em] uppercase font-semibold">sm · 18px</span>
                </div>
              </div>
            </Card>

            <Card tag="dark tone (ink-1 substrate)">
              <div className="bg-s-ink rounded-xl p-8 flex flex-col gap-8">
                <div className="flex items-baseline gap-2">
                  <Logo size="xl" tone="dark" />
                </div>
                <div className="flex items-baseline gap-2">
                  <Logo size="lg" tone="dark" />
                </div>
                <div className="flex items-baseline gap-2">
                  <Logo size="md" tone="dark" />
                </div>
                <div className="flex items-baseline gap-2">
                  <Logo size="sm" tone="dark" />
                </div>
              </div>
            </Card>

            <Card tag="in app-header context">
              <div className="bg-white border border-s-ink/10 rounded-xl px-6 py-4 flex items-center justify-between">
                <Logo size="md" />
                <div className="flex items-center gap-4 text-[14px] text-s-ink-2 font-medium">
                  <span>Entdecken</span>
                  <span>Städte</span>
                  <button className="bg-s-brand text-white px-4 py-2 rounded-full font-semibold text-[14px]">Anmelden</button>
                </div>
              </div>
            </Card>

            <Card tag="without dot accent (alt)">
              <Logo size="lg" noDot />
              <p className="font-body text-[13px] text-s-ink-3 mt-2">
                Use <code className="bg-s-bg-sunken px-1.5 py-0.5 rounded">noDot</code> prop for contexts where the dot
                competes with adjacent UI (e.g. inside a button, next to other dots).
              </p>
            </Card>
          </Grid>
        </Section>

        {/* FOOT */}
        <footer className="mt-24 pt-6 border-t border-s-ink flex justify-between font-body text-[13px] uppercase tracking-[0.16em] text-s-ink-3 tabular-nums">
          <span>Solen V3 · Phase 0 · §F.1 + §F.2 + §F.3 + §F.4 React · /dev/primitives</span>
          <span>2026-05-09 · V2-D20</span>
        </footer>
      </div>
    </div>
  );
}

/* ============================== local layout helpers ============================== */

function Section({
  eyebrow,
  meta,
  title,
  children,
}: {
  eyebrow: string;
  meta: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <div className="h-px bg-s-ink mb-3.5" />
      <div className="flex items-baseline justify-between gap-4 mb-3 font-body font-bold text-[13px] uppercase tracking-[0.18em] tabular-nums">
        <span className="text-s-ink inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-s-brand" />
          {eyebrow}
        </span>
        <span className="text-s-ink-3">{meta}</span>
      </div>
      <h2 className="font-display font-black text-[36px] leading-none tracking-[-0.02em] text-s-ink mb-4">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Grid({ cols, children }: { cols: 2 | 3; children: React.ReactNode }) {
  return (
    <div
      className={
        "grid gap-[18px] " +
        (cols === 3
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 lg:grid-cols-2")
      }
    >
      {children}
    </div>
  );
}

function Card({ tag, children }: { tag: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-s-ink/[0.06] rounded-2xl p-[22px] flex flex-col gap-1.5">
      <div className="font-body font-bold text-[11px] uppercase tracking-[0.16em] text-s-ink-3 mb-3.5">
        {tag}
      </div>
      {children}
    </div>
  );
}

function DateTimePickerDemo() {
  const [pickerValue, setPickerValue] = React.useState<DateTimeValue>({ date: null, time: null });

  // Fake slots — 3 different scenarios based on selected date weekday
  const slots = React.useMemo<TimeSlot[]>(() => {
    if (!pickerValue.date) return [];
    const day = pickerValue.date.day;
    // No availability on dates ending in 0 or 5 (demo: simulate fully-booked days)
    if (day % 5 === 0) return [];
    return [
      { time: "09:00", available: true },
      { time: "09:30", available: true },
      { time: "10:00", available: true },
      { time: "10:30", available: true },
      { time: "11:00", available: false },
      { time: "11:30", available: true },
      { time: "13:00", available: true },
      { time: "13:30", available: true },
      { time: "14:00", available: false },
      { time: "14:30", available: true },
      { time: "15:00", available: true },
      { time: "15:30", available: true },
      { time: "16:00", available: true },
      { time: "16:30", available: true },
      { time: "17:00", available: true },
      { time: "17:30", available: true },
      { time: "18:00", available: false },
    ];
  }, [pickerValue.date]);

  // Disable some dates as "salon closed" demo
  const isDateDisabled = React.useCallback((date: import("@internationalized/date").CalendarDate) => {
    // Sundays are closed (Sunday = 7 in DE locale, or 0 in JS)
    return date.toDate(getLocalTimeZone()).getDay() === 0;
  }, []);

  return (
    <Grid cols={2}>
      <Card tag="date-and-time · default · live">
        <p className="font-body text-[14px] text-s-ink-2 mb-4">
          Pick a date (Sundays closed, dates ending in 0/5 fully-booked). Time slots update live.
          Selected: <strong className="text-s-ink">{pickerValue.date?.toString() ?? "(none)"}</strong>
          {pickerValue.time && <> at <strong className="text-s-ink">{pickerValue.time}</strong></>}
        </p>
        <DateTimePicker
          value={pickerValue}
          onChange={setPickerValue}
          slots={slots}
          isDateDisabled={isDateDisabled}
          minDate={today(getLocalTimeZone())}
        />
      </Card>

      <Card tag="single-date · no time slots">
        <p className="font-body text-[14px] text-s-ink-2 mb-4">
          Used in search filter "verfügbar am" + B2B closed-day toggle.
        </p>
        <DateTimePicker
          value={pickerValue}
          onChange={setPickerValue}
          variant="single-date"
          minDate={today(getLocalTimeZone())}
        />
      </Card>
    </Grid>
  );
}

function ToastDemo() {
  const toast = useToast();

  return (
    <Grid cols={2}>
      <Card tag="4 tones · click to fire">
        <p className="font-body text-[14px] text-s-ink-2 mb-3">
          Click each button to fire that tone. Hover the toast to pause auto-dismiss timer.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              toast.success({
                title: "Look gespeichert",
                description: "Long Bob mit Highlights ist jetzt in deinem Mein-Look-Board.",
                action: "Anzeigen",
                onAction: () => alert("Navigate to Mein-Look-Board"),
              })
            }
            className="font-body font-semibold text-[14px] px-4 py-2.5 rounded-full bg-s-success text-white hover:opacity-90 transition-opacity"
          >
            Success
          </button>
          <button
            type="button"
            onClick={() =>
              toast.info({
                title: "3 neue Salons in Basel",
                description: "Schau sie dir in deinem Feed an.",
              })
            }
            className="font-body font-semibold text-[14px] px-4 py-2.5 rounded-full bg-s-brand text-white hover:bg-s-brand-mid transition-colors"
          >
            Info
          </button>
          <button
            type="button"
            onClick={() =>
              toast.warning({
                title: "Internetverbindung instabil",
                description: "Deine Buchung wird gespeichert sobald die Verbindung zurück ist.",
              })
            }
            className="font-body font-semibold text-[14px] px-4 py-2.5 rounded-full bg-s-warning text-white hover:opacity-90 transition-opacity"
          >
            Warning
          </button>
          <button
            type="button"
            onClick={() =>
              toast.error({
                title: "Buchung fehlgeschlagen",
                description: "Der Termin wurde inzwischen gebucht. Wähle einen anderen Slot.",
                action: "Erneut versuchen",
                onAction: () => alert("Retry booking"),
              })
            }
            className="font-body font-semibold text-[14px] px-4 py-2.5 rounded-full bg-s-error text-white hover:opacity-90 transition-opacity"
          >
            Error (sticky)
          </button>
        </div>
      </Card>

      <Card tag="stacking demo · max 3 visible">
        <p className="font-body text-[14px] text-s-ink-2 mb-3">
          Click "Fire 5" to queue 5 toasts. Watch as 4th + 5th wait until visible slots open.
          Errors take priority — a fresh error replaces the oldest non-error.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              toast.success({ title: "Toast 1" });
              toast.info({ title: "Toast 2" });
              toast.success({ title: "Toast 3" });
              setTimeout(() => toast.warning({ title: "Toast 4 (queued)" }), 100);
              setTimeout(() => toast.success({ title: "Toast 5 (queued)" }), 200);
            }}
            className="font-body font-semibold text-[14px] px-4 py-2.5 rounded-full bg-s-ink text-white hover:opacity-90 transition-opacity"
          >
            Fire 5 (queue 2)
          </button>
          <button
            type="button"
            onClick={() => {
              toast.success({ title: "Mit Aktion", action: "Rückgängig", onAction: () => alert("Undone") });
            }}
            className="font-body font-semibold text-[14px] px-4 py-2.5 rounded-full bg-s-bg-base text-s-ink border border-s-ink/10 hover:bg-s-bg-sunken transition-colors"
          >
            With action
          </button>
          <button
            type="button"
            onClick={() => {
              toast.success({ title: "Title only — no description" });
            }}
            className="font-body font-semibold text-[14px] px-4 py-2.5 rounded-full bg-s-bg-base text-s-ink border border-s-ink/10 hover:bg-s-bg-sunken transition-colors"
          >
            Title only
          </button>
          <button
            type="button"
            onClick={() => {
              toast.dismissAll();
            }}
            className="font-body font-semibold text-[14px] px-4 py-2.5 rounded-full bg-s-bg-base text-s-ink-3 border border-s-ink/10 hover:text-s-ink transition-colors"
          >
            Dismiss all
          </button>
        </div>
      </Card>
    </Grid>
  );
}
