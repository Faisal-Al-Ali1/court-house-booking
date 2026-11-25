"use server";

import { cookies } from "next/headers";
import { after } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { bookingsRepo, type Booking } from "@/repositories/bookings";
import { errorCodeOf } from "@/core/types/results/failures";
import { isFailure } from "@/core/types/results/results";
import { routing } from "@/core/i18n/routing";
import {
  sendBookingConfirmation,
  sendInterviewerNotification,
} from "@/core/services/email";
import {
  FALLBACK_ERROR_KEY,
  claimOutcomeToState,
  failureCodeToState,
} from "@/lib/booking-outcome";
import { requireSessionSecret, signRef } from "@/lib/signed-ref";
import { BOOKED_COOKIE, bookedCookieExpiry } from "@/lib/booked-cookie";
import { bookingSchema } from "../schemas/booking-schema";
import { parseFormErrors } from "../utils/parse-form-errors";
import type { BookingActionState } from "../types/booking-action-state";

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

async function rememberBooking(email: string): Promise<void> {
  try {
    const jar = await cookies();
    jar.set(BOOKED_COOKIE, signRef(email, requireSessionSecret()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: bookedCookieExpiry(),
    });
  } catch (error) {
    console.error("booked cookie not written", {
      name: error instanceof Error ? error.name : typeof error,
    });
  }
}

type Attempt = {
  state: BookingActionState;
  email?: string;
  created?: Booking;
};

function sendBookingEmails(booking: Booking): void {
  const run = async (): Promise<void> => {
    await sendBookingConfirmation(booking);
    await sendInterviewerNotification(booking);
  };
  try {
    after(run);
  } catch {
    void run();
  }
}

export async function createBooking(
  _prevState: BookingActionState,
  formData: FormData,
): Promise<BookingActionState> {
  const attempt = await attemptBooking(formData);
  if (attempt.state.status === "success" && attempt.email) {
    await rememberBooking(attempt.email);
  }
  if (attempt.created) {
    sendBookingEmails(attempt.created);
  }
  return attempt.state;
}

async function attemptBooking(formData: FormData): Promise<Attempt> {
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
        state: {
          status: "invalid",
          errors: parseFormErrors(parsed.error, (key) =>
            t.has(key) ? t(key) : t(FALLBACK_ERROR_KEY),
          ),
        },
      };
    }

    const { name, email, phone, slotId } = parsed.data;
    const booking: Booking = {
      slotId,
      name,
      email,
      phone,
      locale,
      createdAt: new Date(),
      cancelledAt: null,
      attendance: null,
    };
    const result = await bookingsRepo.create(booking);

    if (isFailure(result)) {
      const code = errorCodeOf(result.failure);
      console.error("createBooking repository failure", { code });
      return { state: failureCodeToState(code, (key) => t(key)) };
    }

    return {
      state: claimOutcomeToState(result.data, slotId, (key) => t(key)),
      email,
      created: result.data === "created" ? booking : undefined,
    };
  } catch (error) {
    console.error("createBooking threw", {
      name: error instanceof Error ? error.name : typeof error,
    });
    return { state: await failureState(locale) };
  }
}
