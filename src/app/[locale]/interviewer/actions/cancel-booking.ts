"use server";

import { after } from "next/server";
import {
  BOOKING_ERROR_CODES,
  bookingsRepo,
  type Booking,
} from "@/repositories/bookings";
import { sendCancellation } from "@/core/services/email";
import { errorCodeOf } from "@/core/types/results/failures";
import { isFailure } from "@/core/types/results/results";
import { isValidSlotId } from "@/lib/slots";
import { isSignedIn } from "../utils/is-signed-in";
import type { CancelResult } from "../types/cancel-result";

function sendCancellationEmail(booking: Booking): void {
  const run = (): Promise<void> => sendCancellation(booking);
  try {
    after(run);
  } catch {
    void run();
  }
}

export async function cancelBooking(slotId: string): Promise<CancelResult> {
  if (!(await isSignedIn())) {
    return "signed-out";
  }
  if (typeof slotId !== "string" || !isValidSlotId(slotId)) {
    return "failed";
  }

  try {
    const active = await bookingsRepo.listActive();
    if (isFailure(active)) {
      console.error("cancelBooking lookup failed", {
        code: errorCodeOf(active.failure),
      });
      return "failed";
    }
    const booking = (active.data ?? []).find((row) => row.slotId === slotId);
    if (!booking) {
      return "cancelled";
    }

    const result = await bookingsRepo.cancel(slotId);
    if (isFailure(result)) {
      const code = errorCodeOf(result.failure);
      console.error("cancelBooking repository failure", { code });
      return code === BOOKING_ERROR_CODES.notFound ? "cancelled" : "failed";
    }

    sendCancellationEmail(booking);
    return "cancelled";
  } catch (error) {
    console.error("cancelBooking threw", {
      name: error instanceof Error ? error.name : typeof error,
    });
    return "failed";
  }
}
