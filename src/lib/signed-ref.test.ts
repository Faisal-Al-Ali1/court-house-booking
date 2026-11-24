import { test } from "node:test";
import assert from "node:assert/strict";
import { requireSessionSecret, signRef, verifyRef } from "./signed-ref.ts";

const SECRET = "test-secret-one";

test("a signed value verifies and round-trips", () => {
  assert.equal(verifyRef(signRef("a@example.com", SECRET), SECRET), "a@example.com");
});

test("an unsigned value confirms nothing", () => {
  assert.equal(verifyRef("a@example.com", SECRET), null);
  assert.equal(verifyRef(undefined, SECRET), null);
  assert.equal(verifyRef("", SECRET), null);
});

test("a tampered payload or signature confirms nothing", () => {
  const [payload, mac] = signRef("a@example.com", SECRET).split(".");
  const forged = Buffer.from("victim@example.com").toString("base64url");
  assert.equal(verifyRef(`${forged}.${mac}`, SECRET), null);
  assert.equal(verifyRef(`${payload}.${mac.slice(0, -2)}AA`, SECRET), null);
  assert.equal(verifyRef(`${payload}.`, SECRET), null);
  assert.equal(verifyRef(`${payload}.${mac}.extra`, SECRET), null);
});

test("a value signed with another secret confirms nothing", () => {
  assert.equal(verifyRef(signRef("a@example.com", "other-secret"), SECRET), null);
});

test("a missing secret fails loudly", () => {
  const saved = process.env.SESSION_SECRET;
  delete process.env.SESSION_SECRET;
  try {
    assert.throws(() => requireSessionSecret(), /SESSION_SECRET/);
  } finally {
    if (saved !== undefined) {
      process.env.SESSION_SECRET = saved;
    }
  }
});
