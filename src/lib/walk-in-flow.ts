import type { Locale } from "../core/i18n/routing.ts";
import type { BookingsRepo } from "../repositories/bookings/bookings_repo.ts";
import type { Booking } from "../repositories/bookings/types.ts";
import { errorCodeOf } from "../core/types/results/failures.ts";
import { isFailure } from "../core/types/results/results.ts";
import { collectDetailsErrors } from "./details-errors.ts";

export type WalkInOutcome =
  | { status: "added" }
  | { status: "invalid"; errors: Record<string, string> }
  | { status: "slot-taken" }
  | { status: "already-booked" }
  | { status: "failed" }
  | { status: "signed-out" };

export type WalkInInput = {
  slotId: string;
  name: string;
  email: string;
  phone: string;
  consent: boolean;
  locale: Locale;
};

export type WalkInDeps = {
  isSignedIn: () => Promise<boolean>;
  isValidSlotId: (slotId: string) => boolean;
  repo: Pick<BookingsRepo, "create">;
  notify: (booking: Booking) => void;
  now: () => Date;
};

export async function runWalkIn(
  input: WalkInInput,
  deps: WalkInDeps,
): Promise<WalkInOutcome> {
  if (!(await deps.isSignedIn())) {
    return { status: "signed-out" };
  }
  if (typeof input.slotId !== "string" || !deps.isValidSlotId(input.slotId)) {
    return { status: "failed" };
  }

  const errors = collectDetailsErrors({
    name: input.name,
    email: input.email,
    phone: input.phone,
    consent: input.consent,
  });
  if (Object.keys(errors).length > 0) {
    return { status: "invalid", errors };
  }

  const booking: Booking = {
    slotId: input.slotId,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    locale: input.locale,
    createdAt: deps.now(),
    cancelledAt: null,
    attendance: null,
  };

  try {
    const result = await deps.repo.create(booking);
    if (isFailure(result)) {
      console.error("walkIn repository failure", {
        code: errorCodeOf(result.failure),
      });
      return { status: "failed" };
    }

    if (result.data === "created") {
      deps.notify(booking);
      return { status: "added" };
    }
    if (result.data === "slot-taken") {
      return { status: "slot-taken" };
    }
    return { status: "already-booked" };
  } catch (error) {
    console.error("walkIn threw", {
      name: error instanceof Error ? error.name : typeof error,
    });
    return { status: "failed" };
  }
}
