import { test } from "node:test";
import assert from "node:assert/strict";
import { normaliseDigits } from "./normalise-digits.ts";

test("maps Arabic-Indic digits to ASCII", () => {
  assert.equal(normaliseDigits("٠٧٩١٢٣٤٥٦٧"), "0791234567");
});

test("maps Eastern Arabic-Indic digits to ASCII", () => {
  assert.equal(normaliseDigits("۰۷۹۱۲۳۴۵۶۷"), "0791234567");
});

test("leaves ASCII digits and separators alone", () => {
  assert.equal(normaliseDigits("079 123 4567"), "079 123 4567");
});

test("maps mixed digit scripts in one string", () => {
  assert.equal(normaliseDigits("+٩٦٢ 79 ۱۲۳ 4567"), "+962 79 123 4567");
});
