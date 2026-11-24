import type { Result } from "../../core/types/results/results.ts";
import type { Booking, SlotClaim } from "./types.ts";

export interface BookingsRepo {
  create(booking: Booking): Promise<Result<SlotClaim>>;
  listActive(): Promise<Result<Booking[]>>;
  listAll(): Promise<Result<Booking[]>>;
  cancel(slotId: string): Promise<Result<null>>;
  takenSlotIds(): Promise<Result<string[]>>;
}
