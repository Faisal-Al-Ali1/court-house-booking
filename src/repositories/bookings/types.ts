import type { Locale } from "../../core/i18n/routing.ts";

export type Booking = {
  slotId: string;
  name: string;
  email: string;
  phone: string;
  locale: Locale;
  createdAt: Date;
  cancelledAt: Date | null;
};

export type SlotClaim = "created" | "slot-taken" | "already-booked" | "idempotent";

export const BOOKING_ERROR_CODES = Object.freeze({
  unknownSlot: "unknown-slot",
  slotPast: "slot-past",
  retry: "retry",
  notFound: "not-found",
  database: "database-error",
});

export type BookingErrorCode =
  (typeof BOOKING_ERROR_CODES)[keyof typeof BOOKING_ERROR_CODES];
