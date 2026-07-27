// Current T&S version string. Update this when publishing new T&S.
// Format: YYYY-MM-DD-vN
//
// 2026-07-27-v2: added section 8.2a, rights of depicted persons. The uploader now warrants
// they hold the rights, must have the depicted person's prior consent INCLUDING for
// advertising use, must keep a record of it, and solen.ch commits to removing a reported
// image within 48 hours, no questions asked and no proof of identity required. The licence in
// 8.2 is unchanged , it was already the industry standard. What was missing was the chain of
// permission behind it, which matters here because a salon photo is usually a photo of a
// client who never agreed to anything.
//
// BUMPING THIS IS NOT COSMETIC: profiles.tos_accepted_version records what each user actually
// agreed to, so leaving it at v1 would have recorded every existing user as having accepted a
// clause that did not exist when they signed up. A new promise needs a new acceptance.
export const CURRENT_TOS_VERSION = "2026-07-27-v2";

// Human-readable effective date for display
export const TOS_EFFECTIVE_DATE = "27. Juli 2026 / 27 July 2026";
