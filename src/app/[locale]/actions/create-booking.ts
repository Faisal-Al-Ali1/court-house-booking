"use server";

import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { BOOKING_ERROR_CODES, bookingsRepo } from "@/repositories/bookings";
import { errorCodeOf } from "@/core/types/results/failures";
import { isFailure, isSuccess } from "@/core/types/results/results";
import { routing } from "@/core/i18n/routing";
import { bookingSchema } from "../schemas/booking-schema";
import { parseFormErrors } from "../utils/parse-form-errors";
import type { BookingActionState } from "../types/booking-action-state";

const ERROR_KEY_BY_CODE: Readonly<Record<string, string>> = Object.freeze({
  [BOOKING_ERROR_CODES.unknownSlot]: "slotInvalid",
  [BOOKING_ERROR_CODES.slotPast]: "slotPast",
  [BOOKING_ERROR_CODES.retry]: "unexpected",
  [BOOKING_ERROR_CODES.notFound]: "unexpected",
  [BOOKING_ERROR_CODES.database]: "unexpected",
});

const FALLBACK_ERROR_KEY = "unexpected";

function readField(formData: FormData, field: string): string {
  const value = formData.get(field);
  return typeof value === "string" ? value : "";
}

function readLocale(formData: FormData) {
  const submitted = readField(formData, "locale");
  return hasLocale(routing.locales, submitted)
    ? submitted
    : routing.defaultLocale;
}

export async function createBooking(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const locale = readLocale(formData);

  try {
    const t = await getTranslations({ locale, namespace: "booking.errors" });

    const parsed = bookingSchema.safeParse({
      name: readField(formData, "name"),
      email: readField(formData, "email"),
      phone: readField(formData, "phone"),
      slotId: readField(formData, "slotId"),
      consent: readField(formData, "consent"),
    });

    if (!parsed.success) {
      return {
        status: "invalid",
        errors: parseFormErrors(parsed.error, (key) => t(key)),
      };
    }

    const { name, email, phone, slotId } = parsed.data;
    const result = await bookingsRepo.create({
      slotId,
      name,
      email,
      phone,
      locale,
      createdAt: new Date(),
      cancelledAt: null,
    });

    if (isFailure(result)) {
      const code = errorCodeOf(result.failure);
      const key =
        (code !== undefined ? ERROR_KEY_BY_CODE[code] : undefined) ??
        FALLBACK_ERROR_KEY;
      return { status: "error", message: t(key) };
    }

    if (!isSuccess(result) || result.data === undefined) {
      return { status: "error", message: t(FALLBACK_ERROR_KEY) };
    }

    switch (result.data) {
      case "created":
      case "idempotent":
        return { status: "success", slotId };
      case "slot-taken":
        return { status: "error", message: t("slotTaken") };
      case "already-booked":
        return { status: "error", message: t("alreadyBooked") };
      default:
        return { status: "error", message: t(FALLBACK_ERROR_KEY) };
    }
  } catch {
    const t = await getTranslations({ locale, namespace: "booking.errors" });
    return { status: "error", message: t(FALLBACK_ERROR_KEY) };
  }
}
