import { test } from "node:test";
import assert from "node:assert/strict";
import { collectDetailsErrors } from "./details-errors.ts";

const complete = {
  name: "Lina Haddad",
  email: "lina@example.com",
  phone: "0790000000",
  consent: true,
};

test("a complete draft has no errors", () => {
  assert.deepEqual(collectDetailsErrors(complete), {});
});

test("an unticked consent box is an error", () => {
  assert.equal(
    collectDetailsErrors({ ...complete, consent: false }).consent,
    "consentRequired",
  );
});

test("an invalid email is an error", () => {
  assert.equal(
    collectDetailsErrors({ ...complete, email: "lina@" }).email,
    "emailInvalid",
  );
});

test("a phone with too few digits is an error", () => {
  assert.equal(
    collectDetailsErrors({ ...complete, phone: "0790" }).phone,
    "phoneRequired",
  );
});

test("a blank name is an error", () => {
  assert.equal(
    collectDetailsErrors({ ...complete, name: "   " }).name,
    "nameRequired",
  );
});

test("every bad field is reported together, not one at a time", () => {
  assert.deepEqual(
    collectDetailsErrors({ name: "", email: "nope", phone: "", consent: false }),
    {
      name: "nameRequired",
      email: "emailInvalid",
      phone: "phoneRequired",
      consent: "consentRequired",
    },
  );
});

test("the slot is not part of the details step", () => {
  assert.equal("slotId" in collectDetailsErrors(complete), false);
});
