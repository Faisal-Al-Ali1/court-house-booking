import { z } from "zod";
import { isValidSlotId } from "@/lib/slots";
import { normaliseDigits } from "@/lib/normalise-digits";

export const bookingSchema = z.object({
  name: z
    .string()
    .normalize("NFC")
    .trim()
    .min(2, "nameRequired")
    .max(120, "nameTooLong"),
  email: z
    .string()
    .trim()
    .max(254, "emailInvalid")
    .pipe(z.email("emailInvalid"))
    .transform((value) => value.toLowerCase()),
  phone: z
    .string()
    .transform(normaliseDigits)
    .pipe(z.string().trim().min(7, "phoneRequired").max(24, "phoneTooLong")),
  slotId: z.string().refine(isValidSlotId, "slotInvalid"),
  consent: z.literal("on", { error: "consentRequired" }),
});

export type BookingValues = z.infer<typeof bookingSchema>;
