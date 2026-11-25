import { z } from "zod";
import { isValidSlotId } from "../../../lib/slots.ts";
import { detailsSchema } from "../../../lib/details-errors.ts";

export const bookingSchema = detailsSchema.extend({
  slotId: z.string().refine(isValidSlotId, "slotInvalid"),
});

export type BookingValues = z.infer<typeof bookingSchema>;
