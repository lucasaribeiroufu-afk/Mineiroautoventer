export interface SavedBooking { id: string; token: string; label: string }
const BOOKING_KEY = 'mineiro.private-bookings.v1';
export function savedBookings(): SavedBooking[] {
  try { return JSON.parse(localStorage.getItem(BOOKING_KEY) || '[]').filter((b: SavedBooking) => /^[A-Za-z0-9_-]{43}$/.test(b.token)); }
  catch { return []; }
}
export function rememberBooking(item: { id: string; clientToken?: string; preferredDate: string; serviceName: string }) {
  if (!item.clientToken) return;
  try {
    const list = savedBookings().filter(b => b.id !== item.id);
    localStorage.setItem(BOOKING_KEY, JSON.stringify([{ id: item.id, token: item.clientToken, label: item.serviceName + ' · ' + item.preferredDate }, ...list].slice(0,20)));
  } catch { /* The private link remains usable if storage is disabled. */ }
}
export function createClientToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export function createRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
  return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
}
export async function portalRequest(path: string, token?: string, body?: unknown, method?: string, ownerPassword?: string) {
  const response = await fetch(path, {
    method: method || (body === undefined ? 'GET' : 'POST'),
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}), ...(ownerPassword ? { 'x-admin-password': ownerPassword } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    cache: 'no-store', signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível consultar o atendimento.');
  return data;
}
export async function endpointHash(endpoint: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2,'0')).join('');
}
