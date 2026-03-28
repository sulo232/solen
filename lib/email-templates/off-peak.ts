import type { EmailPayload, EmailLocale } from "../email";

export function offPeakAlert(
  to: string,
  data: {
    salonName: string;
    discountPercent: number;
    salonUrl: string;
  },
  locale: EmailLocale = "de"
): EmailPayload {
  const subjects = {
    de: `Dein Lieblingssalon ${data.salonName} hat Nebenzeiten — ${data.discountPercent}% Rabatt!`,
    en: `Your favorite salon ${data.salonName} added off-peak slots — ${data.discountPercent}% off!`,
    fr: `Votre salon préféré ${data.salonName} a des heures creuses — ${data.discountPercent}% de réduction !`,
    it: `Il tuo salone preferito ${data.salonName} ha orari non di punta — ${data.discountPercent}% di sconto!`,
  };

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1A1A2E;">
      <h2 style="color: #FF6B6B;">solen.ch</h2>
      <p>Hallo!</p>
      <p>Es gibt tolle Neuigkeiten für dich: <strong>${data.salonName}</strong> (einer deiner Favoriten) bietet ab sofort einen <strong>Nebenzeiten-Rabatt von ${data.discountPercent}%</strong> an!</p>
      <p>Sichere dir diesen Rabatt, indem du deinen Termin schnell während den Nebenzeiten buchst.</p>
      <div style="margin: 30px 0;">
        <a href="${data.salonUrl}" style="background-color: #38B2AC; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; display: inline-block;">
          Jetzt Termin sichern
        </a>
      </div>
      <p style="color: #666; font-size: 12px; margin-top: 40px;">
        Du erhältst diese E-Mail, weil du auf solen.ch Deal-Benachrichtigungen für deine Lieblingssalons aktiviert hast.
      </p>
    </div>
  `;

  return {
    to,
    subject: subjects[locale] || subjects.de,
    html: body,
  };
}
