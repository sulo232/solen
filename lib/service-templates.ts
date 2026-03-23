export interface ServiceTemplate {
  name_de: string;
  name_en: string;
  name_fr: string;
  name_it: string;
  duration: number; // minutes
  price: number;    // CHF
  category: string;
}

export const serviceTemplates: Record<string, ServiceTemplate[]> = {
  barbershop: [
    { name_de: "Herrenschnitt", name_en: "Men's Haircut", name_fr: "Coupe homme", name_it: "Taglio uomo", duration: 30, price: 40, category: "barbershop" },
    { name_de: "Bart Trim", name_en: "Beard Trim", name_fr: "Taille de barbe", name_it: "Rifinitura barba", duration: 15, price: 20, category: "barbershop" },
    { name_de: "Fade + Bart Kombi", name_en: "Fade + Beard Combo", name_fr: "Dégradé + barbe", name_it: "Sfumatura + barba", duration: 45, price: 55, category: "barbershop" },
    { name_de: "Heisses Handtuch Rasur", name_en: "Hot Towel Shave", name_fr: "Rasage serviette chaude", name_it: "Rasatura asciugamano caldo", duration: 30, price: 45, category: "barbershop" },
    { name_de: "Kopf rasieren", name_en: "Head Shave", name_fr: "Rasage crâne", name_it: "Rasatura testa", duration: 20, price: 30, category: "barbershop" },
    { name_de: "Augenbrauen zupfen", name_en: "Eyebrow Grooming", name_fr: "Épilation sourcils", name_it: "Sistemazione sopracciglia", duration: 10, price: 15, category: "barbershop" },
    { name_de: "Kinder Haarschnitt", name_en: "Kids Haircut", name_fr: "Coupe enfant", name_it: "Taglio bambino", duration: 20, price: 25, category: "barbershop" },
    { name_de: "Waschen + Schneiden + Styling", name_en: "Wash + Cut + Style", name_fr: "Shampooing + coupe + coiffage", name_it: "Lavaggio + taglio + styling", duration: 45, price: 55, category: "barbershop" },
  ],
  coiffeur: [
    { name_de: "Waschen, Schneiden, Föhnen (Damen)", name_en: "Wash, Cut, Blow-Dry (Women)", name_fr: "Shampooing, coupe, brushing (femmes)", name_it: "Lavaggio, taglio, piega (donna)", duration: 60, price: 85, category: "coiffeur" },
    { name_de: "Waschen, Schneiden, Föhnen (Herren)", name_en: "Wash, Cut, Blow-Dry (Men)", name_fr: "Shampooing, coupe, brushing (hommes)", name_it: "Lavaggio, taglio, piega (uomo)", duration: 30, price: 45, category: "coiffeur" },
    { name_de: "Balayage", name_en: "Balayage", name_fr: "Balayage", name_it: "Balayage", duration: 120, price: 180, category: "coiffeur" },
    { name_de: "Strähnen (Folien)", name_en: "Highlights (Foils)", name_fr: "Mèches (papier)", name_it: "Colpi di sole (carta stagnola)", duration: 90, price: 150, category: "coiffeur" },
    { name_de: "Komplett Färbung", name_en: "Full Color", name_fr: "Coloration complète", name_it: "Colorazione completa", duration: 90, price: 120, category: "coiffeur" },
    { name_de: "Olaplex Behandlung", name_en: "Olaplex Treatment", name_fr: "Traitement Olaplex", name_it: "Trattamento Olaplex", duration: 30, price: 50, category: "coiffeur" },
    { name_de: "Hochsteckfrisur", name_en: "Updo / Special Occasion", name_fr: "Chignon / occasion spéciale", name_it: "Acconciatura / occasione speciale", duration: 60, price: 90, category: "coiffeur" },
    { name_de: "Kinderhaarschnitt", name_en: "Kids Haircut", name_fr: "Coupe enfant", name_it: "Taglio bambino", duration: 30, price: 35, category: "coiffeur" },
  ],
  nails: [
    { name_de: "Maniküre Klassisch", name_en: "Classic Manicure", name_fr: "Manucure classique", name_it: "Manicure classica", duration: 30, price: 40, category: "nails" },
    { name_de: "Maniküre mit Gel", name_en: "Gel Manicure", name_fr: "Manucure gel", name_it: "Manicure gel", duration: 45, price: 55, category: "nails" },
    { name_de: "Pediküre Klassisch", name_en: "Classic Pedicure", name_fr: "Pédicure classique", name_it: "Pedicure classica", duration: 45, price: 50, category: "nails" },
    { name_de: "Acryl Nagelverlängerung", name_en: "Acrylic Nail Extensions", name_fr: "Extensions ongles acrylique", name_it: "Estensioni unghie acrilico", duration: 90, price: 90, category: "nails" },
    { name_de: "Gel Auffüllung", name_en: "Gel Refill", name_fr: "Remplissage gel", name_it: "Ricostruzione gel", duration: 60, price: 65, category: "nails" },
    { name_de: "Nail Art (pro Nagel)", name_en: "Nail Art (per nail)", name_fr: "Nail art (par ongle)", name_it: "Nail art (per unghia)", duration: 10, price: 8, category: "nails" },
    { name_de: "Shellac Entfernung", name_en: "Shellac Removal", name_fr: "Retrait Shellac", name_it: "Rimozione Shellac", duration: 15, price: 15, category: "nails" },
    { name_de: "Mani + Pedi Kombi", name_en: "Mani + Pedi Combo", name_fr: "Manucure + pédicure combo", name_it: "Manicure + pedicure combo", duration: 75, price: 80, category: "nails" },
  ],
  spa: [
    { name_de: "Gesichtsbehandlung Klassisch", name_en: "Classic Facial", name_fr: "Soin du visage classique", name_it: "Trattamento viso classico", duration: 60, price: 90, category: "spa" },
    { name_de: "Rückenmassage", name_en: "Back Massage", name_fr: "Massage du dos", name_it: "Massaggio schiena", duration: 30, price: 60, category: "spa" },
    { name_de: "Ganzkörpermassage", name_en: "Full Body Massage", name_fr: "Massage complet", name_it: "Massaggio completo", duration: 60, price: 100, category: "spa" },
    { name_de: "Hot Stone Massage", name_en: "Hot Stone Massage", name_fr: "Massage pierres chaudes", name_it: "Massaggio pietre calde", duration: 60, price: 110, category: "spa" },
    { name_de: "Microneedling", name_en: "Microneedling", name_fr: "Microneedling", name_it: "Microneedling", duration: 45, price: 120, category: "spa" },
    { name_de: "Chemisches Peeling", name_en: "Chemical Peel", name_fr: "Peeling chimique", name_it: "Peeling chimico", duration: 30, price: 80, category: "spa" },
    { name_de: "Anti-Aging Behandlung", name_en: "Anti-Aging Treatment", name_fr: "Traitement anti-âge", name_it: "Trattamento anti-età", duration: 75, price: 140, category: "spa" },
    { name_de: "Lymphdrainage", name_en: "Lymphatic Drainage", name_fr: "Drainage lymphatique", name_it: "Drenaggio linfatico", duration: 60, price: 95, category: "spa" },
  ],
  makeup: [
    { name_de: "Tages-Makeup", name_en: "Day Makeup", name_fr: "Maquillage jour", name_it: "Trucco giorno", duration: 30, price: 50, category: "makeup" },
    { name_de: "Abend-Makeup", name_en: "Evening Makeup", name_fr: "Maquillage soirée", name_it: "Trucco sera", duration: 45, price: 70, category: "makeup" },
    { name_de: "Braut-Makeup", name_en: "Bridal Makeup", name_fr: "Maquillage mariée", name_it: "Trucco sposa", duration: 90, price: 180, category: "makeup" },
    { name_de: "Wimpernverlängerung", name_en: "Lash Extensions", name_fr: "Extensions cils", name_it: "Estensioni ciglia", duration: 90, price: 150, category: "makeup" },
    { name_de: "Wimpern Lifting", name_en: "Lash Lift", name_fr: "Rehaussement cils", name_it: "Laminazione ciglia", duration: 45, price: 65, category: "makeup" },
    { name_de: "Augenbrauen Microblading", name_en: "Eyebrow Microblading", name_fr: "Microblading sourcils", name_it: "Microblading sopracciglia", duration: 120, price: 350, category: "makeup" },
    { name_de: "Makeup Beratung", name_en: "Makeup Consultation", name_fr: "Consultation maquillage", name_it: "Consulenza trucco", duration: 30, price: 40, category: "makeup" },
    { name_de: "Wimpern Auffüllung", name_en: "Lash Refill", name_fr: "Remplissage cils", name_it: "Ricostruzione ciglia", duration: 60, price: 80, category: "makeup" },
  ],
  waxing: [
    { name_de: "Beine komplett", name_en: "Full Legs", name_fr: "Jambes complètes", name_it: "Gambe intere", duration: 30, price: 50, category: "waxing" },
    { name_de: "Bikinizone", name_en: "Bikini Line", name_fr: "Maillot classique", name_it: "Inguine classico", duration: 15, price: 25, category: "waxing" },
    { name_de: "Brazilian Waxing", name_en: "Brazilian Wax", name_fr: "Épilation brésilienne", name_it: "Ceretta brasiliana", duration: 30, price: 45, category: "waxing" },
    { name_de: "Achseln", name_en: "Underarms", name_fr: "Aisselles", name_it: "Ascelle", duration: 10, price: 15, category: "waxing" },
    { name_de: "Oberlippe", name_en: "Upper Lip", name_fr: "Lèvre supérieure", name_it: "Labbro superiore", duration: 10, price: 12, category: "waxing" },
    { name_de: "Rücken (Herren)", name_en: "Back (Men)", name_fr: "Dos (hommes)", name_it: "Schiena (uomini)", duration: 30, price: 45, category: "waxing" },
    { name_de: "Ganzkörper Paket", name_en: "Full Body Package", name_fr: "Forfait corps entier", name_it: "Pacchetto corpo intero", duration: 90, price: 140, category: "waxing" },
    { name_de: "Augenbrauen Waxing", name_en: "Eyebrow Wax", name_fr: "Épilation sourcils", name_it: "Ceretta sopracciglia", duration: 10, price: 15, category: "waxing" },
  ],
};

/** Duration options for the dropdown in minutes */
export const DURATION_OPTIONS = [10, 15, 20, 30, 45, 60, 75, 90, 120, 150, 180];
