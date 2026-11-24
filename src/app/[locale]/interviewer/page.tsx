import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { EVENT_CONFIG } from "@/core/config/event";
import { routing } from "@/core/i18n/routing";
import { RichText } from "@/core/new-components/common/ltr-run";
import { bookingsRepo } from "@/repositories/bookings";
import { errorCodeOf } from "@/core/types/results/failures";
import { isFailure } from "@/core/types/results/results";
import { generateSlots, slotStartUtc } from "@/lib/slots";
import { PageClient } from "./page-client";
import { isSignedIn } from "./utils/is-signed-in";
import type { ScheduleRow } from "./types/schedule-row";

const MS_PER_MINUTE = 60_000;

export default async function InterviewerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);
  await connection();

  if (!(await isSignedIn())) {
    return null;
  }

  const result = await bookingsRepo.listActive();

  if (isFailure(result)) {
    console.error("interviewer listActive failed", {
      code: errorCodeOf(result.failure),
    });
    const t = await getTranslations({ locale, namespace: "interviewer" });
    return (
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <p
          role="alert"
          className="rounded-md border border-accent bg-ground-raised p-4 font-semibold text-accent"
        >
          <RichText>{t("loadFailed")}</RichText>
        </p>
      </main>
    );
  }

  const bySlot = new Map((result.data ?? []).map((row) => [row.slotId, row]));
  const nowMs = new Date().getTime();
  const rows: ScheduleRow[] = generateSlots().map((slot) => {
    const booking = bySlot.get(slot.id);
    const endsAt =
      slotStartUtc(slot).getTime() + EVENT_CONFIG.interviewMinutes * MS_PER_MINUTE;
    return {
      slotId: slot.id,
      startMinutes: slot.startMinutes,
      past: endsAt <= nowMs,
      applicant: booking ? { name: booking.name, phone: booking.phone } : null,
    };
  });
  const nextSlotId =
    rows.find((row) => row.applicant !== null && !row.past)?.slotId ?? null;

  return <PageClient locale={locale} rows={rows} nextSlotId={nextSlotId} />;
}
