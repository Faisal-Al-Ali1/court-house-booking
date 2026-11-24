import { test } from "node:test";
import assert from "node:assert/strict";
import { runCancel, type CancelDeps } from "./cancel-flow.ts";
import type { Booking } from "../repositories/bookings/types.ts";
import { BOOKING_ERROR_CODES } from "../repositories/bookings/types.ts";

const SLOT = "2026-11-28T10:00";

const BOOKING: Booking = {
  slotId: SLOT,
  name: "Layla Haddad",
  email: "layla@example.com",
  phone: "+962791234567",
  locale: "ar",
  createdAt: new Date("2026-11-25T08:30:00Z"),
  cancelledAt: null,
};

function harness(overrides: Partial<CancelDeps> = {}) {
  const calls = { cancel: 0, notify: 0 };
  const deps: CancelDeps = {
    isSignedIn: async () => true,
    isValidSlotId: () => true,
    repo: {
      listActive: async () => ({ type: "success", data: [BOOKING] }),
      cancel: async () => {
        calls.cancel += 1;
        return { type: "success", data: null };
      },
    },
    notify: async () => {
      calls.notify += 1;
      return true;
    },
    ...overrides,
  };
  return { deps, calls };
}

async function silently<T>(run: () => Promise<T>): Promise<T> {
  const original = console.error;
  console.error = () => undefined;
  try {
    return await run();
  } finally {
    console.error = original;
  }
}

test("without a session nothing is read, cancelled or emailed", async () => {
  const { deps, calls } = harness({ isSignedIn: async () => false });
  let listed = 0;
  deps.repo.listActive = async () => {
    listed += 1;
    return { type: "success", data: [BOOKING] };
  };
  assert.equal(await runCancel(SLOT, deps), "signed-out");
  assert.equal(listed, 0);
  assert.equal(calls.cancel, 0);
  assert.equal(calls.notify, 0);
});

test("a cancelled booking whose email went reports notified", async () => {
  const { deps, calls } = harness();
  assert.equal(await runCancel(SLOT, deps), "notified");
  assert.equal(calls.cancel, 1);
  assert.equal(calls.notify, 1);
});

test("a cancelled booking whose email failed says so and still frees the slot", async () => {
  const { deps, calls } = harness({ notify: async () => false });
  assert.equal(await runCancel(SLOT, deps), "not-notified");
  assert.equal(calls.cancel, 1);
});

test("an unknown slot is refused before any lookup", async () => {
  const { deps, calls } = harness({ isValidSlotId: () => false });
  assert.equal(await runCancel("nope", deps), "failed");
  assert.equal(calls.cancel, 0);
});

test("a slot with no active booking sends no email", async () => {
  const { deps, calls } = harness();
  deps.repo.listActive = async () => ({ type: "success", data: [] });
  assert.equal(await runCancel(SLOT, deps), "gone");
  assert.equal(calls.notify, 0);
});

test("losing the race to another cancel sends no email", async () => {
  const { deps, calls } = harness();
  deps.repo.cancel = async () => ({
    type: "failure",
    failure: {
      type: "server",
      code: BOOKING_ERROR_CODES.notFound,
      message: "x",
    },
  });
  assert.equal(await runCancel(SLOT, deps), "gone");
  assert.equal(calls.notify, 0);
});

test("a database failure is reported as failed and sends no email", async () => {
  const { deps, calls } = harness();
  deps.repo.cancel = async () => ({
    type: "failure",
    failure: {
      type: "server",
      code: BOOKING_ERROR_CODES.database,
      message: "secret layla@example.com",
    },
  });
  assert.equal(await silently(() => runCancel(SLOT, deps)), "failed");
  assert.equal(calls.notify, 0);
});
