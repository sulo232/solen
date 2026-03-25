-- Migration to add dimension ratings to reviews table
-- Dimension scores: 1-5 (stars) for Ergebnis (Result), Atmosphäre (Atmosphere), and Preis-Leistung (Value)

ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS score_ergebnis INT CHECK (score_ergebnis >= 1 AND score_ergebnis <= 5),
ADD COLUMN IF NOT EXISTS score_atmosphaere INT CHECK (score_atmosphaere >= 1 AND score_atmosphaere <= 5),
ADD COLUMN IF NOT EXISTS score_preis_leistung INT CHECK (score_preis_leistung >= 1 AND score_preis_leistung <= 5);

-- Also add aggregated averages to the salons table to avoid calculating on the fly for every card
ALTER TABLE salons
ADD COLUMN IF NOT EXISTS avg_score_ergebnis DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_score_atmosphaere DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_score_preis_leistung DECIMAL(3,2) DEFAULT 0;
