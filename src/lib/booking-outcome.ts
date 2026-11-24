import { BOOKING_ERROR_CODES } from "../repositories/bookings/types.ts";
import type { BookingActionState } from "../app/[locale]/types/booking-action-state.ts";

export const FALLBACK_ERROR_KEY = "unexpected";

const ERROR_KEY_BY_CODE: ReadonlyMap<string, string> = new Map([
  [BOOKING_ERROR_CODES.unknownSlot, "slotInvalid"],
  [BOOKING_ERROR_CODES.slotPast, "slotPast"],
  [BOOKING_ERROR_CODES.retry, FALLBACK_ERROR_KEY],
  [BOOKING_ERROR_CODES.notFound, FALLBACK_ERROR_KEY],
  [BOOKING_ERROR_CODES.database, FALLBACK_ERROR_KEY],
]);

type Translate = (key: string) => string;

export function failureCodeToState(
  code: string | undefined,
  t: Translate,
): BookingActionState {
  const key =
    code === undefined
      ? FALLBACK_ERROR_KEY
      : (ERROR_KEY_BY_CODE.get(code) ?? FALLBACK_ERROR_KEY);
  return { status: "error", message: t(key) };
}

export function claimOutcomeToState(
  claim: string | undefined,
  slotId: string,
  t: Translate,
): BookingActionState {
  switch (claim) {
    case "created":
    case "idempotent":
      return { status: "success", slotId };
    case "slot-taken":
      return { status: "error", message: t("slotTaken") };
    case "already-booked":
      return { status: "error", message: t("alreadyBooked") };
    default:
      return { status: "error", message: t(FALLBACK_ERROR_KEY) };
  }
}
