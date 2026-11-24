import { test } from "node:test";
import assert from "node:assert/strict";
import { bookingSchema } from "../app/[locale]/schemas/booking-schema.ts";
import { generateSlots } from "./slots.ts";

const VALID_SLOT = generateSlots()[0].id;

function valid(overrides: Record<string, string> = {}) {
  return {
    name: "Layla Hassan",
    email: "layla@example.com",
    phone: "0791234567",
    slotId: VALID_SLOT,
    consent: "on",
    ...overrides,
  };
}

function messagesFor(input: Record<string, string>, field: string): string[] {
  const result = bookingSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues
    .filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message);
}

test("accepts a fully valid submission", () => {
  assert.equal(bookingSchema.safeParse(valid()).success, true);
});

test("rejects a blank email", () => {
  assert.deepEqual(messagesFor(valid({ email: "" }), "email"), ["emailInvalid"]);
});

test("rejects a whitespace-only email", () => {
  assert.deepEqual(messagesFor(valid({ email: "   " }), "email"), ["emailInvalid"]);
});

test("trims and lowercases a padded email", () => {
  const result = bookingSchema.parse(valid({ email: "  Layla@Example.COM  " }));
  assert.equal(result.email, "layla@example.com");
});

test("normalises an Arabic-Indic phone to ASCII", () => {
  const result = bookingSchema.parse(valid({ phone: "٠٧٩١٢٣٤٥٦٧" }));
  assert.equal(result.phone, "0791234567");
});

test("normalises an Eastern Arabic-Indic phone to ASCII", () => {
  const result = bookingSchema.parse(valid({ phone: "۰۷۹۱۲۳۴۵۶۷" }));
  assert.equal(result.phone, "0791234567");
});

test("normalises a decomposed name to NFC", () => {
  const decomposed = "Jose\u0301";
  const result = bookingSchema.parse(valid({ name: decomposed }));
  assert.equal(result.name, "Jos\u00e9");
  assert.notEqual(result.name, decomposed);
});

test("rejects a slot id outside the generated grid", () => {
  assert.deepEqual(
    messagesFor(valid({ slotId: "2026-11-28T10:07" }), "slotId"),
    ["slotInvalid"],
  );
});

test("rejects a missing consent checkbox", () => {
  assert.deepEqual(messagesFor(valid({ consent: "" }), "consent"), ["consentRequired"]);
});
