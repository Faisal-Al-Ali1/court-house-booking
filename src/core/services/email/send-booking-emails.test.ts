import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MailConfigError,
  MailSendError,
  readInterviewerEmail,
  readInterviewerLocale,
  readMailConfig,
} from "./client.ts";
import { createEmailSenders } from "./send-booking-emails.ts";
import { translatorFor } from "./translator.ts";
import type { OutgoingMail } from "./types.ts";

const APPLICANT_EMAIL = "applicant.secret@example.com";
const APPLICANT_PHONE = "+962791234567";

const CONFIG = {
  apiKey: "re_test_key",
  from: "bookings@sender.example",
  replyTo: "hello@courthouse.example",
};

type Booking = Parameters<
  ReturnType<typeof createEmailSenders>["sendBookingConfirmation"]
>[0];

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    slotId: "2026-11-28T11:00",
    name: "Layla Haddad",
    email: APPLICANT_EMAIL,
    locale: "en",
    ...overrides,
  };
}

function harness(transport?: (message: OutgoingMail) => Promise<void>) {
  const sent: OutgoingMail[] = [];
  const senders = createEmailSenders({
    transport:
      transport ??
      (async (message) => {
        sent.push(message);
      }),
    readConfig: () => CONFIG,
    readInterviewerEmail: () => "interviewer@courthouse.example",
    readInterviewerLocale: () => "en",
    translatorFor,
  });
  return { sent, senders };
}

async function captureErrors<T>(run: () => Promise<T>) {
  const lines: string[] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    lines.push(JSON.stringify(args));
  };
  try {
    const result = await run();
    return { result, lines };
  } finally {
    console.error = original;
  }
}

test("a rejected send is swallowed and the log carries the code only", async () => {
  const { senders } = harness(async () => {
    throw Object.assign(
      new Error(`could not deliver to ${APPLICANT_EMAIL} ${APPLICANT_PHONE}`),
      { code: "EDNS" },
    );
  });
  const { result, lines } = await captureErrors(() =>
    senders.sendBookingConfirmation(booking()),
  );
  assert.equal(result, undefined);
  assert.equal(lines.length, 1);
  assert.ok(!lines[0].includes(APPLICANT_EMAIL));
  assert.ok(!lines[0].includes("applicant"));
  assert.ok(!lines[0].includes("could not deliver"));
  assert.ok(lines[0].includes("Error"));
});

test("a Resend rejection logs its code and never its message", async () => {
  const { senders } = harness(async () => {
    throw new MailSendError("invalid_api_key");
  });
  const { lines } = await captureErrors(() =>
    senders.sendBookingConfirmation(booking()),
  );
  assert.equal(lines.length, 1);
  assert.ok(lines[0].includes("invalid_api_key"));
  assert.ok(!lines[0].includes(APPLICANT_EMAIL));
});

test("a non-error rejection is swallowed too", async () => {
  const { senders } = harness(async () => {
    throw `boom ${APPLICANT_EMAIL}`;
  });
  const { lines } = await captureErrors(() =>
    senders.sendCancellation(booking()),
  );
  assert.equal(lines.length, 1);
  assert.ok(!lines[0].includes(APPLICANT_EMAIL));
});

test("missing configuration fails loudly at send time and names variables only", async () => {
  const sent: OutgoingMail[] = [];
  const senders = createEmailSenders({
    transport: async (message) => {
      sent.push(message);
    },
    readConfig: () => readMailConfig({}),
    readInterviewerEmail: () => readInterviewerEmail({}),
    readInterviewerLocale: () => readInterviewerLocale({}),
    translatorFor,
  });
  const { lines } = await captureErrors(async () => {
    await senders.sendBookingConfirmation(booking());
    await senders.sendInterviewerNotification({
      ...booking(),
      phone: APPLICANT_PHONE,
    });
  });
  assert.equal(sent.length, 0);
  assert.equal(lines.length, 2);
  assert.ok(lines[0].includes("MailConfigError"));
  assert.ok(lines[0].includes("RESEND_API_KEY"));
  assert.ok(lines[1].includes("INTERVIEWER_EMAIL"));
  assert.ok(!lines.join().includes(APPLICANT_EMAIL));
});

test("an unknown slot is swallowed rather than thrown", async () => {
  const { senders, sent } = harness();
  const { lines } = await captureErrors(() =>
    senders.sendBookingConfirmation(booking({ slotId: "2026-11-28T03:00" })),
  );
  assert.equal(sent.length, 0);
  assert.equal(lines.length, 1);
  assert.ok(!lines[0].includes("03:00"));
});

test("importing the email module reads no configuration", async () => {
  for (const name of ["RESEND_API_KEY", "MAIL_FROM", "MAIL_REPLY_TO", "INTERVIEWER_EMAIL", "INTERVIEWER_LOCALE"]) {
    assert.equal(process.env[name], undefined, name);
  }
  const emailModule = await import("./index.ts");
  assert.equal(typeof emailModule.sendBookingConfirmation, "function");
});

test("configuration is validated when read", () => {
  assert.throws(() => readMailConfig({}), MailConfigError);
  assert.deepEqual(readMailConfig({
    RESEND_API_KEY: "k",
    MAIL_FROM: "Someone <a@b.example>",
    MAIL_REPLY_TO: "r@b.example",
  }), { apiKey: "k", from: "a@b.example", replyTo: "r@b.example" });
  assert.throws(() => readMailConfig({
    RESEND_API_KEY: "k",
    MAIL_FROM: "a@b.example\r\nBcc: x@y.example",
    MAIL_REPLY_TO: "r@b.example",
  }), MailConfigError);
});

test("confirmation is addressed to the applicant with the Court House+ headers", async () => {
  const { senders, sent } = harness();
  await senders.sendBookingConfirmation(booking());
  assert.equal(sent.length, 1);
  const [message] = sent;
  assert.equal(message.to, APPLICANT_EMAIL);
  assert.equal(message.from, '"Court House+" <bookings@sender.example>');
  assert.equal(message.replyTo, "hello@courthouse.example");
});

test("confirmation carries the facts the screen shows and the calendar file", async () => {
  const { senders, sent } = harness();
  await senders.sendBookingConfirmation(booking());
  const [message] = sent;
  const addressLead = translatorFor("en")("venue.address").match(/[\p{L}\p{N}]{3,}/u)?.[0] ?? "";
  assert.ok(addressLead.length >= 3, "venue.address has no plain word to look for");
  for (const fact of ["11:00 AM", "Saturday 28 November 2026", "15 minutes", addressLead]) {
    assert.ok(message.html.includes(fact), `html: ${fact}`);
    assert.ok(message.text.includes(fact), `text: ${fact}`);
  }
  assert.equal(message.attachments?.length, 1);
  const [attachment] = message.attachments ?? [];
  assert.equal(attachment.filename, "interview.ics");
  assert.match(attachment.contentType, /^text\/calendar/);
  const rawIcs = attachment.content.toString("utf8");
  assert.ok(rawIcs.startsWith("BEGIN:VCALENDAR\r\n"));
  const ics = rawIcs.replace(/\r\n[ \t]/g, "");
  assert.ok(ics.includes("DTSTART:20261128T080000Z"));
  assert.ok(ics.includes(addressLead));
});

test("the applicant's locale picks the language, direction and subject", async () => {
  const { senders, sent } = harness();
  await senders.sendBookingConfirmation(booking({ locale: "ar" }));
  await senders.sendBookingConfirmation(booking({ locale: "en" }));
  const [ar, en] = sent;
  assert.ok(ar.html.includes('<html lang="ar" dir="rtl">'));
  assert.ok(en.html.includes('<html lang="en" dir="ltr">'));
  assert.notEqual(ar.subject, en.subject);
  assert.ok(!en.subject.includes("TODO-AR"));
});

test("Arabic bodies isolate times, dates and numbers", async () => {
  const { senders, sent } = harness();
  await senders.sendBookingConfirmation(booking({ locale: "ar" }));
  const [message] = sent;
  assert.ok(message.html.includes('<span dir="ltr">11:00</span>'));
  const liveDate = translatorFor("ar")("booking.eventDate");
  const dateDigits = liveDate.match(/[0-9]+/)?.[0];
  if (dateDigits !== undefined) {
    assert.ok(
      new RegExp(`<span dir="ltr">[^<]*${dateDigits}[^<]*</span>`).test(message.html),
      "the Arabic date digits are isolated",
    );
  }
  assert.ok(message.text.includes("\u200E"));
});

test("English bodies carry no isolation markup or marks", async () => {
  const { senders, sent } = harness();
  await senders.sendBookingConfirmation(booking());
  const [message] = sent;
  assert.ok(!message.html.includes('dir="ltr">1'));
  assert.ok(!message.text.includes("\u200E"));
});

test("applicant text is escaped in HTML", async () => {
  const { senders, sent } = harness();
  await senders.sendBookingConfirmation(
    booking({ name: '<img src=x onerror="alert(1)">' }),
  );
  const [message] = sent;
  assert.ok(message.html.includes("&lt;img"));
  assert.ok(!message.html.includes(`onerror="`));
  assert.equal(message.html.split("<img").length - 1, 1);
  assert.match(message.html, /<img src="[^"]*\/logo-email\.png"/);
});

test("the interviewer is notified with the applicant's details and no attachment", async () => {
  const { senders, sent } = harness();
  await senders.sendInterviewerNotification({
    ...booking({ locale: "ar" }),
    phone: APPLICANT_PHONE,
  });
  const [message] = sent;
  assert.equal(message.to, "interviewer@courthouse.example");
  assert.equal(message.replyTo, "hello@courthouse.example");
  assert.equal(message.attachments, undefined);
  assert.ok(message.html.includes('lang="en"'));
  assert.ok(message.subject.includes("11:00 AM"));
  for (const detail of ["Layla Haddad", APPLICANT_EMAIL, APPLICANT_PHONE]) {
    assert.ok(message.text.includes(detail), detail);
  }
});

test("the interviewer is still notified when the applicant's mail is rejected", async () => {
  const sent: OutgoingMail[] = [];
  const { senders } = harness(async (message) => {
    if (message.to === APPLICANT_EMAIL) {
      throw new MailSendError("validation_error");
    }
    sent.push(message);
  });
  await captureErrors(async () => {
    await Promise.all([
      senders.sendBookingConfirmation(booking()),
      senders.sendInterviewerNotification({
        ...booking(),
        phone: APPLICANT_PHONE,
      }),
    ]);
  });
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "interviewer@courthouse.example");
});

test("cancellation goes to the applicant in their locale with the freed time and no attachment", async () => {
  const { senders, sent } = harness();
  await senders.sendCancellation(booking({ locale: "ar" }));
  await senders.sendCancellation(booking({ locale: "en" }));
  const [ar, en] = sent;
  assert.equal(ar.to, APPLICANT_EMAIL);
  assert.ok(ar.html.includes('lang="ar"'));
  assert.notEqual(ar.subject, en.subject);
  assert.ok(en.html.includes('lang="en"'));
  assert.ok(en.text.includes("11:00 AM"));
  assert.equal(en.attachments, undefined);
  assert.equal(en.replyTo, "hello@courthouse.example");
  assert.equal(en.from, '"Court House+" <bookings@sender.example>');
});

test("every message repeats that it was sent on behalf of Court House+", async () => {
  const { senders, sent } = harness();
  await senders.sendBookingConfirmation(booking());
  await senders.sendCancellation(booking());
  for (const message of sent) {
    assert.ok(message.text.includes("on behalf of Court House+"));
  }
});

test("interviewer locale comes from the environment and defaults to Arabic", () => {
  assert.equal(readInterviewerLocale({}), "ar");
  assert.equal(readInterviewerLocale({ INTERVIEWER_LOCALE: "en" }), "en");
  assert.equal(readInterviewerLocale({ INTERVIEWER_LOCALE: " EN " }), "en");
  assert.equal(readInterviewerLocale({ INTERVIEWER_LOCALE: "fr" }), "ar");
});

test("the notification renders in the configured interviewer locale", async () => {
  const sent: OutgoingMail[] = [];
  const senders = createEmailSenders({
    transport: async (message) => {
      sent.push(message);
    },
    readConfig: () => CONFIG,
    readInterviewerEmail: () => "interviewer@courthouse.example",
    readInterviewerLocale: () => "ar",
    translatorFor,
  });
  await senders.sendInterviewerNotification({ ...booking(), phone: APPLICANT_PHONE });
  assert.ok(sent[0].html.includes('<html lang="ar" dir="rtl">'));
});

test("label and value cells are separated on the correct side in both directions", async () => {
  const { senders, sent } = harness();
  await senders.sendBookingConfirmation(booking({ locale: "en" }));
  await senders.sendBookingConfirmation(booking({ locale: "ar" }));
  const [en, ar] = sent;
  assert.ok(en.html.includes("padding:6px 16px 6px 0"));
  assert.ok(ar.html.includes("padding:6px 0 6px 16px"));
});

test("the document declares its charset", async () => {
  const { senders, sent } = harness();
  await senders.sendBookingConfirmation(booking());
  assert.ok(sent[0].html.includes('<meta charset="utf-8">'));
});

test("a missing translation key is logged by name and code only", async () => {
  const t = translatorFor("en");
  const { lines } = await captureErrors(async () => {
    t("email.nothing.here");
  });
  assert.equal(lines.length, 1);
  assert.ok(lines[0].includes("email translation problem"));
  assert.ok(!lines[0].includes("nothing"));
});

test("sendCancellation reports whether the email went", async () => {
  const delivered = harness(async () => undefined);
  assert.equal(await delivered.senders.sendCancellation(booking()), true);
  const failing = harness(async () => {
    throw new MailSendError("invalid_api_key");
  });
  const { result } = await captureErrors(() =>
    failing.senders.sendCancellation(booking()),
  );
  assert.equal(result, false);
});
