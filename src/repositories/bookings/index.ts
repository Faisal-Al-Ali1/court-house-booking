import { BookingsImpl } from "./bookings_impl.ts";
import type { BookingsRepo } from "./bookings_repo.ts";

export const bookingsRepo: BookingsRepo = new BookingsImpl();

export type { BookingsRepo } from "./bookings_repo.ts";
export type { Booking, SlotClaim } from "./types.ts";
