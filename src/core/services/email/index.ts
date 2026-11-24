import {
  createResendTransport,
  readInterviewerEmail,
  readMailConfig,
} from "./client.ts";
import { createEmailSenders } from "./send-booking-emails.ts";
import { translatorFor } from "./translator.ts";

const senders = createEmailSenders({
  transport: createResendTransport(),
  readConfig: () => readMailConfig(),
  readInterviewerEmail: () => readInterviewerEmail(),
  translatorFor,
});

export const {
  sendBookingConfirmation,
  sendInterviewerNotification,
  sendCancellation,
} = senders;
