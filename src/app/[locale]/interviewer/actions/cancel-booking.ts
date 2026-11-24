"use server";

import { bookingsRepo } from "@/repositories/bookings";
import { sendCancellation } from "@/core/services/email";
import { runCancel } from "@/lib/cancel-flow";
import { isValidSlotId } from "@/lib/slots";
import { isSignedIn } from "../utils/is-signed-in";
import type { CancelResult } from "../types/cancel-result";

export async function cancelBooking(slotId: string): Promise<CancelResult> {
  return runCancel(slotId, {
    isSignedIn,
    isValidSlotId,
    repo: bookingsRepo,
    notify: sendCancellation,
  });
}
