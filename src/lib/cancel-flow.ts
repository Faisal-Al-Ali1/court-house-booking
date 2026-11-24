import type { BookingsRepo } from "../repositories/bookings/bookings_repo.ts";
import {
  BOOKING_ERROR_CODES,
  type Booking,
} from "../repositories/bookings/types.ts";
import { errorCodeOf } from "../core/types/results/failures.ts";
import { isFailure } from "../core/types/results/results.ts";

export type CancelOutcome =
  | "notified"
  | "not-notified"
  | "gone"
  | "failed"
  | "signed-out";

export type CancelDeps = {
  isSignedIn: () => Promise<boolean>;
  isValidSlotId: (slotId: string) => boolean;
  repo: Pick<BookingsRepo, "listActive" | "cancel">;
  notify: (booking: Booking) => Promise<boolean>;
};

async function notified(
  booking: Booking,
  deps: CancelDeps,
): Promise<CancelOutcome> {
  try {
    return (await deps.notify(booking)) ? "notified" : "not-notified";
  } catch (error) {
    console.error("cancelBooking notify threw", {
      name: error instanceof Error ? error.name : typeof error,
    });
    return "not-notified";
  }
}

export async function runCancel(
  slotId: string,
  deps: CancelDeps,
): Promise<CancelOutcome> {
  if (!(await deps.isSignedIn())) {
    return "signed-out";
  }
  if (typeof slotId !== "string" || !deps.isValidSlotId(slotId)) {
    return "failed";
  }

  try {
    const active = await deps.repo.listActive();
    if (isFailure(active)) {
      console.error("cancelBooking lookup failed", {
        code: errorCodeOf(active.failure),
      });
      return "failed";
    }
    const booking = (active.data ?? []).find((row) => row.slotId === slotId);
    if (!booking) {
      return "gone";
    }

    const result = await deps.repo.cancel(slotId);
    if (isFailure(result)) {
      const code = errorCodeOf(result.failure);
      console.error("cancelBooking repository failure", { code });
      return code === BOOKING_ERROR_CODES.notFound ? "gone" : "failed";
    }

    return await notified(booking, deps);
  } catch (error) {
    console.error("cancelBooking threw", {
      name: error instanceof Error ? error.name : typeof error,
    });
    return "failed";
  }
}
