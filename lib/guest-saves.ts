const STORAGE_KEY = "solen_discovery_saves";

export function getGuestSaves(): string[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

export function addGuestSave(itemId: string): void {
  const saves = getGuestSaves();
  if (!saves.includes(itemId)) { saves.push(itemId); localStorage.setItem(STORAGE_KEY, JSON.stringify(saves)); }
}

export function removeGuestSave(itemId: string): void {
  const saves = getGuestSaves().filter(id => id !== itemId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saves));
}

export function clearGuestSaves(): void {
  localStorage.removeItem(STORAGE_KEY);
}
