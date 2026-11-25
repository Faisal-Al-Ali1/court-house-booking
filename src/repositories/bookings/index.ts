import { BookingsImpl } from "./bookings_impl.ts";
import type { BookingsRepo } from "./bookings_repo.ts";

export const bookingsRepo: BookingsRepo = new BookingsImpl();

export type { BookingsRepo } from "./bookings_repo.ts";
export type { Attendance, Booking, SlotClaim, BookingErrorCode } from "./types.ts";
export { BOOKING_ERROR_CODES } from "./types.ts";
