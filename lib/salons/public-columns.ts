// Public (anonymous-safe) salons column allowlist. Replaces `.select('*')`, which shipped
// ALL ~98 salon columns to anonymous clients, including owner/payment internals
// (stripe_account_id, owner_id), the growing FTS doc (search_doc), the scoring jsonb
// (score_details), and moderation fields (verification_warnings, frozen_reason,
// rejection_reason, approved_by, warning_count, phone). This is exactly the set the salon
// cards + their downstream filters read (audited across SearchTemplate / SearchResults /
// SalonResultCard / SplitView / CityPage / RecentlyViewed / TreatmentsClient) plus common
// ordering columns (solen_score, average_rating, last_minute_discount_percent, created_at).
// Shared by every public salon-listing endpoint (app/api/salons, app/api/search/treatments,
// app/api/salons/trending). city_id + is_top_pick added Ring 2d (trending-route convergence):
// both are public-safe (a city grouping key + a boolean editorial flag), gate nothing sensitive.
// Never add search_doc / score_details / stripe_account_id / owner_id / phone /
// frozen_reason / rejection_reason / approved_by / warning_count / verification_warnings here.
export const SALON_PUBLIC_COLS =
  "id, slug, name, cover_photo_url, gallery_urls, categories, address, postal_code, quartier, latitude, longitude, opening_hours, average_rating, review_count, last_minute_discount_percent, walkin_enabled, accepts_online_payment, solen_score, created_at, city_id, is_top_pick";
