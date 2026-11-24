import { test } from "node:test";
import assert from "node:assert/strict";
import { splitLtrRuns } from "./split-ltr-runs.ts";

test("splits Latin and numeric runs out of Arabic text", () => {
  const runs = splitLtrRuns("الموعد 10:00 ص");
  assert.deepEqual(
    runs.map((r) => r.isLtr),
    [false, true, false],
  );
  assert.equal(runs[1].text, "10:00");
});

test("treats a phone number as a single run", () => {
  const runs = splitLtrRuns("هاتف 079 123 4567");
  assert.equal(runs.filter((r) => r.isLtr).length, 1);
  assert.equal(runs.find((r) => r.isLtr)?.text, "079 123 4567");
});

test("leaves pure Arabic untouched", () => {
  const runs = splitLtrRuns("مرحبا بك");
  assert.deepEqual(runs, [{ text: "مرحبا بك", isLtr: false }]);
});

test("leaves pure Latin as one run", () => {
  assert.deepEqual(splitLtrRuns("Court House+"), [
    { text: "Court House+", isLtr: true },
  ]);
});

test("keeps an international number whole, including its leading +", () => {
  const runs = splitLtrRuns("هاتف +962 6 5515451");
  assert.equal(runs.filter((r) => r.isLtr).length, 1);
  assert.equal(runs.find((r) => r.isLtr)?.text, "+962 6 5515451");
});

test("isolates an alphanumeric code without swallowing the Arabic comma", () => {
  const runs = splitLtrRuns("شارع الملكة رانيا 1145-A، عمّان");
  assert.equal(runs.find((r) => r.isLtr)?.text, "1145-A");
});

test("keeps an accented Latin name inside Arabic as one run", () => {
  const runs = splitLtrRuns("محمد José Müller");
  assert.equal(runs.filter((r) => r.isLtr).length, 1);
  assert.equal(runs.find((r) => r.isLtr)?.text, "José Müller");
});

test("keeps an en-dash time range as one run", () => {
  const runs = splitLtrRuns("2:00 – 4:00 PM");
  assert.deepEqual(runs, [{ text: "2:00 – 4:00 PM", isLtr: true }]);
});

test("returns no runs for the empty string", () => {
  assert.deepEqual(splitLtrRuns(""), []);
});

test("keeps an email inside Arabic as one run", () => {
  const runs = splitLtrRuns("البريد user@example.com");
  assert.equal(runs.find((r) => r.isLtr)?.text, "user@example.com");
});
