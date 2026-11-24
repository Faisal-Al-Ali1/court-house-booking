import type { Result } from "../core/types/results/results.ts";
import type { Booking } from "../repositories/bookings/types.ts";
import { resolveConfirmedSlot } from "./resolve-confirmed-slot.ts";
import { verifyRef } from "./signed-ref.ts";

export type ConfirmFromRequestInput = {
  booked: string | string[] | undefined;
  cookie: string | undefined;
  getSecret: () => string;
  loadActive: () => Promise<Result<Booking[]>>;
};

export async function confirmFromRequest({
  booked,
  cookie,
  getSecret,
  loadActive,
}: ConfirmFromRequestInput): Promise<string | null> {
  if (typeof booked !== "string" || !cookie) {
    return null;
  }
  let secret: string;
  try {
    secret = getSecret();
  } catch (error) {
    console.error("booking confirmation disabled: session secret unusable", {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : undefined,
    });
    return null;
  }
  const email = verifyRef(cookie, secret);
  if (email === null) {
    return null;
  }
  const active = await loadActive();
  return resolveConfirmedSlot({
    booked,
    cookieEmail: email,
    activeBookings: active.type === "failure" ? [] : (active.data ?? []),
  });
}
