import { createHmac } from "crypto";

/**
 * Token format: {salonId}:{customerId}:{cardId}:{hmac_16chars}
 * QR encodes URL: https://solen.ch/loyalty/stamp?token={token}
 */
export function generateLoyaltyQRToken(
  salonId: string,
  customerId: string,
  cardId: string,
  secret: string
): string {
  const payload = `${salonId}:${customerId}:${cardId}`;
  const hmac = createHmac("sha256", secret).update(payload).digest("hex").slice(0, 16);
  return `${payload}:${hmac}`;
}

export function verifyLoyaltyQRToken(
  token: string,
  secret: string
): { valid: boolean; salonId?: string; customerId?: string; cardId?: string } {
  const parts = token.split(":");
  if (parts.length !== 4) return { valid: false };
  const [salonId, customerId, cardId, hmac] = parts;
  const expected = createHmac("sha256", secret)
    .update(`${salonId}:${customerId}:${cardId}`)
    .digest("hex")
    .slice(0, 16);
  return hmac === expected
    ? { valid: true, salonId, customerId, cardId }
    : { valid: false };
}
