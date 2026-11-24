import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveConfirmedSlot } from "./resolve-confirmed-slot.ts";
import { bookedCookieExpiry } from "./booked-cookie.ts";

const SLOT = "2026-11-28T16:00";
const live = { slotId: SLOT, email: "a@example.com", cancelledAt: null };

test("a live booking matching cookie and slot is confirmed", () => {
  assert.equal(
    resolveConfirmedSlot({ booked: SLOT, cookieEmail: "a@example.com", activeBookings: [live] }),
    SLOT,
  );
});

test("the cookie email is compared case-insensitively", () => {
  assert.equal(
    resolveConfirmedSlot({ booked: SLOT, cookieEmail: "A@Example.com", activeBookings: [live] }),
    SLOT,
  );
});

test("a missing cookie or parameter confirms nothing", () => {
  assert.equal(resolveConfirmedSlot({ booked: SLOT, cookieEmail: undefined, activeBookings: [live] }), null);
  assert.equal(resolveConfirmedSlot({ booked: undefined, cookieEmail: "a@example.com", activeBookings: [live] }), null);
});

test("a cancelled booking confirms nothing", () => {
  const cancelled = { ...live, cancelledAt: new Date() };
  assert.equal(
    resolveConfirmedSlot({ booked: SLOT, cookieEmail: "a@example.com", activeBookings: [cancelled] }),
    null,
  );
});

test("a slot rebooked by someone else confirms nothing for the old holder", () => {
  const other = { slotId: SLOT, email: "b@example.com", cancelledAt: null };
  assert.equal(
    resolveConfirmedSlot({ booked: SLOT, cookieEmail: "a@example.com", activeBookings: [other] }),
    null,
  );
});

test("a forged slot the cookie holder does not hold confirms nothing", () => {
  assert.equal(
    resolveConfirmedSlot({ booked: "2026-11-28T17:00", cookieEmail: "a@example.com", activeBookings: [live] }),
    null,
  );
});

test("the cookie expires at the end of the event day in Amman", () => {
  assert.equal(bookedCookieExpiry().toISOString(), "2026-11-28T21:00:00.000Z");
});
