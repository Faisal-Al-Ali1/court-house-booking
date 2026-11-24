import { EVENT_CONFIG } from "../core/config/event.ts";
import type { Locale } from "../core/i18n/routing.ts";
import { generateSlots, slotStartUtc } from "./slots.ts";

export type BuildIcsInput = {
  slotId: string;
  summary: string;
  location: string;
  locale: Locale;
  now?: Date;
};

const CRLF = "\r\n";
const MAX_LINE_OCTETS = 75;
const MS_PER_MINUTE = 60_000;
const UID_DOMAIN = "court-house-booking";

function formatUtc(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

function foldLine(line: string): string {
  if (Buffer.byteLength(line, "utf8") <= MAX_LINE_OCTETS) {
    return line;
  }
  const parts: string[] = [];
  let current = "";
  let currentOctets = 0;
  let limit = MAX_LINE_OCTETS;
  for (const character of line) {
    const octets = Buffer.byteLength(character, "utf8");
    if (currentOctets + octets > limit) {
      parts.push(current);
      current = "";
      currentOctets = 0;
      limit = MAX_LINE_OCTETS - 1;
    }
    current += character;
    currentOctets += octets;
  }
  parts.push(current);
  return parts.join(`${CRLF} `);
}

export function buildIcs({
  slotId,
  summary,
  location,
  locale,
  now = new Date(),
}: BuildIcsInput): string {
  const slot = generateSlots().find((candidate) => candidate.id === slotId);
  if (!slot) {
    throw new Error(`Unknown slot: ${slotId}`);
  }
  const start = slotStartUtc(slot);
  const end = new Date(
    start.getTime() + EVENT_CONFIG.interviewMinutes * MS_PER_MINUTE,
  );
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Court House+//Interview booking//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${slotId}@${UID_DOMAIN}`,
    `DTSTAMP:${formatUtc(now)}`,
    `DTSTART:${formatUtc(start)}`,
    `DTEND:${formatUtc(end)}`,
    `SUMMARY;LANGUAGE=${locale}:${escapeText(summary)}`,
    `LOCATION:${escapeText(location)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join(CRLF) + CRLF;
}
