import { useTranslations } from "next-intl";
import { EVENT_CONFIG } from "@/core/config/event";
import { VENUE_MAP_URL } from "@/core/config/venue";
import { LtrRun, RichText } from "@/core/new-components/common/ltr-run";
import { formatSlotTime } from "@/lib/format-time";
import type { BookingConfirmationProps } from "../types/booking-confirmation-props";

export function BookingConfirmation({ slot, locale }: BookingConfirmationProps) {
  const t = useTranslations("booking");
  const c = useTranslations("confirmation");
  const venue = useTranslations("venue");
  const icsHref = `/${locale}/api/ics?slot=${encodeURIComponent(slot.id)}`;

  return (
    <section
      aria-live="polite"
      className="rounded-lg border border-rule bg-ground-raised p-6"
    >
      <h1 className="text-2xl font-bold">{t("confirmed.title")}</h1>
      <p className="mt-3 text-lg">
        {t.rich("confirmed.body", {
          time: formatSlotTime(slot, locale),
          n: (chunks) => <LtrRun className="font-semibold">{chunks}</LtrRun>,
        })}
      </p>

      <dl className="mt-5 grid gap-4 border-t border-rule pt-5">
        <div>
          <dt className="text-sm text-ink-muted">{c("dateLabel")}</dt>
          <dd className="mt-1 font-semibold">
            <RichText>{t("eventDate")}</RichText>
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">{c("durationLabel")}</dt>
          <dd className="mt-1 font-semibold">
            {c.rich("duration", {
              minutes: EVENT_CONFIG.interviewMinutes,
              n: (chunks) => <LtrRun>{chunks}</LtrRun>,
            })}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-ink-muted">{c("venueLabel")}</dt>
          <dd className="mt-1 font-semibold">
            <RichText>{venue("name")}</RichText>
            <br />
            <RichText>{venue("address")}</RichText>
          </dd>
        </div>
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <a
          href={icsHref}
          download="interview.ics"
          className="inline-flex min-h-12 items-center rounded-md bg-accent px-6 py-3 text-base font-semibold text-accent-ink"
        >
          {c("addToCalendar")}
        </a>
        <a
          href={VENUE_MAP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-12 items-center rounded-md border border-rule-strong bg-ground px-6 py-3 text-base font-semibold text-accent underline underline-offset-4"
        >
          {c("openMap")}
        </a>
      </div>
      <p className="mt-3 text-sm text-ink-muted">{c("calendarHint")}</p>
      <p className="mt-3 text-ink-muted">{t("confirmed.note")}</p>
    </section>
  );
}
