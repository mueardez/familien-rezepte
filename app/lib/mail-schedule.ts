export type MailSchedule = { weekday: number; time: string; enabled: boolean };
export const defaultMailSchedule: MailSchedule = { weekday: 5, time: "17:00", enabled: true };
export function normalizeMailSchedule(value: unknown): MailSchedule {
  if (!value || typeof value !== "object") throw new Error("Ungültiger Versandplan.");
  const schedule = value as MailSchedule;
  if (!Number.isInteger(schedule.weekday) || schedule.weekday < 0 || schedule.weekday > 6 || typeof schedule.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(schedule.time) || typeof schedule.enabled !== "boolean") throw new Error("Bitte einen gültigen Wochentag und eine Uhrzeit wählen.");
  return { weekday: schedule.weekday, time: schedule.time, enabled: schedule.enabled };
}
// Work in Swiss wall-clock time: UTC offsets and summer/winter time are handled by Intl.
export function duePollWeek(schedule: MailSchedule, now = new Date()): string | null {
  if (!schedule.enabled) return null;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now).map((part) => [part.type, part.value]));
  const wallNow = new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`);
  const occurrence = new Date(wallNow);
  occurrence.setUTCDate(occurrence.getUTCDate() - (occurrence.getUTCDay() - schedule.weekday + 7) % 7);
  const [hour, minute] = schedule.time.split(":").map(Number); occurrence.setUTCHours(hour, minute, 0, 0);
  if (occurrence > wallNow) occurrence.setUTCDate(occurrence.getUTCDate() - 7);
  // Retry missed/failed runs for 24 hours; never send an old week's invitation on installation.
  if (wallNow.valueOf() - occurrence.valueOf() >= 24 * 60 * 60 * 1000) return null;
  occurrence.setUTCDate(occurrence.getUTCDate() + (occurrence.getUTCDay() === 1 ? 7 : (8 - (occurrence.getUTCDay() || 7))));
  return occurrence.toISOString().slice(0, 10);
}
