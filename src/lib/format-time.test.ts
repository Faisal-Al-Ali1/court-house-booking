import { test } from "node:test";
import assert from "node:assert/strict";
import { formatBreakRange, formatSlotTime } from "./format-time.ts";
import { generateSlots, slotWindows } from "./slots.ts";

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

test("the break between windows reads as one en-dash range", () => {
  const [morning, evening] = slotWindows();
  assert.equal(
    formatBreakRange(morning.endMinutes, evening.startMinutes, "en"),
    "2:00 – 4:00 PM",
  );
  assert.equal(
    formatBreakRange(morning.endMinutes, evening.startMinutes, "ar"),
    "2:00 – 4:00 م",
  );
});

test("a break across noon keeps both markers", () => {
  assert.equal(formatBreakRange(11 * 60, 13 * 60, "en"), "11:00 AM – 1:00 PM");
});

test("slot windows follow the event configuration", () => {
  assert.deepEqual(
    slotWindows().map((w) => [w.startMinutes, w.endMinutes]),
    [
      [600, 840],
      [960, 1320],
    ],
  );
});
