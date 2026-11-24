import type { Locale } from "../core/i18n/routing.ts";
import type { Slot } from "./slots.ts";

const MINUTES_PER_HOUR = 60;
const HOURS_PER_HALF_DAY = 12;

const MERIDIEM = Object.freeze({
  en: Object.freeze({ am: "AM", pm: "PM" }),
  ar: Object.freeze({ am: "ص", pm: "م" }),
});

export function formatSlotTime(slot: Slot, locale: Locale): string {
  const hours24 = Math.floor(slot.startMinutes / MINUTES_PER_HOUR) % 24;
  const minutes = slot.startMinutes % MINUTES_PER_HOUR;
  const hours12 = hours24 % HOURS_PER_HALF_DAY || HOURS_PER_HALF_DAY;
  const marker = hours24 < HOURS_PER_HALF_DAY ? MERIDIEM[locale].am : MERIDIEM[locale].pm;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${marker}`;
}
