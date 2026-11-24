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
