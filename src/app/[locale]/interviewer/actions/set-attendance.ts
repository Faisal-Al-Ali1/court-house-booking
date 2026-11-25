"use server";

import { bookingsRepo, type Attendance } from "@/repositories/bookings";
import { errorCodeOf } from "@/core/types/results/failures";
import { isFailure } from "@/core/types/results/results";
import { isValidSlotId } from "@/lib/slots";
import { isSignedIn } from "../utils/is-signed-in";
import type { AttendanceResult } from "../types/attendance-result";

export async function setAttendance(
  slotId: string,
  attendance: Attendance | null,
): Promise<AttendanceResult> {
  if (!(await isSignedIn())) {
    return { status: "signed-out" };
  }
  if (!isValidSlotId(slotId)) {
    return { status: "failed" };
  }

  const result = await bookingsRepo.setAttendance(slotId, attendance);
  if (isFailure(result)) {
    console.error("interviewer setAttendance failed", {
      code: errorCodeOf(result.failure),
    });
    return { status: "failed" };
  }

  return { status: "ok" };
}
