import type { Result } from "../../core/types/results/results.ts";
import type { Attendance, Booking, SlotClaim } from "./types.ts";

export interface BookingsRepo {
  create(booking: Booking): Promise<Result<SlotClaim>>;
  listActive(): Promise<Result<Booking[]>>;
  listAll(): Promise<Result<Booking[]>>;
  cancel(slotId: string): Promise<Result<null>>;
  setAttendance(
    slotId: string,
    attendance: Attendance | null,
  ): Promise<Result<null>>;
  takenSlotIds(): Promise<Result<string[]>>;
}
