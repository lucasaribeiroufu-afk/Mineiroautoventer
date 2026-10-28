import type { ScheduleAvailability } from '../types';

export function workshopDate(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function workshopTomorrow(now = new Date()): string {
  const date = new Date(`${workshopDate(now)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
export async function fetchVerifiedAvailability(date: string, now = new Date(), request: typeof fetch = fetch): Promise<ScheduleAvailability> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || new Date(`${date}T12:00:00Z`).toISOString().slice(0,10) !== date) throw new Error('Selecione uma data válida.');
  const response = await request(`/api/schedule/availability?date=${encodeURIComponent(date)}`, { signal: AbortSignal.timeout(10000), cache: 'no-store' });
  if (!response.ok) throw new Error('Não foi possível consultar a agenda. Consulte a equipe pelo WhatsApp.');
  const data = await response.json();
  if (data.date !== date || typeof data.isOpen !== 'boolean' || !Array.isArray(data.slots) || !Number.isFinite(data.defaultCapacityPerSlot) || data.slots.some((slot: any) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(slot.time) || typeof slot.available !== 'boolean')) throw new Error('A agenda não retornou horários válidos. Consulte a equipe pelo WhatsApp.');
  const today = workshopDate(now);
  const currentTime = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const slots = data.slots.map((slot: any) => {
    const past = date < today || (date === today && slot.time <= currentTime);
    return { ...slot, available: slot.available && data.isOpen && !past, ...(past ? { reason: 'Horário já encerrado' } : {}) };
  });
  return { ...data, slots };
}
