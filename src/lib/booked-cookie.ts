import { EVENT_CONFIG } from "../core/config/event.ts";

export const BOOKED_COOKIE = "booking-ref";

const MS_PER_MINUTE = 60_000;

export function bookedCookieExpiry(): Date {
  const [year, month, day] = EVENT_CONFIG.date.split("-").map(Number);
  const endOfEventDayUtc =
    Date.UTC(year, month - 1, day + 1) -
    EVENT_CONFIG.utcOffsetMinutes * MS_PER_MINUTE;
  return new Date(endOfEventDayUtc);
}
