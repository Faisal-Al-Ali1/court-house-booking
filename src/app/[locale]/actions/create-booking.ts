"use server";

import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { bookingsRepo } from "@/repositories/bookings";
import { errorCodeOf } from "@/core/types/results/failures";
import { isFailure } from "@/core/types/results/results";
import { routing } from "@/core/i18n/routing";
import {
  FALLBACK_ERROR_KEY,
  claimOutcomeToState,
  failureCodeToState,
} from "@/lib/booking-outcome";
import { BOOKED_COOKIE } from "@/lib/booked-cookie";
import { bookingSchema } from "../schemas/booking-schema";
import { parseFormErrors } from "../utils/parse-form-errors";
import type { BookingActionState } from "../types/booking-action-state";

const BOOKED_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
const FALLBACK_MESSAGE = "Something went wrong. Please try again.";

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

async function failureState(locale: string): Promise<BookingActionState> {
  try {
    const t = await getTranslations({ locale, namespace: "booking.errors" });
    return { status: "error", message: t(FALLBACK_ERROR_KEY) };
  } catch {
    return { status: "error", message: FALLBACK_MESSAGE };
  }
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
        errors: parseFormErrors(parsed.error, (key) =>
          t.has(key) ? t(key) : t(FALLBACK_ERROR_KEY),
        ),
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
      console.error("createBooking repository failure", { code });
      return failureCodeToState(code, (key) => t(key));
    }

    const outcome = claimOutcomeToState(result.data, slotId, (key) => t(key));
    if (outcome.status === "success") {
      const jar = await cookies();
      jar.set(BOOKED_COOKIE, slotId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: BOOKED_COOKIE_MAX_AGE_SECONDS,
      });
    }
    return outcome;
  } catch (error) {
    console.error("createBooking threw", {
      name: error instanceof Error ? error.name : typeof error,
    });
    return failureState(locale);
  }
}
