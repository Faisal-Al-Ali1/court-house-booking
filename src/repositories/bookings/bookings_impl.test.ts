import { execFile } from "node:child_process";
import { after, before, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { promisify } from "node:util";
import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import { generateSlots, slotStartUtc } from "../../lib/slots.ts";
import type { Result } from "../../core/types/results/results.ts";
import type { BookingsImpl as BookingsImplType } from "./bookings_impl.ts";
import type { Booking, SlotClaim } from "./types.ts";

const run = promisify(execFile);
const DB_NAME = "court_house_test";
const SLOTS = generateSlots();
const BEFORE_EVENT = new Date("2026-11-20T09:00:00.000Z");

let server: MongoMemoryServer;
let client: MongoClient;
let BookingsImpl: typeof BookingsImplType;
let repo: BookingsImplType;

function booking(slotIndex: number, email: string): Booking {
  return {
    slotId: SLOTS[slotIndex].id,
    name: "Test Person",
    email,
    phone: "+962790000000",
    locale: "en",
    createdAt: BEFORE_EVENT,
    cancelledAt: null,
  };
}

function dataOf<T>(result: Result<T>): T {
  assert.equal(result.type, "success");
  assert.ok(result.type === "success" && result.data !== undefined);
  return result.data as T;
}

before(async () => {
  server = await MongoMemoryServer.create();
  const uri = server.getUri();
  process.env.MONGODB_URI = uri;
  process.env.MONGODB_DB = DB_NAME;
  await run(process.execPath, ["scripts/ensure-indexes.mjs"], {
    env: process.env,
  });
  client = new MongoClient(uri);
  await client.connect();
  ({ BookingsImpl } = await import("./bookings_impl.ts"));
  repo = new BookingsImpl(() => BEFORE_EVENT);
});

beforeEach(async () => {
  await client.db(DB_NAME).collection("bookings").deleteMany({});
});

after(async () => {
  await client.close();
  const pooled = (globalThis as { mongoClientPromise?: Promise<MongoClient> })
    .mongoClientPromise;
  if (pooled) {
    await (await pooled).close();
  }
  await server.stop();
});

test("both unique indexes exist and are partial on cancelledAt null", async () => {
  const indexes = await client.db(DB_NAME).collection("bookings").indexes();
  for (const field of ["slotId", "email"]) {
    const index = indexes.find((entry) => field in entry.key);
    assert.ok(index, `${field} index missing`);
    assert.equal(index.unique, true);
    assert.deepEqual(index.partialFilterExpression, { cancelledAt: null });
  }
});

test("insert, same slot, same email other slot, same email same slot, cancel, re-insert", async () => {
  assert.equal(dataOf(await repo.create(booking(0, "a@example.com"))), "created");
  assert.equal(dataOf(await repo.create(booking(0, "b@example.com"))), "slot-taken");
  assert.equal(dataOf(await repo.create(booking(1, "a@example.com"))), "already-booked");
  assert.equal(dataOf(await repo.create(booking(0, "a@example.com"))), "idempotent");

  const cancelled = await repo.cancel(SLOTS[0].id);
  assert.equal(cancelled.type, "success");

  assert.equal(dataOf(await repo.create(booking(0, "b@example.com"))), "created");
  assert.equal(dataOf(await repo.create(booking(1, "a@example.com"))), "created");
});

test("a cancelled booking survives for the export but frees slot and email", async () => {
  await repo.create(booking(2, "c@example.com"));
  await repo.cancel(SLOTS[2].id);

  assert.deepEqual(dataOf(await repo.listActive()), []);
  assert.deepEqual(dataOf(await repo.takenSlotIds()), []);
  const all = dataOf(await repo.listAll());
  assert.equal(all.length, 1);
  assert.ok(all[0].cancelledAt instanceof Date);
});

test("takenSlotIds and listActive report only active bookings", async () => {
  await repo.create(booking(0, "a@example.com"));
  await repo.create(booking(1, "b@example.com"));
  await repo.create(booking(2, "c@example.com"));
  await repo.cancel(SLOTS[1].id);

  assert.deepEqual(
    dataOf(await repo.takenSlotIds()).sort(),
    [SLOTS[0].id, SLOTS[2].id],
  );
  assert.equal(dataOf(await repo.listActive()).length, 2);
  assert.equal(dataOf(await repo.listAll()).length, 3);
});

test("emails differing only in case or padding are the same person", async () => {
  assert.equal(dataOf(await repo.create(booking(0, "Mixed@Example.com"))), "created");
  assert.equal(dataOf(await repo.create(booking(1, "  mixed@example.com "))), "already-booked");
  assert.equal(dataOf(await repo.create(booking(0, "MIXED@example.com"))), "idempotent");
});

test("cancelling a slot with no active booking is a failure", async () => {
  const result = await repo.cancel(SLOTS[5].id);
  assert.equal(result.type, "failure");
});

test("an unknown slot id is rejected and nothing is written", async () => {
  const result = await repo.create({ ...booking(0, "a@example.com"), slotId: "2026-11-28T14:00" });
  assert.equal(result.type, "failure");
  assert.equal(dataOf(await repo.listAll()).length, 0);
});

test("a slot already started is rejected, including exactly at its start", async () => {
  const start = slotStartUtc(SLOTS[3]);
  const atStart = new BookingsImpl(() => start);
  const justBefore = new BookingsImpl(() => new Date(start.getTime() - 1));

  assert.equal((await atStart.create(booking(3, "a@example.com"))).type, "failure");
  assert.equal(dataOf(await justBefore.create(booking(3, "a@example.com"))), "created");
  assert.equal(dataOf(await repo.listAll()).length, 1);
});

test("20 simultaneous bookings of one slot yield exactly one winner", async () => {
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) => repo.create(booking(0, `racer${i}@example.com`))),
  );
  const claims = results.map(dataOf);
  assert.equal(claims.filter((c) => c === "created").length, 1);
  assert.equal(claims.filter((c) => c === "slot-taken").length, 19);
  assert.equal(dataOf(await repo.listActive()).length, 1);
});

test("20 simultaneous bookings by one email across slots yield exactly one booking", async () => {
  const results = await Promise.all(
    Array.from({ length: 20 }, (_, i) => repo.create(booking(i, "one@example.com"))),
  );
  const claims = results.map(dataOf);
  assert.equal(claims.filter((c) => c === "created").length, 1);
  assert.equal(claims.filter((c) => c === "already-booked").length, 19);
  assert.equal(dataOf(await repo.listActive()).length, 1);
});

test("a burst of double-taps on one slot by one person never reports a failure", async () => {
  const results = await Promise.all(
    Array.from({ length: 10 }, () => repo.create(booking(4, "tap@example.com"))),
  );
  const claims: SlotClaim[] = results.map(dataOf);
  assert.equal(claims.filter((c) => c === "created").length, 1);
  assert.equal(claims.filter((c) => c === "idempotent").length, 9);
});

test("a full mixed burst never double-books a slot or an email", async () => {
  const attempts = Array.from({ length: 60 }, (_, i) =>
    repo.create(booking(i % 6, `person${i % 10}@example.com`)),
  );
  await Promise.all(attempts);
  const active = dataOf(await repo.listActive());
  assert.equal(new Set(active.map((b) => b.slotId)).size, active.length);
  assert.equal(new Set(active.map((b) => b.email)).size, active.length);
});
