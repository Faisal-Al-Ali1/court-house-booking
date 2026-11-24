import type { Locale } from "../../../i18n/routing.ts";
import { isolateText } from "../isolate.ts";
import type { SlotFacts } from "../slot-facts.ts";
import type { RenderedEmail, Translate } from "../types.ts";
import { renderHtml, renderText, type EmailContent } from "./layout.ts";

export type ApplicantConfirmationInput = {
  t: Translate;
  locale: Locale;
  name: string;
  facts: SlotFacts;
};

export function renderApplicantConfirmation({
  t,
  locale,
  name,
  facts,
}: ApplicantConfirmationInput): RenderedEmail {
  const content: EmailContent = {
    locale,
    heading: t("email.confirmation.heading"),
    paragraphs: [
      t("email.confirmation.greeting", { name }),
      t("email.confirmation.intro"),
      t("email.confirmation.calendar"),
      t("booking.confirmed.note"),
    ],
    rows: [
      { label: t("confirmation.timeLabel"), value: facts.time },
      { label: t("confirmation.dateLabel"), value: facts.date },
      { label: t("confirmation.durationLabel"), value: facts.duration },
      { label: t("confirmation.venueLabel"), value: facts.venue },
    ],
    links: facts.mapUrl
      ? [{ label: t("confirmation.openMap"), url: facts.mapUrl }]
      : [],
    footer: t("email.footer"),
  };
  return {
    subject: isolateText(t("email.confirmation.subject"), locale),
    html: renderHtml(content),
    text: renderText(content),
  };
}
