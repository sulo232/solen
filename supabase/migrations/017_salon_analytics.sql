-- Migration 017: Salon analytics tables
-- Tracks aggregated booking metrics per salon per period,
-- plus individual page view events for conversion analysis.

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

CREATE INDEX IF NOT EXISTS idx_salon_analytics_salon ON salon_analytics(salon_id, period_start);

CREATE TABLE IF NOT EXISTS salon_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source TEXT -- 'category_page', 'search', 'direct', 'last_minute'
);

CREATE INDEX IF NOT EXISTS idx_page_views_salon ON salon_page_views(salon_id, viewed_at);

-- RLS: analytics readable by salon owner and admin
ALTER TABLE salon_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "salon_owner_read_analytics" ON salon_analytics
  FOR SELECT USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS: page views insertable by anyone (anonymous tracking), readable by owner/admin
ALTER TABLE salon_page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone_insert_page_view" ON salon_page_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "salon_owner_read_page_views" ON salon_page_views
  FOR SELECT USING (
    salon_id IN (SELECT id FROM salons WHERE owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
