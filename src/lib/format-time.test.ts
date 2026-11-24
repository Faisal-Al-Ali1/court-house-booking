import { test } from "node:test";
import assert from "node:assert/strict";
import { formatSlotTime } from "./format-time.ts";
import { generateSlots } from "./slots.ts";

test("formats 12-hour times with Western digits", () => {
  const [first] = generateSlots();
  assert.equal(formatSlotTime(first, "en"), "10:00 AM");
  assert.equal(formatSlotTime(first, "ar"), "10:00 ص");
});

test("afternoon and evening take the PM marker", () => {
  const slots = generateSlots();
  const oneForty = slots.find((s) => s.id === "2026-11-28T13:40");
  const nineForty = slots.find((s) => s.id === "2026-11-28T21:40");
  assert.ok(oneForty && nineForty);
  assert.equal(formatSlotTime(oneForty, "en"), "1:40 PM");
  assert.equal(formatSlotTime(nineForty, "ar"), "9:40 م");
});

test("noon and midnight boundaries read as 12, not 0", () => {
  const noon = generateSlots().find((s) => s.id === "2026-11-28T12:00");
  assert.ok(noon);
  assert.equal(formatSlotTime(noon, "en"), "12:00 PM");
});
