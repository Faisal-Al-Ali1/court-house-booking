import { z } from "zod";
import { countDigits, normaliseDigits } from "./normalise-digits.ts";

const MIN_PHONE_DIGITS = 7;

export const detailsSchema = z.object({
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
  consent: z.literal("on", { error: "consentRequired" }),
});

export type DetailsDraft = {
  name: string;
  email: string;
  phone: string;
  consent: boolean;
};

export function collectDetailsErrors(
  values: DetailsDraft,
): Record<string, string> {
  const result = detailsSchema.safeParse({
    name: values.name,
    email: values.email,
    phone: values.phone,
    consent: values.consent ? "on" : "",
  });

  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !(field in errors)) {
      errors[field] = issue.message;
    }
  }

  return errors;
}
