// exists-check: net-new re-export inside this candidate's own folder, not a new helper. The real
// cover-photo-swap logic already exists one round back on the confirmation RULE view; this file
// only re-exports it so every .tsx file in this folder can import it without repeating that
// folder's own path string. Purely a barrel, no new decision.
export { getAlternateCoverPhoto } from "../../../directions-0905-r2/confirmation/_rule/getAlternateCoverPhoto";
