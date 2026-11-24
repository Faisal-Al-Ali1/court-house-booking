export const ICS_SLOT_PARAM = "slot";

export function icsHref(locale: string, slotId: string): string {
  return `/${locale}/api/ics?${ICS_SLOT_PARAM}=${encodeURIComponent(slotId)}`;
}
