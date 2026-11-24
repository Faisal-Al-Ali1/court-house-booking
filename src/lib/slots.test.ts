import { test } from "node:test";
import assert from "node:assert/strict";
import { EVENT_CONFIG } from "../core/config/event.ts";
import {
  generateSlots,
  isSlotPast,
  isValidSlotId,
  slotStartUtc,
} from "./slots.ts";

test("generates exactly 30 slots", () => {
  assert.equal(generateSlots().length, 30);
});

test("morning window runs 10:00 to 13:40 inclusive", () => {
  const morning = generateSlots().filter((s) => s.startMinutes < 14 * 60);
  assert.equal(morning.length, 12);
  assert.equal(morning[0].id, "2026-11-28T10:00");
  assert.equal(morning[11].id, "2026-11-28T13:40");
});

test("no slot starts during the break", () => {
  const inBreak = generateSlots().filter(
    (s) => s.startMinutes >= 14 * 60 && s.startMinutes < 16 * 60,
  );
  assert.equal(inBreak.length, 0);
});

test("evening window runs 16:00 to 21:40 inclusive", () => {
  const evening = generateSlots().filter((s) => s.startMinutes >= 16 * 60);
  assert.equal(evening.length, 18);
  assert.equal(evening[17].id, "2026-11-28T21:40");
});

test("every interview finishes inside its window", () => {
  for (const slot of generateSlots()) {
    const end = slot.startMinutes + EVENT_CONFIG.interviewMinutes;
    assert.ok(end <= 14 * 60 || (slot.startMinutes >= 16 * 60 && end <= 22 * 60));
  }
});

test("slot ids round-trip through validation", () => {
  assert.ok(isValidSlotId("2026-11-28T10:00"));
  assert.ok(!isValidSlotId("2026-11-28T14:00"));
  assert.ok(!isValidSlotId("2026-11-28T10:01"));
  assert.ok(!isValidSlotId("nonsense"));
});

test("start times convert to UTC at a fixed +03:00", () => {
  const [first] = generateSlots();
  assert.equal(slotStartUtc(first).toISOString(), "2026-11-28T07:00:00.000Z");
});

test("a slot is past only when Amman wall-clock has gone by", () => {
  const [first] = generateSlots();
  assert.ok(isSlotPast(first, new Date("2026-11-28T08:00:00.000Z")));
  assert.ok(!isSlotPast(first, new Date("2026-11-28T06:00:00.000Z")));
});

test("a slot starting exactly now counts as past", () => {
  const [first] = generateSlots();
  assert.ok(isSlotPast(first, slotStartUtc(first)));
  assert.ok(!isSlotPast(first, new Date(slotStartUtc(first).getTime() - 1)));
});
