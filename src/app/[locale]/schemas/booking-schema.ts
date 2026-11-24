import { z } from "zod";
import { isValidSlotId } from "../../../lib/slots.ts";
import {
  countDigits,
  normaliseDigits,
} from "../../../lib/normalise-digits.ts";

const MIN_PHONE_DIGITS = 7;

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
    .pipe(
      z
        .string()
        .trim()
        .min(7, "phoneRequired")
        .max(24, "phoneTooLong")
        .refine(
          (value) => countDigits(value) >= MIN_PHONE_DIGITS,
          "phoneRequired",
        ),
    ),
  slotId: z.string().refine(isValidSlotId, "slotInvalid"),
  consent: z.literal("on", { error: "consentRequired" }),
});

export type BookingValues = z.infer<typeof bookingSchema>;
