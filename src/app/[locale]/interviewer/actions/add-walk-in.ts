"use server";

import { after } from "next/server";
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { routing, type Locale } from "@/core/i18n/routing";
import {
  sendBookingConfirmation,
  sendInterviewerNotification,
} from "@/core/services/email";
import { bookingsRepo, type Booking } from "@/repositories/bookings";
import { isValidSlotId } from "@/lib/slots";
import { runWalkIn } from "@/lib/walk-in-flow";
import { isSignedIn } from "../utils/is-signed-in";
import type { WalkInState } from "../types/walk-in-state";

const FALLBACK_ERROR_KEY = "unexpected";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function notify(booking: Booking): void {
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

export async function addWalkIn(
  _previous: WalkInState,
  formData: FormData,
): Promise<WalkInState> {
  const submitted = field(formData, "locale");
  const locale: Locale = hasLocale(routing.locales, submitted)
    ? submitted
    : routing.defaultLocale;

  const outcome = await runWalkIn(
    {
      slotId: field(formData, "slotId"),
      name: field(formData, "name"),
      email: field(formData, "email"),
      phone: field(formData, "phone"),
      consent: field(formData, "consent") === "on",
      locale,
    },
    {
      isSignedIn,
      isValidSlotId,
      repo: bookingsRepo,
      notify,
      now: () => new Date(),
    },
  );

  if (outcome.status !== "invalid") {
    return { status: outcome.status };
  }

  const t = await getTranslations({ locale, namespace: "booking.errors" });
  const errors: Record<string, string> = {};
  for (const [name, key] of Object.entries(outcome.errors)) {
    errors[name] = t.has(key) ? t(key) : t(FALLBACK_ERROR_KEY);
  }
  return { status: "invalid", errors };
}
