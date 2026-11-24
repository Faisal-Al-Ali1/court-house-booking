import { buildIcs } from "../../../lib/ics.ts";
import type { Booking } from "../../../repositories/bookings/types.ts";
import type { Locale } from "../../i18n/routing.ts";
import {
  MailConfigError,
  MailSendError,
  formatFrom,
  type MailConfig,
} from "./client.ts";
import { buildSlotFacts, venueLocation } from "./slot-facts.ts";
import { renderApplicantConfirmation } from "./templates/applicant-confirmation.ts";
import { renderCancellation } from "./templates/cancellation.ts";
import { renderInterviewerNotification } from "./templates/interviewer-notification.ts";
import type {
  MailTransport,
  OutgoingAttachment,
  RenderedEmail,
  Translate,
} from "./types.ts";

const ICS_FILENAME = "interview.ics";
const ICS_CONTENT_TYPE = "text/calendar; charset=utf-8";

export type EmailDeps = {
  transport: MailTransport;
  readConfig: () => MailConfig;
  readInterviewerEmail: () => string;
  readInterviewerLocale: () => Locale;
  translatorFor: (locale: Locale) => Translate;
};

type ApplicantBooking = Pick<Booking, "slotId" | "name" | "email" | "locale">;
type InterviewerBooking = Pick<
  Booking,
  "slotId" | "name" | "email" | "phone"
>;

export type EmailSenders = {
  sendBookingConfirmation: (booking: ApplicantBooking) => Promise<void>;
  sendInterviewerNotification: (booking: InterviewerBooking) => Promise<void>;
  sendCancellation: (booking: ApplicantBooking) => Promise<void>;
};

function describeFailure(error: unknown): Record<string, unknown> {
  if (error instanceof MailConfigError) {
    return { name: error.name, variables: error.variables };
  }
  if (error instanceof MailSendError) {
    return { name: error.name, code: error.code };
  }
  return { name: error instanceof Error ? error.name : typeof error };
}

async function guarded(kind: string, work: () => Promise<void>): Promise<void> {
  try {
    await work();
  } catch (error) {
    console.error("email not sent", { kind, ...describeFailure(error) });
  }
}

export function createEmailSenders(deps: EmailDeps): EmailSenders {
  async function deliver(
    to: string,
    rendered: RenderedEmail,
    attachments?: readonly OutgoingAttachment[],
  ): Promise<void> {
    const config = deps.readConfig();
    await deps.transport({
      from: formatFrom(config.from),
      to,
      replyTo: config.replyTo,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      attachments,
    });
  }

  return {
    sendBookingConfirmation: (booking) =>
      guarded("confirmation", async () => {
        const t = deps.translatorFor(booking.locale);
        const facts = buildSlotFacts(t, booking.slotId, booking.locale);
        const ics = buildIcs({
          slotId: booking.slotId,
          summary: t("confirmation.eventSummary"),
          location: venueLocation(t),
          locale: booking.locale,
        });
        await deliver(
          booking.email,
          renderApplicantConfirmation({
            t,
            locale: booking.locale,
            name: booking.name,
            facts,
          }),
          [
            {
              filename: ICS_FILENAME,
              content: Buffer.from(ics, "utf8"),
              contentType: ICS_CONTENT_TYPE,
            },
          ],
        );
      }),

    sendInterviewerNotification: (booking) =>
      guarded("notification", async () => {
        const locale = deps.readInterviewerLocale();
        const t = deps.translatorFor(locale);
        const facts = buildSlotFacts(t, booking.slotId, locale);
        await deliver(
          deps.readInterviewerEmail(),
          renderInterviewerNotification({
            t,
            locale,
            applicant: {
              name: booking.name,
              email: booking.email,
              phone: booking.phone,
            },
            facts,
          }),
        );
      }),

    sendCancellation: (booking) =>
      guarded("cancellation", async () => {
        const t = deps.translatorFor(booking.locale);
        const facts = buildSlotFacts(t, booking.slotId, booking.locale);
        await deliver(
          booking.email,
          renderCancellation({
            t,
            locale: booking.locale,
            name: booking.name,
            facts,
          }),
        );
      }),
  };
}
