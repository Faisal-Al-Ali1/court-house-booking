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
