-- V3-D387: seed descriptive salon amenities so the filter facets return varied,
-- meaningful results. The boolean columns already existed (kid_friendly,
-- wheelchair_accessible, …) but were unpopulated (≈1 salon each), so the amenity
-- filters returned almost nothing.
--
-- Deterministic (hashtext of id + a per-amenity salt) => IDEMPOTENT: re-running on a
-- db reset reproduces the exact same distribution, so seeded demo data survives.
-- Functional flags (accepts_online_payment, instant_booking_enabled) are intentionally
-- NOT touched here — those gate real behaviour, not cosmetic facets.

update salons set
  wheelchair_accessible = abs(hashtext(id::text || 'wheel'))   % 100 < 45,
  near_public_transport = abs(hashtext(id::text || 'transit')) % 100 < 70,
  kid_friendly          = abs(hashtext(id::text || 'kid'))     % 100 < 40,
  pet_friendly          = abs(hashtext(id::text || 'pet'))     % 100 < 30,
  wifi_friendly         = abs(hashtext(id::text || 'wifi'))    % 100 < 78,
  lgbtq_friendly        = abs(hashtext(id::text || 'lgbtq'))   % 100 < 45,
  woman_owned           = abs(hashtext(id::text || 'woman'))   % 100 < 42,
  family_owned          = abs(hashtext(id::text || 'family'))  % 100 < 38,
  student_discount      = abs(hashtext(id::text || 'student')) % 100 < 50
where is_active;
