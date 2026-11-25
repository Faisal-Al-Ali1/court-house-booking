import { test } from "node:test";
import assert from "node:assert/strict";
import { runWalkIn, type WalkInDeps, type WalkInInput } from "./walk-in-flow.ts";
import { generateSlots } from "./slots.ts";
import type { Booking, SlotClaim } from "../repositories/bookings/types.ts";
import type { Result } from "../core/types/results/results.ts";

const SLOT = generateSlots()[0].id;
const NOW = new Date("2026-11-20T09:00:00.000Z");

const input: WalkInInput = {
  slotId: SLOT,
  name: "Walk In",
  email: "Walk.In@Example.com",
  phone: "0790000000",
  consent: true,
  locale: "ar",
};

function deps(
  overrides: {
    signedIn?: boolean;
    claim?: SlotClaim;
    failure?: boolean;
  } = {},
): WalkInDeps & { stored: Booking[]; notified: Booking[] } {
  const stored: Booking[] = [];
  const notified: Booking[] = [];
  return {
    stored,
    notified,
    isSignedIn: async () => overrides.signedIn ?? true,
    isValidSlotId: (slotId) => generateSlots().some((s) => s.id === slotId),
    repo: {
      create: async (booking: Booking): Promise<Result<SlotClaim>> => {
        if (overrides.failure) {
          return {
            type: "failure",
            failure: { type: "server", code: "database-error", message: "nope" },
          };
        }
        stored.push(booking);
        return { type: "success", data: overrides.claim ?? "created" };
      },
    },
    notify: (booking) => {
      notified.push(booking);
    },
    now: () => NOW,
  };
}

test("a signed-out interviewer cannot add anyone", async () => {
  const d = deps({ signedIn: false });
  assert.deepEqual(await runWalkIn(input, d), { status: "signed-out" });
  assert.equal(d.stored.length, 0);
});

test("an unknown slot is refused before anything is written", async () => {
  const d = deps();
  assert.deepEqual(await runWalkIn({ ...input, slotId: "nope" }, d), {
    status: "failed",
  });
  assert.equal(d.stored.length, 0);
});

test("a valid walk-in is stored and the applicant is emailed", async () => {
  const d = deps();
  assert.deepEqual(await runWalkIn(input, d), { status: "added" });
  assert.equal(d.stored.length, 1);
  assert.equal(d.notified.length, 1);
  assert.equal(d.stored[0].slotId, SLOT);
  assert.equal(d.stored[0].cancelledAt, null);
  assert.equal(d.stored[0].attendance, null);
  assert.equal(d.stored[0].createdAt, NOW);
});

test("every bad field is reported at once and nothing is written", async () => {
  const d = deps();
  const outcome = await runWalkIn(
    { ...input, name: "", email: "nope", phone: "" },
    d,
  );
  assert.equal(outcome.status, "invalid");
  assert.deepEqual(outcome.status === "invalid" ? outcome.errors : null, {
    name: "nameRequired",
    email: "emailInvalid",
    phone: "phoneRequired",
  });
  assert.equal(d.stored.length, 0);
});

test("an unconfirmed walk-in is refused like any other missing consent", async () => {
  const d = deps();
  const outcome = await runWalkIn({ ...input, consent: false }, d);
  assert.equal(outcome.status, "invalid");
  assert.equal(
    outcome.status === "invalid" ? outcome.errors.consent : null,
    "consentRequired",
  );
  assert.equal(d.stored.length, 0);
});

test("a slot taken between opening the form and saving is reported", async () => {
  const d = deps({ claim: "slot-taken" });
  assert.deepEqual(await runWalkIn(input, d), { status: "slot-taken" });
  assert.equal(d.notified.length, 0);
});

test("someone who already holds another slot is reported, not duplicated", async () => {
  const d = deps({ claim: "already-booked" });
  assert.deepEqual(await runWalkIn(input, d), { status: "already-booked" });
  assert.equal(d.notified.length, 0);
});

test("re-adding the same person to the same slot is not a second booking", async () => {
  const d = deps({ claim: "idempotent" });
  assert.deepEqual(await runWalkIn(input, d), { status: "already-booked" });
  assert.equal(d.notified.length, 0);
});

test("a database failure is reported and nobody is emailed", async () => {
  const d = deps({ failure: true });
  assert.deepEqual(await runWalkIn(input, d), { status: "failed" });
  assert.equal(d.notified.length, 0);
});

test("the stored email is normalised the same way the public form normalises it", async () => {
  const d = deps();
  await runWalkIn(input, d);
  assert.equal(d.stored[0].email, "walk.in@example.com");
});
