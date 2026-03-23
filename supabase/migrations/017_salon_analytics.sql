-- Migration 017: Salon analytics tables
-- Creates salon_analytics (aggregated nightly) and salon_page_views (real-time)

CREATE TABLE IF NOT EXISTS salon_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_bookings INT DEFAULT 0,
  total_revenue NUMERIC(10,2) DEFAULT 0,
  unique_customers INT DEFAULT 0,
  avg_booking_price NUMERIC(10,2) DEFAULT 0,
  new_customers INT DEFAULT 0,
  returning_customers INT DEFAULT 0,
  cancellation_count INT DEFAULT 0,
  cancellation_rate NUMERIC(5,2) DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INT DEFAULT 0,
  most_popular_service TEXT,
  most_popular_time TEXT,
  last_minute_bookings INT DEFAULT 0,
  last_minute_conversion_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS salon_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT -- 'category_page', 'search', 'direct', 'last_minute'
);

CREATE INDEX IF NOT EXISTS idx_page_views_salon ON salon_page_views(salon_id, viewed_at);
CREATE INDEX IF NOT EXISTS idx_salon_analytics_salon ON salon_analytics(salon_id, period_start);
