import { useTranslations } from "next-intl";
import { LtrRun, RichText } from "@/core/new-components/common/ltr-run";
import { formatSlotTime } from "@/lib/format-time";
import type { BookingConfirmationProps } from "../types/booking-confirmation-props";

export function BookingConfirmation({ slot, locale }: BookingConfirmationProps) {
  const t = useTranslations("booking");

  return (
    <section
      aria-live="polite"
      className="rounded-lg border border-rule bg-ground-raised p-6"
    >
      <h2 className="text-xl font-bold">{t("confirmed.title")}</h2>
      <p className="mt-3 font-semibold">
        <RichText>{t("eventDate")}</RichText>
      </p>
      <p className="mt-1 text-lg">
        {t.rich("confirmed.body", {
          time: formatSlotTime(slot, locale),
          n: (chunks) => <LtrRun className="font-semibold">{chunks}</LtrRun>,
        })}
      </p>
      <p className="mt-3 text-ink-muted">{t("confirmed.note")}</p>
    </section>
  );
}
