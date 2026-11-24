import { EVENT_CONFIG } from "../core/config/event.ts";

export type Slot = { id: string; startMinutes: number };

const MINUTES_PER_HOUR = 60;
const MS_PER_MINUTE = 60_000;

function parseClock(clock: string): number {
  const [hours, minutes] = clock.split(":").map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
}

function formatClock(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildSlots(): readonly Slot[] {
  const step = EVENT_CONFIG.interviewMinutes + EVENT_CONFIG.gapMinutes;
  const slots: Slot[] = [];
  for (const [windowStart, windowEnd] of EVENT_CONFIG.windows) {
    const end = parseClock(windowEnd);
    for (
      let start = parseClock(windowStart);
      start + EVENT_CONFIG.interviewMinutes <= end;
      start += step
    ) {
      slots.push(
        Object.freeze({
          id: `${EVENT_CONFIG.date}T${formatClock(start)}`,
          startMinutes: start,
        }),
      );
    }
  }
  return Object.freeze(slots);
}

const SLOTS = buildSlots();
const SLOT_IDS: ReadonlySet<string> = new Set(SLOTS.map((slot) => slot.id));

export function generateSlots(): readonly Slot[] {
  return SLOTS;
}

export function isValidSlotId(id: string): boolean {
  return SLOT_IDS.has(id);
}

export function slotStartUtc(slot: Slot): Date {
  const [year, month, day] = EVENT_CONFIG.date.split("-").map(Number);
  const utcMinutes = slot.startMinutes - EVENT_CONFIG.utcOffsetMinutes;
  return new Date(Date.UTC(year, month - 1, day) + utcMinutes * MS_PER_MINUTE);
}

export function isSlotPast(slot: Slot, now: Date): boolean {
  return slotStartUtc(slot).getTime() <= now.getTime();
}
