import type { Locale } from "../../../i18n/routing.ts";
import { isolateText } from "../isolate.ts";
import type { SlotFacts } from "../slot-facts.ts";
import type { RenderedEmail, Translate } from "../types.ts";
import { renderHtml, renderText, type EmailContent } from "./layout.ts";

export type InterviewerNotificationInput = {
  t: Translate;
  locale: Locale;
  applicant: { name: string; email: string; phone: string };
  facts: SlotFacts;
};

export function renderInterviewerNotification({
  t,
  locale,
  applicant,
  facts,
}: InterviewerNotificationInput): RenderedEmail {
  const content: EmailContent = {
    locale,
    heading: t("email.notification.heading"),
    paragraphs: [t("email.notification.intro")],
    rows: [
      { label: t("confirmation.timeLabel"), value: facts.time },
      { label: t("confirmation.dateLabel"), value: facts.date },
      { label: t("email.notification.nameLabel"), value: applicant.name },
      { label: t("email.notification.emailLabel"), value: applicant.email },
      { label: t("email.notification.phoneLabel"), value: applicant.phone },
    ],
    links: [],
    footer: t("email.notification.footer"),
  };
  return {
    subject: isolateText(
      t("email.notification.subject", { time: facts.time }),
      locale,
    ),
    html: renderHtml(content),
    text: renderText(content),
  };
}
