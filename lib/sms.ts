// Stub SMS utility — full implementation planned in roadmap R10
export async function sendSMS(to: string, message: string): Promise<{ success: boolean }> {
  console.log(`[sms] stub: would send to ${to}: ${message.slice(0, 50)}...`);
  return { success: true };
}
