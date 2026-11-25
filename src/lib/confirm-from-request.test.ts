import { test } from "node:test";
import assert from "node:assert/strict";
import { confirmFromRequest } from "./confirm-from-request.ts";
import { signRef } from "./signed-ref.ts";
import type { Result } from "../core/types/results/results.ts";
import type { Booking } from "../repositories/bookings/types.ts";

const SECRET = "test-secret";
const SLOT = "2026-11-28T16:00";
const booking: Booking = {
  slotId: SLOT,
  name: "A",
  email: "a@example.com",
  phone: "0790000000",
  locale: "en",
  createdAt: new Date(),
  cancelledAt: null,
  attendance: null,
};

function loader(result: Result<Booking[]>) {
  const calls = { count: 0 };
  return {
    calls,
    loadActive: async () => {
      calls.count += 1;
      return result;
    },
  };
}

const ok: Result<Booking[]> = { type: "success", data: [booking] };
const getSecret = () => SECRET;

test("a signed cookie and matching slot confirm", async () => {
  const { loadActive } = loader(ok);
  assert.equal(
    await confirmFromRequest({ booked: SLOT, cookie: signRef("a@example.com", SECRET), getSecret, loadActive }),
    SLOT,
  );
});

test("a hand-set unsigned or tampered cookie confirms nothing and never reads the database", async () => {
  const { loadActive, calls } = loader(ok);
  for (const cookie of ["a@example.com", signRef("a@example.com", "other"), "x.y"]) {
    assert.equal(await confirmFromRequest({ booked: SLOT, cookie, getSecret, loadActive }), null);
  }
  assert.equal(calls.count, 0);
});

test("a repeated booked parameter arrives as an array and confirms nothing", async () => {
  const { loadActive, calls } = loader(ok);
  assert.equal(
    await confirmFromRequest({ booked: [SLOT, SLOT], cookie: signRef("a@example.com", SECRET), getSecret, loadActive }),
    null,
  );
  assert.equal(calls.count, 0);
});

test("a listActive failure confirms nothing", async () => {
  const failed: Result<Booking[]> = {
    type: "failure",
    failure: { code: "database-error" } as Extract<Result<Booking[]>, { type: "failure" }>["failure"],
  };
  const { loadActive } = loader(failed);
  assert.equal(
    await confirmFromRequest({ booked: SLOT, cookie: signRef("a@example.com", SECRET), getSecret, loadActive }),
    null,
  );
});

test("a missing secret logs loudly and confirms nothing instead of throwing", async () => {
  const { loadActive, calls } = loader(ok);
  const logged: unknown[][] = [];
  const original = console.error;
  console.error = (...args: unknown[]) => {
    logged.push(args);
  };
  try {
    const result = await confirmFromRequest({
      booked: SLOT,
      cookie: signRef("a@example.com", SECRET),
      getSecret: () => {
        throw new Error("SESSION_SECRET is not set");
      },
      loadActive,
    });
    assert.equal(result, null);
  } finally {
    console.error = original;
  }
  assert.equal(calls.count, 0);
  assert.equal(logged.length, 1);
  assert.match(JSON.stringify(logged[0]), /SESSION_SECRET/);
});

test("no cookie means the secret is never needed", async () => {
  const { loadActive } = loader(ok);
  assert.equal(
    await confirmFromRequest({
      booked: SLOT,
      cookie: undefined,
      getSecret: () => {
        throw new Error("must not be called");
      },
      loadActive,
    }),
    null,
  );
});
