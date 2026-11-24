import type { Locale } from "../../../i18n/routing.ts";
import { isolateText } from "../isolate.ts";
import type { SlotFacts } from "../slot-facts.ts";
import type { RenderedEmail, Translate } from "../types.ts";
import { renderHtml, renderText, type EmailContent } from "./layout.ts";

export type CancellationInput = {
  t: Translate;
  locale: Locale;
  name: string;
  facts: SlotFacts;
};

export function renderCancellation({
  t,
  locale,
  name,
  facts,
}: CancellationInput): RenderedEmail {
  const content: EmailContent = {
    locale,
    heading: t("email.cancellation.heading"),
    paragraphs: [
      t("email.cancellation.greeting", { name }),
      t("email.cancellation.intro"),
      t("email.cancellation.rebook"),
    ],
    rows: [
      { label: t("confirmation.timeLabel"), value: facts.time },
      { label: t("confirmation.dateLabel"), value: facts.date },
    ],
    links: [],
    footer: t("email.footer"),
  };
  return {
    subject: isolateText(t("email.cancellation.subject"), locale),
    html: renderHtml(content),
    text: renderText(content),
  };
}
