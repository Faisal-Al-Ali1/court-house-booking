import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MailSendError,
  createResendTransport,
  formatFrom,
  type ResendLike,
} from "./client.ts";
import type { OutgoingMail } from "./types.ts";

const MESSAGE: OutgoingMail = {
  from: formatFrom("bookings@sender.example"),
  to: "applicant@example.com",
  replyTo: "hello@courthouse.example",
  subject: "Subject",
  html: "<p>Hi</p>",
  text: "Hi",
  attachments: [
    {
      filename: "interview.ics",
      content: Buffer.from("BEGIN:VCALENDAR"),
      contentType: "text/calendar; charset=utf-8",
    },
  ],
};

test("the display name is Court House+", () => {
  assert.equal(
    formatFrom("a@b.example"),
    '"Court House+" <a@b.example>',
  );
});

test("a Resend error response becomes a MailSendError carrying only the code", async () => {
  const client: ResendLike = {
    emails: {
      send: async () => ({ error: { name: "invalid_api_key" } }),
    },
  };
  const transport = createResendTransport(() => "bad", () => client);
  await assert.rejects(transport(MESSAGE), (error: unknown) => {
    assert.ok(error instanceof MailSendError);
    assert.equal(error.code, "invalid_api_key");
    assert.ok(!error.message.includes("applicant"));
    return true;
  });
});

test("the payload reaches the client with headers and the attachment intact", async () => {
  const payloads: unknown[] = [];
  const client: ResendLike = {
    emails: {
      send: async (payload) => {
        payloads.push(payload);
        return { error: null };
      },
    },
  };
  const keys: string[] = [];
  const transport = createResendTransport(
    () => "key-1",
    (apiKey) => {
      keys.push(apiKey);
      return client;
    },
  );
  await transport(MESSAGE);
  assert.deepEqual(keys, ["key-1"]);
  assert.deepEqual(payloads, [
    {
      from: MESSAGE.from,
      to: MESSAGE.to,
      replyTo: MESSAGE.replyTo,
      subject: MESSAGE.subject,
      html: MESSAGE.html,
      text: MESSAGE.text,
      attachments: MESSAGE.attachments,
    },
  ]);
});

test("the API key is read when sending, not when the transport is built", async () => {
  let reads = 0;
  const transport = createResendTransport(
    () => {
      reads += 1;
      return "late";
    },
    () => ({ emails: { send: async () => ({ error: null }) } }),
  );
  assert.equal(reads, 0);
  await transport(MESSAGE);
  assert.equal(reads, 1);
});
