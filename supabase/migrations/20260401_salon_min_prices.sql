-- Migration M2: salon_min_prices materialized view
-- Used by the price sort option on category pages and future price range filter

CREATE MATERIALIZED VIEW IF NOT EXISTS salon_min_prices AS
SELECT
  salon_id,
  MIN(price) AS min_price,
  COUNT(*) AS service_count
FROM services
WHERE is_active = true
GROUP BY salon_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_salon_min_prices_salon_id ON salon_min_prices (salon_id);

-- Refresh function (called by trigger or scheduled job)
CREATE OR REPLACE FUNCTION refresh_salon_min_prices()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY salon_min_prices;
  RETURN NULL;
END;
$$;

-- Trigger: refresh when a service price changes
DROP TRIGGER IF EXISTS trg_refresh_salon_min_prices ON services;
CREATE TRIGGER trg_refresh_salon_min_prices
  AFTER INSERT OR UPDATE OF price OR DELETE ON services
  FOR EACH STATEMENT
  EXECUTE FUNCTION refresh_salon_min_prices();
