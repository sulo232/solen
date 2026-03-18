import { z } from "zod";

export const step1Schema = z.object({
  name: z.string().min(2, "Name muss mindestens 2 Zeichen haben").max(100),
  email: z.string().email("Ungültige E-Mail-Adresse"),
  categories: z.array(z.string()).min(1, "Wähle mindestens eine Kategorie"),
  quartier: z.string().min(1, "Wähle ein Quartier"),
  address: z.string().min(5, "Adresse ist zu kurz"),
});

export const step2Schema = z.object({
  cover_photo_url: z.string().url("Bitte lade ein Titelbild hoch"),
  description_de: z.string().min(20, "Beschreibung muss mindestens 20 Zeichen haben").max(500),
});

export const step3Schema = z.object({
  services: z.array(z.object({
    name_de: z.string().min(2),
    duration_minutes: z.number().min(5).max(480),
    price: z.number().min(0),
  })).min(1, "Füge mindestens einen Service hinzu"),
});

export const step4Schema = z.object({
  staff: z.array(z.object({
    name: z.string().min(1),
  })).min(1, "Füge mindestens ein Teammitglied hinzu"),
});

/** Validate data against a schema, returns field-level errors */
export function validateStep<T>(schema: z.ZodType<T>, data: unknown): Record<string, string> {
  const result = schema.safeParse(data);
  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
