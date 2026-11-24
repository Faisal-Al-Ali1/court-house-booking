import { test } from "node:test";
import assert from "node:assert/strict";
import { claimOutcomeToState, failureCodeToState } from "./booking-outcome.ts";

const t = (key: string) => `T:${key}`;
const SLOT = "2026-11-28T10:00";

test("created is a success carrying the slot", () => {
  assert.deepEqual(claimOutcomeToState("created", SLOT, t), { status: "success", slotId: SLOT });
});

test("idempotent is a success, not a failure", () => {
  assert.deepEqual(claimOutcomeToState("idempotent", SLOT, t), { status: "success", slotId: SLOT });
});

test("slot-taken maps to the slotTaken message", () => {
  assert.deepEqual(claimOutcomeToState("slot-taken", SLOT, t), { status: "error", message: "T:slotTaken" });
});

test("already-booked maps to the alreadyBooked message", () => {
  assert.deepEqual(claimOutcomeToState("already-booked", SLOT, t), { status: "error", message: "T:alreadyBooked" });
});

test("an unknown or missing claim falls back to the generic message", () => {
  assert.deepEqual(claimOutcomeToState("bogus", SLOT, t), { status: "error", message: "T:unexpected" });
  assert.deepEqual(claimOutcomeToState(undefined, SLOT, t), { status: "error", message: "T:unexpected" });
});

test("each repository code resolves to its key", () => {
  assert.equal(failureCodeToState("unknown-slot", t).message, "T:slotInvalid");
  assert.equal(failureCodeToState("slot-past", t).message, "T:slotPast");
  assert.equal(failureCodeToState("retry", t).message, "T:unexpected");
  assert.equal(failureCodeToState("not-found", t).message, "T:unexpected");
  assert.equal(failureCodeToState("database-error", t).message, "T:unexpected");
});

test("an unknown, prototype-named or missing code falls back", () => {
  for (const code of ["nope", "constructor", "__proto__", "toString", undefined]) {
    assert.deepEqual(failureCodeToState(code, t), { status: "error", message: "T:unexpected" });
  }
});
