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
    { question_key: "current_nail_state", question_de: "Aktueller Nagelzustand", question_en: "Current nail condition", type: "select", options: ["natural_healthy", "natural_damaged", "gel_existing", "acrylic_existing", "biab_existing", "growing_out"] },
    { question_key: "previous_treatments", question_de: "Bisherige Nagelbehandlungen?", question_en: "Previous nail treatments?", type: "text" },
    { question_key: "nail_type", question_de: "Gewünschtes Material", question_en: "Desired material", type: "select", options: ["natural", "gel", "acrylic", "dip_powder", "biab", "shellac", "polygel", "press_on", "gel_x"] },
    { question_key: "desired_shape", question_de: "Gewünschte Form", question_en: "Desired shape", type: "select", options: ["round", "square", "almond", "coffin", "stiletto", "oval", "squoval", "ballerina", "lipstick", "edge"] },
    { question_key: "preferred_length", question_de: "Bevorzugte Länge", question_en: "Preferred length", type: "select", options: ["natural", "short", "medium", "long", "extra_long"] },
    { question_key: "style_inspiration", question_de: "Stil-Inspiration (z.B. French, Chrome, 3D Art)", question_en: "Style inspiration (e.g. French, Chrome, 3D Art)", type: "text" },
    { question_key: "color_preferences", question_de: "Farbwünsche", question_en: "Color preferences", type: "text" },
    { question_key: "nail_conditions", question_de: "Nagelschäden oder -erkrankungen?", question_en: "Nail damage or conditions?", type: "text" },
    { question_key: "allergies", question_de: "Allergien gegen Nagelmaterialien? (z.B. Acryl, Formaldehyd, Toluol)", question_en: "Allergies to nail materials? (e.g. acrylic, formaldehyde, toluene)", type: "text" },
    { question_key: "allergy_severity", question_de: "Allergieschwere", question_en: "Allergy severity", type: "select", options: ["none", "mild", "moderate", "severe"] },
    { question_key: "skin_sensitivity", question_de: "Hautempfindlichkeit rund um die Nägel", question_en: "Skin sensitivity around nails", type: "select", options: ["normal", "sensitive", "very_sensitive"] },
    { question_key: "cuticle_care", question_de: "Nagelpflege-Routine?", question_en: "Cuticle care routine?", type: "text" },
    { question_key: "lifestyle_factors", question_de: "Handbeanspruchung (Handarbeit, Sport, Tippen)?", question_en: "Hand strain (manual work, sports, typing)?", type: "text" },
    { question_key: "gel_removal_history", question_de: "Gel-Entfernung in der Vergangenheit?", question_en: "Gel removal history?", type: "select", options: ["never", "professional", "self_removed", "peeled_off"] },
    { question_key: "preferred_finish", question_de: "Bevorzugtes Finish", question_en: "Preferred finish", type: "select", options: ["glossy", "matte", "shimmer", "chrome", "velvet"] },
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
  barber_consultation: [
    { question_key: "hair_type", question_de: "Haartyp", question_en: "Hair type", type: "select", options: ["straight", "wavy", "curly", "coily", "thin", "thick"] },
    { question_key: "current_style", question_de: "Aktueller Stil", question_en: "Current style", type: "text" },
    { question_key: "desired_style", question_de: "Gewünschter Stil", question_en: "Desired style", type: "text" },
    { question_key: "fade_preference", question_de: "Fade-Präferenz", question_en: "Fade preference", type: "select", options: ["skin", "low", "mid", "high", "taper", "drop", "temp", "burst", "none"] },
    { question_key: "side_preference", question_de: "Seiten-Länge (Clipper Guard #)", question_en: "Side length (clipper guard #)", type: "select", options: ["0", "0.5", "1", "1.5", "2", "3", "4", "scissors"] },
    { question_key: "top_preference", question_de: "Oben-Stil", question_en: "Top style", type: "select", options: ["scissors", "textured", "slicked_back", "pompadour", "crew", "buzz", "flat_top", "mohawk", "freeform", "other"] },
    { question_key: "lineup_preference", question_de: "Lineup/Edge-Up gewünscht?", question_en: "Lineup/edge-up desired?", type: "boolean" },
    { question_key: "beard_care", question_de: "Bartpflege", question_en: "Beard care", type: "select", options: ["full_shape", "trim", "sculpt", "shave", "goatee", "stubble", "none"] },
    { question_key: "product_preference", question_de: "Produktpräferenz (Pomade, Wachs, etc.)", question_en: "Product preference (pomade, wax, etc.)", type: "text" },
    { question_key: "scalp_conditions", question_de: "Kopfhautprobleme?", question_en: "Scalp conditions?", type: "text" },
  ],
  spa_consultation: [
    { question_key: "health_conditions", question_de: "Gesundheitliche Einschränkungen?", question_en: "Health conditions?", type: "text" },
    { question_key: "pressure_preference", question_de: "Druckpräferenz", question_en: "Pressure preference", type: "select", options: ["light", "medium", "firm", "deep"] },
    { question_key: "focus_areas", question_de: "Problembereiche?", question_en: "Focus areas?", type: "text" },
    { question_key: "pregnant", question_de: "Schwangerschaft?", question_en: "Pregnancy?", type: "boolean" },
    { question_key: "recent_surgery", question_de: "Kürzliche Operationen?", question_en: "Recent surgery?", type: "text" },
  ],
};
