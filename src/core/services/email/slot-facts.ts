import { EVENT_CONFIG } from "../../config/event.ts";
import { formatSlotTime } from "../../../lib/format-time.ts";
import { isHttpUrl } from "../../../lib/placeholder-content.ts";
import { generateSlots } from "../../../lib/slots.ts";
import type { Locale } from "../../i18n/routing.ts";
import type { Translate } from "./types.ts";

export type SlotFacts = {
  date: string;
  time: string;
  duration: string;
  venue: string;
  mapUrl: string | null;
};

export function venueLocation(t: Translate): string {
  return t("venue.fullLocation", {
    name: t("venue.name"),
    address: t("venue.address"),
  });
}

export function buildSlotFacts(
  t: Translate,
  slotId: string,
  locale: Locale,
): SlotFacts {
  const slot = generateSlots().find((candidate) => candidate.id === slotId);
  if (!slot) {
    throw new Error(`Unknown slot: ${slotId}`);
  }
  const mapUrl = t("venue.mapUrl").trim();
  return {
    date: t("booking.eventDate"),
    time: formatSlotTime(slot, locale),
    duration: t("email.durationValue", {
      minutes: String(EVENT_CONFIG.interviewMinutes),
    }),
    venue: venueLocation(t),
    mapUrl: isHttpUrl(mapUrl) ? mapUrl : null,
  };
}
