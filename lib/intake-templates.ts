export interface IntakeQuestion {
  question_key: string;
  question_de: string;
  question_en: string;
  type: "text" | "select" | "boolean";
  options?: string[];
}

export const INTAKE_TEMPLATES: Record<string, IntakeQuestion[]> = {
  hair_consultation: [
    { question_key: "current_color", question_de: "Aktuelle Haarfarbe", question_en: "Current hair color", type: "text" },
    { question_key: "desired_result", question_de: "Gewünschtes Ergebnis", question_en: "Desired result", type: "text" },
    { question_key: "chemical_treatments", question_de: "Chemische Behandlungen in den letzten 6 Monaten?", question_en: "Chemical treatments in the last 6 months?", type: "text" },
    { question_key: "allergies", question_de: "Allergien oder Empfindlichkeiten?", question_en: "Allergies or sensitivities?", type: "text" },
    { question_key: "scalp_condition", question_de: "Kopfhautzustand", question_en: "Scalp condition", type: "select", options: ["normal", "dry", "oily", "sensitive", "dandruff"] },
    { question_key: "heat_styling", question_de: "Regelmässiges Hitze-Styling?", question_en: "Regular heat styling?", type: "boolean" },
    { question_key: "hair_goals", question_de: "Haarziele (Wachstum, Volumen, Gesundheit...)", question_en: "Hair goals (growth, volume, health...)", type: "text" },
  ],
  nail_consultation: [
    { question_key: "nail_type", question_de: "Nageltyp", question_en: "Nail type", type: "select", options: ["natural", "gel", "acrylic", "dip_powder"] },
    { question_key: "desired_shape", question_de: "Gewünschte Form", question_en: "Desired shape", type: "select", options: ["round", "square", "almond", "coffin", "stiletto", "oval"] },
    { question_key: "nail_conditions", question_de: "Nagelprobleme?", question_en: "Nail conditions?", type: "text" },
    { question_key: "allergies", question_de: "Allergien gegen Nagelmaterialien?", question_en: "Allergies to nail materials?", type: "text" },
    { question_key: "preferred_length", question_de: "Bevorzugte Länge", question_en: "Preferred length", type: "select", options: ["short", "medium", "long", "extra_long"] },
  ],
  waxing_consultation: [
    { question_key: "skin_type", question_de: "Hauttyp", question_en: "Skin type", type: "select", options: ["normal", "sensitive", "dry", "oily"] },
    { question_key: "previous_waxing", question_de: "Erfahrung mit Waxing?", question_en: "Previous waxing experience?", type: "boolean" },
    { question_key: "medications", question_de: "Aktuelle Medikamente (z.B. Retinol)?", question_en: "Current medications (e.g., retinol)?", type: "text" },
    { question_key: "skin_conditions", question_de: "Hautprobleme im Behandlungsbereich?", question_en: "Skin conditions in treatment area?", type: "text" },
    { question_key: "sun_exposure", question_de: "Kürzliche Sonneneinstrahlung?", question_en: "Recent sun exposure?", type: "boolean" },
  ],
  makeup_consultation: [
    { question_key: "skin_type", question_de: "Hauttyp", question_en: "Skin type", type: "select", options: ["normal", "dry", "oily", "combination", "sensitive"] },
    { question_key: "occasion", question_de: "Anlass", question_en: "Occasion", type: "select", options: ["everyday", "wedding", "party", "photoshoot", "other"] },
    { question_key: "style_preference", question_de: "Stilpräferenz", question_en: "Style preference", type: "select", options: ["natural", "glam", "editorial", "classic", "bold"] },
    { question_key: "allergies", question_de: "Allergien gegen Kosmetikprodukte?", question_en: "Allergies to cosmetic products?", type: "text" },
    { question_key: "reference_photos", question_de: "Referenzbilder vorhanden?", question_en: "Reference photos available?", type: "boolean" },
  ],
  spa_consultation: [
    { question_key: "health_conditions", question_de: "Gesundheitliche Einschränkungen?", question_en: "Health conditions?", type: "text" },
    { question_key: "pressure_preference", question_de: "Druckpräferenz", question_en: "Pressure preference", type: "select", options: ["light", "medium", "firm", "deep"] },
    { question_key: "focus_areas", question_de: "Problembereiche?", question_en: "Focus areas?", type: "text" },
    { question_key: "pregnant", question_de: "Schwangerschaft?", question_en: "Pregnancy?", type: "boolean" },
    { question_key: "recent_surgery", question_de: "Kürzliche Operationen?", question_en: "Recent surgery?", type: "text" },
  ],
};
