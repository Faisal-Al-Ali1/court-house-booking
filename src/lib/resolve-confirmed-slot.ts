import type { Booking } from "../repositories/bookings/types.ts";

export type ResolveConfirmedSlotInput = {
  booked: string | undefined;
  cookieEmail: string | undefined;
  activeBookings: readonly Pick<Booking, "slotId" | "email" | "cancelledAt">[];
};

export function resolveConfirmedSlot({
  booked,
  cookieEmail,
  activeBookings,
}: ResolveConfirmedSlotInput): string | null {
  if (!booked || !cookieEmail) {
    return null;
  }
  const email = cookieEmail.trim().toLowerCase();
  const live = activeBookings.some(
    (booking) =>
      booking.cancelledAt === null &&
      booking.email === email &&
      booking.slotId === booked,
  );
  return live ? booked : null;
}
